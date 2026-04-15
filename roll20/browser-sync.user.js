// ==UserScript==
// @name         D&D Tracker Pro — Roll20 Browser Sync
// @namespace    https://dn-d-tracker-pro.vercel.app
// @version      2.1.0
// @description  Syncs HP and initiative from Roll20 to D&D Tracker Pro.
//               Scopes sync to the ACTIVE PAGE only — no more importing your
//               entire character history. Detects page changes automatically.
// @author       D&D Tracker Pro
// @match        https://app.roll20.net/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  var CONFIG = {
    webhookUrl: 'https://dn-d-tracker-pro.vercel.app/api/roll20-sync',
    secret:     '4cdfb0756350434c69e8acb5a5429eca0f900b6b1f1ba81cc4d67c28',
    campaignId: '18959361'
  };

  var SYNC_VERSION  = '2.1.0-browser';
  var POLL_MS       = 2000;
  var _lastHpMap    = {};
  var _lastTurnJson = '';
  var _lastPageId   = null;

  // ── helpers ──────────────────────────────────────────────────────────────

  function post(type, data) {
    fetch(CONFIG.webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: CONFIG.secret, campaignId: CONFIG.campaignId,
        version: SYNC_VERSION, type: type,
        data: data || {}, timestamp: Date.now()
      })
    })
    .then(function (r) { console.log('[R20Sync] ' + type + ' → ' + r.status); })
    .catch(function (e) { console.error('[R20Sync] post failed:', e); });
  }

  // Only tokens on the ACTIVE page, objects layer, linked to a character
  function getActiveTokens() {
    try {
      var page = Campaign.activePage();
      if (!page || !page.thegraphics) return [];
      return page.thegraphics.models.filter(function (t) {
        return t.get('layer') === 'objects' && t.get('represents');
      });
    } catch (e) { return []; }
  }

  // Turn order filtered to the ACTIVE page only (ignores stale entries from old sessions)
  function getActiveTurnOrder() {
    try {
      var raw = Campaign.get('turnorder');
      if (!raw || raw === '[]') return [];
      var pageId   = Campaign.activePage().id;
      var allTurns = JSON.parse(raw);
      var pageTurns = allTurns.filter(function (t) {
        return !t._pageid || t._pageid === pageId;
      });
      if (!pageTurns.length) return [];

      var tokenMap = {};
      getActiveTokens().forEach(function (tok) { tokenMap[tok.id] = tok.get('name'); });

      return pageTurns.map(function (turn) {
        var name = (turn.custom || '').trim() || tokenMap[turn.id] || ('Token ' + turn.id.slice(-4));
        return { name: name, initiative: parseFloat(turn.pr) || 0 };
      }).filter(function (t) { return t.name; });
    } catch (e) { return []; }
  }

  // Characters whose token is on the active page (avoids importing the full campaign library)
  function getActiveCharacters() {
    var chars = [];
    try {
      var tokens = getActiveTokens();
      if (!tokens.length) return [];

      var tokenByCharId = {};
      tokens.forEach(function (tok) { tokenByCharId[tok.get('represents')] = tok; });

      Campaign.characters.models.forEach(function (character) {
        var tok = tokenByCharId[character.id];
        if (!tok) return; // not on this page — skip

        // Prefer bar1/bar2 values from the token (always live)
        var hp    = parseInt(tok.get('bar1_value')) || 0;
        var hpMax = parseInt(tok.get('bar1_max'))   || hp || 1;
        var ac    = parseInt(tok.get('bar2_value')) || 10;

        // Supplement with loaded attribs if available
        if (character.attribs && character.attribs.models.length > 0) {
          var attrs = {};
          character.attribs.models.forEach(function (a) {
            attrs[a.get('name')] = a.get('current');
          });
          if (!hp)  hp    = parseInt(attrs['hp']     || attrs['HP']     || 0);
          if (!hpMax || hpMax === hp)
            hpMax = parseInt(attrs['hp_max'] || attrs['HP_max'] || hp || 1);
          if (ac === 10)
            ac = parseInt(attrs['ac'] || attrs['AC'] || attrs['armor_class'] || 10);
        }

        var cb = character.get('controlledby') || '';
        chars.push({
          roll20Id: character.id,
          name:     tok.get('name') || character.get('name'),
          isPlayer: cb !== '' && cb !== 'all',
          hp: hp, hpMax: hpMax, ac: ac,
          player: character.get('name')
        });
      });
    } catch (e) { console.warn('[R20Sync] getActiveCharacters error:', e); }
    return chars;
  }

  // ── polling ──────────────────────────────────────────────────────────────

  function checkChanges() {
    // Detect page change → fresh full_sync clears old combatants in tracker
    try {
      var currentPageId = Campaign.activePage().id;
      if (currentPageId !== _lastPageId) {
        _lastPageId   = currentPageId;
        _lastHpMap    = {};
        _lastTurnJson = '';
        console.log('[R20Sync] Page changed → full sync (page: ' + currentPageId + ')');
        doFullSync('page-change');
        return;
      }
    } catch (e) {}

    // HP changes on active-page tokens
    try {
      getActiveTokens().forEach(function (token) {
        var hp  = parseInt(token.get('bar1_value'));
        if (isNaN(hp)) return;
        var max = parseInt(token.get('bar1_max')) || hp;
        var key = token.id;
        if (_lastHpMap[key] !== hp) {
          _lastHpMap[key] = hp;
          post('hp_update', {
            roll20Id:      token.get('represents'),
            characterName: token.get('name'),
            currentHp: hp, maxHp: max
          });
        }
      });
    } catch (e) {}

    // Turn-order changes (active page only)
    try {
      var turns     = getActiveTurnOrder();
      var turnsJson = JSON.stringify(turns);
      if (turnsJson !== _lastTurnJson) {
        _lastTurnJson = turnsJson;
        if (turns.length) post('initiative_update', { initiativeList: turns });
      }
    } catch (e) {}
  }

  function doFullSync(reason) {
    var chars = getActiveCharacters();
    var turns = getActiveTurnOrder();
    console.log('[R20Sync] Full sync (' + reason + ') — ' + chars.length +
                ' chars on active page, ' + turns.length + ' in initiative');
    post('full_sync', { characters: chars, initiativeList: turns, triggeredBy: reason });
  }

  // ── boot ─────────────────────────────────────────────────────────────────

  function waitForRoll20(callback) {
    var attempts = 0;
    var t = setInterval(function () {
      attempts++;
      try {
        if (window.Campaign && Campaign.characters && Campaign.characters.models) {
          clearInterval(t);
          callback();
        }
      } catch (e) {}
      if (attempts > 120) { clearInterval(t); console.warn('[R20Sync] Timed out.'); }
    }, 500);
  }

  waitForRoll20(function () {
    _lastPageId = Campaign.activePage().id;
    console.log('[R20Sync] Browser sync ready v' + SYNC_VERSION + ' — page: ' + _lastPageId);
    post('handshake', { version: SYNC_VERSION, message: 'Browser sync v2.1 loaded' });
    setTimeout(function () { doFullSync('browser-load'); }, 1000);
    window._r20syncInterval = setInterval(checkChanges, POLL_MS);
  });

})();

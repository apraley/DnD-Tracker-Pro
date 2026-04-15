// =============================================================
//  D&D Tracker Pro — Roll20 Sync Script  v1.0
//  Install: Roll20 campaign → Settings → API Scripts → New Script
//  Paste this entire file, then edit the three CONFIG lines below.
// =============================================================

var CONFIG = {
  webhookUrl: 'https://dnd-tracker-pro.vercel.app/api/roll20-sync',
  secret:     'PASTE_YOUR_SECRET_HERE',     // from D&D Tracker Pro → Battle → Roll20 Live
  campaignId: 'PASTE_YOUR_CAMPAIGN_ID_HERE' // from Roll20 URL: /campaigns/details/XXXXXX/...
};

// =============================================================
//  Internal — do not edit below this line
// =============================================================

var SYNC_VERSION = '1.0.0';
var DEBOUNCE_MS  = 600; // ms to wait before sending initiative updates

// ── HTTP helper — tries every known method for Roll20 sandboxes ───────────────
function post(type, data) {
  if (!state.DndTrackerSync || !state.DndTrackerSync.enabled) return;

  var payload = JSON.stringify({
    secret:     CONFIG.secret,
    campaignId: CONFIG.campaignId,
    version:    SYNC_VERSION,
    type:       type,
    data:       data || {},
    timestamp:  Date.now()
  });

  // Resolve HTTP primitives — Roll20 sandboxes expose these in different places
  // depending on the campaign's sandbox version. Check both the direct global
  // scope and the Node.js `global` object.
  var _fetch = null, _XHR = null, _https = null;

  try { if (typeof fetch === 'function')           _fetch = fetch;           } catch(e) {}
  try { if (!_fetch && typeof global !== 'undefined' &&
            typeof global.fetch === 'function')    _fetch = global.fetch;    } catch(e) {}

  try { if (typeof XMLHttpRequest === 'function')  _XHR = XMLHttpRequest;    } catch(e) {}
  try { if (!_XHR && typeof global !== 'undefined' &&
            typeof global.XMLHttpRequest === 'function') _XHR = global.XMLHttpRequest; } catch(e) {}

  try { _https = require('https'); }                                           catch(e) {}
  try { if (!_https && typeof global !== 'undefined' &&
            typeof global.require === 'function')  _https = global.require('https'); } catch(e) {}

  // 1) fetch
  if (_fetch) {
    _fetch(CONFIG.webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    payload
    }).then(function(r) {
      if (!r.ok) log('[R20Sync] fetch error: ' + r.status);
      else       log('[R20Sync] sent via fetch: ' + type);
    }).catch(function(e) {
      log('[R20Sync] fetch failed: ' + e);
    });
    return;
  }

  // 2) XMLHttpRequest
  if (_XHR) {
    try {
      var xhr = new _XHR();
      xhr.open('POST', CONFIG.webhookUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) log('[R20Sync] sent via XHR: ' + type);
          else                    log('[R20Sync] XHR error ' + xhr.status);
        }
      };
      xhr.send(payload);
    } catch(e) { log('[R20Sync] XHR error: ' + e); }
    return;
  }

  // 3) Node.js https module
  if (_https) {
    try {
      var urlParts = CONFIG.webhookUrl.replace('https://', '').split('/');
      var hostname = urlParts.shift();
      var path     = '/' + urlParts.join('/');
      var options  = {
        hostname: hostname,
        path:     path,
        method:   'POST',
        headers:  { 'Content-Type': 'application/json', 'Content-Length': payload.length }
      };
      var req = _https.request(options, function(res) {
        log('[R20Sync] https status: ' + res.statusCode + ' (' + type + ')');
      });
      req.on('error', function(e) { log('[R20Sync] https error: ' + e); });
      req.write(payload);
      req.end();
    } catch(e) { log('[R20Sync] https error: ' + e); }
    return;
  }

  log('[R20Sync] No HTTP method found. Run !r20sync debug to diagnose.');
}

// ── Attribute helpers ─────────────────────────────────────────────────────────
function safeAttr(charId, name) {
  var v = getAttrByName(charId, name);
  return (v !== undefined && v !== '') ? v : null;
}

function intAttr(charId, name, fallback) {
  return parseInt(safeAttr(charId, name)) || (fallback !== undefined ? fallback : 0);
}

// ── Determine player vs monster ───────────────────────────────────────────────
function isPlayerChar(character) {
  var ctrl = character.get('controlledby') || '';
  return ctrl !== '' && ctrl !== 'all';
}

// ── Build the full character data payload ────────────────────────────────────
function buildCharData(character) {
  var id = character.id;
  // Support both OGL sheet (full word) and abbreviated sheets
  var hp    = intAttr(id, 'hp', 0);
  var hpMax = intAttr(id, 'hp_max', 0) || intAttr(id, 'hp', 1);
  var ac    = intAttr(id, 'ac', 0) || intAttr(id, 'AC', 10);
  return {
    roll20Id:  id,
    name:      character.get('name'),
    isPlayer:  isPlayerChar(character),
    hp:        hp,
    hpMax:     hpMax,
    ac:        ac,
    speed:     intAttr(id, 'speed', 30),
    str:       intAttr(id, 'strength', 10),
    dex:       intAttr(id, 'dexterity', 10),
    con:       intAttr(id, 'constitution', 10),
    int:       intAttr(id, 'intelligence', 10),
    wis:       intAttr(id, 'wisdom', 10),
    cha:       intAttr(id, 'charisma', 10),
    level:     intAttr(id, 'level', 0) || intAttr(id, 'base_level', 1),
    cls:       safeAttr(id, 'class') || '',
    player:    safeAttr(id, 'player_name') || ''
  };
}

// ── Parse Roll20 turn order ───────────────────────────────────────────────────
function getTurnOrder() {
  try {
    var raw = Campaign().get('turnorder');
    if (!raw || raw === '[]') return [];
    return JSON.parse(raw).map(function (turn) {
      var name = (turn.custom || '').trim();
      if (turn.id && turn.id !== '-1') {
        var token = getObj('graphic', turn.id);
        if (token) name = token.get('name') || name;
      }
      return { name: name, initiative: parseFloat(turn.pr) || 0, tokenId: turn.id };
    }).filter(function (t) { return t.name; });
  } catch (e) {
    log('[R20Sync] Turn order parse error: ' + e);
    return [];
  }
}

// ── Sync actions ──────────────────────────────────────────────────────────────
function doFullSync(respondTo) {
  var chars = findObjs({ _type: 'character' }).map(buildCharData);
  post('full_sync', {
    characters:      chars,
    initiativeList:  getTurnOrder(),
    triggeredBy:     respondTo || 'auto'
  });
  if (respondTo) {
    sendChat('D&D Tracker', '/w ' + respondTo +
      ' ✅ Full sync sent — ' + chars.length + ' character(s).');
  }
}

function doHpUpdate(charId, charName, currentHp, maxHp) {
  post('hp_update', {
    roll20Id:      charId || null,
    characterName: charName,
    currentHp:     currentHp,
    maxHp:         maxHp
  });
}

function doInitiativeUpdate() {
  post('initiative_update', { initiativeList: getTurnOrder() });
}

// ── Debounce helper (Roll20 has setTimeout in newer API versions) ─────────────
var _initTimer = null;
function debouncedInitUpdate() {
  if (_initTimer) clearTimeout(_initTimer);
  _initTimer = setTimeout(doInitiativeUpdate, DEBOUNCE_MS);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
on('ready', function () {
  // Initialise persistent state
  if (!state.DndTrackerSync) {
    state.DndTrackerSync = { enabled: true, version: SYNC_VERSION };
  }
  log('[R20Sync] Ready. v' + SYNC_VERSION +
      ' | enabled=' + state.DndTrackerSync.enabled +
      ' | campaign=' + CONFIG.campaignId);

  // ── HP via character attribute (OGL sheet stores current HP here) ──────────
  on('change:attribute', function (attr) {
    if (!state.DndTrackerSync.enabled) return;
    var name = attr.get('name').toLowerCase();
    if (name !== 'hp' && name !== 'hp_current' && name !== 'hit_points') return;

    var charId    = attr.get('_characterid');
    var character = getObj('character', charId);
    if (!character) return;

    var currentHp = parseInt(attr.get('current'))  || 0;
    var maxHp     = parseInt(attr.get('max'))        ||
                    intAttr(charId, 'hp_max', 0)     || currentHp;

    doHpUpdate(charId, character.get('name'), currentHp, maxHp);
  });

  // ── HP via token bar1 (most DMs map bar1 → HP on tokens) ──────────────────
  on('change:graphic:bar1_value', function (token) {
    if (!state.DndTrackerSync.enabled) return;
    var charName  = token.get('name');
    if (!charName) return;
    var charId    = token.get('represents') || null;
    var currentHp = parseInt(token.get('bar1_value')) || 0;
    var maxHp     = parseInt(token.get('bar1_max'))   || currentHp;
    doHpUpdate(charId, charName, currentHp, maxHp);
  });

  // ── Initiative / turn order ────────────────────────────────────────────────
  on('change:campaign:turnorder', function () {
    if (!state.DndTrackerSync.enabled) return;
    debouncedInitUpdate();
  });

  // ── Chat commands ──────────────────────────────────────────────────────────
  //  !r20sync full       — push all characters + initiative
  //  !r20sync status     — show current status
  //  !r20sync on / off   — enable / disable
  //  !r20sync handshake  — test connection (used by pairing flow)
  on('chat:message', function (msg) {
    if (msg.type !== 'api') return;
    if (!msg.content.startsWith('!r20sync')) return;

    var parts = msg.content.trim().split(/\s+/);
    var cmd   = (parts[1] || 'help').toLowerCase();
    var who   = msg.who.replace(' (GM)', '').trim();

    switch (cmd) {
      case 'full':
      case 'sync':
        doFullSync(who);
        break;

      case 'on':
        state.DndTrackerSync.enabled = true;
        sendChat('D&D Tracker', '/w ' + who + ' ✅ Roll20 Sync **enabled**.');
        break;

      case 'off':
        state.DndTrackerSync.enabled = false;
        sendChat('D&D Tracker', '/w ' + who + ' 🔴 Roll20 Sync **disabled**.');
        break;

      case 'status':
        sendChat('D&D Tracker', '/w ' + who + ' ' +
          (state.DndTrackerSync.enabled ? '✅ Enabled' : '🔴 Disabled') +
          ' | v' + SYNC_VERSION +
          ' | Campaign: ' + CONFIG.campaignId);
        break;

      case 'handshake':
        post('handshake', { version: SYNC_VERSION, message: 'Handshake from Roll20' });
        sendChat('D&D Tracker', '/w ' + who + ' 🤝 Handshake sent to D&D Tracker Pro.');
        break;

      case 'debug':
        var hasFetch  = (function(){ try { return typeof fetch === 'function' || (typeof global !== 'undefined' && typeof global.fetch === 'function'); } catch(e){ return false; } })();
        var hasXHR    = (function(){ try { return typeof XMLHttpRequest === 'function' || (typeof global !== 'undefined' && typeof global.XMLHttpRequest === 'function'); } catch(e){ return false; } })();
        var hasHttps  = (function(){ try { require('https'); return true; } catch(e){ try { return typeof global !== 'undefined' && typeof global.require === 'function'; } catch(e2){ return false; } } })();
        var hasGlobal = (function(){ try { return typeof global !== 'undefined'; } catch(e){ return false; } })();
        sendChat('D&D Tracker', '/w ' + who +
          ' 🔍 Sandbox debug:' +
          ' fetch=' + hasFetch +
          ' | XHR=' + hasXHR +
          ' | https=' + hasHttps +
          ' | global=' + hasGlobal +
          ' | Node=' + (typeof process !== 'undefined') +
          ' | v' + SYNC_VERSION);
        break;

      default:
        sendChat('D&D Tracker', '/w ' + who +
          ' Commands: <b>!r20sync</b> [full | on | off | status | handshake | debug]');
    }
  });

  // Send automatic handshake on script load so the tracker knows we're online
  post('handshake', { version: SYNC_VERSION, message: 'Script loaded — auto handshake' });
});

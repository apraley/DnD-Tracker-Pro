/**
 * pro-client.js
 * Lightweight client-side helper that the index.html <script> tag imports.
 * Handles: Supabase auth, subscription status, cloud campaign save/load,
 *          and the /api/narrate proxy call.
 *
 * Injected into the HTML as an ES module via:
 *   <script type="module" src="/lib/pro-client.js"></script>
 *
 * Exposes a global `Pro` object so the existing non-module app code can call it.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ── Config ────────────────────────────────────────────────────────────────────
// These are injected at build time by Vercel env vars (public, anon-safe values).
const SUPABASE_URL      = window.__PRO_CONFIG__?.supabaseUrl      || '';
const SUPABASE_ANON_KEY = window.__PRO_CONFIG__?.supabaseAnonKey  || '';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth ──────────────────────────────────────────────────────────────────────
async function signUp(email, password) {
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  await sb.auth.signOut();
}

async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

async function getUser() {
  const { data } = await sb.auth.getUser();
  return data.user;
}

// ── Subscription ──────────────────────────────────────────────────────────────
/** Returns true only when the user has an 'active' or 'trialing' subscription. */
async function hasSubscription() {
  const { data, error } = await sb
    .from('subscriptions')
    .select('status')
    .single();
  if (error || !data) return false;
  return ['active', 'trialing'].includes(data.status);
}

/** Opens Stripe Checkout in the same tab. */
async function startCheckout() {
  const user = await getUser();
  if (!user) throw new Error('Must be signed in to subscribe');

  const r = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, email: user.email }),
  });
  const { url, error } = await r.json();
  if (error) throw new Error(error);
  window.location.href = url;
}

// ── Campaign cloud save/load ──────────────────────────────────────────────────
async function cloudSave(campaignData) {
  const session = await getSession();
  if (!session) throw new Error('Not signed in');

  const r = await fetch('/api/campaign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(campaignData),
  });
  const json = await r.json();
  if (!json.ok) throw new Error(json.error || 'Save failed');
  return json;
}

async function cloudLoad() {
  const session = await getSession();
  if (!session) throw new Error('Not signed in');

  const r = await fetch('/api/campaign', {
    headers: { 'Authorization': `Bearer ${session.access_token}` },
  });
  const json = await r.json();
  if (json.error) throw new Error(json.error);
  return json.data;   // null if no save exists yet
}

// ── AI Narrator proxy ─────────────────────────────────────────────────────────
async function narrate(prompt, systemPrompt) {
  const session = await getSession();
  if (!session) throw new Error('Not signed in');

  const r = await fetch('/api/narrate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ prompt, systemPrompt }),
  });

  const json = await r.json();
  if (json.error) throw new Error(json.error);
  return json.options;   // string[]
}

// ── Auth state listener ───────────────────────────────────────────────────────
sb.auth.onAuthStateChange((event, session) => {
  window.dispatchEvent(new CustomEvent('pro:authchange', { detail: { event, session } }));
});

// ── Roll20 Live Sync ──────────────────────────────────────────────────────────

/**
 * Create or replace a Roll20 pairing for the current user.
 * Returns { secret, campaignId } — secret is shown ONCE; store it in the Roll20 script.
 */
async function pairRoll20(campaignId) {
  const session = await getSession();
  if (!session) throw new Error('Not signed in');
  const r = await fetch('/api/roll20-pair', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
    body:    JSON.stringify({ campaignId }),
  });
  const json = await r.json();
  if (!json.ok) throw new Error(json.error || 'Pairing failed');
  return json; // { ok, secret, campaignId }
}

/** Return current pairing info (no secret). */
async function getRoll20Pairing() {
  const session = await getSession();
  if (!session) return null;
  const r = await fetch('/api/roll20-pair', {
    headers: { 'Authorization': `Bearer ${session.access_token}` },
  });
  const json = await r.json();
  return json.session || null; // { campaign_id, enabled, created_at } or null
}

/** Remove the Roll20 pairing. */
async function unpairRoll20() {
  const session = await getSession();
  if (!session) return;
  await fetch('/api/roll20-pair', {
    method:  'DELETE',
    headers: { 'Authorization': `Bearer ${session.access_token}` },
  });
}

/**
 * Subscribe to live Roll20 sync events for a given campaignId.
 * onUpdate(type, data) is called whenever Roll20 pushes a new payload.
 * Returns an unsubscribe function.
 */
function subscribeRoll20Sync(campaignId, onUpdate) {
  const channel = sb
    .channel(`roll20_sync:${campaignId}`)
    .on(
      'postgres_changes',
      {
        event:  '*',
        schema: 'public',
        table:  'roll20_sync',
        filter: `campaign_id=eq.${campaignId}`,
      },
      (payload) => {
        const row = payload.new || payload.old;
        if (row && row.type && row.data) {
          onUpdate(row.type, row.data);
        }
      }
    )
    .subscribe();

  return () => sb.removeChannel(channel);
}

// ── Public API ────────────────────────────────────────────────────────────────
window.Pro = {
  signUp,
  signIn,
  signOut,
  getSession,
  getUser,
  hasSubscription,
  startCheckout,
  cloudSave,
  cloudLoad,
  narrate,
  // Roll20 Live Sync
  pairRoll20,
  getRoll20Pairing,
  unpairRoll20,
  subscribeRoll20Sync,
};

export {
  signUp, signIn, signOut, getSession, getUser,
  hasSubscription, startCheckout, cloudSave, cloudLoad, narrate,
  pairRoll20, getRoll20Pairing, unpairRoll20, subscribeRoll20Sync,
};

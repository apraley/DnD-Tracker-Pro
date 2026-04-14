/**
 * POST /api/roll20-sync
 *
 * Receives events from the Roll20 Mod API script and writes them to Supabase.
 * Supabase Realtime then pushes changes to all connected tracker windows.
 *
 * Body: {
 *   secret:     string,   // shared secret set in the Roll20 script CONFIG
 *   campaignId: string,   // Roll20 campaign numeric ID
 *   version:    string,
 *   type:       'handshake' | 'full_sync' | 'hp_update' | 'initiative_update',
 *   data:       object,
 *   timestamp:  number
 * }
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Roll20's XHR doesn't send a preflight but browsers in dev tools might
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { secret, campaignId, type, data, version, timestamp } = req.body || {};

  // ── Basic field validation ────────────────────────────────────────────────
  if (!secret || !campaignId || !type) {
    return res.status(400).json({ error: 'Missing required fields: secret, campaignId, type' });
  }

  // Reject payloads older than 5 minutes (replay protection)
  if (timestamp && Date.now() - timestamp > 5 * 60 * 1000) {
    return res.status(400).json({ error: 'Stale payload' });
  }

  // ── Authenticate via hashed secret ───────────────────────────────────────
  const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

  const { data: session, error: sessionErr } = await supabase
    .from('roll20_sessions')
    .select('user_id, enabled')
    .eq('campaign_id', campaignId)
    .eq('secret_hash', secretHash)
    .single();

  if (sessionErr || !session) {
    // Don't leak whether the campaign exists — always same message
    return res.status(401).json({ error: 'Unauthorised — check campaignId and secret' });
  }

  if (!session.enabled) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'sync disabled' });
  }

  // ── Upsert sync record — Supabase Realtime picks this up ─────────────────
  const { error: upsertErr } = await supabase
    .from('roll20_sync')
    .upsert(
      {
        campaign_id: campaignId,
        user_id:     session.user_id,
        type,
        data:        data || {},
        updated_at:  new Date().toISOString(),
      },
      { onConflict: 'campaign_id,type' }
    );

  if (upsertErr) {
    console.error('[roll20-sync] Upsert error:', upsertErr);
    return res.status(500).json({ error: 'Database write failed' });
  }

  return res.status(200).json({ ok: true, type, version: version || '?' });
}

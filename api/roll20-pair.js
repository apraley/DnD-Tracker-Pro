/**
 * /api/roll20-pair
 *
 * Manages the pairing between a D&D Tracker Pro account and a Roll20 campaign.
 *
 * POST   — create / replace a pairing  (body: { campaignId })
 *          Returns a plaintext secret ONCE — we never store it, only the hash.
 *
 * GET    — return current pairing info (no secret exposed)
 *
 * DELETE — remove the pairing entirely
 *
 * All routes require a valid Supabase Bearer token.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getUser(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error ? null : user;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  // ── POST: create / replace pairing ───────────────────────────────────────
  if (req.method === 'POST') {
    const { campaignId } = req.body || {};
    if (!campaignId) return res.status(400).json({ error: 'campaignId required' });

    // Generate a strong random secret — shown to user once, then we only keep the hash
    const secret     = crypto.randomBytes(28).toString('hex');  // 56-char hex
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

    const { error } = await supabase
      .from('roll20_sessions')
      .upsert(
        {
          user_id:     user.id,
          campaign_id: String(campaignId).trim(),
          secret_hash: secretHash,
          enabled:     true,
          created_at:  new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('[roll20-pair] Upsert error:', error);
      return res.status(500).json({ error: 'Could not save pairing' });
    }

    // Return plaintext secret — this is the ONLY time it is returned
    return res.status(200).json({ ok: true, secret, campaignId });
  }

  // ── GET: fetch current pairing (no secret) ────────────────────────────────
  if (req.method === 'GET') {
    const { data: session, error } = await supabase
      .from('roll20_sessions')
      .select('campaign_id, enabled, created_at')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Could not load pairing' });
    }

    return res.status(200).json({ session: session || null });
  }

  // ── DELETE: remove pairing ────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    // Fetch campaign_id BEFORE deleting so we can clean up roll20_sync
    const { data: s } = await supabase
      .from('roll20_sessions')
      .select('campaign_id')
      .eq('user_id', user.id)
      .single();

    await supabase.from('roll20_sessions').delete().eq('user_id', user.id);

    if (s?.campaign_id) {
      await supabase.from('roll20_sync').delete().eq('campaign_id', s.campaign_id);
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

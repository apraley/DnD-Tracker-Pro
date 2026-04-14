/**
 * /api/campaign
 *
 * GET  /api/campaign          → load all campaign data for the authed user
 * POST /api/campaign          → save (upsert) campaign data for the authed user
 *
 * The campaign blob is a single JSON object identical to what the free version
 * stores in localStorage, so the client code can swap localStorage ↔ server
 * with minimal changes.
 *
 * Requires: Authorization: Bearer <supabase_session_token>
 * Requires: active subscription (status = 'active' in subscriptions table)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getAuthedUser(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return { user: null, error: 'Missing token' };
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return { user, error };
}

async function hasActiveSub(userId) {
  const { data } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .single();
  return data?.status === 'active';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { user, error: authErr } = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: authErr || 'Unauthorized' });

  if (!(await hasActiveSub(user.id))) {
    return res.status(403).json({ error: 'subscription_required' });
  }

  // ── GET: load campaign data ───────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('campaigns')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      data: data?.data ?? null,
      updated_at: data?.updated_at ?? null,
    });
  }

  // ── POST: save campaign data ──────────────────────────────────────────────
  if (req.method === 'POST') {
    const payload = req.body;
    if (!payload) return res.status(400).json({ error: 'Body required' });

    const { error } = await supabase
      .from('campaigns')
      .upsert(
        { user_id: user.id, data: payload, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

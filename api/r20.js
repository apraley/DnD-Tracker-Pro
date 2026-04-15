/**
 * /api/r20  — Public Roll20 sync endpoint (no auth required)
 *
 * POST ?action=pair  { campaignId }          → generate secret, store hash
 * POST               { secret, campaignId, type, data, timestamp } → receive Roll20 event
 * GET  ?campaignId=X&since=MS               → poll for recent events
 * DELETE             { campaignId, secret }  → remove pairing
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── PAIR ────────────────────────────────────────────────────────────────────
  if (req.method === 'POST' && req.query.action === 'pair') {
    const { campaignId } = req.body || {};
    if (!campaignId) return res.status(400).json({ error: 'campaignId required' });

    const secret     = crypto.randomBytes(28).toString('hex');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

    const { error } = await sb.from('r20_public_sessions').upsert(
      { campaign_id: campaignId, secret_hash: secretHash },
      { onConflict: 'campaign_id' }
    );
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ secret, campaignId });
  }

  // ── RECEIVE Roll20 EVENT ────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { secret, campaignId, type, data, timestamp } = req.body || {};
    if (!secret || !campaignId || !type) {
      return res.status(400).json({ error: 'secret, campaignId, and type required' });
    }

    // Replay protection — reject payloads older than 5 minutes
    if (timestamp && Date.now() - timestamp > 5 * 60 * 1000) {
      return res.status(400).json({ error: 'payload expired' });
    }

    // Validate secret
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');
    const { data: session } = await sb
      .from('r20_public_sessions')
      .select('secret_hash')
      .eq('campaign_id', campaignId)
      .single();

    if (!session || session.secret_hash !== secretHash) {
      return res.status(401).json({ error: 'invalid secret' });
    }

    // Upsert sync row (triggers Realtime for any subscriber)
    const { error } = await sb.from('r20_public_sync').upsert(
      { campaign_id: campaignId, type, data: data || {}, updated_at: new Date().toISOString() },
      { onConflict: 'campaign_id,type' }
    );
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true });
  }

  // ── POLL for new events ─────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { campaignId, since } = req.query;
    if (!campaignId) return res.status(400).json({ error: 'campaignId required' });

    let query = sb.from('r20_public_sync').select('type,data,updated_at').eq('campaign_id', campaignId);
    if (since) {
      const sinceDate = new Date(parseInt(since, 10));
      if (!isNaN(sinceDate)) query = query.gt('updated_at', sinceDate.toISOString());
    }
    const { data: rows, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ events: rows || [] });
  }

  // ── UNPAIR ──────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { campaignId, secret } = req.body || {};
    if (!campaignId || !secret) return res.status(400).json({ error: 'campaignId and secret required' });

    // Validate secret before allowing delete
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');
    const { data: session } = await sb
      .from('r20_public_sessions')
      .select('secret_hash')
      .eq('campaign_id', campaignId)
      .single();

    if (!session || session.secret_hash !== secretHash) {
      return res.status(401).json({ error: 'invalid secret' });
    }

    await sb.from('r20_public_sessions').delete().eq('campaign_id', campaignId);
    await sb.from('r20_public_sync').delete().eq('campaign_id', campaignId);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

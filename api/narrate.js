/**
 * POST /api/narrate
 * Server-side proxy for Anthropic Claude — keeps the API key off the client.
 * Requires a valid Supabase session (Bearer token) AND an active Stripe subscription.
 *
 * Body: { prompt: string, systemPrompt?: string }
 * Returns: { options: string[] }  (2–3 narrator options)
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // ── CORS ──────────────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Auth ──────────────────────────────────────────────────────────────────
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' });

  // ── Subscription check ────────────────────────────────────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single();

  if (!sub || !['active', 'trialing'].includes(sub.status)) {
    return res.status(403).json({ error: 'subscription_required' });
  }

  // ── AI call ───────────────────────────────────────────────────────────────
  const { prompt, systemPrompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  const defaultSystem = `You are a creative D&D Dungeon Master assistant called the Mythweaver.
When given a scenario or question, respond with exactly 3 short options separated by the delimiter |||.
Each option should be vivid, flavourful, and 1–3 sentences. Do NOT number them.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: systemPrompt || defaultSystem,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0]?.text || '';
    const options = raw.split('|||').map(s => s.trim()).filter(Boolean);

    return res.status(200).json({ options });
  } catch (err) {
    console.error('Anthropic error:', err);
    return res.status(500).json({ error: 'AI request failed', detail: err.message });
  }
}

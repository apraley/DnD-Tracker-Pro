import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, latitude, longitude, speed, heading, accuracy } = req.body;

  if (!userId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const { data, error } = await supabase
    .from('location_tracking')
    .insert([
      {
        user_id: userId,
        latitude,
        longitude,
        speed,
        heading,
        accuracy,
        timestamp: new Date().toISOString()
      }
    ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, data });
};

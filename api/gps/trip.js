import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  if (req.method === 'POST') {
    const { userId, boatName, startLocation } = req.body;

    if (!userId || !boatName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('trips')
      .insert([
        {
          user_id: userId,
          boat_name: boatName,
          start_location: startLocation,
          started_at: new Date().toISOString(),
          status: 'active'
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, trip: data[0] });
  }

  res.status(405).json({ error: 'Method not allowed' });
};

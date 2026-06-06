import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { slug } = req.query;
  const path = slug ? slug.join('/') : '';

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  // Handle /api/gps/trip/:tripId/end
  if (path.match(/^trip\/[\w-]+\/end$/)) {
    if (req.method !== 'PATCH') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const tripId = path.split('/')[1];
    const { endLocation } = req.body;

    const { data, error } = await supabase
      .from('trips')
      .update({
        ended_at: new Date().toISOString(),
        end_location: endLocation,
        status: 'completed'
      })
      .eq('id', tripId)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, trip: data[0] });
  }

  // Handle /api/gps/trip/:tripId/locations
  if (path.match(/^trip\/[\w-]+\/locations$/)) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const tripId = path.split('/')[1];

    const { data, error } = await supabase
      .from('location_tracking')
      .select('*')
      .eq('trip_id', tripId)
      .order('timestamp', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  }

  // Handle /api/gps/user/:userId/trips
  if (path.match(/^user\/[\w-]+\/trips$/)) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const userId = path.split('/')[1];
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  }

  res.status(404).json({ error: 'Not found' });
}

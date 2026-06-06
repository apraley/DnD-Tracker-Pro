const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const severn = require('../data/severn-river.json');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

router.get('/river-data', (req, res) => {
  res.json(severn);
});

router.get('/hazards', (req, res) => {
  const { minLat, maxLat, minLng, maxLng } = req.query;

  let hazards = severn.hazards;

  if (minLat && maxLat && minLng && maxLng) {
    hazards = hazards.filter(h =>
      h.latitude >= parseFloat(minLat) &&
      h.latitude <= parseFloat(maxLat) &&
      h.longitude >= parseFloat(minLng) &&
      h.longitude <= parseFloat(maxLng)
    );
  }

  res.json(hazards);
});

router.get('/marinas', (req, res) => {
  const { minLat, maxLat, minLng, maxLng } = req.query;

  let marinas = severn.marinas;

  if (minLat && maxLat && minLng && maxLng) {
    marinas = marinas.filter(m =>
      m.latitude >= parseFloat(minLat) &&
      m.latitude <= parseFloat(maxLat) &&
      m.longitude >= parseFloat(minLng) &&
      m.longitude <= parseFloat(maxLng)
    );
  }

  res.json(marinas);
});

router.get('/buoys', (req, res) => {
  const { minLat, maxLat, minLng, maxLng } = req.query;

  let buoys = severn.buoys;

  if (minLat && maxLat && minLng && maxLng) {
    buoys = buoys.filter(b =>
      b.latitude >= parseFloat(minLat) &&
      b.latitude <= parseFloat(maxLat) &&
      b.longitude >= parseFloat(minLng) &&
      b.longitude <= parseFloat(maxLng)
    );
  }

  res.json(buoys);
});

router.get('/locks', (req, res) => {
  res.json(severn.locks);
});

router.post('/track-location', async (req, res) => {
  const { userId, latitude, longitude, speed, heading, accuracy } = req.body;

  if (!userId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
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
});

router.get('/trip/:tripId/locations', async (req, res) => {
  const { tripId } = req.params;

  const { data, error } = await supabase
    .from('location_tracking')
    .select('*')
    .eq('trip_id', tripId)
    .order('timestamp', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.post('/trip', async (req, res) => {
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

  res.json({ success: true, trip: data[0] });
});

router.patch('/trip/:tripId/end', async (req, res) => {
  const { tripId } = req.params;
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

  res.json({ success: true, trip: data[0] });
});

router.get('/user/:userId/trips', async (req, res) => {
  const { userId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

module.exports = router;

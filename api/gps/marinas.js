module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const severn = require('../../data/severn-river.json');
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

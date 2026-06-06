module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const severn = require('../../data/severn-river.json');
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

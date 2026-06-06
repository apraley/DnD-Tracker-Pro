const data = require('./data');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { minLat, maxLat, minLng, maxLng } = req.query;
  let buoys = data.buoys;

  if (minLat && maxLat && minLng && maxLng) {
    buoys = buoys.filter(b =>
      b.latitude >= parseFloat(minLat) &&
      b.latitude <= parseFloat(maxLat) &&
      b.longitude >= parseFloat(minLng) &&
      b.longitude <= parseFloat(maxLng)
    );
  }

  res.json(buoys);
};

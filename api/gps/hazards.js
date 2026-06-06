import data from './data.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { minLat, maxLat, minLng, maxLng } = req.query;
  let hazards = data.hazards;

  if (minLat && maxLat && minLng && maxLng) {
    hazards = hazards.filter(h =>
      h.latitude >= parseFloat(minLat) &&
      h.latitude <= parseFloat(maxLat) &&
      h.longitude >= parseFloat(minLng) &&
      h.longitude <= parseFloat(maxLng)
    );
  }

  res.json(hazards);
};

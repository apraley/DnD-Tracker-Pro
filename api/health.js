module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.json({ status: 'ok', service: 'Severn River GPS API' });
};

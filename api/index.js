const express = require('express');
const gpsRouter = require('./gps');

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.use('/api/gps', gpsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Severn River GPS API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Severn River GPS Server running on port ${PORT}`);
});

module.exports = app;

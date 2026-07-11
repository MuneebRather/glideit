require('dotenv').config();
const express = require('express');
const dockerRoutes = require('./routes/docker');

const app = express();

app.use(express.json());

app.use('/api', dockerRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Docker Monitor running on port ${PORT}`);
});
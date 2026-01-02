const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const marketplaceRoutes = require('./routes/marketplace');
const { register, metricsMiddleware } = require('./metrics');

const app = express();

app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

app.use('/marketplace', marketplaceRoutes);

app.get('/status', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'marketplace',
    instance: config.instanceId,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log(`[${config.instanceId}] Connected to MongoDB`);

    app.listen(config.port, () => {
      console.log(`[${config.instanceId}] Marketplace service running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

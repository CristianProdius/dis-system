const express = require('express');
const cors = require('cors');
const config = require('./config');
const { sequelize } = require('./models');
const discourseRoutes = require('./routes/discourse');
const { register, metricsMiddleware } = require('./metrics');

const app = express();

app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

app.use('/discourse', discourseRoutes);

app.get('/status', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'discourse',
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
    await sequelize.authenticate();
    console.log(`[${config.instanceId}] Connected to PostgreSQL`);

    await sequelize.sync({ alter: true });
    console.log(`[${config.instanceId}] Database synchronized`);

    app.listen(config.port, () => {
      console.log(`[${config.instanceId}] Discourse service running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

const client = require('prom-client');
const config = require('./config');

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status', 'instance'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status', 'instance'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5],
  registers: [register],
});

const serviceInfo = new client.Gauge({
  name: 'service_info',
  help: 'Service information',
  labelNames: ['service', 'instance', 'version'],
  registers: [register],
});

serviceInfo.set({ service: 'marketplace', instance: config.instanceId, version: '1.0.0' }, 1);

const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const path = req.route ? req.route.path : req.path;

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status: res.statusCode,
      instance: config.instanceId,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path,
        status: res.statusCode,
        instance: config.instanceId,
      },
      duration
    );
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
};

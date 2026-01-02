module.exports = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace',
  instanceId: process.env.INSTANCE_ID || 'marketplace-local',
};

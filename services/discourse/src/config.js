module.exports = {
  port: process.env.PORT || 4001,
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/discourse',
  instanceId: process.env.INSTANCE_ID || 'discourse-local',
};

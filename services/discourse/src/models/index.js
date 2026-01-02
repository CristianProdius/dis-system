const { Sequelize } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const Channel = require('./Channel')(sequelize);
const Post = require('./Post')(sequelize);

Channel.hasMany(Post, { foreignKey: 'channelId', as: 'posts' });
Post.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

module.exports = {
  sequelize,
  Channel,
  Post,
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    channelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'channel_id',
      references: {
        model: 'channels',
        key: 'id',
      },
    },
    authorId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'author_id',
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    topic: {
      type: DataTypes.ENUM('economic', 'philosophical', 'strategic', 'general'),
      allowNull: false,
      defaultValue: 'general',
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_pinned',
    },
  }, {
    tableName: 'posts',
    timestamps: true,
    underscored: true,
  });

  return Post;
};

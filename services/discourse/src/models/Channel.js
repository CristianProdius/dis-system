const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Channel = sequelize.define('Channel', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('public', 'private', 'sovereign'),
      allowNull: false,
      defaultValue: 'public',
    },
    zone: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Economic/philosophical zone identifier',
    },
    createdBy: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  }, {
    tableName: 'channels',
    timestamps: true,
    underscored: true,
  });

  return Channel;
};

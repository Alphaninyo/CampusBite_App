const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Favorite = sequelize.define(
  'Favorite',
  {
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
    },
    consumer_id: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'users', key: 'id' },
    },
    menu_item_id: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'menu_items', key: 'id' },
    },
  },
  {
    tableName:  'favorites',
    timestamps: true,
    createdAt:  'created_at',
    updatedAt:  false,
    underscored: true,
    indexes: [
      { unique: true, fields: ['consumer_id', 'menu_item_id'] },
    ],
  }
);

module.exports = Favorite;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Notification Model
 * Stores in-app notifications for users (consumers, vendors, food_couriers).
 * These notifications persist in the database and are accessible via the API.
 */
const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'The recipient user of this notification',
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('order_status', 'payment', 'delivery', 'system', 'feedback'),
      allowNull: false,
      defaultValue: 'system',
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional data payload (e.g., order_id, vendor_id, etc.)',
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = Notification;

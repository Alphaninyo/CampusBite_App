const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Vendor Model
 * Represents a food seller on the platform — either a physical restaurant
 * or a home-based seller. Always linked to a User record (user_id FK).
 */
const Vendor = sequelize.define(
  'Vendor',
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
      references: { model: 'users', key: 'id' },
    },
    business_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Business name cannot be empty.' },
      },
    },
    vendor_type: {
      type: DataTypes.ENUM('restaurant', 'home_based'),
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Text description of the vendor location on or near campus.',
    },
    is_open: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Vendor toggles this to accept or pause incoming orders.',
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when admin approved this vendor profile.',
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when admin rejected this vendor profile.',
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Cover/banner photo path served from /uploads/vendors/',
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    mpesa_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'M-Pesa phone number for receiving payouts',
    },
    kra_pin: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Kenya Revenue Authority PIN for tax purposes',
    },
    opening_time: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Human-readable opening time, e.g. "8:00 AM"',
    },
    closing_time: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Human-readable closing time, e.g. "10:00 PM"',
    },
    prep_time: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: 'Estimated prep time label, e.g. "15-20 mins"',
    },
  },
  {
    tableName: 'vendors',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  }
);

module.exports = Vendor;

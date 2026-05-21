const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * User Model
 * Central authentication table for all actors in the system.
 * A single user can hold one of four roles: consumer, vendor, food_courier, or admin.
 * Vendors and Food Couriers additionally require admin approval (is_approved).
 */
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name cannot be empty.' },
        len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters.' },
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: { msg: 'This email address is already registered.' },
      validate: {
        isEmail: { msg: 'Please provide a valid email address.' },
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Phone number cannot be empty.' },
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('consumer', 'vendor', 'food_courier', 'admin'),
      allowNull: false,
      defaultValue: 'consumer',
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Relevant for vendor and food_courier roles. Consumers are auto-approved.',
    },
    fcm_token: {
      type:      DataTypes.STRING(512),
      allowNull: true,
      comment:   'Firebase Cloud Messaging device token. Updated by the app on each login.',
    },
    password_reset_otp: {
      type:      DataTypes.STRING(255),
      allowNull: true,
      comment:   'SHA-256 hash of the 6-digit OTP sent to the user\'s email.',
    },
    password_reset_expires: {
      type:      DataTypes.DATE,
      allowNull: true,
      comment:   'Expiry timestamp for the password reset OTP (10 minutes from issue).',
    },
    verification_document: {
      type:      DataTypes.STRING(500),
      allowNull: true,
      comment:   'File path to the uploaded national ID or passport image.',
    },
    verification_type: {
      type:      DataTypes.ENUM('national_id', 'passport'),
      allowNull: true,
      comment:   'Type of verification document uploaded.',
    },
    verification_status: {
      type:      DataTypes.ENUM('not_submitted', 'pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'not_submitted',
      comment:   'Admin review status of the uploaded verification document.',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  }
);

module.exports = User;

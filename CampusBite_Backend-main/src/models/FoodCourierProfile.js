const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * FoodCourierProfile Model
 * Represents a food courier/delivery rider on the platform.
 * Linked to a User record (user_id FK) with role 'food_courier'.
 */
const FoodCourierProfile = sequelize.define(
  'FoodCourierProfile',
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
      unique: true,
      references: { model: 'users', key: 'id' },
    },
    vehicle_type: {
      type: DataTypes.ENUM('Electric Bicycle', 'Bicycle', 'Motorcycle', 'Walking'),
      allowNull: false,
      defaultValue: 'Electric Bicycle',
    },
    vehicle_plate: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Vehicle registration plate (for motorcycles)',
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Courier toggles this to accept or pause new delivery requests.',
    },
    total_deliveries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_earnings: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Average rating from consumers (0.00 - 5.00)',
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when admin approved this courier profile.',
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when admin rejected this courier profile.',
    },
  },
  {
    tableName: 'food_courier_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  }
);

module.exports = FoodCourierProfile;

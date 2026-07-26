const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Order Model
 * CRITICAL: An Order row is ONLY created after M-Pesa payment is confirmed.
 * The status lifecycle is: Received → Preparing → Ready → Collected → In Transit → Delivered
 * rider_id is nullable because a rider is assigned AFTER the order is prepared.
 */
const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    consumer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    vendor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'vendors', key: 'id' },
    },
    rider_id: {
      type: DataTypes.UUID,
      allowNull: true, // Nullable — rider is assigned after vendor prepares the order
      references: { model: 'users', key: 'id' },
    },
    status: {
      type: DataTypes.ENUM(
        'Received',
        'Preparing',
        'Ready',
        'Collected',
        'In Transit',
        'Delivered',
        'Cancelled'
      ),
      allowNull: false,
      defaultValue: 'Received',
    },
    food_subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Sum of (unit_price × quantity) for all order items.',
    },
    delivery_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'food_subtotal + delivery_fee. This is the exact amount charged via M-Pesa.',
    },
    delivery_address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    special_instructions: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    payment_method: {
      type: DataTypes.ENUM('mpesa', 'cash', 'card'),
      allowNull: false,
      defaultValue: 'mpesa',
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    promo_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    scheduled_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'NULL = deliver ASAP.',
    },
    rider_lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      comment: 'Rider live latitude, updated while In Transit.',
    },
    rider_lng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      comment: 'Rider live longitude, updated while In Transit.',
    },
    location_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    has_issue: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'True once the consumer reports a delivery problem via "Report a problem".',
    },
    issue_reason: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'One of: not_delivered, wrong_items, missing_items, poor_quality, other.',
    },
    issue_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    issue_reported_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    issue_resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'NULL = still open. Set by an admin resolving the report.',
    },
    refund_status: {
      type: DataTypes.ENUM('not_applicable', 'refunded', 'manual_required', 'failed'),
      allowNull: false,
      defaultValue: 'not_applicable',
      comment: 'Set when a vendor declines a paid order. "manual_required" is used for M-Pesa, since automated reversal needs Daraja Reversal API credentials this app does not have.',
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    delivery_pin: {
      type: DataTypes.STRING(4),
      allowNull: true,
      comment: 'Shown only to the consumer. The rider must obtain it from them to confirm delivery — never exposed via any rider/vendor/admin-facing query.',
    },
    delivery_pin_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'True only when the rider entered the correct delivery PIN. False if an admin force-completed the order instead — lets a dispute be checked at a glance.',
    },
    admin_override_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Set when an admin force-completes an order without PIN verification (e.g. consumer lost access to the PIN).',
    },
  },
  {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  }
);

module.exports = Order;

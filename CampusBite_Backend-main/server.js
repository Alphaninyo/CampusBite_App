require('dotenv').config();

const app           = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 5000;

/**
 * Database Connection & Server Bootstrap
 *
 * sync({ alter: true }) — In development, Sequelize will ALTER existing tables
 * to match model definitions without dropping data.
 * Use { force: true } ONLY to wipe and recreate all tables (dangerous in production).
 */
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[DB] PostgreSQL connection established successfully.');

    // sync() creates tables that don't exist; skips tables that already do.
    // Use { force: true } only once to wipe + rebuild (destructive).
    // Avoid { alter: true } in development — it conflicts with UNIQUE constraints.
    await sequelize.sync();
    console.log('[DB] All models synchronized with the database.');

    // Safe column migrations — IF NOT EXISTS means these are no-ops on subsequent starts
    const migrations = [
      // Existing columns
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions VARCHAR(500)`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP`,
      `ALTER TABLE food_courier_profiles ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP`,
      `ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category VARCHAR(50)`,
      `ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image VARCHAR(500)`,
      // New: multi-payment + promo + scheduled delivery
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(10) DEFAULT 'mpesa'`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50)`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP`,
      // Verification info-request flow
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS passport_photo VARCHAR(500)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_note TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS requested_docs TEXT`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='info_requested' AND enumtypid=(SELECT oid FROM pg_type WHERE typname='enum_users_verification_status')) THEN ALTER TYPE "enum_users_verification_status" ADD VALUE 'info_requested'; END IF; END $$`,
      // User suspension
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false`,
      // User profile photo
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(500)`,
      // Vendor cover image, description, hours, prep time
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS image VARCHAR(500)`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS description VARCHAR(500)`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS mpesa_phone VARCHAR(20)`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS kra_pin VARCHAR(20)`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS opening_time VARCHAR(20)`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS closing_time VARCHAR(20)`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS prep_time VARCHAR(30)`,
      // Order cancellation
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='Cancelled' AND enumtypid=(SELECT oid FROM pg_type WHERE typname='enum_orders_status')) THEN ALTER TYPE "enum_orders_status" ADD VALUE 'Cancelled'; END IF; END $$`,
      // Consumer "Report a problem" flow
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS has_issue BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS issue_reason VARCHAR(50)`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS issue_note TEXT`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS issue_reported_at TIMESTAMP`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS issue_resolved_at TIMESTAMP`,
      // Vendor-decline refunds
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='enum_orders_refund_status') THEN CREATE TYPE "enum_orders_refund_status" AS ENUM ('not_applicable', 'refunded', 'manual_required', 'failed'); END IF; END $$`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status "enum_orders_refund_status" NOT NULL DEFAULT 'not_applicable'`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='refunded' AND enumtypid=(SELECT oid FROM pg_type WHERE typname='enum_payments_status')) THEN ALTER TYPE "enum_payments_status" ADD VALUE 'refunded'; END IF; END $$`,
      // Delivery PIN — proof of delivery, consumer-only visibility
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_pin VARCHAR(4)`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_pin_verified BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_override_reason TEXT`,
      // Platform service fee — KES 5 each from consumer, vendor, and courier per order
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_fee_consumer DECIMAL(10,2) NOT NULL DEFAULT 5.00`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_fee_vendor DECIMAL(10,2) NOT NULL DEFAULT 5.00`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_fee_courier DECIMAL(10,2) NOT NULL DEFAULT 5.00`,
      // Per-status timestamps — so order progress can show when each stage happened
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMP`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS collected_at TIMESTAMP`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS in_transit_at TIMESTAMP`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP`,
      // Distance + time-of-day delivery pricing
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7)`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7)`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_distance_km DECIMAL(6,2)`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='enum_orders_delivery_time_tier') THEN CREATE TYPE "enum_orders_delivery_time_tier" AS ENUM ('normal', 'peak', 'after_hours'); END IF; END $$`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time_tier "enum_orders_delivery_time_tier"`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,7)`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(10,7)`,
      // is_open is now a manual pause override (default true) — the vendor's
      // opening_time/closing_time schedule is the primary driver of open/closed status.
      `ALTER TABLE vendors ALTER COLUMN is_open SET DEFAULT true`,
    ];
    for (const sql of migrations) {
      await sequelize.query(sql).catch((e) => console.warn('[MIGRATION]', sql.slice(0, 60), e.message));
    }
    console.log('[DB] Column migrations applied.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] CampusBite API running on http://localhost:${PORT}`);
      console.log(`[SERVER] Environment: ${process.env.NODE_ENV}`);
      console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[FATAL] Unable to start the server:', error);
    process.exit(1);
  }
}

startServer();

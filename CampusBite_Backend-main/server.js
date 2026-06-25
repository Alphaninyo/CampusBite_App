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
    ];
    for (const sql of migrations) {
      await sequelize.query(sql).catch((e) => console.warn('[MIGRATION]', sql.slice(0, 60), e.message));
    }
    console.log('[DB] Column migrations applied.');

    app.listen(PORT, () => {
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

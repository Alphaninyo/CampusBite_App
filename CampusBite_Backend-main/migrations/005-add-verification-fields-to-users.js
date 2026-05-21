/**
 * Migration 005 — Add verification fields to users table
 * Run once: node migrations/005-add-verification-fields-to-users.js
 */
require('dotenv').config();
const { sequelize } = require('../src/models');

async function up() {
  const qi = sequelize.getQueryInterface();

  const tableDesc = await qi.describeTable('users');

  if (!tableDesc.verification_document) {
    await sequelize.query(`
      ALTER TABLE users
        ADD COLUMN verification_document VARCHAR(500),
        ADD COLUMN verification_type VARCHAR(20) CHECK (verification_type IN ('national_id','passport')),
        ADD COLUMN verification_status VARCHAR(20) NOT NULL DEFAULT 'not_submitted'
          CHECK (verification_status IN ('not_submitted','pending','approved','rejected'));
    `);
    console.log('[MIGRATION 005] verification columns added to users table.');
  } else {
    console.log('[MIGRATION 005] verification columns already exist — skipped.');
  }

  await sequelize.close();
}

up().catch((err) => { console.error('[MIGRATION 005] Error:', err); process.exit(1); });

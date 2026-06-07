const { Client } = require('pg');
require('dotenv').config();

async function addRiderLocationToOrders() {
  const client = new Client({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'campusbite_db',
    user:     process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    await client.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS rider_lat  DECIMAL(10, 7) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS rider_lng  DECIMAL(10, 7) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP DEFAULT NULL;
    `);
    console.log('✅ rider_lat, rider_lng, location_updated_at columns added to orders table');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

addRiderLocationToOrders();

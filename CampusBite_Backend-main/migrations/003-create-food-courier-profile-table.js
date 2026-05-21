const { Client } = require('pg');
require('dotenv').config();

async function createFoodCourierProfileTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'campusbite_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS food_courier_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Electric Bicycle' CHECK (vehicle_type IN ('Electric Bicycle', 'Bicycle', 'Motorcycle', 'Walking')),
        vehicle_plate VARCHAR(20),
        is_available BOOLEAN NOT NULL DEFAULT false,
        total_deliveries INTEGER NOT NULL DEFAULT 0,
        total_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_food_courier_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    await client.query(createTableQuery);
    console.log('✅ food_courier_profiles table created successfully');

    // Create index on user_id for faster lookups
    await client.query('CREATE INDEX IF NOT EXISTS idx_food_courier_user_id ON food_courier_profiles(user_id);');
    console.log('✅ Index on user_id created');

    // Create index on is_available for filtering available couriers
    await client.query('CREATE INDEX IF NOT EXISTS idx_food_courier_is_available ON food_courier_profiles(is_available);');
    console.log('✅ Index on is_available created');

  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createFoodCourierProfileTable();

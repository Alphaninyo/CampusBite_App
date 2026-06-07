const { Client } = require('pg');
require('dotenv').config();

async function createReviewsTable() {
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

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL UNIQUE,
        consumer_id UUID NOT NULL,
        vendor_id UUID NOT NULL,
        rider_id UUID,
        vendor_rating INTEGER NOT NULL CHECK (vendor_rating >= 1 AND vendor_rating <= 5),
        rider_rating INTEGER CHECK (rider_rating >= 1 AND rider_rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_review_consumer FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_review_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
        CONSTRAINT fk_review_rider FOREIGN KEY (rider_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `;

    await client.query(createTableQuery);
    console.log('✅ reviews table created successfully');

    // Create indexes for faster lookups
    await client.query('CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reviews_consumer_id ON reviews(consumer_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON reviews(vendor_id);');
    console.log('✅ Indexes created');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createReviewsTable();

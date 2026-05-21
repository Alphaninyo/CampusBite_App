const { Client } = require('pg');
require('dotenv').config();

async function createNotificationsTable() {
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
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title VARCHAR(150) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'system' CHECK (type IN ('order_status', 'payment', 'delivery', 'system', 'feedback')),
        is_read BOOLEAN NOT NULL DEFAULT false,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    await client.query(createTableQuery);
    console.log('✅ notifications table created successfully');

    // Create index on user_id for faster lookups
    await client.query('CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notifications(user_id);');
    console.log('✅ Index on user_id created');

    // Create index on is_read for filtering unread notifications
    await client.query('CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notifications(is_read);');
    console.log('✅ Index on is_read created');

    // Create index on created_at for sorting by date
    await client.query('CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notifications(created_at DESC);');
    console.log('✅ Index on created_at created');

  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createNotificationsTable();

const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', logging: false }
);

async function seed() {
  await sequelize.authenticate();
  console.log('Connected to database');

  const hash = await bcrypt.hash('password123', 10);

  const users = [
    { name: 'Mark Grayson',    email: 'mark@campusbite.com',     phone: '+254700000001', role: 'consumer',      is_approved: true  },
    { name: 'Test User',       email: 'testuser@campusbite.com', phone: '+254700000002', role: 'consumer',      is_approved: true  },
    { name: 'System Admin',    email: 'sysadmin@campusbite.com', phone: '+254700000003', role: 'admin',         is_approved: true  },
    { name: 'Campus Vendor',   email: 'vendor2@campusbite.com',  phone: '+254700000004', role: 'vendor',        is_approved: false },
    { name: 'Campus Rider',    email: 'rider@campusbite.com',    phone: '+254700000005', role: 'food_courier',  is_approved: false },
  ];

  for (const u of users) {
    try {
      await sequelize.query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, is_approved, verification_status, created_at, updated_at)
         VALUES (gen_random_uuid(), :name, :email, :phone, :hash, :role, :approved, 'pending', NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        { replacements: { name: u.name, email: u.email, phone: u.phone, hash, role: u.role, approved: u.is_approved } }
      );
      console.log(`✅ ${u.name} (${u.email}) - ${u.role}`);
    } catch (err) {
      console.log(`⚠️  ${u.email}: ${err.message}`);
    }
  }

  await sequelize.close();
  console.log('\n🎉 Seed complete! All test accounts ready.');
}

seed().catch(console.error);

const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function createAdminUser() {
  try {
    // Create an admin user
    const password_hash = await bcrypt.hash('password123', 12);
    
    const admin = await User.create({
      name: 'Campus Admin',
      email: 'admin@campusbite.com',
      phone: '+254712345683',
      password_hash: password_hash,
      role: 'admin',
      is_approved: true
    });

    console.log('✅ Admin user created successfully:');
    console.log('📧 Email: admin@campusbite.com');
    console.log('🔑 Password: password123');
    console.log('👤 Role: admin');
    console.log('✅ Approved: true');
    console.log('🆔 User ID:', admin.id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();

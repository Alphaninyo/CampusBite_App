const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function createAdminUser() {
  try {
    // Create an admin user
    const password_hash = await bcrypt.hash('password123', 12);
    
    const admin = await User.create({
      name: 'System Administrator',
      email: 'sysadmin@campusbite.com',
      phone: '+254712345684',
      password_hash: password_hash,
      role: 'admin',
      is_approved: true
    });

    console.log('✅ Admin user created successfully:');
    console.log('📧 Email: sysadmin@campusbite.com');
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

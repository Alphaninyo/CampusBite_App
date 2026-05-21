const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function createTestUser() {
  try {
    // Create a test consumer user
    const password_hash = await bcrypt.hash('password123', 12);
    
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      password_hash: password_hash,
      role: 'consumer',
      is_approved: true
    });

    console.log('✅ Test user created successfully:');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: password123');
    console.log('👤 Role: consumer');
    console.log('✅ Approved: true');
    console.log('🆔 User ID:', user.id);

    // Create another test user
    const user2 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567891',
      password_hash: await bcrypt.hash('password123', 12),
      role: 'consumer',
      is_approved: true
    });

    console.log('\n✅ Second test user created:');
    console.log('📧 Email: john@example.com');
    console.log('🔑 Password: password123');
    console.log('👤 Role: consumer');
    console.log('✅ Approved: true');
    console.log('🆔 User ID:', user2.id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();

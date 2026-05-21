const { sequelize } = require('./src/models');

async function runMigration() {
  try {
    console.log('🔄 Running SQL migration: Update Rider to Food Courier');
    
    // Step 1: Try to add food_courier to the enum (if not exists)
    try {
      await sequelize.query(`
        ALTER TYPE enum_users_role ADD VALUE 'food_courier'
      `);
      console.log('✅ Added food_courier to enum');
    } catch (enumError) {
      if (enumError.message.includes('already exists')) {
        console.log('✅ food_courier already exists in enum');
      } else {
        throw enumError;
      }
    }
    
    // Step 2: Update all rider accounts to food_courier
    console.log('Step 2: Updating rider accounts...');
    const result = await sequelize.query(`
      UPDATE users 
      SET role = 'food_courier', updated_at = NOW() 
      WHERE role = 'rider'
      RETURNING email
    `);
    
    const updatedUsers = result[1] || [];
    console.log(`✅ Updated ${updatedUsers.length} rider accounts to food_courier`);
    
    // Show updated accounts
    if (updatedUsers.length > 0) {
      updatedUsers.forEach(user => {
        console.log(`   📧 ${user.email} → food_courier`);
      });
    } else {
      console.log('ℹ️  No rider accounts found to update');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📱 Updated Login Credentials:');
    console.log('   Food Courier: rider@campusbite.com / password123');
    console.log('\n✨ All rider accounts are now food_courier accounts!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();

const { User } = require('./src/models');

async function migrateRiderToFoodCourier() {
  try {
    console.log('🔄 Starting migration: Rider → Food Courier');
    
    // Find all users with role 'rider'
    const riders = await User.findAll({
      where: { role: 'rider' }
    });

    console.log(`📊 Found ${riders.length} users with role 'rider'`);

    if (riders.length === 0) {
      console.log('✅ No rider accounts found. Migration complete.');
      process.exit(0);
    }

    // Update all rider accounts to food_courier
    const [updatedCount] = await User.update(
      { role: 'food_courier' },
      { where: { role: 'rider' } }
    );

    console.log(`✅ Successfully migrated ${updatedCount} rider accounts to food_courier`);

    // Show migrated accounts
    for (const rider of riders) {
      console.log(`   📧 ${rider.email} → food_courier`);
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

migrateRiderToFoodCourier();

const { sequelize } = require('./src/models');

async function runMigration() {
  try {
    console.log('🔄 Running SQL migration: Update Rider to Food Courier');
    
    // Step 1: Add food_courier to the enum
    console.log('Step 1: Adding food_courier to enum...');
    await sequelize.query(`
      ALTER TYPE enum_users_role ADD VALUE 'food_courier'
    `);
    
    console.log('✅ Added food_courier to enum');
    
    // Step 2: Wait a moment for the enum change to be committed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Update all rider accounts to food_courier
    console.log('Step 2: Updating rider accounts...');
    const [updatedCount] = await sequelize.query(`
      UPDATE users 
      SET role = 'food_courier', updated_at = NOW() 
      WHERE role = 'rider'
      RETURNING email
    `);
    
    console.log(`✅ Updated ${updatedCount[1].length} rider accounts to food_courier`);
    
    // Show updated accounts
    updatedCount[1].forEach(user => {
      console.log(`   📧 ${user.email} → food_courier`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📱 Updated Login Credentials:');
    console.log('   Food Courier: rider@campusbite.com / password123');
    console.log('\n✨ All rider accounts are now food_courier accounts!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    
    // If the enum already exists, just try to update the records
    if (error.message.includes('already exists')) {
      console.log('⚠️  Enum value already exists, trying to update records...');
      try {
        const [updatedCount] = await sequelize.query(`
          UPDATE users 
          SET role = 'food_courier', updated_at = NOW() 
          WHERE role = 'rider'
          RETURNING email
        `);
        
        console.log(`✅ Updated ${updatedCount[1].length} rider accounts to food_courier`);
        
        updatedCount[1].forEach(user => {
          console.log(`   📧 ${user.email} → food_courier`);
        });
        
        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
      } catch (updateError) {
        console.error('❌ Update failed:', updateError);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

runMigration();

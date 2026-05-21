const { sequelize } = require('./src/models');

async function runMigration() {
  try {
    console.log('🔄 Running SQL migration: Update Rider to Food Courier');
    
    // Start transaction
    const t = await sequelize.transaction();
    
    try {
      // Step 1: Add food_courier to the enum (PostgreSQL specific)
      await sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'food_courier' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_users_role')) THEN
            ALTER TYPE enum_users_role ADD VALUE 'food_courier';
          END IF;
        END $$;
      `, { transaction: t });
      
      console.log('✅ Added food_courier to enum');
      
      // Step 2: Update all rider accounts to food_courier
      const [updatedCount] = await sequelize.query(`
        UPDATE users 
        SET role = 'food_courier', updated_at = NOW() 
        WHERE role = 'rider'
        RETURNING email
      `, { transaction: t });
      
      console.log(`✅ Updated ${updatedCount[1].length} rider accounts to food_courier`);
      
      // Show updated accounts
      updatedCount[1].forEach(user => {
        console.log(`   📧 ${user.email} → food_courier`);
      });
      
      await t.commit();
      
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📱 Updated Login Credentials:');
      console.log('   Food Courier: rider@campusbite.com / password123');
      console.log('\n✨ All rider accounts are now food_courier accounts!');
      
      process.exit(0);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();

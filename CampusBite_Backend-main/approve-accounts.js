const { User, Vendor } = require('./src/models');

async function approvePendingAccounts() {
  try {
    console.log('🔍 Finding pending vendor and rider accounts...');
    
    // Find pending vendor accounts
    const pendingVendors = await User.findAll({
      where: {
        role: 'vendor',
        is_approved: false
      },
      include: [{ model: Vendor, as: 'vendorProfile' }]
    });

    // Find pending rider accounts
    const pendingRiders = await User.findAll({
      where: {
        role: 'rider',
        is_approved: false
      }
    });

    console.log(`\n📊 Found ${pendingVendors.length} pending vendors and ${pendingRiders.length} pending riders`);

    // Approve vendors
    for (const vendor of pendingVendors) {
      await vendor.update({ is_approved: true });
      console.log(`✅ Approved vendor: ${vendor.email} (${vendor.name})`);
      
      // Also approve the vendor profile
      if (vendor.vendorProfile) {
        await vendor.vendorProfile.update({ approved_at: new Date() });
        console.log(`   📝 Vendor profile approved: ${vendor.vendorProfile.business_name}`);
      }
    }

    // Approve riders
    for (const rider of pendingRiders) {
      await rider.update({ is_approved: true });
      console.log(`✅ Approved rider: ${rider.email} (${rider.name})`);
    }

    console.log('\n🎉 All pending accounts have been approved!');
    console.log('\n📱 Updated Login Credentials:');
    console.log('   Vendor: vendor2@campusbite.com / password123');
    console.log('   Rider: rider@campusbite.com / password123');
    console.log('\n✨ These accounts can now login successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error approving accounts:', error);
    process.exit(1);
  }
}

approvePendingAccounts();

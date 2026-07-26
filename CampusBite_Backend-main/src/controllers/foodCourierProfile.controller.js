const { FoodCourierProfile, User, Order, sequelize } = require('../models');
const { Op } = require('sequelize');
const notify = require('../services/notification.service');

/**
 * GET /api/food-courier/profile
 * Protected — food_courier only.
 * Returns the authenticated food courier's profile.
 */
exports.getProfile = async (req, res) => {
  try {
    let profile = await FoodCourierProfile.findOne({
      where: { user_id: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }],
    });

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await FoodCourierProfile.create({
        user_id: req.user.id,
        vehicle_type: 'Electric Bicycle',
        is_available: false,
        total_deliveries: 0,
        total_earnings: 0,
        rating: 0.00,
      });
      await profile.reload({ include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }] });
    }

    // Calculate real-time stats from orders
    const orders = await Order.findAll({
      where: { rider_id: req.user.id, status: 'Delivered' },
      attributes: [[sequelize.fn('COUNT', sequelize.col('id')), 'count'], [sequelize.fn('SUM', sequelize.col('delivery_fee')), 'earnings']],
    });

    const stats = orders[0]?.get({ plain: true }) || { count: 0, earnings: 0 };

    res.status(200).json({
      success: true,
      profile: {
        ...profile.get({ plain: true }),
        total_deliveries: parseInt(stats.count) || 0,
        total_earnings: parseFloat(stats.earnings) || 0,
      },
    });
  } catch (error) {
    console.error('[FOOD_COURIER] getProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PUT /api/food-courier/profile
 * Protected — food_courier only.
 * Updates the food courier's profile (vehicle type, plate, etc.).
 */
exports.updateProfile = async (req, res) => {
  try {
    const { vehicle_type, vehicle_plate } = req.body;

    const profile = await FoodCourierProfile.findOne({
      where: { user_id: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    const updates = {};
    if (vehicle_type !== undefined) updates.vehicle_type = vehicle_type;
    if (vehicle_plate !== undefined) updates.vehicle_plate = vehicle_plate;

    await profile.update(updates);

    res.status(200).json({ success: true, message: 'Profile updated successfully.', profile });
  } catch (error) {
    console.error('[FOOD_COURIER] updateProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/food-courier/profile/toggle-availability
 * Protected — food_courier only.
 * Toggles the courier's availability status.
 */
exports.toggleAvailability = async (req, res) => {
  try {
    const profile = await FoodCourierProfile.findOne({
      where: { user_id: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    await profile.update({ is_available: !profile.is_available });

    res.status(200).json({
      success: true,
      message: `Availability ${profile.is_available ? 'enabled' : 'disabled'}.`,
      is_available: profile.is_available,
    });
  } catch (error) {
    console.error('[FOOD_COURIER] toggleAvailability error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

/**
 * GET /api/food-courier/admin/pending
 * Protected — admin only.
 * Lists all food couriers whose profile has not been approved or rejected.
 */
exports.getPendingFoodCouriers = async (req, res) => {
  try {
    // Primary: profiles not yet approved or rejected
    const profilePending = await FoodCourierProfile.findAll({
      where: { approved_at: null, rejected_at: null },
      attributes: ['user_id'],
    });

    // Fallback: food_courier users with no profile at all (data inconsistency recovery)
    const profileUserIds = profilePending.map((p) => p.user_id);
    const orphanUsers = await User.findAll({
      where: {
        role: 'food_courier',
        is_approved: false,
        id: { [Op.notIn]: profileUserIds.length ? profileUserIds : ['00000000-0000-0000-0000-000000000000'] },
      },
    });

    for (const u of orphanUsers) {
      const existing = await FoodCourierProfile.findOne({ where: { user_id: u.id } });
      if (!existing) {
        await FoodCourierProfile.create({
          user_id: u.id, vehicle_type: 'Electric Bicycle',
          is_available: false, total_deliveries: 0, total_earnings: 0, rating: 0.00,
        });
      }
    }

    // Re-fetch after auto-creating any missing profiles
    const profiles = await FoodCourierProfile.findAll({
      where: { approved_at: null, rejected_at: null },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'created_at', 'verification_status', 'verification_type', 'verification_document', 'passport_photo'] }],
      order: [['created_at', 'ASC']],
    });
    res.status(200).json({ success: true, count: profiles.length, couriers: profiles });
  } catch (error) {
    console.error('[FOOD_COURIER] getPending error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/food-courier/admin/:id/approve
 * Protected — admin only.
 * Approves a food courier by their FoodCourierProfile id.
 */
exports.approveFoodCourier = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const profile = await FoodCourierProfile.findByPk(req.params.id, { transaction: t });
    if (!profile) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Food courier profile not found.' });
    }
    if (profile.approved_at) {
      await t.rollback();
      return res.status(409).json({ success: false, message: 'This courier is already approved.' });
    }
    await profile.update({ approved_at: new Date() }, { transaction: t });
    await User.update({ is_approved: true }, { where: { id: profile.user_id }, transaction: t });
    await t.commit();

    notify.notifyUser(profile.user_id, {
      type: 'system',
      title: 'Food courier account approved!',
      body:  'Your food courier application is approved — you can start accepting deliveries.',
    }).catch(console.error);

    res.status(200).json({ success: true, message: 'Food courier has been approved successfully.' });
  } catch (error) {
    await t.rollback();
    console.error('[FOOD_COURIER] approve error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/food-courier/admin/:id/reject
 * Protected — admin only.
 * Rejects a pending food courier by their FoodCourierProfile id.
 */
exports.rejectFoodCourier = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const profile = await FoodCourierProfile.findByPk(req.params.id, { transaction: t });
    if (!profile) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Food courier profile not found.' });
    }
    if (profile.approved_at) {
      await t.rollback();
      return res.status(409).json({ success: false, message: 'Cannot reject an already approved courier.' });
    }
    if (profile.rejected_at) {
      await t.rollback();
      return res.status(409).json({ success: false, message: 'This courier has already been rejected.' });
    }
    await profile.update({ rejected_at: new Date() }, { transaction: t });
    await t.commit();

    notify.notifyUser(profile.user_id, {
      type: 'system',
      title: 'Application not approved',
      body:  'Your food courier application was not approved.',
    }).catch(console.error);

    res.status(200).json({ success: true, message: 'Food courier has been rejected.' });
  } catch (error) {
    await t.rollback();
    console.error('[FOOD_COURIER] reject error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const { FoodCourierProfile, User, Order, sequelize } = require('../models');

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

const { sequelize, User, Vendor, Order, Payment, Review, MenuItem } = require('../models');
const { Op } = require('sequelize');
const bcrypt  = require('bcryptjs');
const notify  = require('../services/notification.service');

// ─── Stats Overview ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Admin only — platform-wide numbers for a dashboard overview.
 */
exports.getStats = async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    // Platform fee revenue excludes Cancelled orders — a decline refunds the
    // full total_amount (fees included) back to the consumer, so the
    // platform never actually keeps its cut on those.
    const platformFeeSum = (extraWhere = {}) => Order.findOne({
      where: { status: { [Op.ne]: 'Cancelled' }, ...extraWhere },
      attributes: [[sequelize.fn('SUM', sequelize.literal('service_fee_consumer + service_fee_vendor + service_fee_courier')), 'total']],
      raw: true,
    }).catch(() => null);

    const [
      totalOrders,
      ordersByStatus,
      confirmedRevenue,
      todayRevenue,
      deliveredCount,
      activeCount,
      totalConsumers,
      totalVendors,
      totalRiders,
      pendingVendors,
      totalReviews,
      avgDeliveryRow,
      platformFeeTotalRow,
      platformFeeTodayRow,
    ] = await Promise.all([
      Order.count(),
      Order.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw:   true,
      }),
      Payment.sum('amount', { where: { status: 'confirmed' } }),
      Payment.sum('amount', { where: { status: 'confirmed', created_at: { [Op.gte]: todayStart } } }),
      Order.count({ where: { status: 'Delivered' } }),
      Order.count({ where: { status: { [Op.in]: ['Received', 'Preparing', 'Ready', 'Collected', 'In Transit'] } } }),
      User.count({ where: { role: 'consumer' } }),
      User.count({ where: { role: 'vendor', is_approved: true } }),
      User.count({ where: { role: 'food_courier', is_approved: true } }),
      Vendor.count({ where: { approved_at: null } }),
      Review.count(),
      Order.findOne({
        where: { status: 'Delivered' },
        attributes: [[sequelize.literal("AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60)"), 'avg_minutes']],
        raw: true,
      }).catch(() => null),
      platformFeeSum(),
      platformFeeSum({ created_at: { [Op.gte]: todayStart } }),
    ]);

    const platformFeeTotal = parseFloat(platformFeeTotalRow?.total || 0);
    const platformFeeToday = parseFloat(platformFeeTodayRow?.total || 0);

    const fulfilmentRate = totalOrders > 0
      ? Math.round((deliveredCount / totalOrders) * 100)
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        orders: {
          total:         totalOrders,
          delivered:     deliveredCount,
          active:        activeCount,
          fulfilment_rate: fulfilmentRate,
          by_status:     ordersByStatus,
        },
        revenue: {
          confirmed_total: parseFloat(confirmedRevenue || 0).toFixed(2),
          today_total:     parseFloat(todayRevenue     || 0).toFixed(2),
          platform_fee_total: platformFeeTotal.toFixed(2),
          platform_fee_today: platformFeeToday.toFixed(2),
        },
        users: {
          consumers:       totalConsumers,
          vendors:         totalVendors,
          food_couriers:   totalRiders,
          pending_vendors: pendingVendors,
        },
        reviews:  { total: totalReviews },
        avg_delivery_minutes: Math.round(parseFloat(avgDeliveryRow?.avg_minutes || 0)),
      },
    });
  } catch (error) {
    console.error('[ADMIN] getStats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Weekly Orders ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats/weekly-orders
 * Admin only — orders per day for the current week.
 */
exports.getWeeklyOrders = async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start from Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const orders = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [startOfWeek, endOfWeek],
        },
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      raw: true,
    });

    // Create array for all days of the week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = days.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];
      const found = orders.find(o => o.date === dateStr);
      return { day, value: found ? parseInt(found.count) : 0 };
    });

    res.status(200).json({
      success: true,
      weekly_orders: weeklyData,
    });
  } catch (error) {
    console.error('[ADMIN] getWeeklyOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Top Vendors ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats/top-vendors
 * Admin only — vendors ranked by total orders.
 */
exports.getTopVendors = async (req, res) => {
  try {
    const vendors = await Order.findAll({
      attributes: [
        'vendor_id',
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'order_count'],
      ],
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['business_name'],
        },
      ],
      group: ['vendor_id', 'vendor.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('Order.id')), 'DESC']],
      limit: 10,
      raw: false,
    });

    const topVendors = vendors.map(v => ({
      name: v.vendor?.business_name || 'Unknown Vendor',
      orders: parseInt(v.dataValues.order_count),
    }));

    res.status(200).json({
      success: true,
      top_vendors: topVendors,
    });
  } catch (error) {
    console.error('[ADMIN] getTopVendors error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── All Orders ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/orders
 * Admin only — paginated list of all orders.
 * Query params: ?status=Received&page=1&limit=20
 */
exports.getAllOrders = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = req.query.status;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      attributes: { exclude: ['delivery_pin'] },
      include: [
        { model: User,   as: 'consumer', attributes: ['name', 'phone'] },
        { model: Vendor, as: 'vendor',   attributes: ['business_name'] },
        { model: User,   as: 'rider',    attributes: ['name', 'phone'] },
      ],
      order:  [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      total:   count,
      page,
      pages:   Math.ceil(count / limit),
      orders,
    });
  } catch (error) {
    console.error('[ADMIN] getAllOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/admin/orders/:id/resolve-issue
 * Admin only — marks a consumer-reported delivery issue as resolved.
 */
exports.resolveOrderIssue = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (!order.has_issue) {
      return res.status(400).json({ success: false, message: 'This order has no reported issue.' });
    }
    if (order.issue_resolved_at) {
      return res.status(400).json({ success: false, message: 'This issue has already been resolved.' });
    }

    await order.update({ issue_resolved_at: new Date() });

    notify.notifyUser(order.consumer_id, {
      type: 'system',
      title: 'Issue resolved',
      body:  `The issue you reported on order #${order.id.slice(0, 8)} has been resolved.`,
      data:  { order_id: order.id },
    }).catch(console.error);

    res.status(200).json({ success: true, message: 'Issue marked as resolved.', order });
  } catch (error) {
    console.error('[ADMIN] resolveOrderIssue error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/admin/orders/:id/mark-refund-complete
 * Admin only — marks a "manual_required" M-Pesa refund as done once the
 * admin has actually sent the money back via the Safaricom portal/app.
 * There is no automated M-Pesa reversal in this app (needs Daraja
 * Reversal API credentials this project doesn't have configured).
 */
exports.markRefundComplete = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.refund_status !== 'manual_required') {
      return res.status(400).json({ success: false, message: 'This order has no pending manual refund.' });
    }

    await order.update({ refund_status: 'refunded', refunded_at: new Date() });

    notify.notifyUser(order.consumer_id, {
      type: 'payment',
      title: 'Refund completed',
      body:  `Your refund for order #${order.id.slice(0, 8)} has been processed.`,
      data:  { order_id: order.id },
    }).catch(console.error);

    res.status(200).json({ success: true, message: 'Refund marked as completed.', order });
  } catch (error) {
    console.error('[ADMIN] markRefundComplete error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/admin/orders/:id/force-complete
 * Admin only — marks an order Delivered without the rider entering the
 * delivery PIN. This is a deliberate override, not a bypass a rider or
 * vendor can trigger — for cases like the consumer losing access to their
 * PIN. Always requires a reason, and `delivery_pin_verified` stays false so
 * anyone reviewing the order later can see it wasn't PIN-confirmed.
 */
exports.forceCompleteOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A reason is required to force-complete an order.' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.status === 'Delivered') {
      return res.status(400).json({ success: false, message: 'This order is already delivered.' });
    }
    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot complete a cancelled order.' });
    }

    await order.update({
      status: 'Delivered',
      delivery_pin_verified: false,
      admin_override_reason: reason.trim(),
      delivered_at: order.delivered_at || new Date(),
    });

    notify.notifyUser(order.consumer_id, {
      type: 'order_status',
      title: 'Order marked delivered',
      body:  'An admin has marked your order as delivered.',
      data:  { order_id: order.id },
    }).catch(console.error);

    res.status(200).json({ success: true, message: 'Order marked as delivered by admin override.', order });
  } catch (error) {
    console.error('[ADMIN] forceCompleteOrder error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── All Users ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Admin only — paginated user list.
 * Query params: ?role=rider&page=1&limit=20
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const where = { verification_status: { [Op.ne]: 'rejected' } };
    if (req.query.role) where.role = req.query.role;

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash', 'fcm_token'] },
      order:      [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      total:   count,
      page,
      pages:   Math.ceil(count / limit),
      users,
    });
  } catch (error) {
    console.error('[ADMIN] getAllUsers error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── All Vendors ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/vendors
 * Admin only — all vendor profiles with owner info and approval status.
 * Query params: ?approved=true|false&page=1&limit=25
 */
exports.getAllVendors = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.approved === 'true')  where.approved_at = { [Op.ne]: null };
    if (req.query.approved === 'false') where.approved_at = null;

    const { count, rows: vendors } = await Vendor.findAndCountAll({
      where,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone', 'is_approved', 'verification_status', 'verification_document', 'verification_type', 'passport_photo'] },
      ],
      order:  [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      total:   count,
      page,
      pages:   Math.ceil(count / limit),
      vendors,
    });
  } catch (error) {
    console.error('[ADMIN] getAllVendors error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/admin/users/:userId/request-info
 * Admin only — marks a vendor/food_courier account as needing more information.
 *
 * Body: { note: string, requestedDocs: string[] }
 *   requestedDocs: subset of ['passport_photo', 'id_document'] — which files to request
 */
exports.requestInfo = async (req, res) => {
  try {
    const { note, requestedDocs } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'A note describing the missing information is required.' });
    }

    const VALID_DOCS = ['passport_photo', 'national_id', 'passport'];
    const docs = Array.isArray(requestedDocs) ? requestedDocs.filter(d => VALID_DOCS.includes(d)) : VALID_DOCS;
    if (docs.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one document to request.' });
    }

    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!['vendor', 'food_courier'].includes(user.role)) {
      return res.status(400).json({ success: false, message: 'Info requests only apply to vendor and food courier accounts.' });
    }

    await user.update({
      verification_status: 'info_requested',
      admin_note:          note.trim(),
      requested_docs:      JSON.stringify(docs),
    });

    notify.notifyUser(user.id, {
      type: 'system',
      title: 'More information needed',
      body:  note.trim(),
      data:  { requested_docs: docs },
    }).catch(console.error);

    res.status(200).json({
      success: true,
      message: `Information request sent to ${user.name}.`,
    });
  } catch (error) {
    console.error('[ADMIN] requestInfo error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/admin/users/:userId/suspend
 * Admin only — toggles the is_suspended flag on any user account.
 * Suspended users are blocked from logging in.
 */
exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin accounts cannot be suspended.' });
    }

    const newState = !user.is_suspended;
    await user.update({ is_suspended: newState });

    res.status(200).json({
      success:      true,
      is_suspended: newState,
      message:      `${user.name} has been ${newState ? 'suspended' : 'unsuspended'}.`,
    });
  } catch (error) {
    console.error('[ADMIN] suspendUser error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Pending Document Reviews ─────────────────────────────────────────────────

/**
 * GET /api/admin/users/pending-docs
 * Admin only — all vendors/couriers who have submitted documents awaiting review.
 */
exports.getPendingDocUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        verification_status: 'pending',
        role: { [Op.in]: ['vendor', 'food_courier'] },
      },
      attributes: { exclude: ['password_hash', 'fcm_token'] },
      order: [['updated_at', 'DESC']],
    });
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('[ADMIN] getPendingDocUsers error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/admin/users/:userId/approve-docs
 * Admin only — marks verification documents as approved.
 */
exports.approveUserDocs = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!['vendor', 'food_courier'].includes(user.role)) {
      return res.status(400).json({ success: false, message: 'Only vendor and courier documents can be approved.' });
    }
    await user.update({ verification_status: 'approved', admin_note: null });

    notify.notifyUser(user.id, {
      type: 'system',
      title: 'Documents approved',
      body:  'Your verification documents have been approved.',
    }).catch(console.error);

    res.status(200).json({ success: true, message: `${user.name}'s documents have been approved.` });
  } catch (error) {
    console.error('[ADMIN] approveUserDocs error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/admin/users/:userId/reject-docs
 * Admin only — rejects verification documents and sends a note back to the user.
 * Body: { note: string }
 */
exports.rejectUserDocs = async (req, res) => {
  try {
    const { note } = req.body;
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!['vendor', 'food_courier'].includes(user.role)) {
      return res.status(400).json({ success: false, message: 'Only vendor and courier documents can be rejected.' });
    }
    const rejectNote = note?.trim() || 'Your submitted documents were not accepted. Please resubmit clear, valid documents.';
    await user.update({
      verification_status: 'info_requested',
      admin_note: rejectNote,
    });

    notify.notifyUser(user.id, {
      type: 'system',
      title: 'Documents not accepted',
      body:  rejectNote,
    }).catch(console.error);

    res.status(200).json({ success: true, message: `${user.name}'s documents have been rejected.` });
  } catch (error) {
    console.error('[ADMIN] rejectUserDocs error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};


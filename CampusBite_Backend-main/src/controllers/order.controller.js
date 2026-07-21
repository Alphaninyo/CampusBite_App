const mpesaService  = require('../services/mpesa.service');
const stripeService = require('../services/stripe.service');
const notify        = require('../services/notification.service');
const { sequelize, Order, OrderItem, MenuItem, Vendor, User, Payment, PromoCode } = require('../models');

// ─── Constants ────────────────────────────────────────────────────────────────

const DELIVERY_FEE = 50.00;

const TRANSITIONS = {
  'Received':   { next: 'Preparing',  role: 'vendor' },
  'Preparing':  { next: 'Ready',      role: 'vendor' },
  'Ready':      { next: 'Collected',  role: 'food_courier'  },
  'Collected':  { next: 'In Transit', role: 'food_courier'  },
  'In Transit': { next: 'Delivered',  role: 'food_courier'  },
};

const ISSUE_REASONS = ['not_delivered', 'wrong_items', 'missing_items', 'poor_quality', 'other'];

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Calculates the discount amount for a given promo code.
 * Returns { promoRecord, discount_amount } — promoRecord is null if invalid/not found.
 */
async function _applyPromo(code, vendor_id, food_subtotal) {
  if (!code) return { promoRecord: null, discount_amount: 0 };

  const promo = await PromoCode.findOne({
    where: { code: code.trim().toUpperCase(), vendor_id, is_active: true },
  });

  if (!promo) return { promoRecord: null, discount_amount: 0 };
  if (promo.expires_at && new Date() > new Date(promo.expires_at)) return { promoRecord: null, discount_amount: 0 };
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) return { promoRecord: null, discount_amount: 0 };
  if (food_subtotal < parseFloat(promo.min_order_amount)) return { promoRecord: null, discount_amount: 0 };

  const discountValue   = parseFloat(promo.discount_value);
  const discount_amount = promo.discount_type === 'percent'
    ? parseFloat(((food_subtotal * discountValue) / 100).toFixed(2))
    : Math.min(discountValue, food_subtotal);

  return { promoRecord: promo, discount_amount };
}

/**
 * createOrderFromPayment
 * Reads a confirmed Payment's cart_data and atomically creates:
 *   1. An Order row
 *   2. All OrderItem rows
 * EXPORTED so the M-Pesa callback handler can call this.
 */
exports.createOrderFromPayment = async (payment, t) => {
  const {
    consumer_id,
    vendor_id,
    items,
    delivery_address,
    special_instructions,
    food_subtotal,
    delivery_fee,
    discount_amount,
    total_amount,
    promo_code,
    scheduled_time,
    payment_method,
  } = payment.cart_data;

  const order = await Order.create(
    {
      consumer_id,
      vendor_id,
      rider_id:             null,
      status:               'Received',
      food_subtotal,
      delivery_fee,
      discount_amount:      discount_amount || 0,
      total_amount,
      delivery_address,
      special_instructions: special_instructions || null,
      promo_code:           promo_code || null,
      scheduled_time:       scheduled_time || null,
      payment_method:       payment_method || 'mpesa',
    },
    { transaction: t }
  );

  const orderItems = items.map((item) => ({
    order_id:     order.id,
    menu_item_id: item.menu_item_id,
    quantity:     item.quantity,
    unit_price:   item.unit_price,
  }));

  await OrderItem.bulkCreate(orderItems, { transaction: t });

  return order;
};

// ─── Consumer: Initiate Checkout ──────────────────────────────────────────────

/**
 * POST /api/orders/initiate
 * Protected — consumer only.
 *
 * Accepts payment_method: 'mpesa' | 'cash' | 'card'
 *   - mpesa: runs STK Push → returns checkout_request_id for polling
 *   - cash / card: creates order immediately → returns { immediate: true, order_id }
 *
 * Also accepts: promo_code, scheduled_time
 */
exports.initiateCheckout = async (req, res) => {
  try {
    const {
      vendor_id,
      items,
      delivery_address,
      special_instructions,
      payment_method   = 'mpesa',
      promo_code,
      scheduled_time,
      phone_number,
    } = req.body;

    console.log('[ORDER] initiateCheckout request:', { vendor_id, items, delivery_address, payment_method, phone_number });

    // ── Basic validation ──────────────────────────────────────────────────────
    if (!vendor_id || !Array.isArray(items) || items.length === 0) {
      console.log('[ORDER] Validation failed: vendor_id or items');
      return res.status(400).json({ success: false, message: 'Please provide vendor_id and a non-empty items array.' });
    }
    if (!delivery_address || !delivery_address.trim()) {
      console.log('[ORDER] Validation failed: delivery_address');
      return res.status(400).json({ success: false, message: 'delivery_address is required.' });
    }
    if (!['mpesa', 'card', 'cash'].includes(payment_method)) {
      console.log('[ORDER] Validation failed: payment_method', payment_method);
      return res.status(400).json({ success: false, message: 'payment_method must be mpesa, card, or cash.' });
    }

    // ── Vendor validation ─────────────────────────────────────────────────────
    const vendor = await Vendor.findByPk(vendor_id);
    if (!vendor || !vendor.approved_at) {
      return res.status(404).json({ success: false, message: 'Vendor not found or not yet approved.' });
    }
    if (!vendor.is_open) {
      return res.status(400).json({ success: false, message: `"${vendor.business_name}" is currently closed.` });
    }

    // ── Validate each item and snapshot prices ────────────────────────────────
    const cartItems   = [];
    let food_subtotal = 0;

    for (const entry of items) {
      const { menu_item_id, quantity } = entry;

      if (!menu_item_id || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ success: false, message: 'Each item must have a valid menu_item_id and integer quantity ≥ 1.' });
      }

      const menuItem = await MenuItem.findByPk(menu_item_id);
      if (!menuItem || !menuItem.is_available) {
        return res.status(400).json({ success: false, message: `Menu item "${menu_item_id}" is unavailable or does not exist.` });
      }
      if (menuItem.vendor_id !== vendor_id) {
        return res.status(400).json({ success: false, message: `"${menuItem.name}" does not belong to this vendor.` });
      }

      const unit_price = parseFloat(menuItem.price);
      food_subtotal   += unit_price * quantity;
      cartItems.push({ menu_item_id, name: menuItem.name, quantity, unit_price });
    }

    food_subtotal = parseFloat(food_subtotal.toFixed(2));
    const delivery_fee = DELIVERY_FEE;

    // ── Apply promo code ──────────────────────────────────────────────────────
    const { promoRecord, discount_amount } = await _applyPromo(promo_code, vendor_id, food_subtotal);
    const total_amount = parseFloat((food_subtotal + delivery_fee - discount_amount).toFixed(2));

    // Cart snapshot — shared across all payment paths
    const cartSnapshot = {
      consumer_id:          req.user.id,
      vendor_id,
      items:                cartItems,
      delivery_address:     delivery_address.trim(),
      special_instructions: special_instructions?.trim() || null,
      food_subtotal,
      delivery_fee,
      discount_amount,
      total_amount,
      promo_code:           promoRecord ? promoRecord.code : null,
      scheduled_time:       scheduled_time || null,
      payment_method,
    };

    // ─── M-Pesa flow ──────────────────────────────────────────────────────────
    if (payment_method === 'mpesa') {
      // Fire a real STK push whenever real credentials are present.
      // MPESA_ENV controls sandbox vs production — keep it 'sandbox' for testing.
      // Switch to MPESA_ENV=production only with live Daraja credentials.
      const useLiveMpesa =
        process.env.MPESA_CONSUMER_KEY &&
        process.env.MPESA_CONSUMER_KEY !== 'your_consumer_key' &&
        process.env.MPESA_CONSUMER_SECRET &&
        process.env.MPESA_CONSUMER_SECRET !== 'your_consumer_secret' &&
        process.env.MPESA_PASSKEY &&
        process.env.MPESA_PASSKEY !== 'your_lipa_na_mpesa_passkey' &&
        process.env.MPESA_CALLBACK_URL &&
        !process.env.MPESA_CALLBACK_URL.includes('your-public-url');

      let checkoutRequestId;
      let devMode = false;

      if (useLiveMpesa) {
        let stkResponse;
        try {
          stkResponse = await mpesaService.initiateSTKPush({
            phone:       phone_number || req.user.phone,
            amount:      total_amount,
            accountRef:  vendor.business_name,
            description: 'Food Order',
          });
        } catch (mpesaError) {
          console.error('[ORDER] STK Push failed:', mpesaError.message);
          return res.status(503).json({ success: false, message: `M-Pesa request failed: ${mpesaError.message}` });
        }
        checkoutRequestId = stkResponse.CheckoutRequestID;
      } else {
        // Dev / sandbox fallback — no real credentials
        checkoutRequestId = `DEV-${Date.now()}-${req.user.id.slice(0, 8)}`;
        devMode = true;
      }

      const payment = await Payment.create({
        checkout_request_id: checkoutRequestId,
        amount:              total_amount,
        status:              'pending',
        cart_data:           cartSnapshot,
      });

      return res.status(200).json({
        success:             true,
        message:             devMode
          ? 'Dev mode: tap "Simulate M-Pesa" in the app to confirm.'
          : 'STK Push sent. Enter your M-Pesa PIN to confirm.',
        checkout_request_id: payment.checkout_request_id,
        payment_id:          payment.id,
        immediate:           false,
        dev_mode:            devMode,
        summary: {
          vendor:           vendor.business_name,
          items:            cartItems,
          food_subtotal,
          delivery_fee,
          discount_amount,
          total_amount,
          delivery_address: delivery_address.trim(),
          scheduled_time:   scheduled_time || null,
        },
      });
    }

    // ─── Card flow (Stripe) ───────────────────────────────────────────────────
    if (payment_method === 'card') {
      // Fire a real Stripe PaymentIntent whenever a real secret key is present.
      // Leave STRIPE_SECRET_KEY as the placeholder to run in dev/simulation mode.
      const useLiveStripe = stripeService.isConfigured();

      let checkoutRequestId;
      let clientSecret   = null;
      let publishableKey = null;
      let devMode        = false;

      if (useLiveStripe) {
        let intent;
        try {
          intent = await stripeService.createPaymentIntent({
            amount:      total_amount,
            description: `CampusBite order — ${vendor.business_name}`,
          });
        } catch (stripeError) {
          console.error('[ORDER] Stripe PaymentIntent failed:', stripeError.message);
          return res.status(503).json({ success: false, message: 'Card payment service is currently unavailable. Please try again shortly.' });
        }
        checkoutRequestId = intent.id;
        clientSecret       = intent.client_secret;
        publishableKey     = process.env.STRIPE_PUBLISHABLE_KEY;
      } else {
        // Dev / sandbox fallback — no real Stripe key configured
        checkoutRequestId = `DEV-CARD-${Date.now()}-${req.user.id.slice(0, 8)}`;
        devMode = true;
      }

      const payment = await Payment.create({
        checkout_request_id: checkoutRequestId,
        amount:              total_amount,
        status:              'pending',
        cart_data:           cartSnapshot,
      });

      return res.status(200).json({
        success:             true,
        message:             devMode
          ? 'Dev mode: tap "Simulate Card Payment" in the app to confirm.'
          : 'Enter your card details to confirm payment.',
        checkout_request_id: payment.checkout_request_id,
        payment_id:          payment.id,
        client_secret:       clientSecret,
        publishable_key:     publishableKey,
        immediate:           false,
        dev_mode:            devMode,
        summary: {
          vendor:           vendor.business_name,
          items:            cartItems,
          food_subtotal,
          delivery_fee,
          discount_amount,
          total_amount,
          delivery_address: delivery_address.trim(),
          scheduled_time:   scheduled_time || null,
        },
      });
    }

    // ─── Cash flow: create order immediately ─────────────────────────────────
    const t = await sequelize.transaction();
    try {
      const order = await Order.create(
        {
          consumer_id:          req.user.id,
          vendor_id,
          rider_id:             null,
          status:               'Received',
          food_subtotal,
          delivery_fee,
          discount_amount,
          total_amount,
          delivery_address:     delivery_address.trim(),
          special_instructions: special_instructions?.trim() || null,
          promo_code:           promoRecord ? promoRecord.code : null,
          scheduled_time:       scheduled_time || null,
          payment_method,
        },
        { transaction: t }
      );

      await OrderItem.bulkCreate(
        cartItems.map((i) => ({
          order_id:     order.id,
          menu_item_id: i.menu_item_id,
          quantity:     i.quantity,
          unit_price:   i.unit_price,
        })),
        { transaction: t }
      );

      const checkout_request_id = `CASH-${Date.now()}-${req.user.id.slice(0, 8)}`;

      await Payment.create(
        {
          checkout_request_id,
          amount:       total_amount,
          status:       'pending',
          order_id:     order.id,
          confirmed_at: null,
          cart_data:    null,
        },
        { transaction: t }
      );

      if (promoRecord) {
        await promoRecord.increment('uses_count', { transaction: t });
      }

      await t.commit();

      return res.status(201).json({
        success:             true,
        immediate:           true,
        message:             'Order placed! Pay the rider in cash on delivery.',
        checkout_request_id,
        order_id:            order.id,
        summary: {
          vendor:           vendor.business_name,
          items:            cartItems,
          food_subtotal,
          delivery_fee,
          discount_amount,
          total_amount,
          delivery_address: delivery_address.trim(),
          scheduled_time:   scheduled_time || null,
        },
      });
    } catch (innerError) {
      await t.rollback();
      throw innerError;
    }
  } catch (error) {
    console.error('[ORDER] initiateCheckout error:', error);
    res.status(500).json({ success: false, message: 'Server error during checkout.' });
  }
};

// ─── DEV-ONLY: Simulate M-Pesa Callback ──────────────────────────────────────

exports.devConfirmPayment = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Route not found.' });
  }
  const t = await sequelize.transaction();
  try {
    const payment = await Payment.findOne({
      where: { checkout_request_id: req.params.checkoutRequestId },
      transaction: t,
    });

    if (!payment) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Checkout session not found.' });
    }
    if (payment.status !== 'pending') {
      await t.rollback();
      return res.status(409).json({ success: false, message: `Payment already ${payment.status}.` });
    }
    if (!payment.cart_data) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'No cart data found for this payment.' });
    }

    const order = await exports.createOrderFromPayment(payment, t);

    // Increment promo uses if applicable
    const promoCode = payment.cart_data.promo_code;
    if (promoCode) {
      await PromoCode.increment('uses_count', { where: { code: promoCode }, transaction: t });
    }

    await payment.update(
      {
        status:       'confirmed',
        order_id:     order.id,
        mpesa_ref:    `DEV-${Date.now()}`,
        confirmed_at: new Date(),
        cart_data:    null,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({ success: true, message: 'Payment confirmed. Order created.', order_id: order.id, order });
  } catch (error) {
    await t.rollback();
    console.error('[ORDER] devConfirmPayment error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Card Payments (Stripe) ───────────────────────────────────────────────────

/**
 * POST /api/orders/confirm-card-payment/:paymentId
 * Protected — consumer only.
 *
 * Called by the Stripe checkout page after the card is confirmed client-side.
 * Never trusts that report alone — re-verifies the PaymentIntent status
 * directly with Stripe before creating the order, exactly like the M-Pesa
 * callback verifies with Safaricom rather than trusting the client.
 */
exports.confirmCardPayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const payment = await Payment.findByPk(req.params.paymentId, { transaction: t });

    if (!payment) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Payment session not found.' });
    }
    if (!payment.cart_data || payment.cart_data.consumer_id !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (payment.status !== 'pending') {
      await t.rollback();
      return res.status(409).json({ success: false, message: `Payment already ${payment.status}.` });
    }

    let intent;
    try {
      intent = await stripeService.retrievePaymentIntent(payment.checkout_request_id);
    } catch (stripeError) {
      await t.rollback();
      console.error('[ORDER] Stripe retrieve failed:', stripeError.message);
      return res.status(503).json({ success: false, message: 'Could not verify payment with Stripe. Please try again.' });
    }

    if (intent.status !== 'succeeded') {
      await payment.update({ status: 'failed' }, { transaction: t });
      await t.commit();
      return res.status(400).json({ success: false, message: `Card payment ${intent.status.replace(/_/g, ' ')}. Please try again.` });
    }

    const order = await exports.createOrderFromPayment(payment, t);

    const promoCode = payment.cart_data.promo_code;
    if (promoCode) {
      await PromoCode.increment('uses_count', { where: { code: promoCode }, transaction: t });
    }

    await payment.update(
      {
        status:       'confirmed',
        order_id:     order.id,
        confirmed_at: new Date(),
        cart_data:    null,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({ success: true, message: 'Payment confirmed. Order created.', order_id: order.id, order });
  } catch (error) {
    await t.rollback();
    console.error('[ORDER] confirmCardPayment error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Consumer Endpoints ───────────────────────────────────────────────────────

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { consumer_id: req.user.id },
      include: [
        { model: Vendor,    as: 'vendor',  attributes: ['business_name', 'location'],
          include: [{ model: User, as: 'owner', attributes: ['phone'] }] },
        { model: OrderItem, as: 'items',
          include: [{ model: MenuItem, as: 'menuItem', attributes: ['name'] }] },
        { model: Payment,   as: 'payment', attributes: ['mpesa_ref', 'status', 'confirmed_at'] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('[ORDER] getMyOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Shared: Single Order Detail ─────────────────────────────────────────────

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User,    as: 'consumer', attributes: ['name', 'phone'] },
        { model: Vendor,  as: 'vendor',   attributes: ['business_name', 'location'],
          include: [{ model: User, as: 'owner', attributes: ['phone'] }] },
        { model: User,    as: 'rider',    attributes: ['name', 'phone'] },
        { model: OrderItem, as: 'items',
          include: [{ model: MenuItem, as: 'menuItem', attributes: ['name', 'price'] }] },
        { model: Payment, as: 'payment',  attributes: ['mpesa_ref', 'status', 'confirmed_at'] },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const { role, id: userId } = req.user;

    if (role === 'consumer' && order.consumer_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (role === 'food_courier' && order.rider_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (role === 'vendor') {
      const vendorProfile = await Vendor.findOne({ where: { user_id: userId } });
      if (!vendorProfile || vendorProfile.id !== order.vendor_id) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('[ORDER] getOrderById error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Vendor Endpoints ─────────────────────────────────────────────────────────

exports.getVendorOrders = async (req, res) => {
  try {
    const vendorProfile = await Vendor.findOne({ where: { user_id: req.user.id } });
    if (!vendorProfile) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found.' });
    }

    const where = { vendor_id: vendorProfile.id };
    if (req.query.status) where.status = req.query.status;

    const orders = await Order.findAll({
      where,
      include: [
        { model: User,      as: 'consumer', attributes: ['name', 'phone'] },
        { model: OrderItem, as: 'items',
          include: [{ model: MenuItem, as: 'menuItem', attributes: ['name'] }] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('[ORDER] getVendorOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const transition = TRANSITIONS[order.status];
    if (!transition) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Order is already delivered. No further updates possible.' });
    }
    if (req.user.role !== transition.role) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: `Only a ${transition.role} can advance an order from "${order.status}" to "${transition.next}".`,
      });
    }

    if (req.user.role === 'vendor') {
      const vendorProfile = await Vendor.findOne({ where: { user_id: req.user.id }, transaction: t });
      if (!vendorProfile || vendorProfile.id !== order.vendor_id) {
        await t.rollback();
        return res.status(403).json({ success: false, message: 'This order does not belong to your shop.' });
      }
    }

    if (req.user.role === 'food_courier') {
      if (!order.rider_id) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Assign yourself to this order before updating its status.' });
      }
      if (order.rider_id !== req.user.id) {
        await t.rollback();
        return res.status(403).json({ success: false, message: 'You are not assigned to this order.' });
      }
    }

    const previousStatus = order.status;
    await order.update({ status: transition.next }, { transaction: t });
    await t.commit();

    const CONSUMER_MESSAGES = {
      'Preparing':  ['Being Prepared',  'Your order is being prepared.'],
      'Ready':      ['Order Ready',     'Your order is ready and waiting for a rider.'],
      'Collected':  ['Rider Collected', 'A rider has collected your order!'],
      'In Transit': ['On the Way!',     'Your order is on its way to you.'],
      'Delivered':  ['Delivered!',      'Your order has arrived. Enjoy your meal!'],
    };
    const msg = CONSUMER_MESSAGES[transition.next];
    if (msg) {
      User.findByPk(order.consumer_id, { attributes: ['fcm_token'] })
        .then((u) => notify.send(u?.fcm_token, msg[0], msg[1], { order_id: order.id }))
        .catch(console.error);
    }
    if (transition.next === 'Collected') {
      User.findByPk(req.user.id, { attributes: ['name'] }).then((rider) =>
        Vendor.findByPk(order.vendor_id, { include: [{ model: User, as: 'owner', attributes: ['fcm_token'] }] })
          .then((v) => notify.send(v?.owner?.fcm_token, 'Order Collected', `${rider?.name ?? 'Rider'} has collected the order.`, { order_id: order.id }))
      ).catch(console.error);
    }

    res.status(200).json({
      success:    true,
      message:    `Order advanced: "${previousStatus}" → "${transition.next}"`,
      order_id:   order.id,
      new_status: transition.next,
    });
  } catch (error) {
    await t.rollback();
    console.error('[ORDER] updateOrderStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Vendor: Cancel / Decline Order ──────────────────────────────────────────

/**
 * Refunds the payment tied to a declined order, if one was collected.
 *   - cash:  nothing was ever collected → not_applicable
 *   - card:  real Stripe refund via the Refunds API
 *   - mpesa: Safaricom's Reversal API needs Initiator/SecurityCredential
 *            credentials this app doesn't have configured, so it's flagged
 *            for an admin to process manually rather than silently doing
 *            nothing or falsely claiming success.
 *
 * Runs after the order is already committed as Cancelled — refund failures
 * must never block the decline itself.
 */
async function refundDeclinedOrder(order) {
  if (order.payment_method === 'cash') {
    await order.update({ refund_status: 'not_applicable' });
    return { refund_status: 'not_applicable' };
  }

  const payment = await Payment.findOne({ where: { order_id: order.id } });
  if (!payment) {
    await order.update({ refund_status: 'failed' });
    return { refund_status: 'failed' };
  }

  if (order.payment_method === 'card') {
    try {
      await stripeService.refundPaymentIntent(payment.checkout_request_id);
      await payment.update({ status: 'refunded' });
      await order.update({ refund_status: 'refunded', refunded_at: new Date() });
      return { refund_status: 'refunded' };
    } catch (error) {
      console.error('[ORDER] Stripe refund failed:', error.message);
      await order.update({ refund_status: 'failed' });
      return { refund_status: 'failed' };
    }
  }

  // mpesa
  await order.update({ refund_status: 'manual_required' });
  return { refund_status: 'manual_required' };
}

exports.cancelOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const vendorProfile = await Vendor.findOne({ where: { user_id: req.user.id }, transaction: t });
    if (!vendorProfile || vendorProfile.id !== order.vendor_id) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'This order does not belong to your shop.' });
    }

    if (order.status !== 'Received') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order that is already "${order.status}". Only "Received" orders can be declined.`,
      });
    }

    await order.update({ status: 'Cancelled' }, { transaction: t });
    await t.commit();

    const { refund_status } = await refundDeclinedOrder(order);

    const CONSUMER_REFUND_MESSAGES = {
      not_applicable: 'Your order was declined by the vendor.',
      refunded:        'Your order was declined by the vendor and your card payment has been refunded.',
      manual_required: 'Your order was declined by the vendor. Our team will process your M-Pesa refund manually — please allow some time.',
      failed:          'Your order was declined by the vendor. There was an issue processing your refund — our support team has been notified.',
    };

    User.findByPk(order.consumer_id, { attributes: ['fcm_token'] })
      .then((u) => notify.send(u?.fcm_token, 'Order Cancelled', CONSUMER_REFUND_MESSAGES[refund_status], { order_id: order.id }))
      .catch(console.error);

    res.status(200).json({ success: true, message: 'Order declined.', order_id: order.id, new_status: 'Cancelled', refund_status });
  } catch (error) {
    await t.rollback();
    console.error('[ORDER] cancelOrder error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/orders/:id/report-issue
 * Consumer only — flags a delivery problem on their own order for admin review.
 */
exports.reportIssue = async (req, res) => {
  try {
    const { reason, note } = req.body;
    if (!ISSUE_REASONS.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Please select a valid issue reason.' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.consumer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This order does not belong to you.' });
    }
    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot report an issue on a cancelled order.' });
    }
    if (order.has_issue) {
      return res.status(400).json({ success: false, message: 'An issue has already been reported for this order.' });
    }

    await order.update({
      has_issue: true,
      issue_reason: reason,
      issue_note: note || null,
      issue_reported_at: new Date(),
    });

    res.status(200).json({ success: true, message: 'Issue reported. Our team will review it shortly.', order });
  } catch (error) {
    console.error('[ORDER] reportIssue error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Food Courier Endpoints ───────────────────────────────────────────────────

exports.getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { status: 'Ready', rider_id: null },
      include: [
        { model: Vendor, as: 'vendor',   attributes: ['business_name', 'location'],
          include: [{ model: User, as: 'owner', attributes: ['phone'] }] },
        { model: User,   as: 'consumer', attributes: ['name', 'phone'] },
        { model: OrderItem, as: 'items',
          include: [{ model: MenuItem, as: 'menuItem', attributes: ['name'] }] },
      ],
      order: [['created_at', 'ASC']],
    });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('[ORDER] getAvailableOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.assignRider = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.status !== 'Ready') {
      await t.rollback();
      return res.status(400).json({ success: false, message: `Cannot assign: order status is "${order.status}" (must be "Ready").` });
    }
    if (order.rider_id) {
      await t.rollback();
      return res.status(409).json({ success: false, message: 'A rider is already assigned to this order.' });
    }

    await order.update({ rider_id: req.user.id }, { transaction: t });
    await t.commit();

    User.findByPk(req.user.id, { attributes: ['name'] }).then((rider) =>
      Vendor.findByPk(order.vendor_id, { include: [{ model: User, as: 'owner', attributes: ['fcm_token'] }] })
        .then((v) => notify.send(v?.owner?.fcm_token, 'Rider Assigned', `${rider?.name ?? 'A rider'} is on the way to collect the order.`, { order_id: order.id }))
    ).catch(console.error);

    res.status(200).json({ success: true, message: 'You are now assigned. Head to the vendor to collect the order.', order_id: order.id });
  } catch (error) {
    await t.rollback();
    console.error('[ORDER] assignRider error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getRiderOrders = async (req, res) => {
  try {
    const where = { rider_id: req.user.id };
    if (req.query.status) where.status = req.query.status;

    const orders = await Order.findAll({
      where,
      include: [
        { model: Vendor, as: 'vendor',   attributes: ['business_name', 'location'],
          include: [{ model: User, as: 'owner', attributes: ['phone'] }] },
        { model: User,   as: 'consumer', attributes: ['name', 'phone'] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('[ORDER] getRiderOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Food Courier: Confirm Cash Collection ────────────────────────────────────

exports.collectCash = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction: t });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.rider_id !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'You are not assigned to this order.' });
    }
    if (order.status !== 'In Transit') {
      await t.rollback();
      return res.status(400).json({ success: false, message: `Cash can only be collected when the order is "In Transit" (current: "${order.status}").` });
    }
    if (order.payment_method === 'mpesa') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'This order was paid via M-Pesa — no cash to collect.' });
    }

    // Upsert a confirmed cash payment record
    const existing = await Payment.findOne({ where: { order_id: order.id }, transaction: t });
    if (existing) {
      await existing.update(
        { status: 'confirmed', confirmed_at: new Date() },
        { transaction: t }
      );
    } else {
      await Payment.create(
        {
          checkout_request_id: `CASH-${Date.now()}-${req.user.id.slice(0, 8)}`,
          amount:       order.total_amount,
          status:       'confirmed',
          order_id:     order.id,
          confirmed_at: new Date(),
          cart_data:    null,
        },
        { transaction: t }
      );
    }

    await order.update({ payment_method: 'cash' }, { transaction: t });
    await t.commit();

    // Notify consumer
    User.findByPk(order.consumer_id, { attributes: ['fcm_token'] })
      .then((u) => notify.send(u?.fcm_token, 'Cash Received', 'The rider has confirmed your cash payment.', { order_id: order.id }))
      .catch(console.error);

    res.status(200).json({ success: true, message: 'Cash collection confirmed.', order_id: order.id });
  } catch (error) {
    await t.rollback();
    console.error('[ORDER] collectCash error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Rider Location Update ────────────────────────────────────────────────────

exports.updateRiderLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng are required.' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.rider_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this order.' });
    }
    if (!['Collected', 'In Transit'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Location tracking only active when order is in transit.' });
    }

    await order.update({
      rider_lat: parseFloat(lat),
      rider_lng: parseFloat(lng),
      location_updated_at: new Date(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[ORDER] updateRiderLocation error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

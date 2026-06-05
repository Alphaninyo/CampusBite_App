const { PromoCode, Vendor } = require('../models');

// ─── Consumer: Validate a promo code ─────────────────────────────────────────

/**
 * POST /api/promo-codes/validate
 * Protected — consumer only.
 * Body: { code, vendor_id, cart_total }
 * Returns discount info if valid.
 */
exports.validatePromoCode = async (req, res) => {
  try {
    const { code, vendor_id, cart_total } = req.body;

    if (!code || !vendor_id || cart_total == null) {
      return res.status(400).json({ success: false, valid: false, message: 'code, vendor_id, and cart_total are required.' });
    }

    const promo = await PromoCode.findOne({
      where: { code: code.trim().toUpperCase(), vendor_id, is_active: true },
    });

    if (!promo) {
      return res.status(404).json({ success: false, valid: false, message: 'Invalid promo code.' });
    }

    if (promo.expires_at && new Date() > new Date(promo.expires_at)) {
      return res.status(400).json({ success: false, valid: false, message: 'This promo code has expired.' });
    }

    if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
      return res.status(400).json({ success: false, valid: false, message: 'This promo code has reached its maximum usage limit.' });
    }

    const numericTotal = parseFloat(cart_total);
    const minOrder     = parseFloat(promo.min_order_amount);

    if (numericTotal < minOrder) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Minimum order of KES ${minOrder.toFixed(2)} required for this code.`,
      });
    }

    const discountValue  = parseFloat(promo.discount_value);
    const discount_amount = promo.discount_type === 'percent'
      ? parseFloat(((numericTotal * discountValue) / 100).toFixed(2))
      : Math.min(discountValue, numericTotal);

    res.status(200).json({
      success:       true,
      valid:         true,
      code:          promo.code,
      discount_type: promo.discount_type,
      discount_value: discountValue,
      discount_amount,
      message: promo.discount_type === 'percent'
        ? `${discountValue}% off applied! You save KES ${discount_amount.toFixed(2)}.`
        : `KES ${discount_amount.toFixed(2)} off applied!`,
    });
  } catch (error) {
    console.error('[PROMO] validatePromoCode error:', error);
    res.status(500).json({ success: false, valid: false, message: 'Server error.' });
  }
};

// ─── Vendor: Manage promo codes ───────────────────────────────────────────────

/**
 * GET /api/promo-codes/my
 * Protected — vendor only.
 * Returns all promo codes for the authenticated vendor.
 */
exports.getMyPromoCodes = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found.' });
    }

    const codes = await PromoCode.findAll({
      where: { vendor_id: vendor.id },
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({ success: true, count: codes.length, promo_codes: codes });
  } catch (error) {
    console.error('[PROMO] getMyPromoCodes error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * POST /api/promo-codes
 * Protected — vendor only.
 * Body: { code, discount_type, discount_value, min_order_amount?, max_uses?, expires_at? }
 */
exports.createPromoCode = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found.' });
    }

    const {
      code,
      discount_type   = 'percent',
      discount_value,
      min_order_amount = 0,
      max_uses,
      expires_at,
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Promo code is required.' });
    }
    if (!discount_value || isNaN(parseFloat(discount_value)) || parseFloat(discount_value) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid discount_value is required.' });
    }
    if (discount_type === 'percent' && parseFloat(discount_value) > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%.' });
    }

    const normalizedCode = code.trim().toUpperCase();

    const existing = await PromoCode.findOne({ where: { code: normalizedCode } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Promo code "${normalizedCode}" is already taken. Choose a different code.` });
    }

    const promo = await PromoCode.create({
      vendor_id:        vendor.id,
      code:             normalizedCode,
      discount_type,
      discount_value:   parseFloat(discount_value),
      min_order_amount: parseFloat(min_order_amount) || 0,
      max_uses:         max_uses ? parseInt(max_uses) : null,
      expires_at:       expires_at || null,
      is_active:        true,
    });

    res.status(201).json({ success: true, message: 'Promo code created.', promo_code: promo });
  } catch (error) {
    console.error('[PROMO] createPromoCode error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'That promo code already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/promo-codes/:id/toggle
 * Protected — vendor only.
 * Toggles is_active for a promo code.
 */
exports.togglePromoCode = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found.' });
    }

    const promo = await PromoCode.findOne({ where: { id: req.params.id, vendor_id: vendor.id } });
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }

    await promo.update({ is_active: !promo.is_active });
    res.status(200).json({ success: true, message: `Promo code ${promo.is_active ? 'activated' : 'deactivated'}.`, promo_code: promo });
  } catch (error) {
    console.error('[PROMO] togglePromoCode error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * DELETE /api/promo-codes/:id
 * Protected — vendor only.
 */
exports.deletePromoCode = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found.' });
    }

    const promo = await PromoCode.findOne({ where: { id: req.params.id, vendor_id: vendor.id } });
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }

    await promo.destroy();
    res.status(200).json({ success: true, message: 'Promo code deleted.' });
  } catch (error) {
    console.error('[PROMO] deletePromoCode error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

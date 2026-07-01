const path   = require('path');
const fs     = require('fs');
const multer = require('multer');
const { Op, literal }   = require('sequelize');
const { Vendor, User, MenuItem, sequelize } = require('../models');

// ─── Multer Setup for Vendor Cover Images ─────────────────────────────────────

const VENDOR_UPLOAD_DIR = path.join(__dirname, '../../uploads/vendors');
if (!fs.existsSync(VENDOR_UPLOAD_DIR)) fs.mkdirSync(VENDOR_UPLOAD_DIR, { recursive: true });

const vendorStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, VENDOR_UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `vendor-${req.user.id}-${Date.now()}${ext}`);
  },
});

const vendorFileFilter = (_req, file, cb) =>
  /image\/(jpeg|jpg|png|webp)/.test(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only JPEG, PNG, or WEBP images are accepted.'), false);

exports.uploadCoverMiddleware = multer({
  storage: vendorStorage,
  fileFilter: vendorFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

// ─── Vendor Profile ───────────────────────────────────────────────────────────

/**
 * POST /api/vendors/profile
 * Protected — vendor role only.
 * Creates a vendor profile for a vendor user who did not supply
 * business info during registration (fallback endpoint).
 */
exports.createProfile = async (req, res) => {
  try {
    const existing = await Vendor.findOne({ where: { user_id: req.user.id } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have a vendor profile.',
      });
    }

    const { business_name, vendor_type, location } = req.body;

    if (!business_name || !vendor_type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide business_name and vendor_type.',
      });
    }

    if (!['restaurant', 'home_based'].includes(vendor_type)) {
      return res.status(400).json({
        success: false,
        message: 'vendor_type must be "restaurant" or "home_based".',
      });
    }

    const vendor = await Vendor.create({
      user_id:       req.user.id,
      business_name: business_name.trim(),
      vendor_type,
      location:      location ? location.trim() : null,
      is_open:       false,
      approved_at:   null,
    });

    res.status(201).json({
      success: true,
      message: 'Vendor profile created. Awaiting admin approval.',
      vendor,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(' | '),
      });
    }
    console.error('[VENDOR] createProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/vendors/profile/me
 * Protected — vendor role only.
 * Returns the authenticated vendor's own full profile.
 */
exports.getMyProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      where: { user_id: req.user.id },
      include: [
        {
          model:      User,
          as:         'owner',
          attributes: ['name', 'email', 'phone', 'is_approved'],
        },
      ],
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found. Please create one.',
      });
    }

    res.status(200).json({ success: true, vendor });
  } catch (error) {
    console.error('[VENDOR] getMyProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PUT /api/vendors/profile/me
 * Protected — vendor role only.
 * Updates the vendor's own business profile (name, type, location).
 */
exports.updateMyProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found.' });
    }

    const { business_name, vendor_type, location, description, opening_time, closing_time, prep_time, mpesa_phone, kra_pin } = req.body;

    if (vendor_type && !['restaurant', 'home_based'].includes(vendor_type)) {
      return res.status(400).json({
        success: false,
        message: 'vendor_type must be "restaurant" or "home_based".',
      });
    }

    let imagePath = vendor.image;
    if (req.file) {
      if (vendor.image) {
        const oldPath = path.join(__dirname, '../..', vendor.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imagePath = `/uploads/vendors/${req.file.filename}`;
    }

    await vendor.update({
      business_name: business_name ? business_name.trim() : vendor.business_name,
      vendor_type:    vendor_type   || vendor.vendor_type,
      location:       location      !== undefined ? location.trim()     : vendor.location,
      description:    description   !== undefined ? description.trim()  : vendor.description,
      opening_time:   opening_time  !== undefined ? opening_time.trim()  : vendor.opening_time,
      closing_time:   closing_time  !== undefined ? closing_time.trim()  : vendor.closing_time,
      prep_time:      prep_time     !== undefined ? prep_time.trim()     : vendor.prep_time,
      mpesa_phone:    mpesa_phone   !== undefined ? mpesa_phone.trim()   : vendor.mpesa_phone,
      kra_pin:        kra_pin       !== undefined ? kra_pin.trim().toUpperCase() : vendor.kra_pin,
      image:          imagePath,
    });

    res.status(200).json({ success: true, message: 'Profile updated.', vendor });
  } catch (error) {
    console.error('[VENDOR] updateMyProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/vendors/profile/me/toggle
 * Protected — vendor role only.
 * Toggles the shop between OPEN and CLOSED.
 * Blocked if the vendor has not yet been approved by admin.
 */
exports.toggleShopStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found.' });
    }

    if (!vendor.approved_at) {
      return res.status(403).json({
        success: false,
        message: 'Your vendor profile has not been approved yet. Contact the admin.',
      });
    }

    const newStatus = !vendor.is_open;
    await vendor.update({ is_open: newStatus });

    res.status(200).json({
      success: true,
      message:  `Your shop is now ${newStatus ? 'OPEN' : 'CLOSED'}.`,
      is_open:  newStatus,
    });
  } catch (error) {
    console.error('[VENDOR] toggleShopStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Public Endpoints ─────────────────────────────────────────────────────────

/**
 * GET /api/vendors
 * Public — consumer browsing.
 * Returns all admin-approved vendors.
 * Query param: ?open_only=true  → filter to currently open vendors only.
 */
exports.getAllVendors = async (req, res) => {
  try {
    const where = { approved_at: { [Op.ne]: null } };
    if (req.query.open_only === 'true') where.is_open = true;

    const vendors = await Vendor.findAll({
      where,
      include: [{ model: User, as: 'owner', attributes: ['name', 'phone'] }],
      order: [['business_name', 'ASC']],
    });

    res.status(200).json({ success: true, count: vendors.length, vendors });
  } catch (error) {
    console.error('[VENDOR] getAllVendors error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/vendors/:id
 * Public.
 * Returns a single vendor's profile plus their available menu items.
 */
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id, {
      include: [
        { model: User,     as: 'owner',    attributes: ['name', 'phone'] },
        { model: MenuItem, as: 'menuItems', where: { is_available: true }, required: false },
      ],
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    res.status(200).json({ success: true, vendor });
  } catch (error) {
    console.error('[VENDOR] getVendorById error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

/**
 * GET /api/vendors/admin/pending
 * Protected — admin only.
 * Lists all vendor profiles that have not yet been approved (approved_at IS NULL).
 */
exports.getPendingVendors = async (req, res) => {
  try {
    // Primary: vendor profiles not yet approved or rejected
    const profilePending = await Vendor.findAll({
      where: { approved_at: null, rejected_at: null },
      include: [{ model: User, as: 'owner', attributes: ['name', 'email', 'phone', 'is_approved', 'created_at', 'verification_status', 'verification_type', 'verification_document', 'passport_photo'] }],
      order: [['created_at', 'ASC']],
    });

    // Fallback: vendor-role users with no vendor profile (data inconsistency recovery)
    const profilePendingUserIds = profilePending.map((v) => v.user_id);
    const orphanUsers = await User.findAll({
      where: {
        role: 'vendor',
        is_approved: false,
        id: { [Op.notIn]: profilePendingUserIds.length ? profilePendingUserIds : ['00000000-0000-0000-0000-000000000000'] },
      },
      attributes: ['id', 'name', 'email', 'phone', 'is_approved', 'created_at'],
    });

    // For each orphaned user, auto-create a minimal vendor profile so the admin can act on them
    for (const u of orphanUsers) {
      const existing = await Vendor.findOne({ where: { user_id: u.id } });
      if (!existing) {
        await Vendor.create({ user_id: u.id, business_name: `${u.name} (pending setup)`, vendor_type: 'restaurant', is_open: false });
      }
    }

    // Re-fetch after auto-creating any missing profiles
    const vendors = await Vendor.findAll({
      where: { approved_at: null, rejected_at: null },
      include: [{ model: User, as: 'owner', attributes: ['name', 'email', 'phone', 'is_approved', 'created_at', 'verification_status', 'verification_type', 'verification_document', 'passport_photo'] }],
      order: [['created_at', 'ASC']],
    });

    res.status(200).json({ success: true, count: vendors.length, vendors });
  } catch (error) {
    console.error('[VENDOR] getPendingVendors error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/vendors/admin/:id/reject
 * Protected — admin only.
 * Rejects a pending vendor profile.
 */
exports.rejectVendor = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const vendor = await Vendor.findByPk(req.params.id, { transaction: t });
    if (!vendor) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }
    if (vendor.approved_at) {
      await t.rollback();
      return res.status(409).json({ success: false, message: 'Cannot reject an already approved vendor.' });
    }
    if (vendor.rejected_at) {
      await t.rollback();
      return res.status(409).json({ success: false, message: 'This vendor has already been rejected.' });
    }
    await vendor.update({ rejected_at: new Date() }, { transaction: t });
    await t.commit();
    res.status(200).json({ success: true, message: `Vendor "${vendor.business_name}" has been rejected.` });
  } catch (error) {
    await t.rollback();
    console.error('[VENDOR] rejectVendor error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/vendors/admin/:id/approve
 * Protected — admin only.
 * Approves a vendor profile by vendor ID.
 * Uses a transaction to atomically:
 *   1. Set vendor.approved_at = now()
 *   2. Set user.is_approved = true  (allows the vendor to log in)
 */
exports.approveVendor = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const vendor = await Vendor.findByPk(req.params.id, { transaction: t });
    if (!vendor) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    if (vendor.approved_at) {
      await t.rollback();
      return res.status(409).json({ success: false, message: 'This vendor is already approved.' });
    }

    await vendor.update({ approved_at: new Date() }, { transaction: t });

    await User.update(
      { is_approved: true },
      { where: { id: vendor.user_id }, transaction: t }
    );

    await t.commit();

    res.status(200).json({
      success: true,
      message: `Vendor "${vendor.business_name}" has been approved successfully.`,
    });
  } catch (error) {
    await t.rollback();
    console.error('[VENDOR] approveVendor error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

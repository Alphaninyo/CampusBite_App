const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const { MenuItem, Vendor } = require('../models');

// ─── Multer Setup ─────────────────────────────────────────────────────────────

const UPLOAD_DIR = path.join(__dirname, '../../uploads/menu');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only JPEG, PNG, or WEBP images are accepted.'), false);
};

exports.uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

// ─── Helper ───────────────────────────────────────────────────────────────────

const getVendorProfile = (userId) => Vendor.findOne({ where: { user_id: userId } });

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/menu
 * Protected — vendor only.
 * Accepts multipart/form-data (image optional).
 */
exports.addMenuItem = async (req, res) => {
  try {
    const vendor = await getVendorProfile(req.user.id);
    if (!vendor) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Vendor profile not found.' });
    }

    const { name, description, price, is_available, category } = req.body;

    if (!name || price === undefined || price === null) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Please provide item name and price.' });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number.' });
    }

    const imagePath = req.file ? `/uploads/menu/${req.file.filename}` : null;

    const item = await MenuItem.create({
      vendor_id:    vendor.id,
      name:         name.trim(),
      description:  description ? description.trim() : null,
      price:        parsedPrice.toFixed(2),
      category:     category || null,
      image:        imagePath,
      is_available: is_available !== undefined ? (is_available === 'true' || is_available === true) : true,
    });

    res.status(201).json({ success: true, message: 'Menu item added.', item });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: error.errors.map((e) => e.message).join(' | ') });
    }
    console.error('[MENU] addMenuItem error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/menu/vendor/:vendorId
 * Public. Pass ?all=true to include unavailable items (vendor's own management view).
 */
exports.getVendorMenu = async (req, res) => {
  try {
    const where = { vendor_id: req.params.vendorId };
    if (req.query.all !== 'true') where.is_available = true;

    const items = await MenuItem.findAll({ where, order: [['name', 'ASC']] });

    res.status(200).json({ success: true, count: items.length, items });
  } catch (error) {
    console.error('[MENU] getVendorMenu error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PUT /api/menu/:id
 * Protected — vendor only. Accepts multipart/form-data (image optional).
 */
exports.updateMenuItem = async (req, res) => {
  try {
    const vendor = await getVendorProfile(req.user.id);
    if (!vendor) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Vendor profile not found.' });
    }

    const item = await MenuItem.findByPk(req.params.id);
    if (!item) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    if (item.vendor_id !== vendor.id) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this menu item.' });
    }

    const { name, description, price, is_available, category } = req.body;

    if (price !== undefined) {
      const parsed = parseFloat(price);
      if (isNaN(parsed) || parsed < 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: 'Price must be a non-negative number.' });
      }
    }

    // Replace old image file if a new one was uploaded
    let imagePath = item.image;
    if (req.file) {
      if (item.image) {
        const oldPath = path.join(__dirname, '../..', item.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imagePath = `/uploads/menu/${req.file.filename}`;
    }

    await item.update({
      name:         name         ? name.trim()        : item.name,
      description:  description  !== undefined ? description.trim() : item.description,
      price:        price        !== undefined ? parseFloat(price).toFixed(2) : item.price,
      category:     category     !== undefined ? category : item.category,
      image:        imagePath,
      is_available: is_available !== undefined
        ? (is_available === 'true' || is_available === true)
        : item.is_available,
    });

    res.status(200).json({ success: true, message: 'Menu item updated.', item });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('[MENU] updateMenuItem error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/menu/:id/toggle
 * Protected — vendor only.
 */
exports.toggleItemAvailability = async (req, res) => {
  try {
    const vendor = await getVendorProfile(req.user.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found.' });

    const item = await MenuItem.findByPk(req.params.id);
    if (!item)                        return res.status(404).json({ success: false, message: 'Menu item not found.' });
    if (item.vendor_id !== vendor.id) return res.status(403).json({ success: false, message: 'Forbidden.' });

    const newStatus = !item.is_available;
    await item.update({ is_available: newStatus });

    res.status(200).json({ success: true, message: `"${item.name}" is now ${newStatus ? 'AVAILABLE' : 'UNAVAILABLE'}.`, is_available: newStatus });
  } catch (error) {
    console.error('[MENU] toggleItemAvailability error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * DELETE /api/menu/:id
 * Protected — vendor only.
 */
exports.deleteMenuItem = async (req, res) => {
  try {
    const vendor = await getVendorProfile(req.user.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found.' });

    const item = await MenuItem.findByPk(req.params.id);
    if (!item)                        return res.status(404).json({ success: false, message: 'Menu item not found.' });
    if (item.vendor_id !== vendor.id) return res.status(403).json({ success: false, message: 'Forbidden.' });

    // Delete the image file from disk
    if (item.image) {
      const imgPath = path.join(__dirname, '../..', item.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    const itemName = item.name;
    await item.destroy();

    res.status(200).json({ success: true, message: `"${itemName}" has been deleted.` });
  } catch (error) {
    console.error('[MENU] deleteMenuItem error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

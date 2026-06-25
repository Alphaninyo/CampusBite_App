const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const bcrypt  = require('bcryptjs');
const { User } = require('../models');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/verification');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer config ─────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const userId = req.user?.id || req._verifiedUserId || 'anon';
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${userId}_${file.fieldname}_${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, WEBP, or PDF files are accepted.'), false);
};

// Single-file upload (authenticated flow)
exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
}).single('document');

// Multi-file upload for submit-info: both passport_photo and document
exports.uploadMulti = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
}).fields([
  { name: 'document',      maxCount: 1 },
  { name: 'passport_photo', maxCount: 1 },
]);

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/verification/upload
 * Authenticated — vendor or food_courier only.
 * Accepts both passport_photo (selfie) and document (ID) files.
 */
exports.uploadDocument = (req, res) => {
  exports.uploadMulti(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const documentFile      = req.files?.document?.[0];
    const passportPhotoFile = req.files?.passport_photo?.[0];

    if (!documentFile && !passportPhotoFile) {
      return res.status(400).json({ success: false, message: 'Please upload at least one file.' });
    }

    const { document_type } = req.body;
    if (documentFile && !['national_id', 'passport'].includes(document_type)) {
      _cleanFiles(req.files);
      return res.status(400).json({ success: false, message: 'document_type must be national_id or passport.' });
    }

    try {
      const user    = await User.findByPk(req.user.id);
      const updates = { verification_status: 'pending', admin_note: null };

      if (documentFile) {
        if (user.verification_document) {
          const old = path.join(__dirname, '../..', user.verification_document);
          if (fs.existsSync(old)) fs.unlinkSync(old);
        }
        updates.verification_document = `/uploads/verification/${documentFile.filename}`;
        updates.verification_type     = document_type;
      }

      if (passportPhotoFile) {
        if (user.passport_photo) {
          const old = path.join(__dirname, '../..', user.passport_photo);
          if (fs.existsSync(old)) fs.unlinkSync(old);
        }
        updates.passport_photo = `/uploads/verification/${passportPhotoFile.filename}`;
      }

      await user.update(updates);

      res.status(200).json({
        success: true,
        message: 'Documents uploaded successfully. Awaiting admin review.',
        verification_status: 'pending',
      });
    } catch (error) {
      console.error('[VERIFICATION] uploadDocument error:', error);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  });
};

/**
 * POST /api/verification/submit-info
 * Public — verifies credentials, then accepts passport_photo + document uploads.
 * Called when the admin has requested additional information (info_requested status).
 *
 * Body (multipart): { email, password, document_type } + files: passport_photo, document
 */
exports.submitInfo = (req, res) => {
  exports.uploadMulti(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const { email, password, document_type } = req.body;

    if (!email || !password) {
      _cleanFiles(req.files);
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (!['national_id', 'passport'].includes(document_type)) {
      _cleanFiles(req.files);
      return res.status(400).json({ success: false, message: 'document_type must be national_id or passport.' });
    }

    const documentFile     = req.files?.document?.[0];
    const passportPhotoFile = req.files?.passport_photo?.[0];

    if (!documentFile && !passportPhotoFile) {
      return res.status(400).json({ success: false, message: 'Please upload at least one file (passport photo or ID document).' });
    }

    try {
      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        _cleanFiles(req.files);
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        _cleanFiles(req.files);
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (!['vendor', 'food_courier'].includes(user.role)) {
        _cleanFiles(req.files);
        return res.status(400).json({ success: false, message: 'Only vendor and food courier accounts can submit verification info.' });
      }

      const updates = {
        verification_status: 'pending',
        admin_note:          null,
        requested_docs:      null,
      };

      if (documentFile) {
        updates.verification_type = document_type;
        if (user.verification_document) {
          const old = path.join(__dirname, '../..', user.verification_document);
          if (fs.existsSync(old)) fs.unlinkSync(old);
        }
        updates.verification_document = `/uploads/verification/${documentFile.filename}`;
      }

      if (passportPhotoFile) {
        if (user.passport_photo) {
          const old = path.join(__dirname, '../..', user.passport_photo);
          if (fs.existsSync(old)) fs.unlinkSync(old);
        }
        updates.passport_photo = `/uploads/verification/${passportPhotoFile.filename}`;
      }

      await user.update(updates);

      res.status(200).json({
        success: true,
        message: 'Information submitted successfully. Awaiting admin review.',
        verification_status: 'pending',
      });
    } catch (error) {
      console.error('[VERIFICATION] submitInfo error:', error);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  });
};

/**
 * GET /api/verification/status
 * Authenticated — returns own verification status.
 */
exports.getStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'role', 'is_approved', 'verification_status', 'verification_type', 'verification_document', 'passport_photo', 'admin_note'],
    });
    res.status(200).json({ success: true, verification: user });
  } catch (error) {
    console.error('[VERIFICATION] getStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function _cleanFiles(files) {
  if (!files) return;
  Object.values(files).flat().forEach((f) => {
    if (f?.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
  });
}

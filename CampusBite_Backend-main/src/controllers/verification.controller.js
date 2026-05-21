const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const { User } = require('../models');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/verification');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, WEBP, or PDF files are accepted.'), false);
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
}).single('document');

/**
 * POST /api/verification/upload
 * Authenticated — vendor or food_courier only.
 * Accepts a multipart upload of a national_id or passport image.
 */
exports.uploadDocument = (req, res) => {
  exports.upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { document_type } = req.body;
    if (!['national_id', 'passport'].includes(document_type)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'document_type must be national_id or passport.' });
    }

    try {
      const filePath = `/uploads/verification/${req.file.filename}`;

      const user = await User.findByPk(req.user.id);
      if (user.verification_document) {
        const old = path.join(__dirname, '../..', user.verification_document);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }

      await user.update({
        verification_document: filePath,
        verification_type:     document_type,
        verification_status:   'pending',
      });

      res.status(200).json({
        success: true,
        message: 'Verification document uploaded successfully. Awaiting admin review.',
        verification_status: 'pending',
        document_url: filePath,
      });
    } catch (error) {
      console.error('[VERIFICATION] uploadDocument error:', error);
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
      attributes: ['id', 'role', 'is_approved', 'verification_status', 'verification_type', 'verification_document'],
    });
    res.status(200).json({ success: true, verification: user });
  } catch (error) {
    console.error('[VERIFICATION] getStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

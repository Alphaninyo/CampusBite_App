const express          = require('express');
const promoController  = require('../controllers/promoCode.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// ── Consumer ──────────────────────────────────────────────────────────────────
router.post('/validate', protect, restrictTo('consumer'), promoController.validatePromoCode);

// ── Vendor ────────────────────────────────────────────────────────────────────
router.get(   '/my',        protect, restrictTo('vendor'), promoController.getMyPromoCodes);
router.post(  '/',          protect, restrictTo('vendor'), promoController.createPromoCode);
router.patch( '/:id/toggle',protect, restrictTo('vendor'), promoController.togglePromoCode);
router.delete('/:id',       protect, restrictTo('vendor'), promoController.deletePromoCode);

module.exports = router;

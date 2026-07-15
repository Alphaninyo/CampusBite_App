const express            = require('express');
const favoriteController = require('../controllers/favorite.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// ── Consumer ──────────────────────────────────────────────────────────────────
router.post('/toggle', protect, restrictTo('consumer'), favoriteController.toggleFavorite);
router.get('/ids',     protect, restrictTo('consumer'), favoriteController.getMyFavoriteIds);
router.get('/',        protect, restrictTo('consumer'), favoriteController.getMyFavorites);

module.exports = router;

const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/verification.controller');

router.post('/upload',  protect, restrictTo('vendor', 'food_courier'), ctrl.uploadDocument);
router.get('/status',   protect, restrictTo('vendor', 'food_courier'), ctrl.getStatus);

module.exports = router;

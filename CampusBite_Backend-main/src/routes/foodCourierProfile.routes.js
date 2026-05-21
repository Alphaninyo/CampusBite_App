const express = require('express');
const foodCourierProfileController = require('../controllers/foodCourierProfile.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// ── Food Courier Profile Endpoints ─────────────────────────────────────────────
router.get('/',                    protect, restrictTo('food_courier'), foodCourierProfileController.getProfile);
router.put('/',                    protect, restrictTo('food_courier'), foodCourierProfileController.updateProfile);
router.patch('/toggle-availability', protect, restrictTo('food_courier'), foodCourierProfileController.toggleAvailability);

module.exports = router;

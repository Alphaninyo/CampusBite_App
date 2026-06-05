const express = require('express');
const foodCourierProfileController = require('../controllers/foodCourierProfile.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// ── Admin Endpoints ────────────────────────────────────────────────────────────
router.get(  '/admin/pending',     protect, restrictTo('admin'), foodCourierProfileController.getPendingFoodCouriers);
router.patch('/admin/:id/approve', protect, restrictTo('admin'), foodCourierProfileController.approveFoodCourier);
router.patch('/admin/:id/reject',  protect, restrictTo('admin'), foodCourierProfileController.rejectFoodCourier);

// ── Food Courier Profile Endpoints ─────────────────────────────────────────────
router.get('/',                    protect, restrictTo('food_courier'), foodCourierProfileController.getProfile);
router.put('/',                    protect, restrictTo('food_courier'), foodCourierProfileController.updateProfile);
router.patch('/toggle-availability', protect, restrictTo('food_courier'), foodCourierProfileController.toggleAvailability);

module.exports = router;

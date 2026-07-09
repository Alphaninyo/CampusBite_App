const express         = require('express');
const orderController = require('../controllers/order.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// ─── IMPORTANT: All static paths must come before dynamic /:id routes ─────────

// ── Consumer ──────────────────────────────────────────────────────────────────
router.post('/initiate',                       protect, restrictTo('consumer'),        orderController.initiateCheckout);
router.post('/dev-confirm/:checkoutRequestId', protect, restrictTo('consumer'),        orderController.devConfirmPayment);
router.post('/confirm-card-payment/:paymentId', protect, restrictTo('consumer'),       orderController.confirmCardPayment);
router.get( '/',                               protect, restrictTo('consumer'),        orderController.getMyOrders);
router.patch('/:id/report-issue',              protect, restrictTo('consumer'),        orderController.reportIssue);

// ── Vendor ────────────────────────────────────────────────────────────────────
router.get(  '/vendor',                        protect, restrictTo('vendor'),          orderController.getVendorOrders);
router.patch('/:id/cancel',                    protect, restrictTo('vendor'),          orderController.cancelOrder);

// ── Food Courier ─────────────────────────────────────────────────────────────────────
router.get( '/food-courier/available',                protect, restrictTo('food_courier'),           orderController.getAvailableOrders);
router.get( '/food-courier/mine',                     protect, restrictTo('food_courier'),           orderController.getRiderOrders);
router.patch('/:id/assign-food-courier',              protect, restrictTo('food_courier'),           orderController.assignRider);
router.patch('/:id/collect-cash',                     protect, restrictTo('food_courier'),           orderController.collectCash);
router.patch('/:id/location',                         protect, restrictTo('food_courier'),           orderController.updateRiderLocation);

// ── Shared (access control enforced inside controller) ────────────────────────
router.get(  '/:id',      protect, orderController.getOrderById);
router.patch('/:id/status', protect, restrictTo('vendor', 'food_courier'), orderController.updateOrderStatus);

module.exports = router;

const express         = require('express');
const adminController = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// All admin routes require a valid JWT + admin role
router.use(protect, restrictTo('admin'));

router.get('/stats',                adminController.getStats);
router.get('/stats/weekly-orders',  adminController.getWeeklyOrders);
router.get('/stats/top-vendors',    adminController.getTopVendors);
router.get('/orders',               adminController.getAllOrders);
router.patch('/orders/:id/resolve-issue', adminController.resolveOrderIssue);
router.get('/users',                adminController.getAllUsers);
router.get('/vendors',              adminController.getAllVendors);
router.get('/users/pending-docs',                adminController.getPendingDocUsers);
router.patch('/users/:userId/approve-docs',      adminController.approveUserDocs);
router.patch('/users/:userId/reject-docs',       adminController.rejectUserDocs);
router.patch('/users/:userId/request-info',      adminController.requestInfo);
router.patch('/users/:userId/suspend',           adminController.suspendUser);

module.exports = router;

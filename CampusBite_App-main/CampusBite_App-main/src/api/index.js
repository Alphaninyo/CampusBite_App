import { Platform } from 'react-native';
import client from './client';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register:         (data)           => client.post('/auth/register', data),
    login:            (data)           => client.post('/auth/login', data),
    forgotPassword:    (data)           => client.post('/auth/forgot-password', data),
    resetPassword:    (data)           => client.post('/auth/reset-password', data),
    getMe:            ()               => client.get('/auth/me'),
    updateProfile:    (data)           => client.put('/auth/profile', data),
    updatePassword:   (data)           => client.put('/auth/password', data),
    updateDeviceToken:(data)           => client.put('/auth/device-token', data),
  },

  // ─── Vendors ────────────────────────────────────────────────────────────────
  vendors: {
    getAll:        (params) => client.get('/vendors', { params }),
    getById:       (id)     => client.get(`/vendors/${id}`),
    getProfile:    ()       => client.get('/vendors/profile/me'),
    updateProfile: (data)   => client.put('/vendors/profile/me', data),
    updateStatus:  ()       => client.patch('/vendors/profile/me/toggle'),
  },

  // ─── Food Courier Profile ────────────────────────────────────────────────────
  foodCourier: {
    getProfile:           ()       => client.get('/food-courier/profile'),
    updateProfile:        (data)   => client.put('/food-courier/profile', data),
    toggleAvailability:   ()       => client.patch('/food-courier/profile/toggle-availability'),
  },

  // ─── Menu ───────────────────────────────────────────────────────────────────
  menu: {
    getVendorMenu: (vendorId, params) => client.get(`/menu/vendor/${vendorId}`, { params }),
    create: async (data) => {
      const form = new FormData();
      form.append('name', data.name);
      if (data.description) form.append('description', data.description);
      form.append('price', String(data.price));
      if (data.category) form.append('category', data.category);
      form.append('is_available', String(data.is_available !== false));
      await _appendImage(form, data.image);
      return client.post('/menu', form, _multipartHeaders());
    },
    update: async (id, data) => {
      const form = new FormData();
      if (data.name        !== undefined) form.append('name', data.name);
      if (data.description !== undefined) form.append('description', data.description || '');
      if (data.price       !== undefined) form.append('price', String(data.price));
      if (data.category    !== undefined) form.append('category', data.category || '');
      if (data.is_available !== undefined) form.append('is_available', String(data.is_available));
      await _appendImage(form, data.image);
      return client.put(`/menu/${id}`, form, _multipartHeaders());
    },
    delete: (id) => client.delete(`/menu/${id}`),
  },

  // ─── Orders ─────────────────────────────────────────────────────────────────
  orders: {
    initiate:            (data)   => client.post('/orders/initiate', data),
    devConfirm:          (id)     => client.post(`/orders/dev-confirm/${id}`),
    getMyOrders:         ()       => client.get('/orders'),
    getById:             (id)     => client.get(`/orders/${id}`),
    getVendorOrders:     ()       => client.get('/orders/vendor'),
    updateStatus:        (id, status) => client.patch(`/orders/${id}/status`, { status }),
    getAvailableForFoodCourier:()       => client.get('/orders/food-courier/available'),
    acceptDelivery:      (id)     => client.patch(`/orders/${id}/assign-food-courier`),
    getFoodCourierOrders:      ()       => client.get('/orders/food-courier/mine'),
  },

  // ─── Payments ───────────────────────────────────────────────────────────────
  payments: {
    getStatus: (checkoutRequestId) => client.get(`/payments/status/${checkoutRequestId}`),
    cancel:    (checkoutRequestId) => client.post(`/payments/${checkoutRequestId}/cancel`),
  },

  // ─── Reviews ────────────────────────────────────────────────────────────────
  reviews: {
    create:         (data)     => client.post('/reviews', data),
    getVendorReviews:(vendorId) => client.get(`/reviews/vendor/${vendorId}`),
    getOrderReview: (orderId)  => client.get(`/reviews/order/${orderId}`),
  },

  // ─── Notifications ─────────────────────────────────────────────────────────────
  notifications: {
    getAll:         ()         => client.get('/notifications'),
    getUnreadCount: ()         => client.get('/notifications/unread-count'),
    markAsRead:     (id)       => client.patch(`/notifications/${id}/mark-read`),
    markAllAsRead:  ()         => client.patch('/notifications/mark-all-read'),
  },

  // ─── Verification ───────────────────────────────────────────────────────────
  verification: {
    upload:    (formData) => client.post('/verification/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getStatus: ()         => client.get('/verification/status'),
  },

  // ─── Admin ──────────────────────────────────────────────────────────────────
  admin: {
    getStats:      ()       => client.get('/admin/stats'),
    getOrders:     (params) => client.get('/admin/orders', { params }),
    getUsers:      (params) => client.get('/admin/users', { params }),
    getVendors:    (params) => client.get('/admin/vendors', { params }),
    // Vendor approvals
    getPendingVendors:       ()   => client.get('/vendors/admin/pending'),
    approveVendor:           (id) => client.patch(`/vendors/admin/${id}/approve`),
    rejectVendor:            (id) => client.patch(`/vendors/admin/${id}/reject`),
    // Food courier approvals
    getPendingFoodCouriers:  ()   => client.get('/food-courier/admin/pending'),
    approveFoodCourier:      (id) => client.patch(`/food-courier/admin/${id}/approve`),
    rejectFoodCourier:       (id) => client.patch(`/food-courier/admin/${id}/reject`),
  },
};

// ─── Multipart helpers ────────────────────────────────────────────────────────

// Returns the correct Content-Type config for FormData uploads.
// Web: omit Content-Type so the browser sets it with the multipart boundary.
// Native: set explicitly since React Native's XHR needs it.
function _multipartHeaders() {
  return Platform.OS === 'web'
    ? { headers: { 'Content-Type': undefined } }
    : { headers: { 'Content-Type': 'multipart/form-data' } };
}

// Appends an image to a FormData object, handling both platforms:
//   Web   — ImagePicker returns a blob: URL; fetch it to get a real Blob.
//   Native — ImagePicker returns a file: / content: URI; use RN's { uri } notation.
// Server-side paths (/uploads/...) are skipped — backend keeps the existing image.
async function _appendImage(form, uri) {
  if (!uri || uri.startsWith('/uploads/') || uri.startsWith('http')) return;

  if (Platform.OS === 'web') {
    try {
      const res  = await fetch(uri);
      const blob = await res.blob();
      form.append('image', blob, 'item.jpg');
    } catch { /* ignore — upload without image */ }
  } else {
    const ext  = (uri.split('.').pop() || 'jpg').toLowerCase();
    const type = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    form.append('image', { uri, name: `item.${ext}`, type });
  }
}

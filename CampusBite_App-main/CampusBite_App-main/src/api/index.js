import client from './client';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register:      (data) => client.post('/auth/register', data),
    login:         (data) => client.post('/auth/login', data),
    me:            ()     => client.get('/auth/me'),
    updateProfile: (data) => client.put('/auth/profile', data),
    updatePassword:(data) => client.put('/auth/password', data),
    forgotPassword:(data) => client.post('/auth/forgot-password', data),
    resetPassword: (data) => client.post('/auth/reset-password', data),
    deviceToken:   (data) => client.put('/auth/device-token', data),
  },

  // ─── Vendors ────────────────────────────────────────────────────────────────
  vendors: {
    getAll:        (params) => client.get('/vendors', { params }),
    getById:       (id)     => client.get(`/vendors/${id}`),
    getProfile:    ()       => client.get('/vendors/profile/me'),
    updateProfile: (data)   => client.put('/vendors/profile/me', data),
    updateStatus:  ()       => client.patch('/vendors/profile/me/toggle'),
  },

  // ─── Menu ───────────────────────────────────────────────────────────────────
  menu: {
    getVendorMenu: (vendorId, params) => client.get(`/menu/vendor/${vendorId}`, { params }),
    create:        (data)     => client.post('/menu', data),
    update:        (id, data) => client.put(`/menu/${id}`, data),
    delete:        (id)       => client.delete(`/menu/${id}`),
  },

  // ─── Orders ─────────────────────────────────────────────────────────────────
  orders: {
    initiate:            (data)   => client.post('/orders/initiate', data),
    devConfirm:          (id)     => client.post(`/orders/dev-confirm/${id}`),
    getMyOrders:         ()       => client.get('/orders'),
    getById:             (id)     => client.get(`/orders/${id}`),
    getVendorOrders:     ()       => client.get('/orders/vendor'),
    updateStatus:        (id, status) => client.patch(`/orders/${id}/status`, { status }),
    getAvailableForRider:()       => client.get('/orders/rider/available'),
    acceptDelivery:      (id)     => client.patch(`/orders/${id}/assign-rider`),
    getRiderOrders:      ()       => client.get('/orders/rider/mine'),
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

  // ─── Admin ──────────────────────────────────────────────────────────────────
  admin: {
    getStats:      ()       => client.get('/admin/stats'),
    getOrders:     (params) => client.get('/admin/orders', { params }),
    getUsers:      (params) => client.get('/admin/users', { params }),
    getVendors:    (params) => client.get('/admin/vendors', { params }),
    approveVendor: (id)     => client.patch(`/vendors/admin/${id}/approve`),
  },
};

// import axios from 'axios';

// const API_BASE = 'https://dev.collect.org.in/api';

// //const API_BASE = 'https://jsonplaceholder.typicode.com';

// const api = axios.create({
//   baseURL: API_BASE,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add token interceptor if needed
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ============================================================
// // MERCHANT API
// // ============================================================
// export const merchantApi = {
//   //getAllUser: () =>api.get('/users'),
//   getAll: () => api.get('https://dev.collect.org.in/api/Merchant/get-all'),
//   getById: (id) => api.get(`https://dev.collect.org.in/api/Merchant/${id}`),
//   create: (data) => api.post(`https://dev.collect.org.in/api/Merchant/register`, data),
//   update: (id, data) => api.put(`https://dev.collect.org.in/api/Merchant/update/${id}`, data),
//   delete: (id) => api.delete(`https://dev.collect.org.in/api/Merchant/delete/${id}`),
//   approve: (id) => api.patch(`/merchant/${id}/approve`),
//   toggleStatus: (id) => api.patch(`/merchant/${id}/toggle-status`),
//   configMerchant:(data)=> api.post('/Config/config-merchant', data),
//   updateMerchantConfig:(id,data)=> api.put(`Config/Update/${id}`, data),
//   getAllMerchant: () => api.get('/Merchant/by-status?status=pending'),
//   getAllMerchantConfig: ()=>api.get('/Config/get-all'),
//   getAllMerchantConfigById: (id)=>api.get(`/Config/${id}`),
//   configMerchantDelete: (id)=>api.delete(`Config/delete/${id}`)
// };

// // ============================================================
// // AGENT API
// // ============================================================
// export const agentApi = {
//   getAll: () => api.get('/Agent/get-all'),
//   getById: (id) => api.get(`/agent/${id}`),
//   create: (data) => api.post('Agent/create', data),
//   update: (id, data) => api.put(`/Agent/${id}`, data),
//   delete: (id) => api.delete(`/Agent/${id}`),
//   toggleStatus: (id) => api.patch(`/agent/${id}/toggle-status`),
//   getByMerchant: (merchantId) => api.get(`/agent/merchant/${merchantId}`),
// };

// // ============================================================
// // BRANCH API
// // ============================================================
// export const branchApi = {
//   getAll: () => api.get('/Branch/get-all'),
//   getById: (id) => api.get(`/Branch/${id}`),
//   create: (data) => api.post('/Branch/create', data),
//   update: (id, data) => api.put(`/Branch/${id}`, data),
//   delete: (id) => api.delete(`/Branch/${id}`),
//   toggleStatus: (id) => api.patch(`/branch/${id}/toggle-status`),
// };

// // ============================================================
// // PAYMENT API
// // ============================================================
// export const paymentApi = {
//   create: (data) => api.post('/payment/process', data),
//   getHistory: () => api.get('/payment/history'),
//   getById: (id) => api.get(`/payment/${id}`),
//   getStatus: (orderId) => api.get(`/payment/status?orderId=${orderId}`),
//   generateLink: (data) => api.post('/payment/generate-link', data),
//   getRecent: () => api.get('/payment/recent'),
//   getStats: () => api.get('/payment/stats'),
// };

// // ============================================================
// // CUSTOMER API
// // ============================================================
// export const customerApi = {
//   getAll: () => api.get('/customer'),
//   getById: (id) => api.get(`/customer/${id}`),
//   create: (data) => api.post('/customer/create', data),
//   update: (id, data) => api.put(`/customer/${id}`, data),
//   delete: (id) => api.delete(`/customer/${id}`),
//   getDue: () => api.get('/customer/due'),
//   toggleStatus: (id) => api.patch(`/customer/${id}/toggle-status`),
// };

// // ============================================================
// // SETTLEMENT API
// // ============================================================
// export const settlementApi = {
//   getAll: () => api.get('/settlement'),
//   getById: (id) => api.get(`/settlement/${id}`),
//   export: () => api.get('/settlement/export', { responseType: 'blob' }),
//   getStats: () => api.get('/settlement/stats'),
// };

// // ============================================================
// // REFUND API
// // ============================================================
// export const refundApi = {
//   create: (data) => api.post('/refund/process', data),
//   getHistory: () => api.get('/refund/history'),
//   getStatus: (id) => api.get(`/refund/status/${id}`),
//   getAll: () => api.get('/refund'),
//   getById: (id) => api.get(`/refund/${id}`),
// };

// // ============================================================
// // REPORTS API
// // ============================================================
// export const reportsApi = {
//   getOverview: (params) => api.get('/reports/overview', { params }),
//   getRevenue: (params) => api.get('/reports/revenue', { params }),
//   getMerchants: (params) => api.get('/reports/merchants', { params }),
//   getPayments: (params) => api.get('/reports/payments', { params }),
//   getTransactions: (params) => api.get('/reports/transactions', { params }),
//   export: (type, params) => api.get(`/reports/export/${type}`, { 
//     params, 
//     responseType: 'blob' 
//   }),
// };

// // ============================================================
// // COMMISSION API
// // ============================================================
// export const commissionApi = {
//   getAll: () => api.get('/commission'),
//   getById: (id) => api.get(`/commission/${id}`),
//   create: (data) => api.post('/commission/create', data),
//   update: (id, data) => api.put(`/commission/${id}`, data),
//   delete: (id) => api.delete(`/commission/${id}`),
//   pay: (id) => api.patch(`/commission/${id}/pay`),
//   getByAgent: (agentId) => api.get(`/commission/agent/${agentId}`),
//   getStats: () => api.get('/commission/stats'),
//   export: () => api.get('/commission/export', { responseType: 'blob' }),
// };

// // ============================================================
// // DASHBOARD API
// // ============================================================
// export const dashboardApi = {
//   getStats: () => api.get('/dashboard/stats'),
//   getCharts: () => api.get('/dashboard/charts'),
//   getRecent: () => api.get('/dashboard/recent'),
// };

// // ============================================================
// // AUTH API (if needed)
// // ============================================================
// export const authApi = {
//   login: (data) => api.post('/auth/login', data),
//   logout: () => api.post('/auth/logout'),
//   register: (data) => api.post('/auth/register', data),
//   getProfile: () => api.get('/auth/profile'),
//   updateProfile: (data) => api.put('/auth/profile', data),
//   changePassword: (data) => api.put('/auth/change-password', data),
// };

// // ============================================================
// // NOTIFICATION API
// // ============================================================
// export const notificationApi = {
//   getAll: () => api.get('/notifications'),
//   getById: (id) => api.get(`/notifications/${id}`),
//   markAsRead: (id) => api.patch(`/notifications/${id}/read`),
//   markAllRead: () => api.patch('/notifications/read-all'),
//   delete: (id) => api.delete(`/notifications/${id}`),
// };

// export default api;

import axios from 'axios';

// API Base URL (Change to your Localhost port if running locally e.g. 'https://localhost:7000/api' or 'http://localhost:5000/api')
const API_BASE = process.env.REACT_APP_API_URL || 'https://dev.collect.org.in/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Bearer token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH API (Matches AuthController.cs DTOs)
// ============================================================
export const authApi = {
  // Login accepts { UsernameOrEmail, Password } matching LoginRequestDto
  login: (data) => api.post('/Auth/login', {
    UsernameOrEmail: data.UsernameOrEmail || data.email || data.username,
    Password: data.Password || data.password
  }),
  
  // OTP Verification
  requestOtp: (mobileNumber) => api.post('/Auth/request-otp', { MobileNumber: mobileNumber }),
  verifyOtp: (data) => api.post('/Auth/verify-otp', data),
  resendOtp: (userId) => api.post('/Auth/resend-otp', { UserId: userId }),
  
  // Account actions
  register: (data) => api.post('/Auth/register', data),
  forgotPassword: (emailOrPhone) => api.post('/Auth/forgot-password', { EmailOrPhone: emailOrPhone }),
  resetPassword: (data) => api.post('/Auth/reset-password', data),
  changePassword: (data) => api.post('/Auth/change-password', data),
  logout: () => api.post('/Auth/logout'),
  
  // Telemetry & Permissions
  getProfile: () => api.get('/Auth/profile'),
  updateProfile: (data) => api.put('/Auth/profile', data),
  getPermissions: () => api.get('/Auth/permissions'),
  getMenus: () => api.get('/Auth/menus'),
  validateToken: (token) => api.post('/Auth/validate-token', { Token: token }),
};

// ============================================================
// MERCHANT API
// ============================================================
export const merchantApi = {
  getAll: () => api.get('/Merchant/get-all'),
  getById: (id) => api.get(`/Merchant/${id}`),
  create: (data) => api.post(`/Merchant/register`, data),
  update: (id, data) => api.put(`/Merchant/update/${id}`, data),
  delete: (id) => api.delete(`/Merchant/delete/${id}`),
  approve: (id) => api.patch(`/Merchant/${id}/approve`),
  toggleStatus: (id) => api.patch(`/Merchant/${id}/toggle-status`),
  configMerchant: (data) => api.post('/Config/config-merchant', data),
  updateMerchantConfig: (id, data) => api.put(`/Config/Update/${id}`, data),
  getAllMerchant: () => api.get('/Merchant/by-status?status=pending'),
  getAllMerchantConfig: () => api.get('/Config/get-all'),
  getAllMerchantConfigById: (id) => api.get(`/Config/${id}`),
  configMerchantDelete: (id) => api.delete(`/Config/delete/${id}`)
};

// ============================================================
// AGENT API
// ============================================================
export const agentApi = {
  getAll: () => api.get('/Agent/get-all'),
  getById: (id) => api.get(`/Agent/${id}`),
  create: (data) => api.post('/Agent/create', data),
  update: (id, data) => api.put(`/Agent/${id}`, data),
  delete: (id) => api.delete(`/Agent/${id}`),
  toggleStatus: (id) => api.patch(`/Agent/${id}/toggle-status`),
  getByMerchant: (merchantId) => api.get(`/Agent/merchant/${merchantId}`),
};

// ============================================================
// BRANCH API
// ============================================================
export const branchApi = {
  getAll: () => api.get('/Branch/get-all'),
  getById: (id) => api.get(`/Branch/${id}`),
  create: (data) => api.post('/Branch/create', data),
  update: (id, data) => api.put(`/Branch/${id}`, data),
  delete: (id) => api.delete(`/Branch/${id}`),
  toggleStatus: (id) => api.patch(`/Branch/${id}/toggle-status`),
};

// ============================================================
// PAYMENT API
// ============================================================
export const paymentApi = {
  create: (data) => api.post('/Payment/process', data),
  getHistory: () => api.get('/Payment/history'),
  getById: (id) => api.get(`/Payment/${id}`),
  getStatus: (orderId) => api.get(`/Payment/status?orderId=${orderId}`),
  generateLink: (data) => api.post('/Payment/generate-link', data),
  getRecent: () => api.get('/Payment/recent'),
  getStats: () => api.get('/Payment/stats'),
};

// ============================================================
// SETTLEMENT API
// ============================================================
export const settlementApi = {
  getAll: () => api.get('/Settlement'),
  getById: (id) => api.get(`/Settlement/${id}`),
  export: () => api.get('/Settlement/export', { responseType: 'blob' }),
  getStats: () => api.get('/Settlement/stats'),
};

// ============================================================
// REFUND API
// ============================================================
export const refundApi = {
  create: (data) => api.post('/Refund/process', data),
  getHistory: () => api.get('/Refund/history'),
  getStatus: (id) => api.get(`/Refund/status/${id}`),
  getAll: () => api.get('/Refund'),
  getById: (id) => api.get(`/Refund/${id}`),
};

// ============================================================
// REPORTS API
// ============================================================
export const reportsApi = {
  getOverview: (params) => api.get('/Reports/overview', { params }),
  getRevenue: (params) => api.get('/Reports/revenue', { params }),
  getMerchants: (params) => api.get('/Reports/merchants', { params }),
  getPayments: (params) => api.get('/Reports/payments', { params }),
  getTransactions: (params) => api.get('/Reports/transactions', { params }),
  export: (type, params) => api.get(`/Reports/export/${type}`, { 
    params, 
    responseType: 'blob' 
  }),
};

export default api;
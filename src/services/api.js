import axios from 'axios';

const API_BASE = 'https://dev.collect.org.in/api';

//const API_BASE = 'https://jsonplaceholder.typicode.com';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor if needed
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

// ============================================================
// MERCHANT API
// ============================================================
export const merchantApi = {
  //getAllUser: () =>api.get('/users'),
  getAll: () => api.get('https://dev.collect.org.in/api/Merchant/get-all'),
  getById: (id) => api.get(`https://dev.collect.org.in/api/Merchant/${id}`),
  create: (data) => api.post(`https://dev.collect.org.in/api/Merchant/register`, data),
  update: (id, data) => api.put(`https://dev.collect.org.in/api/Merchant/update/${id}`, data),
  delete: (id) => api.delete(`https://dev.collect.org.in/api/Merchant/delete/${id}`),
  approve: (id) => api.patch(`/merchant/${id}/approve`),
  toggleStatus: (id) => api.patch(`/merchant/${id}/toggle-status`),
  configMerchant:(data)=> api.post('/Config/config-merchant', data),
  updateMerchantConfig:(id,data)=> api.put(`Config/Update/${id}`, data),
  getAllMerchant: () => api.get('/Merchant/by-status?status=pending'),
  getAllMerchantConfig: ()=>api.get('/Config/get-all'),
  getAllMerchantConfigById: (id)=>api.get(`/Config/${id}`),
  configMerchantDelete: (id)=>api.delete(`Config/delete/${id}`)
};

// ============================================================
// AGENT API
// ============================================================
export const agentApi = {
  getAll: () => api.get('/agent'),
  getById: (id) => api.get(`/agent/${id}`),
  create: (data) => api.post('/agent/create', data),
  update: (id, data) => api.put(`/agent/${id}`, data),
  delete: (id) => api.delete(`/agent/${id}`),
  toggleStatus: (id) => api.patch(`/agent/${id}/toggle-status`),
  getByMerchant: (merchantId) => api.get(`/agent/merchant/${merchantId}`),
};

// ============================================================
// BRANCH API
// ============================================================
export const branchApi = {
  getAll: () => api.get('/branch'),
  getById: (id) => api.get(`/branch/${id}`),
  create: (data) => api.post('/branch/create', data),
  update: (id, data) => api.put(`/branch/${id}`, data),
  delete: (id) => api.delete(`/branch/${id}`),
  toggleStatus: (id) => api.patch(`/branch/${id}/toggle-status`),
};

// ============================================================
// PAYMENT API
// ============================================================
export const paymentApi = {
  create: (data) => api.post('/payment/process', data),
  getHistory: () => api.get('/payment/history'),
  getById: (id) => api.get(`/payment/${id}`),
  getStatus: (orderId) => api.get(`/payment/status?orderId=${orderId}`),
  generateLink: (data) => api.post('/payment/generate-link', data),
  getRecent: () => api.get('/payment/recent'),
  getStats: () => api.get('/payment/stats'),
};

// ============================================================
// CUSTOMER API
// ============================================================
export const customerApi = {
  getAll: () => api.get('/customer'),
  getById: (id) => api.get(`/customer/${id}`),
  create: (data) => api.post('/customer/create', data),
  update: (id, data) => api.put(`/customer/${id}`, data),
  delete: (id) => api.delete(`/customer/${id}`),
  getDue: () => api.get('/customer/due'),
  toggleStatus: (id) => api.patch(`/customer/${id}/toggle-status`),
};

// ============================================================
// SETTLEMENT API
// ============================================================
export const settlementApi = {
  getAll: () => api.get('/settlement'),
  getById: (id) => api.get(`/settlement/${id}`),
  export: () => api.get('/settlement/export', { responseType: 'blob' }),
  getStats: () => api.get('/settlement/stats'),
};

// ============================================================
// REFUND API
// ============================================================
export const refundApi = {
  create: (data) => api.post('/refund/process', data),
  getHistory: () => api.get('/refund/history'),
  getStatus: (id) => api.get(`/refund/status/${id}`),
  getAll: () => api.get('/refund'),
  getById: (id) => api.get(`/refund/${id}`),
};

// ============================================================
// REPORTS API
// ============================================================
export const reportsApi = {
  getOverview: (params) => api.get('/reports/overview', { params }),
  getRevenue: (params) => api.get('/reports/revenue', { params }),
  getMerchants: (params) => api.get('/reports/merchants', { params }),
  getPayments: (params) => api.get('/reports/payments', { params }),
  getTransactions: (params) => api.get('/reports/transactions', { params }),
  export: (type, params) => api.get(`/reports/export/${type}`, { 
    params, 
    responseType: 'blob' 
  }),
};

// ============================================================
// COMMISSION API
// ============================================================
export const commissionApi = {
  getAll: () => api.get('/commission'),
  getById: (id) => api.get(`/commission/${id}`),
  create: (data) => api.post('/commission/create', data),
  update: (id, data) => api.put(`/commission/${id}`, data),
  delete: (id) => api.delete(`/commission/${id}`),
  pay: (id) => api.patch(`/commission/${id}/pay`),
  getByAgent: (agentId) => api.get(`/commission/agent/${agentId}`),
  getStats: () => api.get('/commission/stats'),
  export: () => api.get('/commission/export', { responseType: 'blob' }),
};

// ============================================================
// DASHBOARD API
// ============================================================
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getCharts: () => api.get('/dashboard/charts'),
  getRecent: () => api.get('/dashboard/recent'),
};

// ============================================================
// AUTH API (if needed)
// ============================================================
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ============================================================
// NOTIFICATION API
// ============================================================
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  getById: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;
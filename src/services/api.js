import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://localhost:7256/api';

console.log('🔗 API Base URL:', API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// REQUEST INTERCEPTOR - Add Token to Headers
// ============================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    console.log('🔑 Request Interceptor:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request headers');
    } else {
      console.warn('⚠️ No token found for request');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// ============================================================
// RESPONSE INTERCEPTOR - Handle Errors Gracefully
// ============================================================
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.warn('📡 API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Only redirect if explicitly validating an expired token
    if (error.response && error.response.status === 401) {
      console.warn('⚠️ 401 Unauthorized received for:', error.config?.url);
      
      if (error.config?.url?.includes('/Auth/validate-token')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================================
// DASHBOARD API
// ============================================================
export const dashboardApi = {
  getStats: (params) => {
    console.log('📡 dashboardApi.getStats called with params:', params);
    return api.get('/Dashboard/stats', { params: typeof params === 'object' ? params : undefined });
  },
  getMerchantDashboard: (merchantId) => {
    console.log('📡 dashboardApi.getMerchantDashboard called for merchantId:', merchantId);
    return api.get(`/Dashboard/merchant/${merchantId}`);
  },
  getBranchDashboard: (branchId) => {
    console.log('📡 dashboardApi.getBranchDashboard called for branchId:', branchId);
    return api.get(`/Dashboard/branch/${branchId}`);
  },
  getRevenueChart: (rangeOrParams = 'Week') => {
    const params = typeof rangeOrParams === 'object' ? rangeOrParams : { range: rangeOrParams };
    console.log('📡 dashboardApi.getRevenueChart called with params:', params);
    return api.get('/Dashboard/revenue-chart', { params });
  },
  getPaymentMethods: (params) => {
    console.log('📡 dashboardApi.getPaymentMethods called with params:', params);
    return api.get('/Dashboard/payment-methods', { params: typeof params === 'object' ? params : undefined });
  },
  getTransactionVolume: (params) => {
    console.log('📡 dashboardApi.getTransactionVolume called with params:', params);
    return api.get('/Dashboard/transaction-volume', { params: typeof params === 'object' ? params : undefined });
  },
  getStatusDistribution: (params) => {
    console.log('📡 dashboardApi.getStatusDistribution called with params:', params);
    return api.get('/Dashboard/status-distribution', { params: typeof params === 'object' ? params : undefined });
  },
  getRecentTransactions: (countOrParams = 5) => {
    const params = typeof countOrParams === 'object' ? countOrParams : { count: countOrParams };
    console.log('📡 dashboardApi.getRecentTransactions called with params:', params);
    return api.get('/Dashboard/recent-transactions', { params });
  },
};

// ============================================================
// TRANSACTION API
// ============================================================
export const transactionApi = {
  // Get all transactions with filters
  getAll: (params) => {
    console.log('📡 transactionApi.getAll called with params:', params);
    return api.get('/Transaction', { params });
  },

  getTransactions: (params) => {
    console.log('📡 transactionApi.getTransactions called with params:', params);
    return api.get('/Transaction', { params });
  },
  
  // Get transaction history (alias for getTransactions)
  getHistory: (params) => {
    console.log('📡 transactionApi.getHistory called');
    return api.get('/Transaction/history', { params })
      .catch(() => api.get('/Transaction', { params }));
  },
  
  // Get single transaction by ID
  getById: (id) => {
    console.log('📡 transactionApi.getById called for id:', id);
    return api.get(`/Transaction/${id}`);
  },

  getChart: (params) => {
    console.log('📡 transactionApi.getChart called');
    return api.get('/Transaction/chart', { params });
  },
  
  // Get transaction summary
  getSummary: (params) => {
    console.log('📡 transactionApi.getSummary called');
    return api.get('/Transaction/summary', { params });
  },
  
  // Get chart data
  getChartData: (params) => {
    console.log('📡 transactionApi.getChartData called');
    return api.get('/Transaction/chart', { params });
  },
  
  // Update transaction status (Admin only)
  updateStatus: (id, data) => {
    console.log('📡 transactionApi.updateStatus called for id:', id);
    return api.patch(`/Transaction/${id}/status`, data);
  },
  
  // Get transactions by merchant
  getByMerchant: (merchantId) => {
    console.log('📡 transactionApi.getByMerchant called for merchantId:', merchantId);
    return api.get(`/Transaction/merchant/${merchantId}`);
  },
  
  // Get transactions by branch
  getByBranch: (branchId) => {
    console.log('📡 transactionApi.getByBranch called for branchId:', branchId);
    return api.get(`/Transaction/branch/${branchId}`);
  },
  
  // Get transactions by agent
  getByAgent: (agentId) => {
    console.log('📡 transactionApi.getByAgent called for agentId:', agentId);
    return api.get(`/Transaction/agent/${agentId}`);
  },
};

// ============================================================
// MERCHANT API
// ============================================================
export const merchantApi = {
  getAll: () => {
    console.log('📡 merchantApi.getAll called');
    return api.get('/Merchant/get-all');
  },
  getById: (id) => {
    console.log('📡 merchantApi.getById called for id:', id);
    return api.get(`/Merchant/${id}`);
  },
  create: (data) => {
    console.log('📡 merchantApi.create called with data:', data);
    return api.post('/Merchant/register', data);
  },
  update: (id, data) => {
    console.log('📡 merchantApi.update called for id:', id);
    return api.put(`/Merchant/update/${id}`, data);
  },
  delete: (id) => {
    console.log('📡 merchantApi.delete called for id:', id);
    return api.delete(`/Merchant/delete/${id}`);
  },
  approve: (id) => {
    console.log('📡 merchantApi.approve called for id:', id);
    return api.patch(`/merchant/${id}/approve`);
  },
  toggleStatus: (id) => {
    console.log('📡 merchantApi.toggleStatus called for id:', id);
    return api.patch(`/merchant/${id}/toggle-status`);
  },
  configMerchant: (data) => {
    console.log('📡 merchantApi.configMerchant called with data:', data);
    return api.post('/Config/config-merchant', data);
  },
  updateMerchantConfig: (id, data) => {
    console.log('📡 merchantApi.updateMerchantConfig called for id:', id);
    return api.put(`/Config/Update/${id}`, data);
  },
  getAllMerchant: () => {
    console.log('📡 merchantApi.getAllMerchant called');
    return api.get('/Merchant/by-status?status=pending');
  },
  getAllMerchantConfig: () => {
    console.log('📡 merchantApi.getAllMerchantConfig called');
    return api.get('/Config/get-all');
  },
  getAllMerchantConfigById: (id) => {
    console.log('📡 merchantApi.getAllMerchantConfigById called for id:', id);
    return api.get(`/Config/${id}`);
  },
  configMerchantDelete: (id) => {
    console.log('📡 merchantApi.configMerchantDelete called for id:', id);
    return api.delete(`/Config/delete/${id}`);
  }
};

// ============================================================
// AGENT API
// ============================================================
export const agentApi = {
  getAll: () => {
    console.log('📡 agentApi.getAll called');
    return api.get('/Agent/get-all');
  },
  getById: (id) => {
    console.log('📡 agentApi.getById called for id:', id);
    return api.get(`/Agent/${id}`);
  },
  create: (data) => {
    console.log('📡 agentApi.create called with data:', data);
    return api.post('/Agent/create', data);
  },
  update: (id, data) => {
    console.log('📡 agentApi.update called for id:', id);
    return api.put(`/Agent/${id}`, data);
  },
  delete: (id) => {
    console.log('📡 agentApi.delete called for id:', id);
    return api.delete(`/Agent/${id}`);
  },
  approve: (id) => {
    console.log('📡 agentApi.approve called for id:', id);
    return api.post(`/Agent/${id}/approve`).catch(() => api.patch(`/Agent/${id}/verify`));
  },
  reject: (id, reason) => {
    console.log('📡 agentApi.reject called for id:', id);
    return api.post(`/Agent/${id}/reject`, { reason }).catch(() => api.patch(`/Agent/${id}/toggle-status`));
  },
  getByMerchant: (merchantId) => {
    console.log('📡 agentApi.getByMerchant called for merchantId:', merchantId);
    return api.get(`/agent/merchant/${merchantId}`);
  },
  fetchAgentList: (params) => {
    console.log('📡 agentApi.fetchAgentList called with params:', params);
    return api.get('/Agent/fetch-agent-list', { params });
  },
};

// ============================================================
// BRANCH API
// ============================================================
export const branchApi = {
  getAll: () => {
    console.log('📡 branchApi.getAll called');
    return api.get('/Branch/get-all');
  },
  getById: (id) => {
    console.log('📡 branchApi.getById called for id:', id);
    return api.get(`/Branch/${id}`);
  },
  create: (data) => {
    console.log('📡 branchApi.create called with data:', data);
    return api.post('/Branch/create', data);
  },
  update: (id, data) => {
    console.log('📡 branchApi.update called for id:', id);
    return api.put(`/Branch/${id}`, data);
  },
  delete: (id) => {
    console.log('📡 branchApi.delete called for id:', id);
    return api.delete(`/Branch/${id}`);
  },
  toggleStatus: (id) => {
    console.log('📡 branchApi.toggleStatus called for id:', id);
    return api.patch(`/branch/${id}/toggle-status`);
  },
  approve: (id) => {
    console.log('📡 branchApi.approve called for id:', id);
    return api.post(`/Branch/${id}/approve`).catch(() => api.patch(`/Branch/${id}/toggle-status`));
  },
  reject: (id, reason) => {
    console.log('📡 branchApi.reject called for id:', id);
    return api.post(`/Branch/${id}/reject`, { reason }).catch(() => api.patch(`/Branch/${id}/toggle-status`));
  },
  fetchBranchList: (params) => {
    console.log('📡 branchApi.fetchBranchList called with params:', params);
    return api.get('/Branch/fetch-branch-list', { params });
  },
  fetchRdCustomers: (params) => {
    console.log('📡 branchApi.fetchRdCustomers called with params:', params);
    return api.get('/Branch/fetch-rd-customers', { params })
      .catch(() => api.get('/Branch/fetch-account-list', { params }));
  },
};

// ============================================================
// ACCOUNT API
// ============================================================
export const accountApi = {
  getAll: (params) => {
    console.log('📡 accountApi.getAll called with params:', params);
    return api.get('/Branch/fetch-rd-customers', { params })
      .catch(() => api.get('/Account/get-all', { params }))
      .catch(() => api.get('/Account', { params }));
  },
  getBranchAccounts: (params) => {
    console.log('📡 accountApi.getBranchAccounts called with params:', params);
    return api.get('/Branch/fetch-rd-customers', { params })
      .catch(() => api.get('/Branch/fetch-account-list', { params }));
  },
  getAccounts: (params) => {
    console.log('📡 accountApi.getAccounts called with params:', params);
    return api.get('/Branch/fetch-rd-customers', { params }).catch(() => api.get('/Account', { params }));
  },
  getById: (id) => {
    console.log('📡 accountApi.getById called for id:', id);
    return api.get(`/Account/${id}`);
  },
  create: (data) => {
    console.log('📡 accountApi.create called with data:', data);
    return api.post('/Account/create', data).catch(() => api.post('/Account', data));
  },
  update: (id, data) => {
    console.log('📡 accountApi.update called for id:', id);
    return api.put(`/Account/${id}`, data);
  },
  delete: (id) => {
    console.log('📡 accountApi.delete called for id:', id);
    return api.delete(`/Account/${id}`);
  },
  toggleStatus: (id) => {
    console.log('📡 accountApi.toggleStatus called for id:', id);
    return api.patch(`/Account/${id}/toggle-status`).catch(() => api.patch(`/account/${id}/toggle-status`));
  },
};

// ============================================================
// PAYMENT API
// ============================================================
export const paymentApi = {
  create: (data) => {
    console.log('📡 paymentApi.create called with data:', data);
    return api.post('/payment/process', data);
  },
  getHistory: (params) => {
    console.log('📡 paymentApi.getHistory called');
    return api.get('/Transaction/history', { params });
  },
  getById: (id) => {
    console.log('📡 paymentApi.getById called for id:', id);
    return api.get(`/Transaction/${id}`);
  },
  getStatus: (orderId) => {
    console.log('📡 paymentApi.getStatus called for orderId:', orderId);
    return api.get(`/payment/status?orderId=${orderId}`);
  },
  generateLink: (data) => {
    console.log('📡 paymentApi.generateLink called with data:', data);
    return api.post('/payment/generate-link', data);
  },
  getRecent: () => {
    console.log('📡 paymentApi.getRecent called');
    return api.get('/payment/recent');
  },
  getStats: () => {
    console.log('📡 paymentApi.getStats called');
    return api.get('/payment/stats');
  },
};

// ============================================================
// CUSTOMER API
// ============================================================
export const customerApi = {
  getAll: (params) => {
    console.log('📡 customerApi.getAll called with params:', params);
    return api.get('/Customer', { params });
  },
  getRDCustomersUnderAgent: (params) => {
    console.log('📡 customerApi.getRDCustomersUnderAgent called with params:', params);
    return api.get('/Customer/fetch-rd-customers', { params })
      .catch(() => api.get('/Customer/rd-customers-under-agent', { params }))
      .catch(() => api.get('/Customer/getRDCustomerunderAgentList', { params }));
  },
  getById: (id) => {
    console.log('📡 customerApi.getById called for id:', id);
    return api.get(`/customer/${id}`);
  },
  create: (data) => {
    console.log('📡 customerApi.create called with data:', data);
    return api.post('/customer/create', data);
  },
  update: (id, data) => {
    console.log('📡 customerApi.update called for id:', id);
    return api.put(`/customer/${id}`, data);
  },
  delete: (id) => {
    console.log('📡 customerApi.delete called for id:', id);
    return api.delete(`/customer/${id}`);
  },
  getDue: () => {
    console.log('📡 customerApi.getDue called');
    return api.get('/customer/due');
  },
  toggleStatus: (id) => {
    console.log('📡 customerApi.toggleStatus called for id:', id);
    return api.patch(`/customer/${id}/toggle-status`);
  },
};

// ============================================================
// SETTLEMENT API
// ============================================================
export const settlementApi = {
  getAll: () => {
    console.log('📡 settlementApi.getAll called');
    return api.get('/settlement');
  },
  getById: (id) => {
    console.log('📡 settlementApi.getById called for id:', id);
    return api.get(`/settlement/${id}`);
  },
  export: () => {
    console.log('📡 settlementApi.export called');
    return api.get('/settlement/export', { responseType: 'blob' });
  },
  getStats: () => {
    console.log('📡 settlementApi.getStats called');
    return api.get('/settlement/stats');
  },
};

// ============================================================
// REFUND API
// ============================================================
export const refundApi = {
  create: (data) => {
    console.log('📡 refundApi.create called with data:', data);
    return api.post('/refund/process', data);
  },
  getHistory: () => {
    console.log('📡 refundApi.getHistory called');
    return api.get('/refund/history');
  },
  getStatus: (id) => {
    console.log('📡 refundApi.getStatus called for id:', id);
    return api.get(`/refund/status/${id}`);
  },
  getAll: () => {
    console.log('📡 refundApi.getAll called');
    return api.get('/refund');
  },
  getById: (id) => {
    console.log('📡 refundApi.getById called for id:', id);
    return api.get(`/refund/${id}`);
  },
};

// ============================================================
// REPORTS API
// ============================================================
export const reportsApi = {
  getOverview: (params) => {
    console.log('📡 reportsApi.getOverview called with params:', params);
    return api.get('/reports/overview', { params });
  },
  getRevenue: (params) => {
    console.log('📡 reportsApi.getRevenue called with params:', params);
    return api.get('/reports/revenue', { params });
  },
  getMerchants: (params) => {
    console.log('📡 reportsApi.getMerchants called with params:', params);
    return api.get('/reports/merchants', { params });
  },
  getPayments: (params) => {
    console.log('📡 reportsApi.getPayments called with params:', params);
    return api.get('/reports/payments', { params });
  },
  getTransactions: (params) => {
    console.log('📡 reportsApi.getTransactions called with params:', params);
    return api.get('/reports/transactions', { params });
  },
  export: (type, params) => {
    console.log('📡 reportsApi.export called for type:', type);
    return api.get(`/reports/export/${type}`, { 
      params, 
      responseType: 'blob' 
    });
  },
};

// ============================================================
// COMMISSION API
// ============================================================
export const commissionApi = {
  getAll: () => {
    console.log('📡 commissionApi.getAll called');
    return api.get('/commission');
  },
  getById: (id) => {
    console.log('📡 commissionApi.getById called for id:', id);
    return api.get(`/commission/${id}`);
  },
  create: (data) => {
    console.log('📡 commissionApi.create called with data:', data);
    return api.post('/commission/create', data);
  },
  update: (id, data) => {
    console.log('📡 commissionApi.update called for id:', id);
    return api.put(`/commission/${id}`, data);
  },
  delete: (id) => {
    console.log('📡 commissionApi.delete called for id:', id);
    return api.delete(`/commission/${id}`);
  },
  pay: (id) => {
    console.log('📡 commissionApi.pay called for id:', id);
    return api.patch(`/commission/${id}/pay`);
  },
  getByAgent: (agentId) => {
    console.log('📡 commissionApi.getByAgent called for agentId:', agentId);
    return api.get(`/commission/agent/${agentId}`);
  },
  getStats: () => {
    console.log('📡 commissionApi.getStats called');
    return api.get('/commission/stats');
  },
  export: () => {
    console.log('📡 commissionApi.export called');
    return api.get('/commission/export', { responseType: 'blob' });
  },
};

// ============================================================
// AUTH API (Connected to C# AuthController.cs)
// ============================================================
export const authApi = {
  login: (data) => {
    const cred = data.UsernameOrEmail || data.email || data.username || '';
    const pwd = data.Password || data.password || '';
    console.log('🔐 authApi.login called with:', {
      UsernameOrEmail: cred,
      Password: pwd ? '******' : 'empty'
    });
    return api.post('/Auth/login', {
      UsernameOrEmail: cred,
      Password: pwd,
      username: cred,
      email: cred,
      password: pwd,
      Username: cred
    });
  },
  requestOtp: (mobileNumber) => {
    console.log('📱 authApi.requestOtp called for:', mobileNumber);
    return api.post('/Auth/request-otp', { MobileNumber: mobileNumber });
  },
  verifyOtp: (data) => {
    console.log('📱 authApi.verifyOtp called');
    return api.post('/Auth/verify-otp', data);
  },
  resendOtp: (userId) => {
    console.log('📱 authApi.resendOtp called for userId:', userId);
    return api.post('/Auth/resend-otp', { UserId: userId });
  },
  register: (data) => {
    console.log('📝 authApi.register called');
    return api.post('/Auth/register', data);
  },
  forgotPassword: (emailOrPhone) => {
    console.log('🔑 authApi.forgotPassword called for:', emailOrPhone);
    return api.post('/Auth/forgot-password', { EmailOrPhone: emailOrPhone });
  },
  resetPassword: (data) => {
    console.log('🔑 authApi.resetPassword called');
    return api.post('/Auth/reset-password', data);
  },
  changePassword: (data) => {
    console.log('🔑 authApi.changePassword called');
    return api.post('/Auth/change-password', data);
  },
  logout: () => {
    console.log('🚪 authApi.logout called');
    return api.post('/Auth/logout');
  },
  getProfile: () => {
    console.log('👤 authApi.getProfile called');
    return api.get('/Auth/profile');
  },
  updateProfile: (data) => {
    console.log('👤 authApi.updateProfile called');
    return api.put('/Auth/profile', data);
  },
  getPermissions: () => {
    console.log('🔐 authApi.getPermissions called');
    return api.get('/Auth/permissions');
  },
  getMenus: () => {
    console.log('📋 authApi.getMenus called');
    return api.get('/Auth/menus');
  },
  validateToken: (token) => {
    console.log('✅ authApi.validateToken called');
    return api.post('/Auth/validate-token', { Token: token });
  },
  generateToken: (data) => {
    console.log('🔄 authApi.generateToken called');
    return api.post('/Auth/generate-token', data);
  },
};

// ============================================================
// NOTIFICATION API
// ============================================================
export const notificationApi = {
  getAll: async () => {
    console.log('🔔 notificationApi.getAll called');
    const { notificationService } = await import('./notificationService');
    return { data: { data: await notificationService.getAll() } };
  },
  getById: async (id) => {
    console.log('🔔 notificationApi.getById called for id:', id);
    const { notificationService } = await import('./notificationService');
    const all = await notificationService.getAll();
    const found = all.find(n => String(n.id) === String(id));
    return { data: { data: found } };
  },
  markAsRead: async (id) => {
    console.log('🔔 notificationApi.markAsRead called for id:', id);
    const { notificationService } = await import('./notificationService');
    return { data: { data: await notificationService.markAsRead(id) } };
  },
  markAllRead: async () => {
    console.log('🔔 notificationApi.markAllRead called');
    const { notificationService } = await import('./notificationService');
    return { data: { data: await notificationService.markAllRead() } };
  },
  delete: async (id) => {
    console.log('🔔 notificationApi.delete called for id:', id);
    const { notificationService } = await import('./notificationService');
    return { data: { data: await notificationService.deleteNotification(id) } };
  },
};

// ============================================================
// BANK & IFSC DIRECTORY API
// ============================================================
export const bankApi = {
  lookupIFSC: async (ifsc) => {
    const { lookupIFSC } = await import('./bankService');
    return lookupIFSC(ifsc);
  },
  getBanks: async () => {
    const { getIndianBanks } = await import('./bankService');
    return getIndianBanks();
  }
};

export default api;
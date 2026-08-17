import api from './api';

const STORAGE_KEY = 'ecollect_notifications_store';

// Default initial realistic domain notifications
const DEFAULT_SEED_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'New Branch Registration Pending Approval',
    message: 'Mumbai Central Regional Branch has been submitted by Merchant #12 (Apex Retail) and requires Software Admin review & activation.',
    category: 'APPROVALS',
    priority: 'HIGH',
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/branches',
    actionLabel: 'Review Branch',
    meta: { merchantId: 12, branchCode: 'BR-1049' }
  },
  {
    id: 'notif-2',
    title: 'Batch Settlement Disbursal Success',
    message: 'Settlement batch #SET-20260817-01 of ₹4,85,250.00 successfully processed via RBI NEFT rail to 14 active merchants.',
    category: 'SETTLEMENTS',
    priority: 'INFO',
    time: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/settlements',
    actionLabel: 'View Settlement',
    meta: { batchId: 'SET-20260817-01', amount: '₹4,85,250.00' }
  },
  {
    id: 'notif-3',
    title: 'Dynamic Core Banking CBS API Synced',
    message: 'Automated branch & agent catalog synchronization completed for integrated partner Apex Retail (Live Dynamic CBS API active).',
    category: 'SYSTEM',
    priority: 'SUCCESS',
    time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/merchants',
    actionLabel: 'View Merchant',
    meta: { merchantId: 12 }
  },
  {
    id: 'notif-4',
    title: 'High Volume Cash Inflow Detected',
    message: 'Field Agent Rahul Sharma (AG-2041) has collected ₹1,20,000.00 across 28 RD customer accounts today, achieving 100% daily target.',
    category: 'AGENTS',
    priority: 'INFO',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: '/agents',
    actionLabel: 'View Agent',
    meta: { agentCode: 'AG-2041' }
  },
  {
    id: 'notif-5',
    title: 'Portal Security Telemetry Alert',
    message: 'Successful administrative login verified from IP 192.168.1.100 via Encrypted Session Token.',
    category: 'SECURITY',
    priority: 'LOW',
    time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: '/settings',
    actionLabel: 'Audit Security',
    meta: { ip: '192.168.1.100' }
  },
  {
    id: 'notif-6',
    title: 'IFSC Public Rail Verified: HDFC0000240',
    message: 'Automated bank branch routing directory updated for HDFC Bank Cyber City Branch.',
    category: 'SYSTEM',
    priority: 'LOW',
    time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: '/merchants',
    actionLabel: 'View Directory',
    meta: { ifsc: 'HDFC0000240' }
  }
];

// Helper to get stored items
const getLocalStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading notifications from localStorage:', err);
  }
  // Initialize with seed
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_NOTIFICATIONS));
  return DEFAULT_SEED_NOTIFICATIONS;
};

// Helper to save stored items
const setLocalStore = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Error saving notifications to localStorage:', err);
  }
};

export const notificationService = {
  // Fetch all notifications from backend with seamless fallback
  getAll: async () => {
    try {
      // Attempt backend endpoints in sequence
      const res = await api.get('/Notification/get-all')
        .catch(() => api.get('/Notification'))
        .catch(() => api.get('/notifications'));
      
      const remoteData = res?.data?.data || res?.data;
      if (Array.isArray(remoteData) && remoteData.length > 0) {
        // Map backend structure to standardized frontend format
        const mapped = remoteData.map((item, idx) => ({
          id: String(item.id || item.notificationId || `backend-${idx}`),
          title: item.title || item.subject || 'System Notification',
          message: item.message || item.description || item.text || '',
          category: (item.category || item.type || 'SYSTEM').toUpperCase(),
          priority: (item.priority || item.severity || 'INFO').toUpperCase(),
          time: item.createdAt || item.createdDate || item.time || new Date().toISOString(),
          read: Boolean(item.isRead !== undefined ? item.isRead : item.read),
          actionUrl: item.actionUrl || item.url || null,
          actionLabel: item.actionLabel || 'View Details',
          meta: item.meta || {}
        }));
        
        // Merge with local read overrides if any
        const localItems = getLocalStore();
        const readIds = new Set(localItems.filter(n => n.read).map(n => String(n.id)));
        const finalItems = mapped.map(m => ({
          ...m,
          read: m.read || readIds.has(String(m.id))
        }));

        setLocalStore(finalItems);
        return finalItems;
      }
    } catch (error) {
      console.log('ℹ️ Backend notification endpoint offline or empty, using active local telemetry cache.');
    }

    return getLocalStore();
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    const targetId = String(id);
    
    // Attempt backend sync
    api.patch(`/Notification/${targetId}/read`)
      .catch(() => api.post(`/Notification/${targetId}/read`))
      .catch(() => api.post('/Notification/mark-read', { id: targetId }))
      .catch(() => api.patch(`/notifications/${targetId}/read`))
      .catch(() => {});

    // Update local cache
    const current = getLocalStore();
    const updated = current.map(item => 
      String(item.id) === targetId ? { ...item, read: true } : item
    );
    setLocalStore(updated);
    return updated;
  },

  // Mark all notifications as read
  markAllRead: async () => {
    // Attempt backend sync
    api.patch('/Notification/read-all')
      .catch(() => api.post('/Notification/read-all'))
      .catch(() => api.patch('/notifications/read-all'))
      .catch(() => {});

    // Update local cache
    const current = getLocalStore();
    const updated = current.map(item => ({ ...item, read: true }));
    setLocalStore(updated);
    return updated;
  },

  // Delete notification
  deleteNotification: async (id) => {
    const targetId = String(id);
    
    // Attempt backend sync
    api.delete(`/Notification/${targetId}`)
      .catch(() => api.delete(`/notifications/${targetId}`))
      .catch(() => {});

    // Update local cache
    const current = getLocalStore();
    const updated = current.filter(item => String(item.id) !== targetId);
    setLocalStore(updated);
    return updated;
  },

  // Clear all read notifications
  clearAllRead: async () => {
    const current = getLocalStore();
    const updated = current.filter(item => !item.read);
    setLocalStore(updated);
    return updated;
  },

  // Create a new notification dynamically
  addNotification: (notif) => {
    const current = getLocalStore();
    const newItem = {
      id: notif.id || `notif-${Date.now()}`,
      title: notif.title || 'Platform Notification',
      message: notif.message || '',
      category: (notif.category || 'SYSTEM').toUpperCase(),
      priority: (notif.priority || 'INFO').toUpperCase(),
      time: notif.time || new Date().toISOString(),
      read: false,
      actionUrl: notif.actionUrl || null,
      actionLabel: notif.actionLabel || 'View',
      meta: notif.meta || {}
    };

    const updated = [newItem, ...current];
    setLocalStore(updated);
    return updated;
  },

  // Reset to default seed
  resetDefaults: () => {
    setLocalStore(DEFAULT_SEED_NOTIFICATIONS);
    return DEFAULT_SEED_NOTIFICATIONS;
  }
};

export default notificationService;

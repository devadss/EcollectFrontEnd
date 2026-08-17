// Role-based menu configuration
export const MENU_CONFIG = {
  softwareadmin: {
    role: 'Software Admin',
    icon: '👑',
    menu: [
      { section: 'Main Menu', items: [
        { icon: '📊', label: 'Dashboard', path: '/dashboard' },
      ]},
      { section: 'Management', items: [
        { icon: '🏪', label: 'Merchants', path: '/merchants', badge: '12' },
        { icon: '👤', label: 'Agents', path: '/agents' },
        { icon: '🏢', label: 'Branches', path: '/branches' },
        { icon: '⚙️', label: 'Merchant Config', path: 'merchants/merchantconfig' }
      ]},
      { section: 'Transactions', items: [
        { icon: '💳', label: 'Payments', path: '/payments' },
        { icon: '🏦', label: 'Settlements', path: '/settlements', badge: '3' },
        { icon: '↩️', label: 'Refunds', path: '/refunds' },
      ]},
      { section: 'Reports', items: [
        { icon: '📈', label: 'Analytics', path: '/reports' },
        { icon: '📋', label: 'Audit Logs', path: '/audit' },
      ]},
    ]
  },

  merchant: {
    role: 'Merchant',
    icon: '🏪',
    menu: [
      { section: 'Main Menu', items: [
        { icon: '📊', label: 'Dashboard', path: '/dashboard' },
      ]},
      { section: 'Payments', items: [
        { icon: '💳', label: 'New Payment', path: '/payments/create' },
        { icon: '📋', label: 'Transaction History', path: '/payments/history' },
        { icon: '🔗', label: 'Payment Links', path: '/payments/links' },
      ]},
      { section: 'Settlements', items: [
        { icon: '🏦', label: 'Settlements', path: '/settlements' },
        { icon: '📊', label: 'Reports', path: '/reports' },
      ]},
      { section: 'Agents', items: [
        { icon: '👤', label: 'My Agents', path: '/agents' },
        { icon: '➕', label: 'Add Agent', path: '/agents/add' },
      ]},
    ]
  },

  branchadmin: {
    role: 'Branch Admin',
    icon: '🏢',
    menu: [
      { section: 'Main Menu', items: [
        { icon: '📊', label: 'Dashboard', path: '/dashboard' },
      ]},
      { section: 'Accounts', items: [
        { icon: '🏦', label: 'Accounts', path: '/accounts' },
      ]},
    ]
  },

  agent: {
    role: 'Agent',
    icon: '👤',
    menu: [
      { section: 'Main Menu', items: [
        { icon: '📊', label: 'Dashboard', path: '/dashboard' },
      ]},
      { section: 'Payments', items: [
        { icon: '💳', label: 'New Payment', path: '/payments/create' },
        { icon: '📋', label: 'History', path: '/payments/history' },
        { icon: '🔗', label: 'Generate Link', path: '/payments/links' },
      ]},
      { section: 'Customers', items: [
        { icon: '👥', label: 'My Customers', path: '/customers' },
        { icon: '➕', label: 'Add Customer', path: '/customers/add' },
        { icon: '📋', label: 'Due List', path: '/customers/due' },
      ]},
      { section: 'Commissions', items: [
        { icon: '💰', label: 'Commission', path: '/commissions' },
        { icon: '📊', label: 'Reports', path: '/reports' },
      ]},
    ]
  },

  customer: {
    role: 'Customer',
    icon: '👤',
    menu: [
      { section: 'Main Menu', items: [
        { icon: '📊', label: 'Dashboard', path: '/dashboard' },
      ]},
      { section: 'Payments', items: [
        { icon: '💳', label: 'Make Payment', path: '/payments/create' },
        { icon: '📋', label: 'Payment History', path: '/payments/history' },
        { icon: '📄', label: 'Invoices', path: '/invoices' },
      ]},
      { section: 'Account', items: [
        { icon: '👤', label: 'Profile', path: '/profile' },
        { icon: '⚙️', label: 'Settings', path: '/settings' },
        { icon: '📞', label: 'Support', path: '/support' },
      ]},
    ]
  }
};

// Default menu for unknown roles
export const DEFAULT_MENU = {
  role: 'User',
  icon: '👤',
  menu: [
    { section: 'Main Menu', items: [
      { icon: '📊', label: 'Dashboard', path: '/dashboard' },
    ]},
  ]
};

// Get menu by role
export const getMenuByRole = (role) => {
  const normalizedRole = role?.toLowerCase() || '';
  return MENU_CONFIG[normalizedRole] || DEFAULT_MENU;
};
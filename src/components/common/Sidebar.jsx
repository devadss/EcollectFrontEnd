import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import './Sidebar.css';

// Crisp Geometric SVG Icons
const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="2" />
      <rect x="14" y="3" width="7" height="5" rx="2" />
      <rect x="14" y="12" width="7" height="9" rx="2" />
      <rect x="3" y="16" width="7" height="5" rx="2" />
    </svg>
  ),
  Merchants: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Agents: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Branches: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 2 7 22 7 12 2" />
    </svg>
  ),
  Config: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  DueList: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Buckets: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Transactions: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Settlements: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <circle cx="12" cy="15" r="2" />
    </svg>
  ),
  Refunds: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  Reports: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Commission: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <line x1="12" y1="6" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="18" />
    </svg>
  ),
  Customers: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Payments: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Profile: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Logo: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Accounts: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  ),
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Default: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
};

const Sidebar = ({ 
  collapsed = false, 
  mobileOpen = false,
  onToggle,
  onMobileClose,
  isMobile = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isLightSidebar = Boolean(theme?.id?.startsWith('light') && theme?.sidebarBg === '#ffffff');

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userMenus, setUserMenus] = useState([]);
  const [userRole, setUserRole] = useState(() => {
    try {
      const userDataStr = localStorage.getItem('auth_user') || localStorage.getItem('user');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        return user?.role?.toLowerCase() || localStorage.getItem('userRole')?.toLowerCase() || 'softwareadmin';
      }
      return localStorage.getItem('userRole')?.toLowerCase() || 'softwareadmin';
    } catch {
      return 'softwareadmin';
    }
  });

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const userDataStr = localStorage.getItem('auth_user') || localStorage.getItem('user');
      if (userDataStr) {
        return JSON.parse(userDataStr);
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
    return null;
  };

  // Modern SVG icon resolver based on menu name / path
  const getMenuIcon = (name = '', path = '') => {
    const key = (name || path).toLowerCase().trim();
    if (key.includes('dashboard')) return <Icons.Dashboard />;
    if (key.includes('due') || key.includes('due-list')) return <Icons.DueList />;
    if (key.includes('bucket')) return <Icons.Buckets />;
    if (key.includes('merchant config')) return <Icons.Config />;
    if (key.includes('merchant')) return <Icons.Merchants />;
    if (key.includes('agent')) return <Icons.Agents />;
    if (key.includes('branch')) return <Icons.Branches />;
    if (key.includes('account')) return <Icons.Accounts />;
    if (key.includes('settlement')) return <Icons.Settlements />;
    if (key.includes('refund')) return <Icons.Refunds />;
    if (key.includes('transaction') || key.includes('history')) return <Icons.Transactions />;
    if (key.includes('commission')) return <Icons.Commission />;
    if (key.includes('report') || key.includes('analytics')) return <Icons.Reports />;
    if (key.includes('customer')) return <Icons.Customers />;
    if (key.includes('payment')) return <Icons.Payments />;
    if (key.includes('notif') || key.includes('alert')) return <Icons.Bell />;
    if (key.includes('setting')) return <Icons.Settings />;
    if (key.includes('profile')) return <Icons.Profile />;
    return <Icons.Default />;
  };

  // Static fallback menus
  const getStaticMenus = (role) => {
    const normRole = (role || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    if (normRole.includes('branch') || normRole.includes('bank')) {
      return [
        { section: 'Overview', items: [{ label: 'Dashboard', path: '/dashboard' }] },
        { section: 'Collections', items: [
          { label: 'Daily Due List', path: '/due-list' },
          { label: 'Delinquency Buckets', path: '/buckets' },
        ]},
        { section: 'Management', items: [
          { label: 'Agents', path: '/agents' },
          { label: 'Accounts', path: '/accounts' },
        ]},
        { section: 'Transactions', items: [
          { label: 'Transaction History', path: '/transactions' },
        ]},
        { section: 'Analytics', items: [
          { label: 'Reports', path: '/reports' },
        ]},
        { section: 'System', items: [
          { label: 'Notifications', path: '/notifications' },
          { label: 'Settings', path: '/settings' },
        ]}
      ];
    }

    if (normRole.includes('merchant')) {
      return [
        { section: 'Overview', items: [{ label: 'Dashboard', path: '/dashboard' }] },
        { section: 'Management', items: [
          { label: 'Branches', path: '/branches' },
          { label: 'Agents', path: '/agents' },
        ]},
        { section: 'Transactions', items: [
          { label: 'Transaction History', path: '/transactions' },
          { label: 'Settlements', path: '/settlements' },
          { label: 'Refunds', path: '/refunds' },
        ]},
        { section: 'System', items: [
          { label: 'Notifications', path: '/notifications' },
          { label: 'Settings', path: '/settings' },
        ]}
      ];
    }

    if (normRole.includes('agent')) {
      return [
        { section: 'Overview', items: [{ label: 'Dashboard', path: '/dashboard' }] },
        { section: 'Collections', items: [
          { label: 'Daily Due List', path: '/due-list' },
          { label: 'Delinquency Buckets', path: '/buckets' },
          { label: 'Transaction History', path: '/transactions' },
          { label: 'My Customers', path: '/customers' },
          { label: 'Commission', path: '/commission' },
        ]},
        { section: 'Account', items: [
          { label: 'Notifications', path: '/notifications' },
          { label: 'Settings', path: '/settings' },
        ]}
      ];
    }

    if (normRole.includes('customer')) {
      return [
        { section: 'Overview', items: [{ label: 'Dashboard', path: '/dashboard' }] },
        { section: 'Payments', items: [
          { label: 'Payment History', path: '/transactions' },
        ]},
        { section: 'Account', items: [
          { label: 'Notifications', path: '/notifications' },
          { label: 'Settings', path: '/settings' },
        ]}
      ];
    }

    // Default: Software Admin
    return [
      { section: 'Overview', items: [{ label: 'Dashboard', path: '/dashboard' }] },
      { section: 'Management', items: [
        { label: 'Merchants', path: '/merchants' },
        { label: 'Agents', path: '/agents' },
        { label: 'Branches', path: '/branches' },
        { label: 'Merchant Config', path: '/merchants/merchantconfig' }
      ]},
      { section: 'Transactions', items: [
        { label: 'Transaction History', path: '/transactions' },
        { label: 'Settlements', path: '/settlements' },
        { label: 'Refunds', path: '/refunds' },
      ]},
      { section: 'Analytics', items: [
        { label: 'Reports', path: '/reports' },
        { label: 'Commission', path: '/commission' },
      ]},
      { section: 'System', items: [
        { label: 'Notifications', path: '/notifications' },
        { label: 'Settings', path: '/settings' },
      ]}
    ];
  };

  // Helper to format table-driven database menu records
  const formatDynamicMenus = (rawMenus) => {
    if (!Array.isArray(rawMenus) || rawMenus.length === 0) return null;
    
    // Check if already structured sections
    if (rawMenus[0]?.section && Array.isArray(rawMenus[0]?.items)) {
      return rawMenus;
    }

    // Flat database table records: [{ id, name, title, url, path, section, icon }, ...]
    const grouped = {};
    rawMenus.forEach(item => {
      const sectionName = item.section || item.category || 'Operations';
      if (!grouped[sectionName]) {
        grouped[sectionName] = [];
      }
      const label = item.name || item.title || item.label || item.menuName || 'Item';
      let path = item.url || item.path || item.route || `/${label.toLowerCase().replace(/\s+/g, '')}`;
      if (!path.startsWith('/')) path = `/${path}`;
      
      grouped[sectionName].push({
        label,
        path
      });
    });

    const sections = Object.keys(grouped).map(section => ({
      section,
      items: grouped[section]
    }));

    return sections.length > 0 ? sections : null;
  };

  useEffect(() => {
    const loadMenusFromTables = async () => {
      try {
        const u = getUserData();
        if (u?.role) {
          setUserRole(u.role.toLowerCase());
        }
        const menusStr = localStorage.getItem('menus') || localStorage.getItem('auth_menus');
        
        if (menusStr) {
          try {
            const menus = JSON.parse(menusStr);
            if (Array.isArray(menus) && menus.length > 0) {
              setUserMenus(menus);
            }
          } catch (e) {}
        }

        // Proactively fetch latest table menus from backend if token present
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (token) {
          try {
            const res = await authApi.getMenus();
            if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
              setUserMenus(res.data);
              localStorage.setItem('auth_menus', JSON.stringify(res.data));
              localStorage.setItem('menus', JSON.stringify(res.data));
            }
          } catch (apiErr) {
            // Silently fallback to cached or static
          }
        }
      } catch (error) {
        console.error('Error loading menus:', error);
      }
    };

    loadMenusFromTables();
  }, []);

  const normUserRole = (userRole || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const roleDisplayName = {
    softwareadmin: 'Software Admin',
    admin: 'Software Admin',
    superadmin: 'Software Admin',
    merchant: 'Merchant Portal',
    merchantadmin: 'Merchant Portal',
    branch: 'Branch Admin',
    branchadmin: 'Branch Admin',
    bank: 'Bank Admin',
    bankadmin: 'Bank Admin',
    agent: 'Field Agent',
    customer: 'Customer'
  }[normUserRole] || (normUserRole.includes('branch') ? 'Branch Admin' : 'Software Admin');

  // Compute menu items & strictly enforce: Settlements and Refunds menus ONLY for Merchant and Software Admin
  const isMerchant = normUserRole.includes('merchant');
  const isSoftwareAdmin = normUserRole.includes('admin') || normUserRole.includes('software');
  const isMerchantOrAdmin = 
    normUserRole.includes('merchant') || 
    normUserRole.includes('admin') || 
    normUserRole === 'softwareadmin';

  // Integration Status check (Model Y = Integrated CBS, Model N = Standalone Ledger)
  const userObj = getUserData();
  const rawInteg = localStorage.getItem('integrationStatus') || userObj?.integrationStatus || userObj?.IntegrationStatus || 'No';
  const isIntegrated = String(rawInteg).toUpperCase() === 'Y' || String(rawInteg).toUpperCase() === 'YES' || rawInteg === true;

  const rawSections = (userMenus.length > 0 && formatDynamicMenus(userMenus)) || getStaticMenus(userRole);
  const menuSections = rawSections.map(sec => ({
    ...sec,
    items: sec.items.filter(item => {
      const p = (item.path || '').toLowerCase();
      const l = (item.label || '').toLowerCase();
      const isRestrictedFinance = 
        p.includes('settlement') || l.includes('settlement') ||
        p.includes('refund') || l.includes('refund');
      if (isRestrictedFinance && !isMerchantOrAdmin) {
        return false;
      }

      // Collections (Due List, Delinquency Buckets) are required ONLY for Branch / Agent operational roles in Standalone Model (Status: N).
      // They are strictly hidden for Software Admin, Merchant, and Integrated CBS Mode (Status: Y).
      const isCollectionMenu = 
        p.includes('due-list') || l.includes('due list') ||
        p.includes('bucket') || l.includes('bucket');
      if (isCollectionMenu && (isSoftwareAdmin || isMerchant || isIntegrated)) {
        return false;
      }

      return true;
    })
  })).filter(sec => sec.items.length > 0);

  const handleNavigation = (path, e) => {
    if (e) e.preventDefault();
    if (!path) return;
    navigate(path);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    
    try {
      localStorage.clear();
      sessionStorage.clear();
      if (isMobile && onMobileClose) {
        onMobileClose();
      }
      navigate('/login', { replace: true });
    } catch (error) {
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isPathActive = (path) => {
    if (!path) return false;
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  if (isMobile && !mobileOpen) {
    return null;
  }

  const sidebarClass = `ultra-sidebar ${collapsed ? 'is-collapsed' : ''} ${isMobile ? 'is-mobile' : ''} ${mobileOpen ? 'is-open' : ''}`;

  return (
    <aside className={sidebarClass} aria-label="Sidebar navigation">
      <div className="sidebar-container">
        
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <div className="brand-logo-pill" onClick={() => navigate('/dashboard')} role="button" tabIndex={0} title="eCollect • Smart Payment Solutions">
            <div className="brand-logo-img-wrapper">
              <img 
                src={isLightSidebar ? "/ecollect-logo-dark.png" : "/ecollect-logo.png"} 
                alt="eCollect - Smart Payment Solutions" 
                className={collapsed ? "sidebar-logo-collapsed-img" : "sidebar-logo-expanded-img"} 
              />
            </div>
          </div>

          {!isMobile && (
            <button 
              className="sidebar-collapse-trigger" 
              onClick={onToggle}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle sidebar collapse"
            >
              {collapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
            </button>
          )}

          {isMobile && (
            <button className="sidebar-close-trigger" onClick={onMobileClose} aria-label="Close sidebar">
              ✕
            </button>
          )}
        </div>

        {/* User Role Card */}
        {!collapsed && (
          <div className="sidebar-role-card">
            <div className="role-avatar-wrapper">
              <div className="role-avatar-initial">
                {roleDisplayName.charAt(0)}
              </div>
              <span className="role-status-dot"></span>
            </div>
            <div className="role-card-info">
              <span className="role-title">{roleDisplayName}</span>
              <span className="role-badge-status">Online System</span>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="sidebar-nav-scroll" role="navigation">
          {menuSections.map((section, idx) => (
            <div key={idx} className="sidebar-group">
              {!collapsed && section.section && (
                <div className="sidebar-group-heading">{section.section}</div>
              )}
              
              <div className="sidebar-group-items">
                {section.items.map((item, itemIdx) => {
                  const isActive = isPathActive(item.path);

                  return (
                    <NavLink
                      key={itemIdx}
                      to={item.path}
                      className={`sidebar-nav-link ${isActive ? 'is-active' : ''}`}
                      onClick={(e) => handleNavigation(item.path, e)}
                      title={collapsed ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="nav-active-indicator"></div>
                      <span className="nav-icon-container">
                        {getMenuIcon(item.label, item.path)}
                      </span>
                      {!collapsed && (
                        <span className="nav-label-text">{item.label}</span>
                      )}
                      {collapsed && (
                        <div className="sidebar-tooltip">{item.label}</div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="sidebar-footer-wrapper">
          <button 
            className={`sidebar-logout-action ${isLoggingOut ? 'is-logging-out' : ''}`}
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={collapsed ? "Sign Out" : undefined}
          >
            <span className="logout-icon-box">
              <Icons.Logout />
            </span>
            {!collapsed && (
              <span className="logout-label-text">
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </span>
            )}
            {collapsed && (
              <div className="sidebar-tooltip">Sign Out</div>
            )}
          </button>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
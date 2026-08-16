import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ 
  collapsed = false, 
  mobileOpen = false,
  onToggle,
  onMobileClose,
  isMobile = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userMenus, setUserMenus] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Get user data from localStorage
  const getUserData = () => {
    try {
      const userDataStr = localStorage.getItem('auth_user');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        setUserData(user);
        setUserRole(user?.role?.toLowerCase() || 'softwareadmin');
        return user;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
    return null;
  };

  // ✅ Get role icon
  const getRoleIcon = (role) => {
    const icons = {
      softwareadmin: '👑',
      merchant: '🏪',
      bankadmin: '🏦',
      branchadmin: '🏢',
      agent: '👤',
      customer: '👤'
    };
    return icons[role?.toLowerCase()] || '👤';
  };

  // ✅ Get icon based on menu name
  const getIconFromName = (menuName) => {
    const iconMap = {
      'dashboard': '📊',
      'merchants': '🏪',
      'agents': '👤',
      'branches': '🏢',
      'transactions': '📋',
      'transaction history': '📋',
      'settlements': '🏦',
      'reports': '📈',
      'profile': '👤',
      'payments': '💳',
      'commission': '💰',
      'refunds': '↩️',
      'customers': '👥',
      'merchant config': '⚙️',
      'reconciliation': '🔄',
      'new payment': '💳',
      'history': '📋',
      'my profile': '👤',
      'change password': '🔒',
      'my customers': '👥',
      'due list': '📋',
      'my commissions': '💰'
    };
    return iconMap[menuName?.toLowerCase()] || '📄';
  };

  // ✅ Get section based on menu name
  const getSectionFromName = (menuName) => {
    const sectionMap = {
      'dashboard': 'MAIN',
      'merchants': 'MANAGEMENT',
      'agents': 'MANAGEMENT',
      'branches': 'MANAGEMENT',
      'merchant config': 'MANAGEMENT',
      'transactions': 'TRANSACTIONS',
      'transaction history': 'TRANSACTIONS',
      'settlements': 'SETTLEMENTS',
      'reports': 'REPORTS',
      'profile': 'ACCOUNT',
      'payments': 'PAYMENTS',
      'commission': 'REPORTS',
      'refunds': 'TRANSACTIONS',
      'customers': 'CUSTOMERS',
      'reconciliation': 'TRANSACTIONS',
      'new payment': 'PAYMENTS',
      'history': 'TRANSACTIONS',
      'my profile': 'ACCOUNT',
      'change password': 'ACCOUNT',
      'my customers': 'CUSTOMERS',
      'due list': 'CUSTOMERS',
      'my commissions': 'COMMISSIONS'
    };
    return sectionMap[menuName?.toLowerCase()] || 'MAIN';
  };

  // ✅ Static fallback menus
  const getStaticMenus = (role) => {
    const staticMenus = {
      softwareadmin: [
        { section: 'MAIN', items: [{ icon: '📊', label: 'Dashboard', path: '/dashboard' }] },
        { section: 'MANAGEMENT', items: [
          { icon: '🏪', label: 'Merchants', path: '/merchants' },
          { icon: '👤', label: 'Agents', path: '/agents' },
          { icon: '🏢', label: 'Branches', path: '/branches' },
          { icon: '⚙️', label: 'Merchant Config', path: '/merchants/merchantconfig' }
        ]},
        { section: 'TRANSACTIONS', items: [
          { icon: '📋', label: 'Transaction History', path: '/transactions' },
          { icon: '🏦', label: 'Settlements', path: '/settlements' },
          { icon: '↩️', label: 'Refunds', path: '/refunds' },
        ]},
        { section: 'REPORTS', items: [
          { icon: '📈', label: 'Reports', path: '/reports' },
          { icon: '💰', label: 'Commission', path: '/commission' },
        ]}
      ],
      merchant: [
        { section: 'MAIN', items: [{ icon: '📊', label: 'Dashboard', path: '/dashboard' }] },
        { section: 'PAYMENTS', items: [
          { icon: '💳', label: 'New Payment', path: '/payments/create' },
          { icon: '📋', label: 'History', path: '/transactions' },
        ]},
        { section: 'SETTLEMENTS', items: [
          { icon: '🏦', label: 'Settlements', path: '/settlements' },
        ]},
        { section: 'REPORTS', items: [
          { icon: '📈', label: 'Reports', path: '/reports' },
        ]}
      ],
      bankadmin: [
        { section: 'MAIN', items: [{ icon: '📊', label: 'Dashboard', path: '/dashboard' }] },
        { section: 'BANK OPERATIONS', items: [
          { icon: '🏪', label: 'Merchants', path: '/merchants' },
          { icon: '👤', label: 'Agents', path: '/agents' },
          { icon: '🏢', label: 'Branches', path: '/branches' },
        ]},
        { section: 'TRANSACTIONS', items: [
          { icon: '📋', label: 'Transaction History', path: '/transactions' },
          { icon: '🏦', label: 'Settlements', path: '/settlements' },
          { icon: '🔄', label: 'Reconciliation', path: '/reconciliation' },
        ]}
      ],
      branchadmin: [
        { section: 'MAIN', items: [{ icon: '📊', label: 'Dashboard', path: '/dashboard' }] },
        { section: 'BRANCH OPERATIONS', items: [
          { icon: '🏪', label: 'Merchants', path: '/merchants' },
          { icon: '👤', label: 'Agents', path: '/agents' },
        ]},
        { section: 'TRANSACTIONS', items: [
          { icon: '📋', label: 'Transaction History', path: '/transactions' },
          { icon: '🏦', label: 'Settlements', path: '/settlements' },
        ]}
      ],
      agent: [
        { section: 'MAIN', items: [{ icon: '📊', label: 'Dashboard', path: '/dashboard' }] },
        { section: 'PAYMENTS', items: [
          { icon: '💳', label: 'New Payment', path: '/payments/create' },
          { icon: '📋', label: 'History', path: '/transactions' },
        ]},
        { section: 'CUSTOMERS', items: [
          { icon: '👥', label: 'My Customers', path: '/customers' },
          { icon: '📋', label: 'Due List', path: '/customers/due' },
        ]},
        { section: 'COMMISSIONS', items: [
          { icon: '💰', label: 'My Commissions', path: '/commission' },
        ]}
      ],
      customer: [
        { section: 'MAIN', items: [{ icon: '📊', label: 'Dashboard', path: '/dashboard' }] },
        { section: 'PAYMENTS', items: [
          { icon: '💳', label: 'Make Payment', path: '/payments/create' },
          { icon: '📋', label: 'History', path: '/transactions' },
        ]},
        { section: 'ACCOUNT', items: [
          { icon: '👤', label: 'My Profile', path: '/profile' },
          { icon: '🔒', label: 'Change Password', path: '/change-password' },
        ]}
      ]
    };

    return staticMenus[role?.toLowerCase()] || staticMenus.softwareadmin;
  };

  // ✅ Convert API menus to sidebar format
  const buildMenuStructure = (menus, role) => {
    if (!menus || menus.length === 0) {
      console.log('📋 No menus, using static menus for role:', role);
      return getStaticMenus(role);
    }

    console.log('📋 Building menu structure from', menus.length, 'menus');

    const sections = {};
    const rootMenus = menus.filter(menu => 
      !menu.parentId || menu.parentId === null || menu.parentId === 0
    );

    rootMenus.forEach(menu => {
      const section = menu.section || getSectionFromName(menu.name) || 'MAIN';
      
      if (!sections[section]) {
        sections[section] = [];
      }
      
      if (menu.permissions?.canView !== false) {
        const menuItem = {
          icon: menu.icon || getIconFromName(menu.name),
          label: menu.name,
          path: menu.path || `/${menu.name.toLowerCase().replace(/\s+/g, '-')}`,
          permissions: menu.permissions || { canView: true },
          badge: menu.badge || null,
          id: menu.id
        };

        const children = menus.filter(m => m.parentId === menu.id);
        if (children.length > 0) {
          menuItem.children = children.map(child => ({
            icon: child.icon || getIconFromName(child.name),
            label: child.name,
            path: child.path || `/${child.name.toLowerCase().replace(/\s+/g, '-')}`,
            permissions: child.permissions || { canView: true },
            badge: child.badge || null,
            id: child.id
          }));
        }

        sections[section].push(menuItem);
      }
    });

    const menuSections = Object.entries(sections)
      .filter(([_, items]) => items.length > 0)
      .map(([section, items]) => ({
        section: section,
        items: items
      }));

    if (menuSections.length === 0) {
      console.log('📋 No sections built, using static menus');
      return getStaticMenus(role);
    }

    console.log('📋 Final menu sections:', menuSections);
    return menuSections;
  };

  // ✅ Load menus from localStorage (NOT from API)
  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const user = getUserData();
      if (!user) {
        setLoading(false);
        return;
      }

      // ✅ Get menus from localStorage (saved during login)
      const menusStr = localStorage.getItem('menus') || localStorage.getItem('auth_menus');
      
      if (menusStr) {
        try {
          const menus = JSON.parse(menusStr);
          if (Array.isArray(menus) && menus.length > 0) {
            setUserMenus(menus);
            console.log('✅ Menus loaded from localStorage:', menus.length);
          } else {
            console.warn('⚠️ No menus in localStorage');
            setUserMenus([]);
          }
        } catch (e) {
          console.error('Error parsing menus:', e);
          setUserMenus([]);
        }
      } else {
        console.warn('⚠️ No menus found in localStorage');
        setUserMenus([]);
      }
    } catch (error) {
      console.error('❌ Error loading menus:', error);
      setUserMenus([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Build menu config
  const menuConfig = {
    role: userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Software Admin',
    icon: getRoleIcon(userRole),
    menu: buildMenuStructure(userMenus, userRole)
  };

  console.log('🔍 Sidebar Debug:', {
    userRole,
    userMenusCount: userMenus?.length || 0,
    hasMenus: menuConfig.menu?.length > 0
  });

  // Handle navigation
  const handleNavigation = (path, e) => {
    if (e) e.preventDefault();
    if (!path) return;
    try {
      navigate(path);
      if (isMobile && onMobileClose) {
        onMobileClose();
      }
    } catch (error) {
      window.location.href = path;
    }
  };

  // Handle logout
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

  // Check if path is active
  const isPathActive = (path) => {
    if (!path) return false;
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  if (isMobile && !mobileOpen) {
    return null;
  }

  if (loading) {
    return (
      <aside className={`sidebar-ultra ${collapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
        <div className="sidebar-inner">
          <div className="sidebar-brand">
            <div className="sidebar-brand-logo-container">
              <div className="sidebar-brand-logo">⚡</div>
            </div>
          </div>
          <div className="sidebar-loading">Loading...</div>
        </div>
      </aside>
    );
  }

  const sidebarClass = `sidebar-ultra ${collapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''} ${mobileOpen ? 'open' : ''}`;

  return (
    <aside className={sidebarClass} role="complementary" aria-label="Sidebar navigation">
      <div className="sidebar-inner">
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo-container">
            <div className="sidebar-brand-logo">⚡</div>
          </div>
          {!collapsed && (
            <span className="sidebar-brand-text">
              Ecollect<span className="brand-accent"></span>
              <span className="brand-dot"></span>
            </span>
          )}
          {!isMobile && (
            <button className="sidebar-collapse-btn" onClick={onToggle}>
              {collapsed ? '→' : '←'}
            </button>
          )}
          {isMobile && (
            <button className="sidebar-close-btn" onClick={onMobileClose}>
              ✕
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="sidebar-role-badge">
            <div className="sidebar-role-icon-box">{menuConfig.icon}</div>
            <div className="sidebar-role-info">
              <span className="sidebar-role-name">{menuConfig.role}</span>
              <span className="sidebar-role-status">
                <span className="online-dot"></span> Portal Active
              </span>
            </div>
          </div>
        )}

        <nav className="sidebar-menu" role="navigation">
          {menuConfig.menu && menuConfig.menu.length > 0 ? (
            menuConfig.menu.map((section, idx) => (
              <div key={idx} className="sidebar-menu-section">
                {!collapsed && section.section && (
                  <div className="sidebar-menu-label">{section.section}</div>
                )}
                {section.items && section.items.map((item, itemIdx) => {
                  const isActive = isPathActive(item.path);
                  if (!item.path) return null;
                  if (item.permissions && item.permissions.canView === false) return null;

                  return (
                    <NavLink
                      key={itemIdx}
                      to={item.path}
                      className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
                      onClick={(e) => handleNavigation(item.path, e)}
                      title={collapsed ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="menu-active-pill"></div>
                      <span className="sidebar-menu-icon" aria-hidden="true">{item.icon}</span>
                      {!collapsed && (
                        <span className="sidebar-menu-label-text">{item.label}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span className="sidebar-menu-badge">{item.badge}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="sidebar-no-menus">No menus available</div>
          )}
        </nav>

        <div className="sidebar-footer">
          <button 
            className={`sidebar-logout-btn ${isLoggingOut ? 'logging-out' : ''}`}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <span className="sidebar-menu-icon">🚪</span>
            {!collapsed && (
              <span className="sidebar-menu-label-text">
                {isLoggingOut ? 'Logging out...' : 'Sign Out'}
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
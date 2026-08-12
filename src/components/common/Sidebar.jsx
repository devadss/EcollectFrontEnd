import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ 
  role = 'softwareadmin', 
  collapsed = false, 
  mobileOpen = false,
  onToggle,
  onMobileClose,
  isMobile = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuByRole = (role) => {
    const MENU_CONFIG = {
      softwareadmin: {
        role: 'Software Admin',
        icon: '👑',
        menu: [
          { 
            section: 'MAIN', 
            items: [
              { icon: '📊', label: 'Dashboard', path: '/dashboard' }
            ]
          },
          { 
            section: 'MANAGEMENT', 
            items: [
              { icon: '🏪', label: 'Merchants', path: '/merchants' },
              { icon: '👤', label: 'Agents', path: '/agents' },
              { icon: '🏢', label: 'Branches', path: '/branches' },
              { icon: '⚙️', label: 'Merchant Config', path: '/merchants/merchantconfig' }
            ]
          },
          { 
            section: 'TRANSACTIONS', 
            items: [
              { icon: '📋', label: 'Transaction History', path: '/transactions' },
              { icon: '🏦', label: 'Settlements', path: '/settlements' },
              { icon: '↩️', label: 'Refunds', path: '/refunds' },
            ]
          },
          { 
            section: 'REPORTS', 
            items: [
              { icon: '📈', label: 'Reports', path: '/reports' },
              { icon: '💰', label: 'Commission', path: '/commission' },
            ]
          },
        ]
      },
      merchant: {
        role: 'Merchant',
        icon: '🏪',
        menu: [
          { 
            section: 'MAIN', 
            items: [
              { icon: '📊', label: 'Dashboard', path: '/dashboard' }
            ]
          },
          { 
            section: 'PAYMENTS', 
            items: [
              { icon: '💳', label: 'New Payment', path: '/payments/create' },
              { icon: '📋', label: 'History', path: '/transactions' },
            ]
          },
          { 
            section: 'SETTLEMENTS', 
            items: [
              { icon: '🏦', label: 'Settlements', path: '/settlements' },
            ]
          },
        ]
      },
      branchadmin: {
        role: 'Branch Admin',
        icon: '🏢',
        menu: [
          { 
            section: 'MAIN', 
            items: [
              { icon: '📊', label: 'Dashboard', path: '/dashboard' }
            ]
          },
          { 
            section: 'BRANCH', 
            items: [
              { icon: '🏪', label: 'Merchants', path: '/merchants' },
              { icon: '👤', label: 'Agents', path: '/agents' },
            ]
          },
          { 
            section: 'TRANSACTIONS', 
            items: [
              { icon: '📋', label: 'Transaction History', path: '/transactions' },
              { icon: '🏦', label: 'Settlements', path: '/settlements' },
            ]
          },
        ]
      },
      agent: {
        role: 'Agent',
        icon: '👤',
        menu: [
          { 
            section: 'MAIN', 
            items: [
              { icon: '📊', label: 'Dashboard', path: '/dashboard' }
            ]
          },
          { 
            section: 'PAYMENTS', 
            items: [
              { icon: '💳', label: 'New Payment', path: '/payments/create' },
              { icon: '📋', label: 'History', path: '/transactions' },
            ]
          },
          { 
            section: 'CUSTOMERS', 
            items: [
              { icon: '👥', label: 'My Customers', path: '/customers' },
              { icon: '📋', label: 'Due List', path: '/customers/due' },
            ]
          },
        ]
      },
      customer: {
        role: 'Customer',
        icon: '👤',
        menu: [
          { 
            section: 'MAIN', 
            items: [
              { icon: '📊', label: 'Dashboard', path: '/dashboard' }
            ]
          },
          { 
            section: 'PAYMENTS', 
            items: [
              { icon: '💳', label: 'Make Payment', path: '/payments/create' },
              { icon: '📋', label: 'History', path: '/transactions' },
            ]
          },
        ]
      }
    };
    return MENU_CONFIG[role?.toLowerCase()] || MENU_CONFIG.softwareadmin;
  };

  const menuConfig = getMenuByRole(role);

  // Handle navigation with error handling and fallback
  const handleNavigation = (path, e) => {
    if (e) e.preventDefault();
    
    try {
      navigate(path);
      if (isMobile && onMobileClose) {
        onMobileClose();
      }
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = path;
    }
  };

  // Handle logout
  const handleLogout = (e) => {
    e.preventDefault();
    try {
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      navigate('/login');
      if (isMobile && onMobileClose) {
        onMobileClose();
      }
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  if (isMobile && !mobileOpen) {
    return null;
  }

  const sidebarClass = `sidebar-ultra ${collapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''} ${mobileOpen ? 'open' : ''}`;

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-inner">
        
        {/* Brand Header */}
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
            <button 
              className="sidebar-collapse-btn" 
              onClick={onToggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? '→' : '←'}
            </button>
          )}

          {isMobile && (
            <button 
              className="sidebar-close-btn" 
              onClick={onMobileClose}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          )}
        </div>

        {/* Role Access Badge */}
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

        {/* Navigation Menu */}
        <nav className="sidebar-menu" role="navigation" aria-label="Main navigation">
          {menuConfig.menu.map((section, idx) => (
            <div key={idx} className="sidebar-menu-section">
              {!collapsed && (
                <div className="sidebar-menu-label">{section.section}</div>
              )}
              {section.items.map((item, itemIdx) => {
                const isActive = item.path === '/dashboard' 
                  ? location.pathname === '/dashboard' 
                  : location.pathname.startsWith(item.path);

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
          ))}
        </nav>

        {/* Footer Logout Action */}
        <div className="sidebar-footer">
          <button 
            className="sidebar-logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
            title={collapsed ? 'Logout' : undefined}
          >
            <span className="sidebar-menu-icon" aria-hidden="true">🚪</span>
            {!collapsed && <span className="sidebar-menu-label-text">Sign Out</span>}
          </button>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
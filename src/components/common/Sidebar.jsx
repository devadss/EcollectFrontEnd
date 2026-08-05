// Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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

  const sidebarClass = `sidebar ${collapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''} ${mobileOpen ? 'open' : ''}`;

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-inner">
        {/* Brand - Premium Design */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">⚡</div>
          {!collapsed && (
            <span className="sidebar-brand-text">
              Ecollect<span>PG</span>
            </span>
          )}
          {!isMobile && (
            <button 
              className="sidebar-collapse-btn" 
              onClick={onToggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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

        {/* Role Badge - Premium */}
        {!collapsed && (
          <div className="sidebar-role-badge">
            <span className="sidebar-role-icon">{menuConfig.icon}</span>
            <span className="sidebar-role-name">{menuConfig.role}</span>
          </div>
        )}

        {/* Menu - Premium Items */}
        <nav className="sidebar-menu" role="navigation" aria-label="Main navigation">
          {menuConfig.menu.map((section, idx) => (
            <div key={idx} className="sidebar-menu-section">
              {!collapsed && (
                <div className="sidebar-menu-label">{section.section}</div>
              )}
              {section.items.map((item, itemIdx) => {
                const isActiveRoute = (match, location) => {
                  if (!match) return false;
                  if (item.path === '/dashboard') {
                    return match && match.isExact;
                  }
                  return location.pathname.startsWith(item.path);
                };

                return (
                  <NavLink
                    key={itemIdx}
                    to={item.path}
                    isActive={isActiveRoute}
                    className={({ isActive }) => {
                      const active = isActive || window.location.pathname.startsWith(item.path);
                      return `sidebar-menu-item ${active ? 'active' : ''}`;
                    }}
                    onClick={(e) => handleNavigation(item.path, e)}
                    aria-current={window.location.pathname.startsWith(item.path) ? 'page' : undefined}
                  >
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

        {/* Footer - Premium Logout */}
        <div className="sidebar-footer">
          <button 
            className="sidebar-logout"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <span className="sidebar-menu-icon" aria-hidden="true">🚪</span>
            {!collapsed && <span className="sidebar-menu-label-text">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
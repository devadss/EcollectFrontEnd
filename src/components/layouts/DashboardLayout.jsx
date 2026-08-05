import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar';
import TopBar from '../common/TopBar';
// ❌ REMOVE: import './DashboardLayout.css';

const DashboardLayout = ({ children, role = 'softwareadmin', pageTitle = 'Dashboard' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const sidebarWidth = isMobile ? 0 : (collapsed ? 72 : 270);

  return (
    <div 
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        background: '#f5f7fa',
        overflow: 'hidden',
      }}
    >
      {isMobile && mobileOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
          onClick={closeMobile}
        />
      )}
      
      <Sidebar
        role={role}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={toggleSidebar}
        onMobileClose={closeMobile}
        isMobile={isMobile}
      />
      
      <div 
        style={{
          flex: 1,
          minHeight: '100vh',
          marginLeft: isMobile ? '0px' : `${sidebarWidth}px`,
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
          maxWidth: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
          background: '#f5f7fa',
          overflowX: 'hidden',
          transition: 'margin-left 0.3s ease, width 0.3s ease, max-width 0.3s ease',
          boxSizing: 'border-box',
        }}
      >
        <TopBar
          onToggle={toggleSidebar}
          pageTitle={pageTitle}
          role={role}
          isMobile={isMobile}
          collapsed={collapsed}
        />
        <div 
          style={{
            padding: '20px 30px',
            minHeight: 'calc(100vh - 70px)',
            background: '#f5f7fa',
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
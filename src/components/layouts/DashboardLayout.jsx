import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar';
import TopBar from '../common/TopBar';

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

  // Fixed Sidebar Width Calculations
  const sidebarWidth = isMobile ? 0 : (collapsed ? 76 : 260);

  return (
    <div 
      style={{
        display: 'flex',
        width: '100vw',
        minHeight: '100vh',
        background: '#070a14',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Mobile Drawer Overlay */}
      {isMobile && mobileOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
          }}
          onClick={closeMobile}
        />
      )}
      
      {/* Sidebar Component */}
      <Sidebar
        role={role}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={toggleSidebar}
        onMobileClose={closeMobile}
        isMobile={isMobile}
      />
      
      {/* Main Content Area */}
      <div 
        style={{
          flex: 1,
          minHeight: '100vh',
          marginLeft: isMobile ? '0px' : `${sidebarWidth}px`,
          width: isMobile ? '100%' : `calc(100vw - ${sidebarWidth}px)`,
          maxWidth: isMobile ? '100%' : `calc(100vw - ${sidebarWidth}px)`,
          background: '#070a14',
          overflowX: 'hidden',
          transition: 'margin-left 0.25s ease, width 0.25s ease, max-width 0.25s ease',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
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
            flex: 1,
            padding: isMobile ? '16px' : '24px 32px',
            background: '#070a14',
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
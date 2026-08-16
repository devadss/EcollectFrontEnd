import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar';
import TopBar from '../common/TopBar';

const DashboardLayout = ({ children, pageTitle = 'Dashboard' }) => {
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

  // Also handle tablet view (auto-collapse on tablet)
  useEffect(() => {
    const width = window.innerWidth;
    if (width > 768 && width <= 1024) {
      setCollapsed(true);
    }
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
          role="button"
          aria-label="Close sidebar"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              closeMobile();
            }
          }}
        />
      )}
      
      {/* Sidebar Component */}
      <Sidebar
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
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
          maxWidth: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
          background: '#070a14',
          overflowX: 'hidden',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TopBar
          onToggle={toggleSidebar}
          pageTitle={pageTitle}
          isMobile={isMobile}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
        />
        
        {/* Main Body Container (FIXED) */}
        <div 
          style={{
            flex: 1,
            /* 
               FIXED: Removed the 70px offset from padding. 
               The TopBar is a separate absolute/sticky element, 
               we only need standard spacing here.
            */
            paddingTop: isMobile ? '24px' : '32px',
            paddingRight: isMobile ? '16px' : '32px',
            paddingBottom: isMobile ? '16px' : '32px',
            paddingLeft: isMobile ? '16px' : '32px',
            background: '#070a14',
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
            overflowY: 'auto',
               height: 'calc(100vh - 70px)', 
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
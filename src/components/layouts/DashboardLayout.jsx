import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar';
import TopBar from '../common/TopBar';
import './DashboardLayout.css';

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

  // Handle auto-collapse on tablet
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

  const sidebarWidth = isMobile ? 0 : (collapsed ? 78 : 264);

  return (
    <div className="app-dashboard-root">
      {/* Subtle ambient light glow orbs */}
      <div className="ambient-glow-mesh">
        <div className="glow-orb glow-top-left"></div>
        <div className="glow-orb glow-bottom-right"></div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobile && mobileOpen && (
        <div 
          className="dashboard-mobile-overlay"
          onClick={closeMobile}
          role="button"
          aria-label="Close navigation sidebar"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') closeMobile();
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
        className="app-main-viewport"
        style={{
          marginLeft: isMobile ? '0px' : `${sidebarWidth}px`,
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
          maxWidth: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
        }}
      >
        <TopBar
          onToggle={toggleSidebar}
          pageTitle={pageTitle}
          isMobile={isMobile}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
        />
        
        {/* Main Body Container */}
        <main className="app-content-container">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
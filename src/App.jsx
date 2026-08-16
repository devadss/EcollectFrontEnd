import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';
import LoadingAnimation from './components/common/LoadingAnimation';

// DASHBOARDS
import SoftwareAdminDashboard from './pages/dashboards/SoftwareAdminDashboard';
import MerchantDashboard from './pages/dashboards/MerchantDashboard';
import BranchDashboard from './pages/dashboards/BranchDashboard';
import AgentDashboard from './pages/dashboards/AgentDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';

// AUTH
import Login from './pages/auth/Login';
import Logout from './pages/auth/Logout';

// MERCHANT PAGES
import Merchants from './pages/merchants/Merchants';
import AddMerchant from './pages/merchants/AddMerchant';
import MerchantDetails from './pages/merchants/MerchantDetails';
import MerchantsConfig from './pages/merchants/MerchantsConfig';
import AddMerchantConfig from './pages/merchants/AddMerchantConfig';
import MerchantConfigDetails from './pages/merchants/MerchantConfigDetails';

// AGENT PAGES
import Agents from './pages/agents/Agents';
import AddAgent from './pages/agents/AddAgent';
import AgentDetails from './pages/agents/AgentDetails';

// BRANCH PAGES
import Branches from './pages/branches/Branches';
import AddBranch from './pages/branches/AddBranch';
import BranchDetails from './pages/branches/BranchDetails';

// TRANSACTION PAGES
import TransactionHistory from './pages/transactions/TransactionHistory';

// SETTLEMENT PAGES
import Settlements from './pages/settlements/Settlements';
import SettlementDetails from './pages/settlements/SettlementDetails';

// REFUND PAGES
import Refunds from './pages/refunds/Refunds';

// REPORTS & COMMISSION
import Reports from './pages/reports/Reports';
import Commission from './pages/commissions/Commission';

// SETTINGS
import Settings from './pages/settings/Settings';

// ============================================================
// PROTECTED ROUTE
// ============================================================
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// ============================================================
// GET ROLE
// ============================================================
const getRoleFromStorage = () => {
  try {
    const userDataStr = localStorage.getItem('auth_user') || localStorage.getItem('user');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      if (userData?.role) {
        return userData.role.toLowerCase();
      }
    }
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      return userRole.toLowerCase();
    }
  } catch (error) {
    console.error('Error getting role:', error);
  }
  return 'softwareadmin';
};

// ============================================================
// MAIN APP
// ============================================================
function App() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('softwareadmin');

  useEffect(() => {
    const currentRole = getRoleFromStorage();
    setRole(currentRole);
    console.log('👤 App detected role:', currentRole);
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const dashboardMap = {
    softwareadmin: <SoftwareAdminDashboard />,
    merchant: <MerchantDashboard />,
    bankadmin: <BranchDashboard />,
    branchadmin: <BranchDashboard />,
    agent: <AgentDashboard />,
    customer: <CustomerDashboard />,
  };

  if (loading) {
    return <LoadingAnimation message="Loading EcollectPG" />;
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* ============================================================
              AUTH ROUTES
              ============================================================ */}
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />

          {/* ============================================================
              DASHBOARD ROUTES
              ============================================================ */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                {dashboardMap[role] || <SoftwareAdminDashboard />}
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* ============================================================
              MERCHANT ROUTES
              ============================================================ */}
          <Route 
            path="/merchants" 
            element={
              <ProtectedRoute>
                <Merchants />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/merchants/add" 
            element={
              <ProtectedRoute>
                <AddMerchant />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/merchants/edit/:id" 
            element={
              <ProtectedRoute>
                <AddMerchant />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/merchants/:id" 
            element={
              <ProtectedRoute>
                <MerchantDetails />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              MERCHANT CONFIG ROUTES
              ============================================================ */}
          <Route 
            path="/merchants/merchantconfig" 
            element={
              <ProtectedRoute>
                <MerchantsConfig />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/merchants/merchantconfig/add" 
            element={
              <ProtectedRoute>
                <AddMerchantConfig />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/merchants/merchantconfig/edit/:id" 
            element={
              <ProtectedRoute>
                <AddMerchantConfig />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/merchants/merchantconfig/:id" 
            element={
              <ProtectedRoute>
                <MerchantConfigDetails />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              AGENT ROUTES
              ============================================================ */}
          <Route 
            path="/agents" 
            element={
              <ProtectedRoute>
                <Agents />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/agents/add" 
            element={
              <ProtectedRoute>
                <AddAgent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/agents/edit/:id" 
            element={
              <ProtectedRoute>
                <AddAgent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/agents/:id" 
            element={
              <ProtectedRoute>
                <AgentDetails />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              BRANCH ROUTES
              ============================================================ */}
          <Route 
            path="/branches" 
            element={
              <ProtectedRoute>
                <Branches />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/branches/add" 
            element={
              <ProtectedRoute>
                <AddBranch />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/branches/edit/:id" 
            element={
              <ProtectedRoute>
                <AddBranch />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/branches/:id" 
            element={
              <ProtectedRoute>
                <BranchDetails />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              TRANSACTIONS ROUTES
              ============================================================ */}
          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute>
                <TransactionHistory />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              SETTLEMENT ROUTES
              ============================================================ */}
          <Route 
            path="/settlements" 
            element={
              <ProtectedRoute>
                <Settlements />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settlements/:id" 
            element={
              <ProtectedRoute>
                <SettlementDetails />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              REFUND ROUTES
              ============================================================ */}
          <Route 
            path="/refunds" 
            element={
              <ProtectedRoute>
                <Refunds />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              REPORTS ROUTES
              ============================================================ */}
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              COMMISSION ROUTES
              ============================================================ */}
          <Route 
            path="/commission" 
            element={
              <ProtectedRoute>
                <Commission />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              SETTINGS ROUTE
              ============================================================ */}
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              FALLBACK - 404
              ============================================================ */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
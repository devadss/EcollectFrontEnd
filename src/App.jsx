import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DialogProvider } from './context/DialogContext';
import { NotificationProvider } from './context/NotificationContext';
import { MerchantProvider } from './context/MerchantContext';
import './App.css';
import LoadingAnimation from './components/common/LoadingAnimation';
import GlobalReminderWorker from './components/common/GlobalReminderWorker';
import SessionTimeoutManager from './components/common/SessionTimeoutManager';

// DASHBOARDS
import SoftwareAdminDashboard from './pages/dashboards/SoftwareAdminDashboard';
import MerchantDashboard from './pages/dashboards/MerchantDashboard';
import BranchDashboard from './pages/dashboards/BranchDashboard';
import AgentDashboard from './pages/dashboards/AgentDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';

// NOTIFICATIONS
import Notifications from './pages/notifications/Notifications';

// AUTH
import Login from './pages/auth/Login';
import Logout from './pages/auth/Logout';
import PlanSelection from './pages/subscription/PlanSelection';
import CustomerPayDecision from './pages/customer/CustomerPayDecision';

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

// ACCOUNT PAGES
import Accounts from './pages/accounts/Accounts';
import DueList from './pages/dues/DueList';
import DelinquencyBuckets from './pages/buckets/DelinquencyBuckets';

// CUSTOMER PAGES
import Customers from './pages/customers/Customers';

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
// TOKEN VALIDATION & SESSION CLEANUP
// ============================================================
const isTokenExpired = (token) => {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (payload?.exp) {
      const isExp = payload.exp * 1000 < Date.now();
      if (isExp) {
        console.warn('⚠️ Session expired (JWT exp timestamp reached):', {
          exp: new Date(payload.exp * 1000).toLocaleString(),
          now: new Date().toLocaleString()
        });
      }
      return isExp;
    }
  } catch (error) {
    console.error('Error decoding token expiry:', error);
  }
  return false;
};

const clearAuthSession = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('user');
  localStorage.removeItem('user_role');
  localStorage.removeItem('role');
  localStorage.removeItem('userRole');
  localStorage.removeItem('branchId');
  localStorage.removeItem('branchName');
  localStorage.removeItem('branchCode');
  localStorage.removeItem('merchantId');
  localStorage.removeItem('agentId');
  localStorage.removeItem('integrationStatus');
  localStorage.removeItem('auth_permissions');
  localStorage.removeItem('permissions');
  localStorage.removeItem('auth_menus');
  sessionStorage.clear();
};

// ============================================================
// PROTECTED ROUTE
// ============================================================
const ProtectedRoute = ({ children, allowedRoles, requireNonIntegrated = false, allowNoPlan = false }) => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  
  if (!token || isTokenExpired(token)) {
    clearAuthSession();
    return <Navigate to="/login" replace />;
  }

  const rawRole = (localStorage.getItem('user_role') || localStorage.getItem('role') || getRoleFromStorage() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const isMerchant = rawRole.includes('merchant');

  // Enforce mandatory plan selection for merchant role before accessing dashboard or operational features
  if (isMerchant && !allowNoPlan) {
    const authUser = (() => { try { return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const hasSelectedPlan = localStorage.getItem('ecollect_has_selected_plan') === 'true' || authUser?.hasSelectedPlan === true;
    if (!hasSelectedPlan) {
      return <Navigate to="/select-plan" replace />;
    }
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some(r => rawRole.includes(r.toLowerCase().replace(/[^a-z0-9]/g, '')));
    if (!isAllowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (requireNonIntegrated) {
    const rawInteg = localStorage.getItem('integrationStatus') || '';
    const isIntegrated = String(rawInteg).toUpperCase() === 'Y' || String(rawInteg).toUpperCase() === 'YES' || rawInteg === 'true';
    if (isIntegrated) {
      return <Navigate to="/dashboard" replace />;
    }
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
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token && isTokenExpired(token)) {
      console.warn('⚠️ Token expired on app startup. Clearing session.');
      clearAuthSession();
    }

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
    return <LoadingAnimation message="Loading eCollect..." />;
  }

  return (
    <ThemeProvider>
      <Router>
        <DialogProvider>
          <NotificationProvider>
            <MerchantProvider>
              <GlobalReminderWorker />
              <SessionTimeoutManager />
              <Routes>
          {/* ============================================================
              AUTH ROUTES
              ============================================================ */}
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/customer-pay-decision" element={<CustomerPayDecision />} />
          <Route 
            path="/select-plan" 
            element={
              <ProtectedRoute allowNoPlan={true}>
                <PlanSelection />
              </ProtectedRoute>
            } 
          />

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
              ACCOUNT ROUTES
              ============================================================ */}
          <Route 
            path="/accounts" 
            element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/accounts/:id" 
            element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/due-list" 
            element={
              <ProtectedRoute requireNonIntegrated={true}>
                <DueList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dues" 
            element={
              <ProtectedRoute requireNonIntegrated={true}>
                <DueList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/buckets" 
            element={
              <ProtectedRoute requireNonIntegrated={true}>
                <DelinquencyBuckets />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/delinquency-buckets" 
            element={
              <ProtectedRoute requireNonIntegrated={true}>
                <DelinquencyBuckets />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              CUSTOMER & RD ROUTES
              ============================================================ */}
          <Route 
            path="/customers" 
            element={
              <ProtectedRoute>
                <Customers />
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
              SETTLEMENT ROUTES (Accessible ONLY by Software Admin & Merchant)
              ============================================================ */}
          <Route 
            path="/settlements" 
            element={
              <ProtectedRoute allowedRoles={['softwareadmin', 'admin', 'superadmin', 'merchant', 'merchantadmin']}>
                <Settlements />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settlements/:id" 
            element={
              <ProtectedRoute allowedRoles={['softwareadmin', 'admin', 'superadmin', 'merchant', 'merchantadmin']}>
                <SettlementDetails />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              REFUND ROUTES (Accessible ONLY by Software Admin & Merchant)
              ============================================================ */}
          <Route 
            path="/refunds" 
            element={
              <ProtectedRoute allowedRoles={['softwareadmin', 'admin', 'superadmin', 'merchant', 'merchantadmin']}>
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
              SETTINGS & NOTIFICATIONS ROUTE
              ============================================================ */}
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================
              FALLBACK - 404
              ============================================================ */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
            </MerchantProvider>
          </NotificationProvider>
        </DialogProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
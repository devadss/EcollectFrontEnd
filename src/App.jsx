import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';
import LoadingAnimation from './components/common/LoadingAnimation';

// ============================================================
// DASHBOARDS
// ============================================================
import SoftwareAdminDashboard from './pages/dashboards/SoftwareAdminDashboard';
import MerchantDashboard from './pages/dashboards/MerchantDashboard';
import BranchDashboard from './pages/dashboards/BranchDashboard';
import AgentDashboard from './pages/dashboards/AgentDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';

// ============================================================
// MERCHANT PAGES
// ============================================================
import Merchants from './pages/merchants/Merchants';
import AddMerchant from './pages/merchants/AddMerchant';
import MerchantDetails from './pages/merchants/MerchantDetails';
import MerchantsConfig from './pages/merchants/MerchantsConfig'; 
import AddMerchantConfig from './pages/merchants/AddMerchantConfig';
import MerchantConfigDetails from './pages/merchants/MerchantConfigDetails';

// ============================================================
// AGENT PAGES
// ============================================================
import Agents from './pages/agents/Agents';
import AddAgent from './pages/agents/AddAgent';
import AgentDetails from './pages/agents/AgentDetails';

// ============================================================
// BRANCH PAGES
// ============================================================
import Branches from './pages/branches/Branches';
import AddBranch from './pages/branches/AddBranch';
import BranchDetails from './pages/branches/BranchDetails';

// ============================================================
// PAYMENT PAGES
// ============================================================
import TransactionHistory from './pages/transactions/TransactionHistory';
// import CreatePayment from './pages/payments/CreatePayment'; // COMMENTED - File doesn't exist
// import PaymentDetails from './pages/payments/PaymentDetails'; // COMMENTED - File doesn't exist

// ============================================================
// SETTLEMENT PAGES
// ============================================================
import Settlements from './pages/settlements/Settlements';
import SettlementDetails from './pages/settlements/SettlementDetails';

// ============================================================
// REFUND PAGES
// ============================================================
import Refunds from './pages/refunds/Refunds';
// import CreateRefund from './pages/refunds/CreateRefund'; // COMMENTED - File doesn't exist

// ============================================================
// REPORTS & COMMISSION
// ============================================================
import Reports from './pages/reports/Reports';
import Commission from './pages/commissions/Commission';

// ============================================================
// AUTH PAGES
// ============================================================
import Login from './pages/auth/Login';
import Logout from './pages/auth/Logout';

// ============================================================
// NOTIFICATIONS
// ============================================================
// import Notifications from './pages/notifications/Notifications'; // COMMENTED - File doesn't exist

// ============================================================
// SETTINGS
// ============================================================
// import Settings from './pages/settings/Settings'; // COMMENTED - File doesn't exist

// ============================================================
// PROFILE
// ============================================================
// import Profile from './pages/profile/Profile'; // COMMENTED - File doesn't exist

// ============================================================
// CUSTOMER PAGES
// ============================================================
// import Customers from './pages/customers/Customers'; // COMMENTED - File doesn't exist
// import AddCustomer from './pages/customers/AddCustomer'; // COMMENTED - File doesn't exist

// ============================================================
// ROLE HELPER
// ============================================================
const getRole = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('role') || 'softwareadmin';
};

// ============================================================
// MAIN APP
// ============================================================
function App() {
  const [loading, setLoading] = useState(true);
  const role = getRole();

  const dashboardMap = {
    softwareadmin: <SoftwareAdminDashboard />,
    merchant: <MerchantDashboard />,
    branchadmin: <BranchDashboard />,
    agent: <AgentDashboard />,
    customer: <CustomerDashboard />,
  };

  useEffect(() => {
    // Simulate initial loading - replace with actual initialization
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading animation while app is initializing
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
          <Route path="/dashboard" element={dashboardMap[role] || <SoftwareAdminDashboard />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* ============================================================
              MERCHANT ROUTES
              ============================================================ */}
          <Route path="/merchants" element={<Merchants />} />
          <Route path="/merchants/add" element={<AddMerchant />} />
          <Route path="/merchants/edit/:id" element={<AddMerchant />} />
          <Route path="/merchants/merchantconfig" element={<MerchantsConfig />} />
          <Route path="/merchants/merchantconfig/add" element={<AddMerchantConfig />} />

          <Route path="/merchants" element={<Merchants />} />
          <Route path="/merchants/:id" element={<MerchantDetails />} />
          <Route path="/merchants/merchantconfigdetails/:id" element={<MerchantConfigDetails />} />
          <Route path="/merchants/merchantconfig/edit/:id" element={<AddMerchantConfig />} />

          {/* ============================================================
              AGENT ROUTES
              ============================================================ */}
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/add" element={<AddAgent />} />
          <Route path="/agents/edit/:id" element={<AddAgent />} />
          <Route path="/agents/:id" element={<AgentDetails />} />

          {/* ============================================================
              BRANCH ROUTES
              ============================================================ */}
          <Route path="/branches" element={<Branches />} />
          <Route path="/branches/add" element={<AddBranch />} />
          <Route path="/branches/edit/:id" element={<AddBranch />} />
          <Route path="/branches/:id" element={<BranchDetails />} />

          {/* ============================================================
              PAYMENT ROUTES
              ============================================================ */}
          <Route path="/payments" element={<TransactionHistory />} />
          {/* <Route path="/payments/create" element={<CreatePayment />} /> */} {/* COMMENTED - Component not available */}
          {/* <Route path="/payments/:id" element={<PaymentDetails />} /> */} {/* COMMENTED - Component not available */}
          <Route path="/transactions" element={<TransactionHistory />} />
          {/* <Route path="/transactions/:id" element={<PaymentDetails />} /> */} {/* COMMENTED - Component not available */}

          {/* ============================================================
              SETTLEMENT ROUTES
              ============================================================ */}
          <Route path="/settlements" element={<Settlements />} />
          <Route path="/settlements/:id" element={<SettlementDetails />} />

          {/* ============================================================
              REFUND ROUTES
              ============================================================ */}
          <Route path="/refunds" element={<Refunds />} />
          {/* <Route path="/refunds/create" element={<CreateRefund />} /> */} {/* COMMENTED - Component not available */}
          {/* <Route path="/refunds/create/:transactionId" element={<CreateRefund />} /> */} {/* COMMENTED - Component not available */}

          {/* ============================================================
              REPORTS & COMMISSION ROUTES
              ============================================================ */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:type" element={<Reports />} />
          <Route path="/commission" element={<Commission />} />

          {/* ============================================================
              CUSTOMER ROUTES - COMMENTED OUT
              ============================================================ */}
          {/* <Route path="/customers" element={<Customers />} /> */}
          {/* <Route path="/customers/add" element={<AddCustomer />} /> */}
          {/* <Route path="/customers/edit/:id" element={<AddCustomer />} /> */}
          {/* <Route path="/customers/due" element={<Customers />} /> */}

          {/* ============================================================
              OTHER ROUTES - COMMENTED OUT
              ============================================================ */}
          {/* <Route path="/notifications" element={<Notifications />} /> */}
          {/* <Route path="/settings" element={<Settings />} /> */}
          {/* <Route path="/profile" element={<Profile />} /> */}

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
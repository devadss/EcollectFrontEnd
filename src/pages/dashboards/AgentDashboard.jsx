import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import './AgentDashboard.css';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const stats = [
    { label: 'Total Customers', value: '45', icon: '👥', color: 'gold' },
    { label: 'Payments Done', value: '89', icon: '💳', color: 'blue' },
    { label: 'Commission Earned', value: '₹45K', icon: '💰', color: 'green' },
    { label: 'Due Payments', value: '12', icon: '📋', color: 'purple' },
  ];

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();
  const rawInteg = localStorage.getItem('integrationStatus') || user?.integrationStatus || user?.IntegrationStatus || 'No';
  const isIntegratedMode = String(rawInteg).toUpperCase() === 'Y' || String(rawInteg).toUpperCase() === 'YES' || rawInteg === true;
  const isNonIntegrated = !isIntegratedMode;

  return (
    <DashboardLayout role="agent">
      <div className="dashboard-content agent-dashboard">
        <h1 className="dashboard-title">
          <span>Agent</span> Dashboard
        </h1>
        <p className="dashboard-subtitle">Manage your customers and payments</p>

        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className={`stat-card ${stat.color}`}>
              <div className="stat-card-icon">{stat.icon}</div>
              <div className="stat-card-info">
                <div className="stat-card-label">{stat.label}</div>
                <div className="stat-card-value">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="quick-actions">
          <button type="button" className="quick-action" onClick={() => navigate('/transactions')}>
            <span>💳</span> New Payment
          </button>
          <button type="button" className="quick-action" onClick={() => navigate('/accounts')}>
            <span>👤</span> Add Customer
          </button>
          <button type="button" className="quick-action" onClick={() => navigate('/transactions')}>
            <span>🔗</span> Generate Link
          </button>
          {isNonIntegrated && (
            <button type="button" className="quick-action" onClick={() => navigate('/due-list')}>
              <span>📋</span> Due List
            </button>
          )}
        </div>

        <div className="customer-list">
          <h4>Recent <span>Customers</span></h4>
          <div className="customer-grid">
            {['Amit Sharma', 'Priya Patel', 'Raj Kumar', 'Sneha Reddy'].map((name, i) => (
              <div key={i} className="customer-card">
                <div className="customer-avatar">{name[0]}</div>
                <div className="customer-info">
                  <div className="customer-name">{name}</div>
                  <div className="customer-status">
                    <span className={`status-dot ${i % 2 === 0 ? 'paid' : 'due'}`}></span>
                    {i % 2 === 0 ? 'Paid' : 'Due'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AgentDashboard;
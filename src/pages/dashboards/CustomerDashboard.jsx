import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const stats = [
    { label: 'Total Payments', value: '23', icon: '💳', color: 'gold' },
    { label: 'Total Spent', value: '₹12,450', icon: '💰', color: 'blue' },
    { label: 'Pending Invoices', value: '3', icon: '📄', color: 'green' },
    { label: 'Due Amount', value: '₹2,500', icon: '📋', color: 'purple' },
  ];

  return (
    <DashboardLayout role="customer">
      <div className="dashboard-content customer-dashboard">
        <h1 className="dashboard-title">
          <span>Customer</span> Dashboard
        </h1>
        <p className="dashboard-subtitle">Manage your payments and invoices</p>

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
            <span>💳</span> Make Payment
          </button>
          <button type="button" className="quick-action" onClick={() => navigate('/transactions')}>
            <span>📋</span> Payment History
          </button>
          <button type="button" className="quick-action" onClick={() => navigate('/settlements')}>
            <span>📄</span> Invoices
          </button>
          <button type="button" className="quick-action" onClick={() => navigate('/settings')}>
            <span>👤</span> Profile
          </button>
        </div>

        <div className="payment-summary">
          <div className="summary-item">
            <span className="summary-label">Total Paid</span>
            <span className="summary-value">₹9,950</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Due</span>
            <span className="summary-value" style={{ color: '#ff6b6b' }}>₹2,500</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Next Payment Due</span>
            <span className="summary-value">Jan 31, 2024</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
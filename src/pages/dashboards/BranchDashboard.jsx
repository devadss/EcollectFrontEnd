import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import './BranchDashboard.css';

const BranchDashboard = () => {
  const stats = [
    { label: 'Branch Merchants', value: '89', icon: '🏪', color: 'gold' },
    { label: 'Branch Agents', value: '34', icon: '👤', color: 'blue' },
    { label: 'Branch Revenue', value: '₹18.2L', icon: '💰', color: 'green' },
    { label: 'Transactions', value: '567', icon: '💳', color: 'purple' },
  ];

  return (
    <DashboardLayout role="branchadmin">
      <div className="dashboard-content branch-dashboard">
        <h1 className="dashboard-title">
          <span>Branch Admin</span> Dashboard
        </h1>
        <p className="dashboard-subtitle">Manage your branch operations</p>

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

        <div className="branch-info">
          <div className="branch-detail">
            <span>🏢</span> Mumbai Central Branch
          </div>
          <div className="branch-detail">
            <span>📍</span> Mumbai, Maharashtra
          </div>
          <div className="branch-detail">
            <span>👤</span> Manager: Rajesh Kumar
          </div>
        </div>

        <div className="quick-actions">
          <a href="#" className="quick-action">
            <span>➕</span> Register Merchant
          </a>
          <a href="#" className="quick-action">
            <span>👤</span> Create Agent
          </a>
          <a href="#" className="quick-action">
            <span>💳</span> New Payment
          </a>
          <a href="#" className="quick-action">
            <span>📊</span> Branch Reports
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BranchDashboard;
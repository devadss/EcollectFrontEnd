import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import './MerchantDashboard.css';

const MerchantDashboard = () => {
  const stats = [
    { label: 'Total Transactions', value: '234', icon: '💳', color: 'gold' },
    { label: 'Revenue', value: '₹12.3L', icon: '💰', color: 'blue' },
    { label: 'Settlements', value: '₹8.7L', icon: '🏦', color: 'green' },
    { label: 'Active Agents', value: '12', icon: '👤', color: 'purple' },
  ];

  return (
    <DashboardLayout role="merchant">
      <div className="dashboard-content merchant-dashboard">
        <h1 className="dashboard-title">
          <span>Merchant</span> Dashboard
        </h1>
        <p className="dashboard-subtitle">Manage your payments and settlements</p>

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
          <a href="#" className="quick-action">
            <span>💳</span> New Payment
          </a>
          <a href="#" className="quick-action">
            <span>🔗</span> Generate Link
          </a>
          <a href="#" className="quick-action">
            <span>📋</span> History
          </a>
          <a href="#" className="quick-action">
            <span>📊</span> Reports
          </a>
        </div>

        <div className="chart-card">
          <h4>Revenue <span>Trend</span></h4>
          <div className="chart-placeholder">
            <canvas id="merchantRevenueChart" height="200"></canvas>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MerchantDashboard;
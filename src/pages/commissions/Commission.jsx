import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import { commissionApi } from '../../services/api';  
import './Commission.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Commission = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState({
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0,
    thisMonth: 0,
  });
  const [filter, setFilter] = useState({ search: '', status: '', dateFrom: '', dateTo: '' });

  // Accent color
  const accent = '#6366f1';
  const accentLight = '#818cf8';
  const accentDark = '#4f46e5';

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const res = await commissionApi.getAll();
      const data = res.data || [];
      setCommissions(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    setStats({
      totalCommission: data.reduce((sum, c) => sum + (c.amount || 0), 0),
      pendingCommission: data.filter(c => c.status === 'Pending').reduce((sum, c) => sum + (c.amount || 0), 0),
      paidCommission: data.filter(c => c.status === 'Paid').reduce((sum, c) => sum + (c.amount || 0), 0),
      thisMonth: data.filter(c => {
        const d = new Date(c.date);
        return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
      }).reduce((sum, c) => sum + (c.amount || 0), 0),
    });
  };

  // Commission Chart - Single Color Theme
  const commissionData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Commission (₹)',
      data: [12000, 15000, 10000, 18000, 14000, 22000, 16000, 25000, 19000, 28000, 22000, 32000],
      backgroundColor: [
        accent + 'CC', accent + '88', accent + 'CC', accent + '88',
        accent + 'CC', accent + '88', accent + 'CC', accent + '88',
        accent + 'CC', accent + '88', accent + 'CC', accent + 'E6'
      ],
      borderColor: accent,
      borderWidth: 2,
      borderRadius: 8,
      barPercentage: 0.6,
      hoverBackgroundColor: accent,
    }]
  };

  const commissionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1a1a2e',
        bodyColor: '#666666',
        cornerRadius: 12,
        padding: 14,
        borderColor: accent + '30',
        borderWidth: 1,
        callbacks: {
          label: (context) => `₹ ${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#94a3b8',
          font: { size: 11, weight: '500' },
          callback: (value) => value >= 1000 ? `₹${value/1000}k` : `₹${value}`
        },
        grid: { color: 'rgba(148, 163, 184, 0.12)' }
      },
      x: {
        ticks: { color: '#94a3b8', font: { size: 11, weight: '500' } },
        grid: { display: false }
      }
    }
  };

  // Status Distribution - Single Color Theme
  const statusData = {
    labels: ['Paid', 'Pending', 'Processing'],
    datasets: [{
      data: [55, 30, 15],
      backgroundColor: [
        accent,
        accent + 'CC',
        accent + '77'
      ],
      borderColor: '#ffffff',
      borderWidth: 4,
      hoverOffset: 15,
    }]
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#64748b',
          padding: 18,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1a1a2e',
        bodyColor: '#666666',
        cornerRadius: 12,
        padding: 14,
        borderColor: accent + '30',
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}%`
        }
      }
    }
  };

  const filteredCommissions = commissions.filter(c => {
    const matchesSearch = 
      c.agent?.toLowerCase().includes(filter.search.toLowerCase()) ||
      c.merchant?.toLowerCase().includes(filter.search.toLowerCase());
    const matchesStatus = filter.status ? c.status === filter.status : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout role="softwareadmin">
      <div className="commission-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="header-badge">
              <span className="header-badge-icon">✦</span>
              <span>Commission Management</span>
            </div>
            <h1 className="page-title">
              <span className="gradient-text">Commissions</span>
            </h1>
            <p className="page-subtitle">Track and manage agent commissions</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => navigate('/commissions/export')}>
              <span className="btn-icon">📥</span> Export
            </button>
            <button className="btn-primary" onClick={() => navigate('/commissions/create')}>
              <span className="btn-icon">➕</span> New Commission
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-glow"></div>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Total Commission</div>
                <div className="stat-value">₹{stats.totalCommission.toLocaleString()}</div>
                <div className="stat-change up">↑ 15% this month</div>
              </div>
              <div className="stat-icon">💰</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-glow"></div>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Paid Commission</div>
                <div className="stat-value">₹{stats.paidCommission.toLocaleString()}</div>
                <div className="stat-change up">↑ 8% this month</div>
              </div>
              <div className="stat-icon">✅</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-glow"></div>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Pending Commission</div>
                <div className="stat-value">₹{stats.pendingCommission.toLocaleString()}</div>
                <div className="stat-change down">↓ 5% this month</div>
              </div>
              <div className="stat-icon">⏳</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-glow"></div>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">This Month</div>
                <div className="stat-value">₹{stats.thisMonth.toLocaleString()}</div>
                <div className="stat-change up">↑ 22% from last month</div>
              </div>
              <div className="stat-icon">📊</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">
                  <span className="gradient-text">Commission</span> Overview
                </div>
                <div className="chart-subtitle">Monthly commission trend</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Bar data={commissionData} options={commissionOptions} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">
                  <span className="gradient-text">Status</span> Distribution
                </div>
                <div className="chart-subtitle">Commission status breakdown</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Doughnut data={statusData} options={statusOptions} />
            </div>
          </div>
        </div>

        {/* Filter & Table */}
        <div className="table-section">
          <div className="filter-bar">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search commissions..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="search-input"
              />
            </div>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
            </select>
            <div className="date-input-wrapper">
              <span className="date-icon">📅</span>
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                className="date-input"
                placeholder="From"
              />
            </div>
            <div className="date-input-wrapper">
              <span className="date-icon">📅</span>
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                className="date-input"
                placeholder="To"
              />
            </div>
          </div>

          <div className="table-card">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>Loading commissions...</span>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Commission ID</th>
                      <th>Agent</th>
                      <th>Merchant</th>
                      <th>Amount</th>
                      <th>Rate</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommissions.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="empty-row">
                          <span className="empty-icon">📭</span>
                          No commissions found
                        </td>
                      </tr>
                    ) : (
                      filteredCommissions.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <span className="tx-id">#{c.id}</span>
                          </td>
                          <td>{c.agent}</td>
                          <td>{c.merchant}</td>
                          <td>
                            <span className="tx-amount">₹{c.amount?.toLocaleString()}</span>
                          </td>
                          <td>{c.rate || 2.5}%</td>
                          <td>
                            <div className="tx-date">{new Date(c.date).toLocaleDateString()}</div>
                          </td>
                          <td>
                            <span className={`status-badge ${c.status?.toLowerCase()}`}>
                              <span className="status-dot"></span>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-group">
                              <button 
                                className="action-btn view" 
                                onClick={() => navigate(`/commissions/${c.id}`)}
                                title="View Details"
                              >
                                👁️
                              </button>
                              {c.status === 'Pending' && (
                                <button 
                                  className="action-btn pay" 
                                  onClick={() => navigate(`/commissions/pay/${c.id}`)}
                                  title="Pay Commission"
                                >
                                  💳
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Commission;
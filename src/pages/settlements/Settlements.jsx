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
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { settlementApi } from '../../services/api';
import './Settlements.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Settlements = () => {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSettled: 0,
    pendingSettlements: 0,
    totalAmount: 0,
    thisMonth: 0,
  });
  const [filter, setFilter] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await settlementApi.getAll();
      const data = res?.data?.data || res?.data || [];
      const safeData = Array.isArray(data) ? data : [];
      setSettlements(safeData);
      calculateStats(safeData);
    } catch (error) {
      console.error('Error loading settlements:', error);
      setError(error?.response?.data?.message || error.message || 'Failed to load settlements');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 450);
    }
  };

  const calculateStats = (data) => {
    const total = data.reduce((sum, s) => sum + (s.amount || 0), 0);
    const pending = data.filter(s => s.status === 'Pending').length;
    const month = data.filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      return d.getMonth() === new Date().getMonth();
    }).reduce((sum, s) => sum + (s.amount || 0), 0);

    setStats({
      totalSettled: data.filter(s => s.status === 'Completed' || s.status === 'Success').length,
      pendingSettlements: pending,
      totalAmount: total,
      thisMonth: month,
    });
  };

  // Settlement Bar Chart Data (Ultra-Premium Electric Palette)
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Settlement Amount (₹)',
      data: [45000, 52000, 38000, 65000, 48000, 72000, 56000, 83000, 61000, 78000, 92000, 105000],
      backgroundColor: [
        'rgba(6, 182, 212, 0.85)',
        'rgba(99, 102, 241, 0.85)',
        'rgba(6, 182, 212, 0.85)',
        'rgba(99, 102, 241, 0.85)',
        'rgba(6, 182, 212, 0.85)',
        'rgba(99, 102, 241, 0.85)',
        'rgba(6, 182, 212, 0.85)',
        'rgba(99, 102, 241, 0.85)',
        'rgba(6, 182, 212, 0.85)',
        'rgba(99, 102, 241, 0.85)',
        'rgba(6, 182, 212, 0.85)',
        'rgba(6, 182, 212, 0.95)'
      ],
      borderColor: '#06b6d4',
      borderWidth: 2,
      borderRadius: 8,
      barPercentage: 0.55,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        cornerRadius: 12,
        padding: 12,
        borderColor: 'rgba(6, 182, 212, 0.3)',
        borderWidth: 1,
        callbacks: {
          label: (context) => ` Settlement: ₹ ${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: '600' },
          callback: (value) => value >= 1000 ? `₹${value/1000}k` : `₹${value}`
        },
        grid: { color: 'rgba(255, 255, 255, 0.06)' }
      },
      x: {
        ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
        grid: { display: false }
      }
    }
  };

  // Status Doughnut Distribution
  const statusData = {
    labels: ['Completed', 'Pending', 'Processing', 'Failed'],
    datasets: [{
      data: [45, 25, 20, 10],
      backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
      borderColor: '#111827',
      borderWidth: 4,
    }]
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '600' }
        }
      }
    }
  };

  const filteredSettlements = settlements.filter(s => {
    const matchesSearch = 
      (s.merchant || '').toLowerCase().includes(filter.search.toLowerCase()) ||
      (s.id || '').toLowerCase().includes(filter.search.toLowerCase());
    const matchesStatus = filter.status ? s.status === filter.status : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'success') return 'completed';
    if (s === 'pending') return 'pending';
    if (s === 'processing') return 'processing';
    if (s === 'failed') return 'failed';
    return '';
  };

  return (
    <>
      {/* Loading overlay */}
      {loading && <LoadingAnimation message="Loading Merchant Settlements..." />}
      
      <DashboardLayout role="softwareadmin" pageTitle="Settlements Telemetry">
        <div className={`settlements-page ${loading ? 'content-blurred' : ''}`}>
          
          {/* Header */}
          <div className="page-header">
            <div>
              <div className="header-badge">
                <span className="pulse-dot"></span> Payout Reconciliation Engine
              </div>
              <h1 className="page-title">
                Merchant <span className="gradient-text">Settlements</span>
              </h1>
              <p className="page-subtitle">Track, audit, and disburse merchant bank account settlements</p>
            </div>

            <button className="btn-primary-gradient" onClick={() => navigate('/settlements/export')}>
              <span>📥 Export Settlement Report</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadSettlements} className="retry-btn">Retry Load</button>
            </div>
          )}

          {/* KPI Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <div className="stat-label">Total Settled</div>
                  <div className="stat-value text-green">{stats.totalSettled}</div>
                  <div className="stat-change up">↑ 12% this month</div>
                </div>
                <div className="stat-icon-box green">✅</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <div className="stat-label">Pending Payouts</div>
                  <div className="stat-value text-amber">{stats.pendingSettlements}</div>
                  <div className="stat-change down">↓ 5% this month</div>
                </div>
                <div className="stat-icon-box amber">⏳</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <div className="stat-label">Total Disbursed Volume</div>
                  <div className="stat-value text-cyan">₹{stats.totalAmount.toLocaleString()}</div>
                  <div className="stat-change up">↑ 18% this month</div>
                </div>
                <div className="stat-icon-box cyan">💰</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <div className="stat-label">Current Month Payout</div>
                  <div className="stat-value text-purple">₹{stats.thisMonth.toLocaleString()}</div>
                  <div className="stat-change up">↑ 8% from last month</div>
                </div>
                <div className="stat-icon-box purple">📊</div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Settlement <span className="gradient-text">Overview</span></div>
                  <div className="chart-subtitle">Monthly payout volume trends</div>
                </div>
              </div>
              <div className="chart-wrapper">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Status <span className="gradient-text">Distribution</span></div>
                  <div className="chart-subtitle">Settlement status breakdown</div>
                </div>
              </div>
              <div className="chart-wrapper">
                <Doughnut data={statusData} options={statusOptions} />
              </div>
            </div>
          </div>

          {/* Filter & Table Section */}
          <div className="table-section">
            
            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="search-input-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search settlement ID or merchant name..."
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
                <option value="">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Failed">Failed</option>
              </select>

              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                className="date-input"
                title="From Date"
              />
              
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                className="date-input"
                title="To Date"
              />
            </div>

            {/* Table Card */}
            <div className="table-card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Settlement ID</th>
                      <th>Merchant</th>
                      <th>Amount Disbursed</th>
                      <th>Date</th>
                      <th>Bank Ref #</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSettlements.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-row">
                          <span className="empty-icon">🏦</span>
                          <p>No settlement records found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredSettlements.map((s) => (
                        <tr key={s.id} className="table-row-hover">
                          <td>
                            <span className="settlement-id-badge">#{s.id}</span>
                          </td>
                          <td className="merchant-name">{s.merchant || 'N/A'}</td>
                          <td>
                            <span className="amount-text">₹{s.amount?.toLocaleString()}</span>
                          </td>
                          <td className="date-text">
                            {s.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td>
                            <span className="bank-ref-text">{s.bankRef || 'UTIB0009817'}</span>
                          </td>
                          <td>
                            <span className={`status-pill ${getStatusClass(s.status)}`}>
                              <span className="status-pulse-dot"></span>
                              {s.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="action-btn view" 
                              onClick={() => navigate(`/settlements/${s.id}`)}
                              title="View Settlement Details"
                            >
                              👁️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Settlements;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { paymentApi } from '../../services/api';
import './TransactionHistory.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    search: '',
    status: '',
    paymentMode: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await paymentApi.getHistory();
      
      let data = [];
      if (res?.data?.data) {
        data = res.data.data;
      } else if (res?.data) {
        data = res.data;
      } else if (Array.isArray(res)) {
        data = res;
      }
      
      setTransactions(data || []);
      
      if (!data || data.length === 0) {
        setError('No transactions found');
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError(error.message || 'Failed to load transactions. Please try again.');
      setTransactions([]);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 450);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      (t.id || '').toLowerCase().includes(filter.search.toLowerCase()) ||
      (t.merchant || '').toLowerCase().includes(filter.search.toLowerCase()) ||
      (t.customer || '').toLowerCase().includes(filter.search.toLowerCase());
    const matchesStatus = filter.status ? t.status === filter.status : true;
    const matchesMode = filter.paymentMode ? t.paymentMode === filter.paymentMode : true;
    return matchesSearch && matchesStatus && matchesMode;
  });

  const getStatusClass = (status) => {
    const map = { 
      'Success': 'success', 
      'Failed': 'failed', 
      'Pending': 'pending', 
      'Refunded': 'refunded' 
    };
    return map[status] || '';
  };

  const stats = {
    total: transactions.length,
    successful: transactions.filter(t => t.status === 'Success').length,
    failed: transactions.filter(t => t.status === 'Failed').length,
    totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
  };

  return (
    <>
      {/* Loading overlay */}
      {loading && <LoadingAnimation message="Loading Settlement Audit Log..." />}
      
      <DashboardLayout role="softwareadmin" pageTitle="Transaction History">
        <div className={`transaction-history ${loading ? 'content-blurred' : ''}`}>
          
          {/* Header */}
          <div className="page-header">
            <div>
              <div className="header-badge">
                <span className="pulse-dot"></span> Live Telemetry Audit
              </div>
              <h1 className="page-title">
                Transaction <span className="gradient-text">History</span>
              </h1>
              <p className="page-subtitle">View, filter, and audit real-time gateway transaction logs</p>
            </div>
            <div className="header-actions">
              <button className="btn-outline-action" onClick={() => navigate('/transactions/export')}>
                📥 Export CSV
              </button>
              <button className="btn-primary-gradient" onClick={() => navigate('/payments/create')}>
                💳 New Payment
              </button>
            </div>
          </div>

          {/* Stats Summary Cards */}
          <div className="stats-summary">
            <div className="stat-item-card">
              <span className="stat-icon">📋</span>
              <div>
                <span className="stat-label">Total Transactions</span>
                <span className="stat-value">{stats.total}</span>
              </div>
            </div>
            
            <div className="stat-item-card">
              <span className="stat-icon success-icon">✅</span>
              <div>
                <span className="stat-label">Successful</span>
                <span className="stat-value success-val">{stats.successful}</span>
              </div>
            </div>
            
            <div className="stat-item-card">
              <span className="stat-icon failed-icon">⚠️</span>
              <div>
                <span className="stat-label">Failed Log</span>
                <span className="stat-value failed-val">{stats.failed}</span>
              </div>
            </div>
            
            <div className="stat-item-card">
              <span className="stat-icon amount-icon">💰</span>
              <div>
                <span className="stat-label">Total Volume</span>
                <span className="stat-value amount-val">₹{stats.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-row">
            
            {/* Line Chart Card */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Transaction <span className="gradient-text">Volume</span></div>
                  <div className="chart-subtitle">7-day processing trajectory</div>
                </div>
              </div>
              <div className="chart-wrapper">
                <Line 
                  data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                      label: 'Transactions',
                      data: [45, 52, 38, 65, 58, 42, 30],
                      borderColor: '#06b6d4',
                      backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(0,0,0,0)';
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
                        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
                        return gradient;
                      },
                      tension: 0.38,
                      fill: true,
                      pointBackgroundColor: '#06b6d4',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 3,
                      pointRadius: 5,
                      borderWidth: 3,
                    }]
                  }} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#111827',
                        titleColor: '#ffffff',
                        bodyColor: '#cbd5e1',
                        cornerRadius: 10,
                        padding: 12,
                        borderColor: 'rgba(6, 182, 212, 0.3)',
                        borderWidth: 1,
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
                        grid: { color: 'rgba(255, 255, 255, 0.06)' }
                      },
                      x: {
                        ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
                        grid: { display: false }
                      }
                    }
                  }} 
                />
              </div>
            </div>

            {/* Doughnut Chart Card */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Payment <span className="gradient-text">Methods</span></div>
                  <div className="chart-subtitle">Channel distribution breakdown</div>
                </div>
              </div>
              <div className="chart-wrapper">
                <Doughnut 
                  data={{
                    labels: ['UPI', 'Credit Card', 'Net Banking', 'Wallet', 'Debit Card'],
                    datasets: [{
                      data: [35, 25, 20, 12, 8],
                      backgroundColor: ['#06b6d4', '#6366f1', '#3b82f6', '#8b5cf6', '#ec4899'],
                      borderColor: '#111827',
                      borderWidth: 4,
                    }]
                  }}
                  options={{
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
                  }}
                />
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadTransactions} className="retry-btn">Retry Load</button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="search-input-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by ID, merchant, customer..."
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
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
            </select>

            <select
              value={filter.paymentMode}
              onChange={(e) => setFilter({ ...filter, paymentMode: e.target.value })}
              className="filter-select"
            >
              <option value="">All Modes</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Wallet">Wallet</option>
              <option value="Debit Card">Debit Card</option>
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

          {/* Transactions Table Card */}
          <div className="table-card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Txn ID</th>
                    <th>Merchant</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        <span className="empty-icon">📋</span>
                        <p>{error ? 'No transactions available' : 'No transactions match your search filters'}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.slice(0, 20).map((t) => (
                      <tr key={t.id} className="table-row-hover">
                        <td>
                          <span className="tx-id-badge">#{t.id}</span>
                        </td>
                        <td className="merchant-name">{t.merchant || 'N/A'}</td>
                        <td className="customer-name">{t.customer || 'N/A'}</td>
                        <td>
                          <span className="amount-val">₹{t.amount?.toLocaleString()}</span>
                        </td>
                        <td>
                          <span className="mode-pill">{t.paymentMode || 'Direct'}</span>
                        </td>
                        <td>
                          <span className={`status-pill ${getStatusClass(t.status)}`}>
                            <span className="status-pulse-dot"></span>
                            {t.status}
                          </span>
                        </td>
                        <td className="date-cell">
                          {t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </td>
                        <td>
                          <button 
                            className="action-btn view" 
                            onClick={() => navigate(`/transactions/${t.id}`)}
                            title="View Transaction Payload"
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
      </DashboardLayout>
    </>
  );
};

export default TransactionHistory;
import React, { useState, useEffect, useMemo } from 'react';
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
import { transactionApi, dashboardApi } from '../../services/api';
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

// SVG Icons
const Icons = {
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Refresh: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  Export: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  Transaction: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Success: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Failed: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Pending: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Amount: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState({
    volume: { labels: [], data: [] },
    paymentMethods: { labels: [], data: [] }
  });
  const [filter, setFilter] = useState({
    search: '',
    status: '',
    paymentMode: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      await loadTransactions();
      await loadChartData();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await transactionApi.getHistory();
      let data = [];
      if (res?.data?.data) {
        data = res.data.data;
      } else if (res?.data) {
        data = res.data;
      } else if (Array.isArray(res)) {
        data = res;
      }
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load transactions');
      throw error;
    }
  };

  const loadChartData = async () => {
    try {
      const volumeRes = await dashboardApi.getTransactionVolume();
      let volumeLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      let volumeData = [45, 52, 38, 65, 58, 72, 48];
      
      if (volumeRes?.data?.labels && volumeRes?.data?.data) {
        volumeLabels = volumeRes.data.labels;
        volumeData = volumeRes.data.data;
      }
      
      const paymentRes = await dashboardApi.getPaymentMethods();
      let paymentLabels = ['UPI', 'Credit Card', 'Net Banking', 'Wallet', 'Debit Card'];
      let paymentData = [35, 25, 20, 12, 8];
      
      if (paymentRes?.data && Array.isArray(paymentRes.data) && paymentRes.data.length > 0) {
        paymentLabels = paymentRes.data.map(d => d.label || d.method || 'Unknown');
        paymentData = paymentRes.data.map(d => d.value || d.count || 0);
      }
      
      setChartData({
        volume: { labels: volumeLabels, data: volumeData },
        paymentMethods: { labels: paymentLabels, data: paymentData }
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = 
        (t.id || '').toLowerCase().includes(filter.search.toLowerCase()) ||
        (t.transactionId || '').toLowerCase().includes(filter.search.toLowerCase()) ||
        (t.merchant || '').toLowerCase().includes(filter.search.toLowerCase()) ||
        (t.merchantName || '').toLowerCase().includes(filter.search.toLowerCase()) ||
        (t.customer || '').toLowerCase().includes(filter.search.toLowerCase());
      
      const matchesStatus = filter.status ? t.status === filter.status : true;
      const matchesMode = filter.paymentMode ? t.paymentMode === filter.paymentMode : true;
      
      let matchesDate = true;
      if (filter.dateFrom) {
        const txDate = new Date(t.date || t.createdAt || t.createdDate || t.createdOn);
        const fromDate = new Date(filter.dateFrom);
        matchesDate = txDate >= fromDate;
      }
      if (filter.dateTo && matchesDate) {
        const txDate = new Date(t.date || t.createdAt || t.createdDate || t.createdOn);
        const toDate = new Date(filter.dateTo);
        matchesDate = txDate <= toDate;
      }
      
      return matchesSearch && matchesStatus && matchesMode && matchesDate;
    });
  }, [transactions, filter]);

  const stats = useMemo(() => {
    const total = filteredTransactions.length;
    const successful = filteredTransactions.filter(t => t.status === 'Success' || t.status === 'Completed' || t.status === 'success' || t.status === 'completed').length;
    const failed = filteredTransactions.filter(t => t.status === 'Failed' || t.status === 'failed').length;
    const pending = filteredTransactions.filter(t => t.status === 'Pending' || t.status === 'pending').length;
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    return { total, successful, failed, pending, totalAmount };
  }, [filteredTransactions]);

  const getStatusClass = (status) => {
    const map = { 
      'Success': 'success', 'success': 'success', 'Completed': 'success', 'completed': 'success',
      'Failed': 'failed', 'failed': 'failed',
      'Pending': 'pending', 'pending': 'pending',
      'Refunded': 'refunded', 'refunded': 'refunded'
    };
    return map[status] || '';
  };

  const getStatusIcon = (status) => {
    const map = {
      'success': <Icons.Success />,
      'failed': <Icons.Failed />,
      'pending': <Icons.Pending />,
      'refunded': <Icons.Success />
    };
    return map[getStatusClass(status)] || null;
  };

  const refreshData = async () => {
    await loadDashboardData();
  };

  const handleExport = () => {
    navigate('/transactions/export');
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Transaction History">
        <LoadingAnimation message="Loading transaction history" type="coin" size="medium" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Transaction History">
      <div className="tx-history-page">
        
        {/* Header */}
        <div className="tx-header">
          <div>
            <div className="tx-badge" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Icons.Sparkles />
              <span>Live Telemetry Audit</span>
            </div>
            <h1 className="tx-title">
              Transaction <span className="tx-gradient">History</span>
            </h1>
            <p className="tx-subtitle">View, filter, and audit real-time gateway transaction logs</p>
          </div>
          <div className="tx-actions">
            <button className="tx-btn-outline" onClick={refreshData}>
              <Icons.Refresh />
              <span>Refresh</span>
            </button>
            <button className="tx-btn-primary" onClick={handleExport}>
              <Icons.Export />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="tx-stats">
          <div className="tx-stat-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="tx-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Icons.Transaction />
            </div>
            <div>
              <span className="tx-stat-label">Total Transactions</span>
              <span className="tx-stat-value">{stats.total}</span>
            </div>
          </div>

          <div className="tx-stat-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="tx-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Icons.Success />
            </div>
            <div>
              <span className="tx-stat-label">Successful</span>
              <span className="tx-stat-value success">{stats.successful}</span>
            </div>
          </div>

          <div className="tx-stat-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="tx-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Icons.Failed />
            </div>
            <div>
              <span className="tx-stat-label">Failed / Pending</span>
              <span className="tx-stat-value failed">{stats.failed + stats.pending}</span>
            </div>
          </div>

          <div className="tx-stat-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="tx-stat-icon" style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' }}>
              <Icons.Amount />
            </div>
            <div>
              <span className="tx-stat-label">Total Volume</span>
              <span className="tx-stat-value amount">₹{stats.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="tx-charts">
          <div className="tx-chart-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="tx-chart-header">
              <div>
                <div className="tx-chart-title">Transaction <span className="tx-gradient">Volume</span></div>
                <div className="tx-chart-subtitle">Weekly processing trajectory</div>
              </div>
            </div>
            <div className="tx-chart-wrapper">
              <Line 
                data={{
                  labels: chartData.volume.labels.length > 0 ? chartData.volume.labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [{
                    label: 'Transactions',
                    data: chartData.volume.data.length > 0 ? chartData.volume.data : [45, 52, 38, 65, 58, 72, 48],
                    borderColor: '#8b5cf6',
                    backgroundColor: (context) => {
                      const chart = context.chart;
                      const { ctx, chartArea } = chart;
                      if (!chartArea) return 'rgba(0,0,0,0)';
                      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
                      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
                      return gradient;
                    },
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#0a0a14',
                    pointBorderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 10,
                    borderWidth: 3,
                  }]
                }} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#1a1a2e',
                      titleColor: '#ffffff',
                      bodyColor: 'rgba(255,255,255,0.7)',
                      cornerRadius: 12,
                      padding: 14,
                      borderColor: 'rgba(139, 92, 246, 0.2)',
                      borderWidth: 1,
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11, weight: '600' } },
                      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
                    },
                    x: {
                      ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11, weight: '600' } },
                      grid: { display: false }
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className="tx-chart-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="tx-chart-header">
              <div>
                <div className="tx-chart-title">Payment <span className="tx-gradient">Methods</span></div>
                <div className="tx-chart-subtitle">Channel distribution breakdown</div>
              </div>
            </div>
            <div className="tx-chart-wrapper">
              <Doughnut 
                data={{
                  labels: chartData.paymentMethods.labels,
                  datasets: [{
                    data: chartData.paymentMethods.data,
                    backgroundColor: ['#8b5cf6', '#06b6d4', '#6366f1', '#10b981', '#f59e0b'],
                    borderColor: '#0a0a14',
                    borderWidth: 4,
                    hoverOffset: 12,
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
                        color: 'rgba(255,255,255,0.5)',
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 12, weight: '600' },
                        boxWidth: 8,
                        boxHeight: 8,
                      }
                    },
                    tooltip: {
                      backgroundColor: '#1a1a2e',
                      titleColor: '#ffffff',
                      bodyColor: 'rgba(255,255,255,0.7)',
                      cornerRadius: 12,
                      padding: 14,
                      borderColor: 'rgba(139, 92, 246, 0.2)',
                      borderWidth: 1,
                      callbacks: {
                        label: (context) => {
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                          return `${context.label}: ${percentage}%`;
                        }
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
          <div className="tx-error">
            <span>⚠️ {error}</span>
            <button onClick={refreshData} className="tx-retry">Retry</button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="tx-filter">
          <div className="tx-search">
            <Icons.Search />
            <input
              type="text"
              placeholder="Search by ID, merchant, customer..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="tx-search-input"
            />
          </div>
          
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="tx-select"
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
            className="tx-select"
          >
            <option value="">All Modes</option>
            <option value="UPI">UPI</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Wallet">Wallet</option>
            <option value="Debit Card">Debit Card</option>
          </select>

          <div className="tx-date-group">
            <Icons.Calendar />
            <input
              type="date"
              value={filter.dateFrom}
              onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
              className="tx-date"
              title="From Date"
            />
          </div>
          
          <div className="tx-date-group">
            <Icons.Calendar />
            <input
              type="date"
              value={filter.dateTo}
              onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
              className="tx-date"
              title="To Date"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="tx-table-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="tx-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Txn ID</th>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Merchant</th>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Customer</th>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Amount</th>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Payment Mode</th>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Status</th>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Timestamp</th>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="tx-empty">
                      <span>📋</span>
                      <p>{error ? error : 'No transactions match your search filters'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.slice(0, 20).map((t) => (
                    <tr key={t.id || t.transactionId} className="tx-row">
                      <td>
                        <span className="tx-id">#{t.transactionId || t.id || 'N/A'}</span>
                      </td>
                      <td className="tx-merchant">{t.merchant || t.merchantName || 'N/A'}</td>
                      <td className="tx-customer">{t.customer || t.customerName || 'N/A'}</td>
                      <td>
                        <span className="tx-amount">₹{t.amount?.toLocaleString() || 0}</span>
                      </td>
                      <td>
                        <span className="tx-mode">{t.paymentMode || t.method || 'Direct'}</span>
                      </td>
                      <td>
                        <span className={`tx-status ${getStatusClass(t.status)}`}>
                          {getStatusIcon(t.status)}
                          {t.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="tx-date-cell">
                        {t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                         t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                         'N/A'}
                      </td>
                      <td>
                        <button 
                          className="tx-view-btn" 
                          onClick={() => navigate(`/transactions/${t.id || t.transactionId}`)}
                          title="View Transaction"
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
  );
};

export default TransactionHistory;
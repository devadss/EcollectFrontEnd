// TransactionHistory.jsx
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
      console.log('API Response:', res);
      
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
      }, 500);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.id?.toLowerCase().includes(filter.search.toLowerCase()) ||
      t.merchant?.toLowerCase().includes(filter.search.toLowerCase()) ||
      t.customer?.toLowerCase().includes(filter.search.toLowerCase());
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
      {/* Loading overlay - shows when loading */}
      {loading && <LoadingAnimation message="Loading Transactions" />}
      
      {/* Main content */}
      <DashboardLayout role="softwareadmin">
        <div className="transaction-history">
          <div className="page-header">
            <div>
              <h1 className="page-title">
                <span className="gradient-text">Transaction History</span>
              </h1>
              <p className="page-subtitle">View and manage all transactions</p>
            </div>
            <div className="header-actions">
              <button className="btn-outline" onClick={() => navigate('/transactions/export')}>
                📥 Export
              </button>
              <button className="btn-primary" onClick={() => navigate('/payments/create')}>
                💳 New Payment
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-label">Total Transactions</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Successful</span>
              <span className="stat-value" style={{ color: '#000000' }}>
                {stats.successful}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Failed</span>
              <span className="stat-value" style={{ color: '#888888' }}>
                {stats.failed}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Amount</span>
              <span className="stat-value">
                ₹{stats.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title"><span className="gradient-text">Transaction</span> Volume</div>
                  <div className="chart-subtitle">Last 7 days</div>
                </div>
              </div>
              <div className="chart-wrapper">
                <Line 
                  data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                      label: 'Transactions',
                      data: [45, 52, 38, 65, 58, 42, 30],
                      borderColor: '#000000',
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#000000',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 6,
                    }]
                  }} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        labels: { color: '#666666', font: { size: 12 } }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { color: '#888888', font: { size: 11 } },
                        grid: { color: 'rgba(0, 0, 0, 0.06)' }
                      },
                      x: {
                        ticks: { color: '#888888', font: { size: 11 } },
                        grid: { display: false }
                      }
                    }
                  }} 
                />
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title"><span className="gradient-text">Payment</span> Methods</div>
                  <div className="chart-subtitle">Distribution</div>
                </div>
              </div>
              <div className="chart-wrapper">
                <Doughnut 
                  data={{
                    labels: ['UPI', 'Credit Card', 'Net Banking', 'Wallet', 'Debit Card'],
                    datasets: [{
                      data: [35, 25, 20, 12, 8],
                      backgroundColor: ['#000000', '#333333', '#555555', '#888888', '#bbbbbb'],
                      borderColor: '#ffffff',
                      borderWidth: 3,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: '#666666',
                          padding: 15,
                          usePointStyle: true,
                          pointStyle: 'circle',
                          font: { size: 11 }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadTransactions} className="retry-btn">Retry</button>
            </div>
          )}

          {/* Filter */}
          <div className="filter-bar">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search transactions..."
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
            />
            <input
              type="date"
              value={filter.dateTo}
              onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
              className="date-input"
            />
          </div>

          {/* Table */}
          <div className="table-card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Merchant</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        {error ? 'No transactions found' : 'No transactions match your filters'}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.slice(0, 20).map((t) => (
                      <tr key={t.id}>
                        <td>#{t.id}</td>
                        <td>{t.merchant}</td>
                        <td>{t.customer}</td>
                        <td>₹{t.amount?.toLocaleString()}</td>
                        <td>{t.paymentMode}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td>{new Date(t.date).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="action-btn view" 
                            onClick={() => navigate(`/transactions/${t.id}`)}
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
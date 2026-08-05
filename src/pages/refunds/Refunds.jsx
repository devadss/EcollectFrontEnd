// Refunds.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { refundApi } from '../../services/api';
import './Refund.css';

const Refunds = () => {
  const navigate = useNavigate();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await refundApi.getAll();
      setRefunds(res.data || []);
    } catch (error) {
      console.error('Error loading refunds:', error);
      setError(error.message || 'Failed to load refunds');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  // Safe navigation helper
  const handleNavigation = (path) => {
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = path;
    }
  };

  // Filter refunds
  const filteredRefunds = refunds.filter(r => {
    const matchesSearch = 
      r.id?.toLowerCase().includes(filter.search.toLowerCase()) ||
      r.transactionId?.toLowerCase().includes(filter.search.toLowerCase());
    const matchesStatus = filter.status ? r.status === filter.status : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusClass = (status) => {
    const map = { 
      'Completed': 'completed', 
      'Pending': 'pending', 
      'Failed': 'failed',
      'Processing': 'processing'
    };
    return map[status] || '';
  };

  // Stats
  const stats = {
    total: refunds.length,
    completed: refunds.filter(r => r.status === 'Completed').length,
    pending: refunds.filter(r => r.status === 'Pending').length,
    totalAmount: refunds.reduce((sum, r) => sum + (r.amount || 0), 0)
  };

  return (
    <>
      {/* Loading overlay with blur - shown when loading */}
      {loading && <LoadingAnimation message="Loading Refunds" />}
      
      {/* Main content */}
      <DashboardLayout role="softwareadmin">
        <div className={`refunds-page ${loading ? 'content-blurred' : ''}`}>
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">
                <span className="gradient-text">Refunds</span>
              </h1>
              <p className="page-subtitle">Manage and track all refund requests</p>
            </div>
            <div className="header-actions">
              <button 
                className="btn-outline" 
                onClick={() => handleNavigation('/refunds/export')}
              >
                📥 Export
              </button>
              <button 
                className="btn-primary" 
                onClick={() => handleNavigation('/refunds/create')}
              >
                ↩️ New Refund
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadRefunds} className="retry-btn">Retry</button>
            </div>
          )}

          {/* Stats Summary */}
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-label">Total Refunds</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completed</span>
              <span className="stat-value" style={{ color: '#000000' }}>
                {stats.completed}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pending</span>
              <span className="stat-value" style={{ color: '#f59e0b' }}>
                {stats.pending}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Amount</span>
              <span className="stat-value">
                ₹{stats.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search refunds by ID or Transaction..."
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
            />
            <input
              type="date"
              value={filter.dateTo}
              onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
              className="date-input"
            />
            <button 
              className="btn-clear"
              onClick={() => setFilter({ search: '', status: '', dateFrom: '', dateTo: '' })}
            >
              Clear Filters
            </button>
          </div>

          {/* Refunds Table */}
          <div className="table-card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Refund ID</th>
                    <th>Transaction ID</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefunds.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-row">No refunds found</td>
                    </tr>
                  ) : (
                    filteredRefunds.slice(0, 20).map((r) => (
                      <tr key={r.id}>
                        <td>#{r.id}</td>
                        <td>
                          <Link to={`/transactions/${r.transactionId}`} className="transaction-link">
                            #{r.transactionId}
                          </Link>
                        </td>
                        <td>₹{r.amount?.toLocaleString()}</td>
                        <td>{r.reason || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>{new Date(r.date).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <Link to={`/refunds/${r.id}`} className="action-btn view">
                              👁️
                            </Link>
                            {r.status === 'Pending' && (
                              <button 
                                className="action-btn process"
                                onClick={() => handleNavigation(`/refunds/${r.id}/process`)}
                              >
                                ⚡
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
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Refunds;
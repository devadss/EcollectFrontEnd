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
      const data = res?.data?.data || res?.data || [];
      setRefunds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading refunds:', error);
      setError(error?.response?.data?.message || error.message || 'Failed to load refunds');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 450);
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
      (r.id || '').toLowerCase().includes(filter.search.toLowerCase()) ||
      (r.transactionId || '').toLowerCase().includes(filter.search.toLowerCase());
    const matchesStatus = filter.status ? r.status === filter.status : true;
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

  // Stats
  const stats = {
    total: refunds.length,
    completed: refunds.filter(r => r.status === 'Completed' || r.status === 'Success').length,
    pending: refunds.filter(r => r.status === 'Pending').length,
    totalAmount: refunds.reduce((sum, r) => sum + (r.amount || 0), 0)
  };

  return (
    <>
      {/* Loading overlay */}
      {loading && <LoadingAnimation message="Loading Refund Disbursal Log..." />}
      
      <DashboardLayout role="softwareadmin" pageTitle="Refunds Telemetry">
        <div className={`refunds-page ${loading ? 'content-blurred' : ''}`}>
          
          {/* Page Header */}
          <div className="page-header">
            <div>
              <div className="header-badge">
                <span className="pulse-dot"></span> Reversal & Disbursal Engine
              </div>
              <h1 className="page-title">
                Merchant <span className="gradient-text">Refunds</span>
              </h1>
              <p className="page-subtitle">Manage, process, and track customer transaction reversals</p>
            </div>
            
            <div className="header-actions">
              <button 
                className="btn-outline-action" 
                onClick={() => handleNavigation('/refunds/export')}
              >
                📥 Export CSV
              </button>
              
              <button 
                className="btn-primary-gradient" 
                onClick={() => handleNavigation('/refunds/create')}
              >
                ↩️ Initiate Refund
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadRefunds} className="retry-btn">Retry Load</button>
            </div>
          )}

          {/* Stats Summary */}
          <div className="stats-summary">
            <div className="stat-item-card">
              <div className="stat-icon-box">↩️</div>
              <div>
                <span className="stat-label">Total Refunds</span>
                <span className="stat-value">{stats.total}</span>
              </div>
            </div>

            <div className="stat-item-card">
              <div className="stat-icon-box green">✅</div>
              <div>
                <span className="stat-label">Completed</span>
                <span className="stat-value text-green">{stats.completed}</span>
              </div>
            </div>

            <div className="stat-item-card">
              <div className="stat-icon-box amber">⏳</div>
              <div>
                <span className="stat-label">Pending Approval</span>
                <span className="stat-value text-amber">{stats.pending}</span>
              </div>
            </div>

            <div className="stat-item-card">
              <div className="stat-icon-box cyan">💰</div>
              <div>
                <span className="stat-label">Reversed Volume</span>
                <span className="stat-value text-cyan">₹{stats.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="search-input-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by Refund ID or Transaction ID..."
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

            <button 
              className="btn-clear-filters"
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
                    <th>Txn Reference</th>
                    <th>Refund Amount</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefunds.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        <span className="empty-icon">↩️</span>
                        <p>{error ? 'No refund logs available' : 'No refund records match your filters'}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRefunds.slice(0, 20).map((r) => (
                      <tr key={r.id} className="table-row-hover">
                        <td>
                          <span className="refund-id-badge">#{r.id}</span>
                        </td>
                        <td>
                          <Link to={`/transactions/${r.transactionId}`} className="transaction-link">
                            #{r.transactionId}
                          </Link>
                        </td>
                        <td>
                          <span className="amount-text">₹{r.amount?.toLocaleString()}</span>
                        </td>
                        <td className="reason-text">{r.reason || 'Customer Request'}</td>
                        <td>
                          <span className={`status-pill ${getStatusClass(r.status)}`}>
                            <span className="status-pulse-dot"></span>
                            {r.status}
                          </span>
                        </td>
                        <td className="date-text">
                          {r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link to={`/refunds/${r.id}`} className="action-btn view" title="View Audit Details">
                              👁️
                            </Link>
                            {r.status === 'Pending' && (
                              <button 
                                className="action-btn process"
                                onClick={() => handleNavigation(`/refunds/${r.id}/process`)}
                                title="Instant Disburse"
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
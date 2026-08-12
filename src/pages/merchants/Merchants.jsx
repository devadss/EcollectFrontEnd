import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { merchantApi } from '../../services/api';
import './Merchants.css';

const Merchants = () => {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await merchantApi.getAll();
      
      const listData = res?.data?.data || res?.data || [];
      setMerchants(Array.isArray(listData) ? listData : []);
    } catch (error) {
      console.error('Error loading merchants:', error);
      setError(error?.response?.data?.message || error.message || 'Failed to load merchants');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 400);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this merchant?')) {
      try {
        await merchantApi.delete(id);
        loadMerchants();
      } catch (error) {
        console.error('Error deleting merchant:', error);
        alert(error?.response?.data?.message || 'Failed to delete merchant. Please try again.');
      }
    }
  };

  // Calculate stats safely
  const totalMerchants = merchants.length;
  const activeMerchants = merchants.filter(m => m.isActive).length;
  const inactiveMerchants = merchants.filter(m => !m.isActive).length;
  const pendingApprovals = merchants.filter(m => !m.isApproved).length;

  const filteredMerchants = merchants.filter(m =>
    (m.merchantName || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.registeredEmail || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.registeredPhone || '').includes(search)
  );

  return (
    <>
      {/* Loading overlay */}
      {loading && <LoadingAnimation message="Loading Merchants Telemetry..." />}
      
      <DashboardLayout role="softwareadmin" pageTitle="Merchants Directory">
        <div className={`merchants-page ${loading ? 'content-blurred' : ''}`}>
          
          {/* Top Header */}
          <div className="page-header">
            <div>
              <div className="header-badge">
                <span className="pulse-dot"></span> Registered Partners
              </div>
              <h1 className="page-title">
                Merchant <span className="gradient-text">Directory</span>
              </h1>
              <p className="page-subtitle">Manage registered business partners, access levels, and gateway status</p>
            </div>
            
            <button className="btn-primary-gradient" onClick={() => navigate('/merchants/add')}>
              <span>➕ Add Merchant</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadMerchants} className="retry-btn">Retry Load</button>
            </div>
          )}

          {/* Stats Cards Row */}
          <div className="stats-cards">
            <div className="stat-card-item">
              <div className="stat-card-icon">🏪</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Total Merchants</span>
                <span className="stat-card-number">{totalMerchants}</span>
              </div>
              <div className="stat-card-trend up">↑ 12%</div>
            </div>

            <div className="stat-card-item">
              <div className="stat-card-icon active-icon">✅</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Active</span>
                <span className="stat-card-number active-num">{activeMerchants}</span>
              </div>
              <div className="stat-card-trend up">↑ 8%</div>
            </div>

            <div className="stat-card-item">
              <div className="stat-card-icon inactive-icon">⏸️</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Inactive</span>
                <span className="stat-card-number inactive-num">{inactiveMerchants}</span>
              </div>
              <div className="stat-card-trend down">↓ 3%</div>
            </div>

            <div className="stat-card-item">
              <div className="stat-card-icon pending-icon">⏳</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Pending Approval</span>
                <span className="stat-card-number pending-num">{pendingApprovals}</span>
              </div>
              <div className="stat-card-trend down">↓ 5%</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              placeholder="Search merchants by business name, email, or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button className="search-clear-btn" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {/* Table Container */}
          <div className="table-card">
            <div className="table-header">
              <div className="table-title">
                <span className="table-title-text">Registered Merchants</span>
                <span className="table-count-badge">{filteredMerchants.length} entries</span>
              </div>
              <button className="btn-outline-print" onClick={() => window.print()}>
                🖨️ Export Audit Report
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Merchant Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMerchants.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        <span className="empty-icon">🏪</span>
                        <p>No merchants matched your criteria</p>
                        <button className="btn-primary-gradient small" onClick={() => navigate('/merchants/add')}>
                          Add New Merchant
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredMerchants.map((m, index) => (
                      <tr key={m.id || index} className="table-row-hover">
                        <td className="row-number">{index + 1}</td>
                        <td>
                          <div className="merchant-cell">
                            <div className="merchant-avatar">
                              {m.merchantName?.charAt(0) || 'M'}
                            </div>
                            <div className="merchant-text-box">
                              <div className="merchant-name-small" title={m.merchantName}>
                                {m.merchantName || 'Unnamed Merchant'}
                              </div>
                              <div className="merchant-id">ID: #{m.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="email-cell">{m.registeredEmail || 'N/A'}</td>
                        <td className="phone-cell">{m.registeredPhone || 'N/A'}</td>
                        <td>
                          <span className="category-badge">{m.businessCategory || 'General'}</span>
                        </td>
                        <td>
                          <div className="status-group">
                            <span className={`status-badge ${m.isActive ? 'active' : 'inactive'}`}>
                              {m.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {!m.isApproved && (
                              <span className="status-badge pending">Pending</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="action-group">
                            <button 
                              className="action-btn view" 
                              onClick={() => navigate(`/merchants/${m.id}`)}
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button 
                              className="action-btn edit" 
                              onClick={() => navigate(`/merchants/edit/${m.id}`)}
                              title="Edit Merchant"
                            >
                              ✏️
                            </button>
                            <button 
                              className="action-btn delete" 
                              onClick={() => handleDelete(m.id)}
                              title="Delete Merchant"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="table-footer">
              <span>Showing {filteredMerchants.length} of {totalMerchants} merchants</span>
              <div className="table-pagination">
                <button className="pagination-btn" disabled>←</button>
                <span className="pagination-current">1</span>
                <button className="pagination-btn">→</button>
              </div>
            </div>
          </div>

        </div>
      </DashboardLayout>
    </>
  );
};

export default Merchants;
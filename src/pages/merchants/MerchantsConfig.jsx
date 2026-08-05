import React, { useState, useEffect } from 'react';
import { useNavigate,useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { merchantApi } from '../../services/api';
import './MerchantsConfig.css';

const MerchantsConfig = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [merchantsConfig, setMerchantsConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMerchants();
  }, [id]);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      setError(null);
        const res = await merchantApi.getAllMerchantConfig();
        //console.log(res.data.data);
        setMerchantsConfig(res.data.data || []);
    } catch (error) {
      console.error('Error loading merchant configuaration:', error);
      setError(error.message || 'Failed to load merchant configuration');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this merchant?')) {
      try {
        await merchantApi.configMerchantDelete(id);
        loadMerchants();
      } catch (error) {
        console.error('Error deleting merchant:', error);
        alert('Failed to delete merchant. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await merchantApi.toggleStatus(id);
      loadMerchants();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  // Calculate stats
  const totalMerchants = merchantsConfig.length;
  const activeMerchants = merchantsConfig.filter(m => m.isActive).length;
  const inactiveMerchants = merchantsConfig.filter(m => !m.isActive).length;
  const pendingApprovals = merchantsConfig.filter(m => !m.isApproved).length;

  const filteredMerchants = merchantsConfig.filter(m =>
    m.apiName?.toLowerCase().includes(search.toLowerCase()) ||
    m.apiCode?.toLowerCase().includes(search.toLowerCase()) ||
    m.httpMethod?.includes(search)
  );

  return (
    <>
      {/* Loading overlay with blur - shown when loading */}
      {loading && <LoadingAnimation message="Loading Merchants Config" />}

      
      
      {/* Main content */}
      <DashboardLayout role="softwareadmin">
        <div className={`merchants-page ${loading ? 'content-blurred' : ''}`}>
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title"><span className="gradient-text">Merchants Config</span></h1>
              <p className="page-subtitle">Manage all registered merchants</p>
            </div>
            <button className="btn-primary" onClick={() => navigate('/merchants/merchantconfig/add')}>
              ➕ Add Merchants Config
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadMerchants} className="retry-btn">Retry</button>
            </div>
          )}

          {/* Stats Cards */}
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
              <div className="stat-card-icon">✅</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Active</span>
                <span className="stat-card-number" style={{ color: '#22c55e' }}>{activeMerchants}</span>
              </div>
              <div className="stat-card-trend up">↑ 8%</div>
            </div>
            {/*<div className="stat-card-item">
              <div className="stat-card-icon">⏸️</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Inactive</span>
                <span className="stat-card-number" style={{ color: '#ef4444' }}>{inactiveMerchants}</span>
              </div>
              <div className="stat-card-trend down">↓ 3%</div>
            </div>*/}
            <div className="stat-card-item">
              <div className="stat-card-icon">⏳</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Pending Approval</span>
                <span className="stat-card-number" style={{ color: '#f59e0b' }}>{pendingApprovals}</span>
              </div>
              <div className="stat-card-trend down">↓ 5%</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-bar">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {/* Table */}
          <div className="table-card">
            <div className="table-header">
              <div className="table-title">
                <span className="gradient-text">All Merchants Config</span>
                <span className="table-count">{filteredMerchants.length} merchants</span>
              </div>
              <button className="btn-outline small" onClick={() => window.print()}>
                🖨️ Export
              </button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Merchant Name</th>
                    <th>Product Type</th>
                    <th>Api Code</th>
                    <th>Api Name</th>
                    <th>Http Method</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMerchants.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        <span className="empty-icon">🏪</span>
                        <p>No merchants configuration found.</p>
                        {/*<button className="btn-primary small" onClick={() => navigate('/merchants/add')}>
                          Add your first merchant
                        </button>*/}
                      </td>
                    </tr>
                  ) : (
                    filteredMerchants.map((m, index) => (
                      <tr key={m.id}>
                        <td className="row-number">{index + 1}</td>
                        <td>
                          <div className="merchant-cell">
                            {/*<div className="merchant-avatar">
                              {m.name?.charAt(0) || 'M'}
                            </div>*/}
                            <div>
                              <div className="merchant-name">{m.merchantName}</div>
                              {/*<div className="merchant-id">ID: #{m.id}</div>*/}
                            </div>
                          </div>
                        </td>
                        <td>{m.productType}</td>
                        <td>{m.apiCode}</td>
                        <td>
                          <span className="category-badge">{m.businessCategory || 'General'}</span>
                        </td>
                        <td>
                         {/* <div className="status-group">
                            <span className={`status-badge ${m.isActive ? 'active' : 'inactive'}`}>
                              {m.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {!m.isApproved && (
                              <span className="status-badge pending">Pending</span>
                            )}
                          </div>*/}
                          {m.httpMethod}
                        </td>
                        <td>
                          <div className="action-group">
                            <button 
                              className="action-btn view" 
                              onClick={() => navigate(`/merchants/merchantconfigdetails/${m.id}`)}
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button 
                              className="action-btn edit" 
                              onClick={() => navigate(`/merchants/merchantconfig/edit/${m.id}`)}
                              title="Edit Merchant"
                            >
                              ✏️
                            </button>
                            {/*<button 
                              className="action-btn toggle" 
                              onClick={() => handleToggleStatus(m.id)}
                              title={m.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {m.isActive ? '⏸️' : '▶️'}
                            </button>*/}
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

export default MerchantsConfig;
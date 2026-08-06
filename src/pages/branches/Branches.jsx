import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { branchApi } from '../../services/api';
import './Branches.css';

const Branches = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await branchApi.getAll();
      setBranches(res.data.data || []);
    } catch (error) {
      console.error('Error loading branches:', error);
      setError(error.message || 'Failed to load branches');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await branchApi.delete(id);
        loadBranches();
      } catch (error) {
        console.error('Error deleting branch:', error);
        alert('Failed to delete branch. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await branchApi.toggleStatus(id);
      loadBranches();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  // Calculate stats
  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.isActive).length;
  const inactiveBranches = branches.filter(b => !b.isActive).length;
  const totalRevenue = branches.reduce((sum, b) => sum + (b.revenue || 0), 0);
  const totalMerchants = branches.reduce((sum, b) => sum + (b.merchantCount || 0), 0);

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = 
      branch.name?.toLowerCase().includes(search.toLowerCase()) ||
      branch.code?.toLowerCase().includes(search.toLowerCase()) ||
      branch.city?.toLowerCase().includes(search.toLowerCase()) ||
      branch.address?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterStatus ? branch.isActive === (filterStatus === 'active') : true;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* Loading overlay with blur - shown when loading */}
      {loading && <LoadingAnimation message="Loading Branches" />}
      
      {/* Main content */}
      <DashboardLayout role="softwareadmin">
        <div className={`branches-page ${loading ? 'content-blurred' : ''}`}>
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title"><span className="gradient-text">Branches</span></h1>
              <p className="page-subtitle">Manage all branch locations</p>
            </div>
            <button className="btn-primary" onClick={() => navigate('/branches/add')}>
              ➕ Add Branch
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadBranches} className="retry-btn">Retry</button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="stats-cards">
            <div className="stat-card-item">
              <div className="stat-card-icon">🏢</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Total Branches</span>
                <span className="stat-card-number">{totalBranches}</span>
              </div>
              <div className="stat-card-trend up">↑ 6%</div>
            </div>
            <div className="stat-card-item">
              <div className="stat-card-icon">✅</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Active</span>
                <span className="stat-card-number" style={{ color: '#22c55e' }}>{activeBranches}</span>
              </div>
              <div className="stat-card-trend up">↑ 4%</div>
            </div>
            <div className="stat-card-item">
              <div className="stat-card-icon">⏸️</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Inactive</span>
                <span className="stat-card-number" style={{ color: '#ef4444' }}>{inactiveBranches}</span>
              </div>
              <div className="stat-card-trend down">↓ 2%</div>
            </div>
            <div className="stat-card-item">
              <div className="stat-card-icon">🏪</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Total Merchants</span>
                <span className="stat-card-number" style={{ color: '#f59e0b' }}>{totalMerchants}</span>
              </div>
              <div className="stat-card-trend up">↑ 10%</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="filter-bar">
            <div className="search-bar">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Search by name, code, city or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
            <div className="filter-group">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="branches-grid">
            {filteredBranches.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🏢</span>
                <h3>No Branches Found</h3>
                <p>Start by adding your first branch</p>
                <button className="btn-primary" onClick={() => navigate('/branches/add')}>
                  ➕ Add Branch
                </button>
              </div>
            ) : (
              filteredBranches.map((branch) => (
                <div key={branch.id} className="branch-card animate-slide-up">
                  <div className="branch-card-header">
                    <div className="branch-icon">{branch.icon || '🏢'}</div>
                    <div className="branch-info">
                      <h3 className="branch-name">{branch.name}</h3>
                      <span className="branch-code">{branch.code || 'BR-' + branch.id}</span>
                    </div>
                    <span className={`branch-status ${branch.isActive ? 'active' : 'inactive'}`}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="branch-details">
                    <div className="branch-detail">
                      <span className="detail-icon">📍</span>
                      <span>{branch.address || 'No address'}</span>
                    </div>
                    <div className="branch-detail">
                      <span className="detail-icon">🏙️</span>
                      <span>{branch.city || 'N/A'}, {branch.state || 'N/A'}</span>
                    </div>
                    <div className="branch-detail">
                      <span className="detail-icon">📞</span>
                      <span>{branch.phone || 'N/A'}</span>
                    </div>
                    <div className="branch-detail">
                      <span className="detail-icon">📧</span>
                      <span>{branch.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="branch-stats-mini">
                    {/*<div className="stat-mini">
                      <span className="stat-mini-value">{branch.merchantCount || 0}</span>
                      <span className="stat-mini-label">Merchants</span>
                    </div>*/}
                    <div className="stat-mini">
                      <span className="stat-mini-value">{branch.agentCount || 0}</span>
                      <span className="stat-mini-label">Agents</span>
                    </div>
                    <div className="stat-mini">
                      <span className="stat-mini-value">₹{(branch.revenue || 0).toLocaleString()}</span>
                      <span className="stat-mini-label">Revenue</span>
                    </div>
                  </div>

                  <div className="branch-actions">
                    <button 
                      className="action-btn view" 
                      onClick={() => navigate(`/branches/${branch.id}`)}
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button 
                      className="action-btn edit" 
                      onClick={() => navigate(`/branches/edit/${branch.id}`)}
                      title="Edit Branch"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn toggle" 
                      onClick={() => handleToggleStatus(branch.id)}
                      title={branch.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {branch.isActive ? '⏸️' : '▶️'}
                    </button>
                    <button 
                      className="action-btn delete" 
                      onClick={() => handleDelete(branch.id)}
                      title="Delete Branch"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {filteredBranches.length > 0 && (
            <div className="table-footer">
              <span>Showing {filteredBranches.length} of {totalBranches} branches</span>
              <div className="table-pagination">
                <button className="pagination-btn" disabled>←</button>
                <span className="pagination-current">1</span>
                <button className="pagination-btn">→</button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
};

export default Branches;
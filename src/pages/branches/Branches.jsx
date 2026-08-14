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
      const listData = res?.data?.data || res?.data || [];
      setBranches(Array.isArray(listData) ? listData : []);
    } catch (error) {
      console.error('Error loading branches:', error);
      setError(error?.response?.data?.message || error.message || 'Failed to load branches');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 450);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        const response = await branchApi.delete(id);
        alert(response?.data?.message || 'Branch deleted successfully');
        loadBranches();
      } catch (error) {
        console.error('Error deleting branch:', error);
        alert(error?.response?.data?.message || 'Failed to delete branch. Please try again.');
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

  // Calculate stats safely
  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.isActive).length;
  const inactiveBranches = branches.filter(b => !b.isActive).length;
  const totalRevenue = branches.reduce((sum, b) => sum + (b.revenue || 0), 0);
  const totalMerchants = branches.reduce((sum, b) => sum + (b.merchantCount || 0), 0);

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = 
      (branch.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (branch.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (branch.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (branch.address || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterStatus ? branch.isActive === (filterStatus === 'active') : true;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* Loading overlay */}
      {loading && <LoadingAnimation message="Loading Branch Network..." />}
      
      <DashboardLayout role="softwareadmin" pageTitle="Branch Network">
        <div className={`branches-page ${loading ? 'content-blurred' : ''}`}>
          
          {/* Header */}
          <div className="page-header">
            <div>
              <div className="header-badge">
                <span className="pulse-dot"></span> Regional Infrastructure
              </div>
              <h1 className="page-title">
                Branch <span className="gradient-text">Network</span>
              </h1>
              <p className="page-subtitle">Manage regional office locations, field teams, and localized revenue</p>
            </div>

            <button className="btn-primary-gradient" onClick={() => navigate('/branches/add')}>
              <span>➕ Add Branch Location</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadBranches} className="retry-btn">Retry Load</button>
            </div>
          )}

          {/* Stats Summary Cards */}
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
              <div className="stat-card-icon active-icon">✅</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Active Offices</span>
                <span className="stat-card-number active-num">{activeBranches}</span>
              </div>
              <div className="stat-card-trend up">↑ 4%</div>
            </div>

            <div className="stat-card-item">
              <div className="stat-card-icon inactive-icon">⏸️</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Inactive</span>
                <span className="stat-card-number inactive-num">{inactiveBranches}</span>
              </div>
              <div className="stat-card-trend down">↓ 2%</div>
            </div>

            <div className="stat-card-item">
              <div className="stat-card-icon merchant-icon">🏪</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Assigned Merchants</span>
                <span className="stat-card-number merchant-num">{totalMerchants}</span>
              </div>
              <div className="stat-card-trend up">↑ 10%</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="filter-bar-container">
            <div className="search-input-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by branch name, code, city or street address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              {search && (
                <button className="search-clear-btn" onClick={() => setSearch('')}>✕</button>
              )}
            </div>

            <div className="filter-group">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="">All Branch Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Branch Grid */}
          <div className="branches-grid">
            {filteredBranches.length === 0 ? (
              <div className="empty-state-card">
                <span className="empty-icon">🏢</span>
                <h3>No Branches Found</h3>
                <p>No office locations match your search query</p>
                <button className="btn-primary-gradient small" onClick={() => navigate('/branches/add')}>
                  ➕ Add New Branch
                </button>
              </div>
            ) : (
              filteredBranches.map((branch) => (
                <div key={branch.id} className="branch-card">
                  <div className="branch-card-header">
                    <div className="branch-icon">{branch.icon || '🏢'}</div>
                    <div className="branch-title-info">
                      <h3 className="branch-name">{branch.name || 'Unnamed Branch'}</h3>
                      <span className="branch-code-badge">{branch.code || 'BR-' + branch.id}</span>
                    </div>
                    <span className={`status-pill ${branch.isActive ? 'active' : 'inactive'}`}>
                      <span className="status-pulse-dot"></span>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="branch-details-list">
                    <div className="branch-detail-item">
                      <span className="detail-icon">📍</span>
                      <span className="detail-text">{branch.address || 'No street address provided'}</span>
                    </div>
                    
                    <div className="branch-detail-item">
                      <span className="detail-icon">🏙️</span>
                      <span className="detail-text">{branch.city || 'N/A'}, {branch.state || 'N/A'}</span>
                    </div>
                    
                    <div className="branch-detail-item">
                      <span className="detail-icon">📞</span>
                      <span className="detail-text">{branch.phone || 'N/A'}</span>
                    </div>
                    
                    <div className="branch-detail-item">
                      <span className="detail-icon">📧</span>
                      <span className="detail-text">{branch.email || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Mini Stats Bar */}
                  <div className="branch-stats-mini">
                    <div className="stat-mini-box">
                      <span className="stat-mini-value">{branch.agentCount || 0}</span>
                      <span className="stat-mini-label">Field Agents</span>
                    </div>
                    
                    <div className="stat-mini-box">
                      <span className="stat-mini-value highlight">₹{(branch.revenue || 0).toLocaleString()}</span>
                      <span className="stat-mini-label">Regional Volume</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="branch-card-actions">
                    <button 
                      className="action-btn view" 
                      onClick={() => navigate(`/branches/${branch.id}`)}
                      title="View Branch Details"
                      style={{
                              backgroundColor: "#007bff",
                              color: "white",
                              border: "none",
                              padding: "8px 12px",
                              borderRadius: "5px",
                              cursor: "pointer"
                            }}
                    >
                      👁️ Details
                    </button>
                    <button 
                      className="action-btn edit" 
                      onClick={() => navigate(`/branches/edit/${branch.id}`)}
                      title="Edit Branch"
                    >
                      ✏️ Edit
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

          {/* Footer Bar */}
          {filteredBranches.length > 0 && (
            <div className="table-footer">
              <span>Showing {filteredBranches.length} of {totalBranches} branch locations</span>
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
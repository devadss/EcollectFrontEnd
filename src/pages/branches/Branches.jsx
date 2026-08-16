import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { branchApi } from '../../services/api';
import './Branches.css';

// SVG Icons
const Icons = {
  Building: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="15" y2="6" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="9" y1="18" x2="12" y2="18" />
    </svg>
  ),
  Branch: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Location: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  City: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Email: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Revenue: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

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
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await branchApi.delete(id);
        loadBranches();
      } catch (error) {
        console.error('Error deleting branch:', error);
        alert(error?.response?.data?.message || 'Failed to delete branch');
      }
    }
  };

  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.isActive).length;
  const inactiveBranches = branches.filter(b => !b.isActive).length;
  const totalRevenue = branches.reduce((sum, b) => sum + (b.revenue || 0), 0);
  const totalAgents = branches.reduce((sum, b) => sum + (b.agentCount || 0), 0);

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = 
      (branch.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (branch.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (branch.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (branch.address || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus ? branch.isActive === (filterStatus === 'active') : true;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout pageTitle="Branch Network">
        <LoadingAnimation message="Loading branch network" type="coin" size="medium" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Branch Network">
      <div className="branches-page">
        
        {/* Header */}
        <div className="branches-header">
          <div>
            <div className="branches-badge" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Icons.Sparkles />
              <span>Regional Infrastructure</span>
            </div>
            <h1 className="branches-title">
              Branch <span className="branches-gradient">Network</span>
            </h1>
            <p className="branches-subtitle">Manage regional office locations, field teams, and localized revenue</p>
          </div>
          <button className="branches-add-btn" onClick={() => navigate('/branches/add')}>
            <Icons.Plus />
            <span>Add Branch</span>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="branches-error">
            <span>⚠️ {error}</span>
            <button onClick={loadBranches} className="branches-retry">Retry</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="branches-stats">
          <div className="branches-stat-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="branches-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Icons.Building />
            </div>
            <div>
              <span className="branches-stat-label">Total Branches</span>
              <span className="branches-stat-value">{totalBranches}</span>
            </div>
          </div>

          <div className="branches-stat-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="branches-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Icons.Branch />
            </div>
            <div>
              <span className="branches-stat-label">Active Offices</span>
              <span className="branches-stat-value success">{activeBranches}</span>
            </div>
          </div>

          <div className="branches-stat-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="branches-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Icons.Building />
            </div>
            <div>
              <span className="branches-stat-label">Inactive</span>
              <span className="branches-stat-value failed">{inactiveBranches}</span>
            </div>
          </div>

          <div className="branches-stat-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="branches-stat-icon" style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' }}>
              <Icons.Users />
            </div>
            <div>
              <span className="branches-stat-label">Field Agents</span>
              <span className="branches-stat-value amount">{totalAgents}</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="branches-filter">
          <div className="branches-search">
            <Icons.Search />
            <input
              type="text"
              placeholder="Search by branch name, code, city or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="branches-search-input"
            />
            {search && (
              <button className="branches-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="branches-select"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Branch Grid */}
        <div className="branches-grid">
          {filteredBranches.length === 0 ? (
            <div className="branches-empty">
              <span>🏢</span>
              <h3>No Branches Found</h3>
              <p>No office locations match your search query</p>
              <button className="branches-empty-btn" onClick={() => navigate('/branches/add')}>
                <Icons.Plus />
                Add Branch
              </button>
            </div>
          ) : (
            filteredBranches.map((branch) => (
              <div key={branch.id} className="branches-card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
                <div className="branches-card-top">
                  <div className="branches-card-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                    {branch.icon || '🏢'}
                  </div>
                  <div className="branches-card-info">
                    <h3 className="branches-card-name">{branch.name || 'Unnamed Branch'}</h3>
                    <span className="branches-card-code">{branch.code || 'BR-' + branch.id}</span>
                  </div>
                  <span className={`branches-status ${branch.isActive ? 'active' : 'inactive'}`}>
                    <span className="branches-status-dot"></span>
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="branches-card-details">
                  <div className="branches-detail">
                    <Icons.Location />
                    <span>{branch.address || 'No address provided'}</span>
                  </div>
                  <div className="branches-detail">
                    <Icons.City />
                    <span>{branch.city || 'N/A'}, {branch.state || 'N/A'}</span>
                  </div>
                  <div className="branches-detail">
                    <Icons.Phone />
                    <span>{branch.phone || 'N/A'}</span>
                  </div>
                  <div className="branches-detail">
                    <Icons.Email />
                    <span>{branch.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="branches-card-stats">
                  <div className="branches-stat-mini">
                    <Icons.Users />
                    <span className="branches-stat-mini-value">{branch.agentCount || 0}</span>
                    <span className="branches-stat-mini-label">Agents</span>
                  </div>
                  <div className="branches-stat-mini">
                    <Icons.Revenue />
                    <span className="branches-stat-mini-value highlight">₹{(branch.revenue || 0).toLocaleString()}</span>
                    <span className="branches-stat-mini-label">Revenue</span>
                  </div>
                </div>

                <div className="branches-card-actions">
                  <button className="branches-action view" onClick={() => navigate(`/branches/${branch.id}`)}>
                    <Icons.Eye />
                    <span>View</span>
                  </button>
                  <button className="branches-action edit" onClick={() => navigate(`/branches/edit/${branch.id}`)}>
                    <Icons.Edit />
                    <span>Edit</span>
                  </button>
                  <button className="branches-action delete" onClick={() => handleDelete(branch.id)}>
                    <Icons.Trash />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {filteredBranches.length > 0 && (
          <div className="branches-footer">
            <span>Showing {filteredBranches.length} of {totalBranches} branches</span>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Branches;
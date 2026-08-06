import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import { branchApi } from '../../services/api';  
import './BranchDetails.css';

const BranchDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBranch();
  }, [id]);

  const loadBranch = async () => {
    try {
      const res = await branchApi.getById(id);
      setBranch(res.data);
    } catch (error) {
      console.error('Error loading branch:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="softwareadmin">
        <div className="loading-spinner">Loading branch details...</div>
      </DashboardLayout>
    );
  }

  if (!branch) {
    return (
      <DashboardLayout role="softwareadmin">
        <div className="empty-state">Branch not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="softwareadmin">
      <div className="branch-details-page">
        <div className="page-header">
          <div>
            <h1 className="page-title"><span className="gradient-text">Branch Details</span></h1>
            <p className="page-subtitle">View complete branch information</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => navigate('/branches')}>← Back</button>
            <button className="btn-primary" onClick={() => navigate(`/branches/edit/${id}`)}>✏️ Edit</button>
          </div>
        </div>

        <div className="details-grid">
          <div className="detail-card">
            <div className="detail-header">
              <div className="branch-icon-large">🏢</div>
              <div className="detail-title">
                <h2>{branch.name}</h2>
                <span className="detail-code">{branch.code || 'BR-' + branch.id}</span>
              </div>
              <span className={`branch-status ${branch.isActive ? 'active' : 'inactive'}`}>
                {branch.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="detail-body">
              <div className="detail-row">
                <div className="detail-item full-width">
                  <label>Address</label>
                  <span>{branch.address || 'No address provided'}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>City</label>
                  <span>{branch.city || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>State</label>
                  <span>{branch.state || 'N/A'}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>Zip Code</label>
                  <span>{branch.zipCode || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Country</label>
                  <span>{branch.country || 'India'}</span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <label>Phone</label>
                  <span>{branch.phone || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <span>{branch.email || 'N/A'}</span>
                </div>
              </div>

              {branch.description && (
                <div className="detail-row">
                  <div className="detail-item full-width">
                    <label>Description</label>
                    <span>{branch.description}</span>
                  </div>
                </div>
              )}

              <div className="detail-row">
                <div className="detail-item">
                  <label>Branch Admin Name</label>
                  <span>{branch.branchAdminName || 'N/A'}</span>
                </div>
                {/*<div className="detail-item">
                  <label>Email</label>
                  <span>{branch.email || 'N/A'}</span>
                </div>*/}
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>Created At</label>
                  <span>{branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Last Updated</label>
                  <span>{branch.updatedAt ? new Date(branch.updatedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <h3>Branch Statistics</h3>
            <div className="stats-grid-mini">
              <div className="stat-mini">
                <span className="stat-mini-value">{branch.totalMerchants || 0}</span>
                <span className="stat-mini-label">Merchants</span>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-value">{branch.totalAgents || 0}</span>
                <span className="stat-mini-label">Agents</span>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-value">₹{branch.totalRevenue || 0}</span>
                <span className="stat-mini-label">Revenue</span>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-value">{branch.totalTransactions || 0}</span>
                <span className="stat-mini-label">Transactions</span>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-value">{branch.pendingSettlements || 0}</span>
                <span className="stat-mini-label">Total Pending Settlements</span>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-value">{branch.totalSettlements || 0}</span>
                <span className="stat-mini-label">Total Settlements</span>
              </div>
            </div>

            <div className="quick-links">
              <h4>Quick Actions</h4>
              <button className="quick-link" onClick={() => navigate(`/merchants?branch=${id}`)}>
                📋 View Merchants
              </button>
              <button className="quick-link" onClick={() => navigate(`/agents?branch=${id}`)}>
                👤 View Agents
              </button>
              <button className="quick-link" onClick={() => navigate(`/payments?branch=${id}`)}>
                💳 View Payments
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BranchDetails;
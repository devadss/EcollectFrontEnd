import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { agentApi, merchantApi } from '../../services/api';
import './AgentDetails.css';

const AgentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAgent();
  }, [id]);

  const loadAgent = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await agentApi.getById(id);
      setAgent(res.data);
    } catch (error) {
      console.error('Error loading agent:', error);
      setError(error.message || 'Failed to load agent details');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  // Show loading animation while loading
  if (loading) {
    return <LoadingAnimation message="Loading Agent Details" />;
  }

  if (error) {
    return (
      <DashboardLayout role="softwareadmin">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/agents')}>
            Back to Agents
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout role="softwareadmin">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2>Agent not found</h2>
          <p>The agent you're looking for doesn't exist or has been removed.</p>
          <button className="btn-primary" onClick={() => navigate('/agents')}>
            Back to Agents
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="softwareadmin">
      <div className="agent-details-page">
        <div className="page-header">
          <div>
            <h1 className="page-title"><span className="gradient-text">Agent Details</span></h1>
            <p className="page-subtitle">View complete agent information</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => navigate('/agents')}>← Back</button>
            <button className="btn-primary" onClick={() => navigate(`/agents/edit/${id}`)}>✏️ Edit</button>
          </div>
        </div>

        <div className="details-grid">
          <div className="detail-card">
            <div className="detail-header">
              <div className="detail-avatar">
                {agent.name?.charAt(0) || 'A'}
              </div>
              <div className="detail-title">
                <h2>{agent.name}</h2>
                <span className="detail-code">{agent.agentCode || 'AG-' + agent.id}</span>
              </div>
              <span className={`agent-status ${agent.isActive ? 'active' : 'inactive'}`}>
                {agent.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="detail-body">
              <div className="detail-row">
                <div className="detail-item">
                  <label>Email</label>
                  <span>{agent.email}</span>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <span>{agent.phone}</span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>Merchant</label>
                  <span>{agent.merchantName || 'Unassigned'}</span>
                </div>
                <div className="detail-item">
                  <label>Commission Rate</label>
                  <span>{agent.commissionRate || '0'}%</span>
                </div>
              </div>

              {agent.address && (
                <div className="detail-row">
                  <div className="detail-item full-width">
                    <label>Address</label>
                    <span>
                      {agent.address}
                      {agent.city && `, ${agent.city}`}
                      {agent.state && `, ${agent.state}`}
                      {agent.zipCode && ` - ${agent.zipCode}`}
                    </span>
                  </div>
                </div>
              )}

              {agent.description && (
                <div className="detail-row">
                  <div className="detail-item full-width">
                    <label>Description</label>
                    <span>{agent.description}</span>
                  </div>
                </div>
              )}

              <div className="detail-row">
                <div className="detail-item">
                  <label>Created At</label>
                  <span>{agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Last Updated</label>
                  <span>{agent.updatedAt ? new Date(agent.updatedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <h3>Statistics</h3>
            <div className="stats-grid-mini">
              <div className="stat-mini">
                <span className="stat-mini-value">0</span>
                <span className="stat-mini-label">Payments</span>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-value">₹0</span>
                <span className="stat-mini-label">Commission</span>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-value">0</span>
                <span className="stat-mini-label">Customers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AgentDetails;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { agentApi, merchantApi } from '../../services/api';
import './Agents.css';

const Agents = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMerchant, setFilterMerchant] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [agentsRes, merchantsRes] = await Promise.all([
        agentApi.getAll(),
        merchantApi.getAll()
      ]);
      
      const agentList = agentsRes?.data?.data || agentsRes?.data || [];
      const merchantList = merchantsRes?.data?.data || merchantsRes?.data || [];
      
      setAgents(Array.isArray(agentList) ? agentList : []);
      setMerchants(Array.isArray(merchantList) ? merchantList : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error?.response?.data?.message || error.message || 'Failed to load agents');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 450);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        const response = await agentApi.delete(id);
        alert(response?.data?.message || 'Agent deleted successfully');
        loadData();
      } catch (error) {
        console.error('Error deleting agent:', error);
        alert(error?.response?.data?.message || 'Failed to delete agent. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await agentApi.toggleStatus(id);
      loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  // Calculate stats
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.isActive).length;
  const inactiveAgents = agents.filter(a => !a.isActive).length;
  const totalCommission = agents.reduce((sum, a) => sum + (parseFloat(a.commissionRate) || 0), 0);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      (agent.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (agent.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (agent.agentCode || '').toLowerCase().includes(search.toLowerCase()) ||
      (agent.phone || '').includes(search);
    
    const matchesMerchant = filterMerchant ? agent.merchantId === parseInt(filterMerchant) : true;
    
    return matchesSearch && matchesMerchant;
  });

  // Get merchant name by ID
  const getMerchantName = (merchantId) => {
    const merchant = merchants.find(m => m.id === merchantId);
    return merchant?.merchantName || 'Unassigned';
  };

  return (
    <>
      {/* Loading overlay */}
      {loading && <LoadingAnimation message="Loading Field Agents..." />}
      
      <DashboardLayout role="softwareadmin" pageTitle="Field Agents Directory">
        <div className={`agents-page ${loading ? 'content-blurred' : ''}`}>
          
          {/* Header */}
          <div className="page-header">
            <div>
              <div className="header-badge">
                <span className="pulse-dot"></span> Field Representative Portal
              </div>
              <h1 className="page-title">
                Field <span className="gradient-text">Agents</span>
              </h1>
              <p className="page-subtitle">Manage agent assignments, merchant links, and commission rates</p>
            </div>
            
            <button className="btn-primary-gradient" onClick={() => navigate('/agents/add')}>
              <span>➕ Add Field Agent</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadData} className="retry-btn">Retry Load</button>
            </div>
          )}

          {/* Stats Summary Cards */}
          <div className="stats-cards">
            <div className="stat-card-item">
              <div className="stat-card-icon">👤</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Total Agents</span>
                <span className="stat-card-number">{totalAgents}</span>
              </div>
              <div className="stat-card-trend up">↑ 8%</div>
            </div>

            <div className="stat-card-item">
              <div className="stat-card-icon active-icon">✅</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Active Agents</span>
                <span className="stat-card-number active-num">{activeAgents}</span>
              </div>
              <div className="stat-card-trend up">↑ 5%</div>
            </div>

            <div className="stat-card-item">
              <div className="stat-card-icon inactive-icon">⏸️</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Inactive</span>
                <span className="stat-card-number inactive-num">{inactiveAgents}</span>
              </div>
              <div className="stat-card-trend down">↓ 3%</div>
            </div>

            <div className="stat-card-item">
              <div className="stat-card-icon commission-icon">💰</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Avg Commission Rate</span>
                <span className="stat-card-number commission-num">{totalCommission.toFixed(1)}%</span>
              </div>
              <div className="stat-card-trend up">↑ 12%</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="filter-bar-container">
            <div className="search-input-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search agent name, email, phone or agent code..."
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
                value={filterMerchant} 
                onChange={(e) => setFilterMerchant(e.target.value)}
                className="filter-select"
              >
                <option value="">All Merchant Assignments</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.merchantName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Agents Profile Cards Grid */}
          <div className="agents-grid">
            {filteredAgents.length === 0 ? (
              <div className="empty-state-card">
                <span className="empty-icon">👤</span>
                <h3>No Agents Found</h3>
                <p>No agent records match your current search filters</p>
                <button className="btn-primary-gradient small" onClick={() => navigate('/agents/add')}>
                  ➕ Add New Agent
                </button>
              </div>
            ) : (
              filteredAgents.map((agent) => (
                <div key={agent.id} className="agent-card">
                  <div className="agent-card-header">
                    <div className="agent-avatar">
                      {agent.name?.charAt(0) || 'A'}
                    </div>
                    <div className="agent-title-info">
                      <h3 className="agent-name">{agent.name || 'Unnamed Agent'}</h3>
                      <span className="agent-code-badge">{agent.agentCode || 'AG-' + agent.id}</span>
                    </div>
                    <span className={`status-pill ${agent.isActive ? 'active' : 'inactive'}`}>
                      <span className="status-pulse-dot"></span>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="agent-details-list">
                    <div className="agent-detail-item">
                      <span className="detail-icon">📧</span>
                      <span className="detail-text">{agent.email || 'No email registered'}</span>
                    </div>
                    
                    <div className="agent-detail-item">
                      <span className="detail-icon">📱</span>
                      <span className="detail-text">{agent.phone || 'No phone registered'}</span>
                    </div>
                    
                    <div className="agent-detail-item">
                      <span className="detail-icon">🏪</span>
                      <span className="detail-text merchant-link">{getMerchantName(agent.merchantId)}</span>
                    </div>
                    
                    <div className="agent-detail-item">
                      <span className="detail-icon">💰</span>
                      <span className="detail-text commission-text">Commission: <strong>{agent.commissionRate || '0'}%</strong></span>
                    </div>
                  </div>

                  <div className="agent-card-actions">
                    <button 
                      className="action-btn view" 
                      onClick={() => navigate(`/agents/${agent.id}`)}
                      title="View Agent Profile"
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
                      onClick={() => navigate(`/agents/edit/${agent.id}`)}
                      title="Edit Agent Profile"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className="action-btn delete" 
                      onClick={() => handleDelete(agent.id)}
                      title="Delete Agent"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar */}
          {filteredAgents.length > 0 && (
            <div className="table-footer">
              <span>Showing {filteredAgents.length} of {totalAgents} active agents</span>
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

export default Agents;
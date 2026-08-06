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
      setAgents(agentsRes.data.data || []);
      //console.log(agentsRes.data);

      //debugger;
      setMerchants(merchantsRes.data.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load agents');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        await agentApi.delete(id);
        loadData();
        navigate('/agents');
      } catch (error) {
        console.error('Error deleting agent:', error);
        alert('Failed to delete agent. Please try again.');
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
      agent.name?.toLowerCase().includes(search.toLowerCase()) ||
      agent.email?.toLowerCase().includes(search.toLowerCase()) ||
      agent.agentCode?.toLowerCase().includes(search.toLowerCase()) ||
      agent.phone?.includes(search);
    
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
      {/* Loading overlay with blur - shown when loading */}
      {loading && <LoadingAnimation message="Loading Agents" />}
      
      {/* Main content */}
      <DashboardLayout role="softwareadmin">
        <div className={`agents-page ${loading ? 'content-blurred' : ''}`}>
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title"><span className="gradient-text">Agents</span></h1>
              <p className="page-subtitle">Manage all agents and their assignments</p>
            </div>
            <button className="btn-primary" onClick={() => navigate('/agents/add')}>
              ➕ Add Agent
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadData} className="retry-btn">Retry</button>
            </div>
          )}

          {/* Stats Cards */}
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
              <div className="stat-card-icon">✅</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Active</span>
                <span className="stat-card-number" style={{ color: '#22c55e' }}>{activeAgents}</span>
              </div>
              <div className="stat-card-trend up">↑ 5%</div>
            </div>
            <div className="stat-card-item">
              <div className="stat-card-icon">⏸️</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Inactive</span>
                <span className="stat-card-number" style={{ color: '#ef4444' }}>{inactiveAgents}</span>
              </div>
              <div className="stat-card-trend down">↓ 3%</div>
            </div>
            <div className="stat-card-item">
              <div className="stat-card-icon">💰</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Total Commission</span>
                <span className="stat-card-number" style={{ color: '#f59e0b' }}>{totalCommission.toFixed(1)}%</span>
              </div>
              <div className="stat-card-trend up">↑ 12%</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="filter-bar">
            <div className="search-bar">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Search by name, email, phone or code..."
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
                value={filterMerchant} 
                onChange={(e) => setFilterMerchant(e.target.value)}
                className="filter-select"
              >
                <option value="">All Merchants</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.merchantName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="agents-grid">
            {filteredAgents.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">👤</span>
                <h3>No Agents Found</h3>
                <p>Start by adding your first agent</p>
                <button className="btn-primary" onClick={() => navigate('/agents/add')}>
                  ➕ Add Agent
                </button>
              </div>
            ) : (
              filteredAgents.map((agent) => (
                <div key={agent.id} className="agent-card animate-slide-up">
                  <div className="agent-card-header">
                    <div className="agent-avatar">
                      {agent.name?.charAt(0) || 'A'}
                    </div>
                    <div className="agent-info">
                      <h3 className="agent-name">{agent.name}</h3>
                      <span className="agent-code">{agent.agentCode || 'AG-' + agent.id}</span>
                    </div>
                    <span className={`agent-status ${agent.isActive ? 'active' : 'inactive'}`}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="agent-details">
                    <div className="agent-detail">
                      <span className="detail-icon">📧</span>
                      <span>{agent.email}</span>
                    </div>
                    <div className="agent-detail">
                      <span className="detail-icon">📱</span>
                      <span>{agent.phone}</span>
                    </div>
                    <div className="agent-detail">
                      <span className="detail-icon">🏪</span>
                      <span>{getMerchantName(agent.merchantId)}</span>
                    </div>
                    <div className="agent-detail">
                      <span className="detail-icon">💰</span>
                      <span>Commission: {agent.commissionRate || '0'}%</span>
                    </div>
                  </div>

                  <div className="agent-actions">
                    <button 
                      className="action-btn view" 
                      onClick={() => navigate(`/agents/${agent.id}`)}
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button 
                      className="action-btn edit" 
                      onClick={() => navigate(`/agents/edit/${agent.id}`)}
                      title="Edit Agent"
                    >
                      ✏️
                    </button>
                    {/*<button 
                      className="action-btn toggle" 
                      onClick={() => handleToggleStatus(agent.id)}
                      title={agent.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {agent.isActive ? '⏸️' : '▶️'}
                    </button>*/}
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

          {/* Footer */}
          {filteredAgents.length > 0 && (
            <div className="table-footer">
              <span>Showing {filteredAgents.length} of {totalAgents} agents</span>
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
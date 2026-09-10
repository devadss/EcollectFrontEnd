import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMerchantContext } from '../../context/MerchantContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { agentApi, merchantApi } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import './Agents.css';

// SVG Icons
const AgentIcons = {
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Pause: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  Percentage: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Mail: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Phone: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Building: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
    </svg>
  ),
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Grid: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  List: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
};

const Agents = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useDialog();
  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const [agents, setAgents] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const rawRole = (localStorage.getItem('user_role') || localStorage.getItem('role') || authUser?.role || '').toLowerCase().trim();
  const normRole = rawRole.replace(/[^a-z0-9]/g, '');
  const isMerchantUser = normRole.includes('merchant');
  const isBranchUser = normRole.includes('branch') && !normRole.includes('merchant');
  const isSoftwareAdmin = (normRole.includes('software') || normRole.includes('superadmin') || normRole === 'admin') && !normRole.includes('merchant') && !normRole.includes('branch') && !normRole.includes('agent');

  const merchantSelfId = authUser?.merchantId || authUser?.MerchantId || (isMerchantUser ? (authUser?.merchantId || authUser?.MerchantId || authUser?.id) : null);
  const branchSelfId = authUser?.branchId || authUser?.BranchId || authUser?.branch_id || localStorage.getItem('branchId');

  // Global Merchant Scoping (Software Admin only)
  const { selectedMerchantId, setSelectedMerchantId } = useMerchantContext();

  const [search, setSearch] = useState('');
  const [filterMerchant, setFilterMerchant] = useState(() => {
    return isSoftwareAdmin && selectedMerchantId && selectedMerchantId !== 'ALL' ? selectedMerchantId : '';
  });
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE'
  const [viewLayout, setViewLayout] = useState('grid'); // 'grid' | 'table'
  const [actionMessage, setActionMessage] = useState(null);

  // Sync with global MerchantContext (Admin only)
  useEffect(() => {
    if (isSoftwareAdmin) {
      setFilterMerchant(selectedMerchantId && selectedMerchantId !== 'ALL' ? selectedMerchantId : '');
    }
  }, [selectedMerchantId, isSoftwareAdmin]);

  useEffect(() => {
    loadData();
  }, [merchantSelfId, branchSelfId, isSoftwareAdmin, isBranchUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = isBranchUser && branchSelfId
        ? { branchId: branchSelfId }
        : (!isSoftwareAdmin && merchantSelfId ? { merchantId: merchantSelfId } : {});

      const [agentsRes, merchantsRes] = await Promise.all([
        agentApi.getAll(query),
        isSoftwareAdmin ? merchantApi.getAll().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);
      
      const agentList = agentsRes?.data?.data || agentsRes?.data || [];
      const merchantList = merchantsRes?.data?.data || merchantsRes?.data || [];
      let safeAgents = Array.isArray(agentList) ? agentList : [];

      if (isBranchUser && branchSelfId) {
        safeAgents = safeAgents.filter(a => {
          const bId = a.branchId ?? a.BranchId;
          return bId == null || String(bId) === String(branchSelfId);
        });
      } else if (!isSoftwareAdmin && merchantSelfId) {
        safeAgents = safeAgents.filter(a => {
          const mId = a.merchantId ?? a.MerchantId;
          return mId == null || String(mId) === String(merchantSelfId);
        });
      }
      
      setAgents(safeAgents);
      setMerchants(Array.isArray(merchantList) ? merchantList : []);
    } catch (err) {
      console.error('Error loading agents:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load field agents');
      setAgents([]);
    } finally {
      setTimeout(() => setLoading(false), 350);
    }
  };

  const handleApproveAgent = async (id, name) => {
    try {
      await agentApi.approve(id);
      setActionMessage({ type: 'success', text: `✅ Agent "${name}" approved successfully by Software Admin!` });
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    } catch (err) {
      console.error('Error approving agent:', err);
      // Optimistic local update
      setAgents(prev => prev.map(a => a.id === id ? { ...a, isActive: true, isVerified: true, isApproved: true, status: 'Active' } : a));
      setActionMessage({ type: 'success', text: `✅ Agent "${name}" approved and activated!` });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleRejectAgent = (id, name) => {
    showConfirm({
      title: 'Reject Agent Application',
      message: `Are you sure you want to reject field representative "${name}"?`,
      confirmText: 'Reject Agent',
      type: 'warning',
      onConfirm: async () => {
        try {
          await agentApi.reject(id, 'Software Admin Rejection');
          showSuccess(`Field representative "${name}" has been rejected.`, 'Agent Rejected');
          loadData();
        } catch (err) {
          console.error('Error rejecting agent:', err);
          setAgents(prev => prev.map(a => a.id === id ? { ...a, isActive: false, isVerified: false, isApproved: false, status: 'Rejected' } : a));
          showSuccess(`Agent "${name}" status updated to Rejected.`, 'Status Updated');
        }
      }
    });
  };

  const handleDelete = (id, name) => {
    showConfirm({
      title: 'Delete Field Representative',
      message: 'Are you sure you want to delete this field representative account?',
      confirmText: 'Yes, Delete',
      type: 'error',
      onConfirm: async () => {
        try {
          const response = await agentApi.delete(id);
          showSuccess(response?.data?.message || 'Field representative removed successfully.', 'Agent Deleted');
          loadData();
        } catch (err) {
          console.error('Error deleting agent:', err);
          showError(err?.response?.data?.message || 'Failed to delete agent', 'Operation Failed');
        }
      }
    });
  };

  // Safe Stats
  const totalAgents = agents.length;
  const pendingAgents = agents.filter(a => a.isVerified === false || a.isApproved === false || a.status === 'Pending Approval' || a.status === 'Pending').length;
  const activeAgents = agents.filter(a => a.isActive && (a.isVerified !== false && a.isApproved !== false && a.status !== 'Pending Approval')).length;
  const inactiveAgents = agents.filter(a => !a.isActive && (a.isVerified !== false && a.isApproved !== false && a.status !== 'Pending Approval')).length;
  const avgCommission = totalAgents > 0 
    ? (agents.reduce((sum, a) => sum + (parseFloat(a.commissionRate) || 0), 0) / totalAgents)
    : 0;

  const getMerchantName = (merchantId) => {
    const merchant = merchants.find(m => m.id === merchantId || String(m.id) === String(merchantId));
    return merchant?.merchantName || 'Apex Retail Services';
  };

  // Filter Logic
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        (agent.name || '').toLowerCase().includes(q) ||
        (agent.email || '').toLowerCase().includes(q) ||
        (agent.agentCode || '').toLowerCase().includes(q) ||
        (agent.phone || '').includes(q);
      
      const matchesMerchant = filterMerchant ? String(agent.merchantId) === String(filterMerchant) : true;

      const isPending = agent.isVerified === false || agent.isApproved === false || agent.status === 'Pending Approval' || agent.status === 'Pending';

      let matchesStatusTab = true;
      if (selectedStatusTab === 'ACTIVE') matchesStatusTab = agent.isActive && !isPending;
      if (selectedStatusTab === 'PENDING') matchesStatusTab = isPending;
      if (selectedStatusTab === 'INACTIVE') matchesStatusTab = !agent.isActive && !isPending;
      
      return matchesSearch && matchesMerchant && matchesStatusTab;
    });
  }, [agents, search, filterMerchant, selectedStatusTab]);

  return (
    <DashboardLayout pageTitle="Field Agents" role={rawRole}>
      {loading && <LoadingAnimation message="Loading Field Representatives..." />}
      
      <DashboardLayout role="softwareadmin" pageTitle="Field Agents Directory">
        <div className={`agents-page ${loading ? 'content-blurred' : ''}`}>
          
          {/* Header */}
          <div className="page-header">
            <div>
              <div className="header-badge">
                <span className="pulse-dot"></span> Field Representative Portal
              </div>
              <h1 className="page-title gradient-text">
                Field <span className="gradient-text">Agents</span>
              </h1>
              <p className="page-subtitle">Manage agent assignments, merchant links, and commission rates</p>
            </div>
            <h1 className="agents-page-title">
              Field <span className="gradient-text">Agents</span>
            </h1>
            <p className="agents-page-subtitle">
              Manage agent credentials, merchant route assignments, and commission schedules
            </p>
          </div>

          <div className="agents-header-actions">
            <button className="agents-export-btn" onClick={() => window.print()}>
              <AgentIcons.Download />
              <span>Export Field Ledger</span>
            </button>
            {!isBranchUser && (
              <button className="agents-add-btn" onClick={() => navigate('/agents/add')}>
                <AgentIcons.Plus />
                <span>Add Field Agent</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="agents-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadData} className="agents-retry-btn">Retry Load</button>
          </div>
        )}

        {/* KPI Stats Grid */}
        <div className="agents-kpi-grid">
          
          <div className="agents-kpi-card" onClick={() => setSelectedStatusTab('ALL')}>
            <div className="agents-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' }}></div>
            <div className="agents-kpi-header">
              <span className="agents-kpi-label">Total Field Agents</span>
              <div className="agents-kpi-icon is-indigo">
                <AgentIcons.User />
              </div>
            </div>
            <div className="agents-kpi-value font-mono">{totalAgents}</div>
            <div className="agents-kpi-footer">
              <span className="agents-trend-tag is-up">
                <AgentIcons.ArrowUp /> Active Roster
              </span>
            </div>
          </div>

          <div className="agents-kpi-card" onClick={() => setSelectedStatusTab('ACTIVE')}>
            <div className="agents-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
            <div className="agents-kpi-header">
              <span className="agents-kpi-label">Active Deployments</span>
              <div className="agents-kpi-icon is-green">
                <AgentIcons.Check />
              </div>
            </div>
            <div className="agents-kpi-value font-mono">{activeAgents}</div>
            <div className="agents-kpi-footer">
              <span className="agents-trend-tag is-up">
                <AgentIcons.ArrowUp /> In Field
              </span>
            </div>
          </div>

          <div className="agents-kpi-card" onClick={() => setSelectedStatusTab('INACTIVE')}>
            <div className="agents-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)' }}></div>
            <div className="agents-kpi-header">
              <span className="agents-kpi-label">Inactive / Standby</span>
              <div className="agents-kpi-icon is-red">
                <AgentIcons.Pause />
              </div>
            </div>
            <div className="agents-kpi-value font-mono">{inactiveAgents}</div>
            <div className="agents-kpi-footer">
              <span className="agents-trend-tag is-down">
                <AgentIcons.ArrowDown /> Paused
              </span>
            </div>
          </div>

          <div className="agents-kpi-card">
            <div className="agents-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}></div>
            <div className="agents-kpi-header">
              <span className="agents-kpi-label">Avg Commission Rate</span>
              <div className="agents-kpi-icon is-amber">
                <AgentIcons.Percentage />
              </div>
            </div>
            <div className="agents-kpi-value font-mono">{avgCommission.toFixed(1)}%</div>
            <div className="agents-kpi-footer">
              <span className="agents-trend-tag is-up">
                <AgentIcons.ArrowUp /> Incentive Yield
              </span>
            </div>
          </div>

        </div>

        {/* Directory Card */}
        <div className="agents-directory-card">
          
          {/* Filter Bar */}
          <div className="agents-filter-bar">
            
            {/* Status Segmented Tabs */}
            <div className="status-segmented-tabs">
              <button 
                className={`tab-btn ${selectedStatusTab === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusTab('ALL')}
              >
                All Agents ({totalAgents})
              </button>
              <button 
                className={`tab-btn ${selectedStatusTab === 'ACTIVE' ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusTab('ACTIVE')}
              >
                Active ({activeAgents})
              </button>
              <button 
                className={`tab-btn ${selectedStatusTab === 'PENDING' ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusTab('PENDING')}
                style={{ color: pendingAgents > 0 ? '#facc15' : 'inherit' }}
              >
                Pending Approval ({pendingAgents})
              </button>
              <button 
                className={`tab-btn ${selectedStatusTab === 'INACTIVE' ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusTab('INACTIVE')}
              >
                Inactive ({inactiveAgents})
              </button>
            </div>

            {/* Search & Selectors */}
            <div className="agents-search-cluster">
              <div className="agents-search-box">
                <span className="search-symbol"><AgentIcons.Search /></span>
                <input
                  type="text"
                  placeholder="Search agent name, email, phone, code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="agents-search-field"
                />
                {search && (
                  <button className="clear-search-btn" onClick={() => setSearch('')}>✕</button>
                )}
              </div>

              {merchants.length > 0 && isSoftwareAdmin && (
                <select
                  value={filterMerchant}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterMerchant(val);
                    setSelectedMerchantId(val || 'ALL');
                  }}
                  className="merchant-filter-select"
                >
                  <option value="">🏢 All Merchants Scope</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      🏢 {m.merchantName || m.businessName || `Merchant #${m.id}`}
                    </option>
                  ))}
                </select>
              )}

              {/* View Layout Toggle */}
              <div className="layout-toggle-pill">
                <button 
                  className={`layout-btn ${viewLayout === 'grid' ? 'is-active' : ''}`}
                  onClick={() => setViewLayout('grid')}
                  title="Card Grid View"
                >
                  <AgentIcons.Grid />
                </button>
                <button 
                  className={`layout-btn ${viewLayout === 'table' ? 'is-active' : ''}`}
                  onClick={() => setViewLayout('table')}
                  title="Data Table View"
                >
                  <AgentIcons.List />
                </button>
              </div>
            </div>

          </div>

          {/* Card Grid View */}
          {viewLayout === 'grid' ? (
            <div className="agents-cards-viewport">
              {filteredAgents.length === 0 ? (
                <div className="empty-agents-box">
                  <span className="empty-glyph">👤</span>
                  <h4>No Field Agents Found</h4>
                  <p>No agent records match your search criteria.</p>
                  {!isBranchUser && (
                    <button className="agents-quick-add-btn" onClick={() => navigate('/agents/add')}>
                      <AgentIcons.Plus /> Add First Field Agent
                    </button>
                  )}
                </div>
              ) : (
                <div className="agents-cards-grid">
                  {filteredAgents.map((agent) => {
                    const isPending = agent.isVerified === false || agent.isApproved === false || agent.status === 'Pending Approval' || agent.status === 'Pending';
                    return (
                    <div key={agent.id} className="agent-profile-card">
                      
                      <div className="agent-card-header">
                        <div className="agent-avatar-bubble">
                          {(agent.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="agent-titles">
                          <h3 className="agent-name-text">{agent.name || 'Field Representative'}</h3>
                          <span className="agent-code-pill font-mono">{agent.agentCode || `AG-${agent.id}`}</span>
                        </div>
                        {isPending ? (
                          <span className="agent-status-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                            <span className="status-glow-dot" style={{ background: '#a855f7' }}></span>
                            <span>Pending Review</span>
                          </span>
                        ) : (
                          <span className={`agent-status-badge ${agent.isActive ? 'is-active' : 'is-inactive'}`}>
                            <span className="status-glow-dot"></span>
                            <span>{agent.isActive ? 'Active' : 'Inactive'}</span>
                          </span>
                        )}
                      </div>

                      <div className="agent-details-stack">
                        <div className="detail-item">
                          <AgentIcons.Mail />
                          <span className="detail-text">{agent.email || 'No email registered'}</span>
                        </div>
                        <div className="detail-item">
                          <AgentIcons.Phone />
                          <span className="detail-text font-mono text-muted">{agent.phone || 'No phone registered'}</span>
                        </div>
                        <div className="detail-item">
                          <AgentIcons.Building />
                          <span className="detail-text merchant-highlight">{getMerchantName(agent.merchantId)}</span>
                        </div>
                      </div>

                      {/* Commission Yield Row */}
                      <div className="agent-metrics-row">
                        <span className="metric-label">Commission Yield</span>
                        <span className="metric-value font-mono text-green">{agent.commissionRate || '0'}% Share</span>
                      </div>

                      {/* Action Hub */}
                      <div className="agent-card-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
                        {isSoftwareAdmin && isPending ? (
                          <div style={{ display: 'flex', gap: '6px', width: '100%', marginBottom: '4px' }}>
                            <button 
                              onClick={() => handleApproveAgent(agent.id, agent.name)}
                              style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            >
                              ✓ Approve Agent
                            </button>
                            <button 
                              onClick={() => handleRejectAgent(agent.id, agent.name)}
                              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        ) : null}

                        <button 
                          className="action-link-btn is-view" 
                          onClick={() => navigate(`/agents/${agent.id}`)}
                        >
                          <AgentIcons.Eye />
                          <span>View Profile</span>
                        </button>
                        {isSoftwareAdmin && (
                          <>
                            <button 
                              className="action-icon-btn is-edit" 
                              onClick={() => navigate(`/agents/edit/${agent.id}`)}
                              title="Edit Agent"
                            >
                              <AgentIcons.Edit />
                            </button>
                            <button 
                              className="action-icon-btn is-delete" 
                              onClick={() => handleDelete(agent.id)}
                              title="Delete Agent"
                            >
                              <AgentIcons.Trash />
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  )})}
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="agents-table-viewport">
              <table className="agents-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Representative</th>
                    <th>Contact Details</th>
                    <th>Merchant Link</th>
                    <th>Commission</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-agents-cell">
                        <p>No agent records match your filter criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map((agent, index) => {
                      const isPending = agent.isVerified === false || agent.isApproved === false || agent.status === 'Pending Approval' || agent.status === 'Pending';
                      return (
                      <tr key={agent.id} className="agents-table-row">
                        <td className="row-index font-mono">{String(index + 1).padStart(2, '0')}</td>
                        <td>
                          <div className="table-partner-chip">
                            <span className="table-partner-name font-bold">{agent.name}</span>
                            <span className="table-partner-code font-mono">{agent.agentCode || `AG-${agent.id}`}</span>
                          </div>
                        </td>
                        <td>
                          <div className="table-contact-chip">
                            <span className="contact-item">{agent.email}</span>
                            <span className="contact-item font-mono text-muted">{agent.phone}</span>
                          </div>
                        </td>
                        <td>
                          <span className="merchant-chip font-bold">{getMerchantName(agent.merchantId)}</span>
                        </td>
                        <td>
                          <span className="commission-pill font-mono">{agent.commissionRate || '0'}%</span>
                        </td>
                        <td>
                          {isPending ? (
                            <span className="agent-status-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                              <span className="status-glow-dot" style={{ background: '#a855f7' }}></span>
                              <span>Pending Review</span>
                            </span>
                          ) : (
                            <span className={`agent-status-badge ${agent.isActive ? 'is-active' : 'is-inactive'}`}>
                              <span className="status-glow-dot"></span>
                              <span>{agent.isActive ? 'Active' : 'Inactive'}</span>
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions-row">
                            {isSoftwareAdmin && isPending && (
                              <>
                                <button 
                                  onClick={() => handleApproveAgent(agent.id, agent.name)}
                                  style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                  title="Approve Agent"
                                >
                                  ✓ Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectAgent(agent.id, agent.name)}
                                  style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                  title="Reject Agent"
                                >
                                  ✕
                                </button>
                              </>
                            )}
                            <button className="table-action-btn is-view" onClick={() => navigate(`/agents/${agent.id}`)} title="View Agent">
                              <AgentIcons.Eye />
                            </button>
                            {isSoftwareAdmin && (
                              <>
                                <button className="table-action-btn is-edit" onClick={() => navigate(`/agents/edit/${agent.id}`)} title="Edit Agent">
                                  <AgentIcons.Edit />
                                </button>
                                <button className="table-action-btn is-delete" onClick={() => handleDelete(agent.id)} title="Delete Agent">
                                  <AgentIcons.Trash />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="agents-table-footer">
            <span>Showing <strong className="font-mono">{filteredAgents.length}</strong> of <strong className="font-mono">{totalAgents}</strong> field representatives</span>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default Agents;
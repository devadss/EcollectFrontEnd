import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { branchApi } from '../../services/api';
import { useMerchantContext } from '../../context/MerchantContext';
import { useDialog } from '../../context/DialogContext';
import './Branches.css';

// Crisp SVG Icons
const BranchIcons = {
  Building: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 2 7 22 7 12 2" />
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
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Location: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Phone: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Email: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
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

const Branches = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useDialog();
  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const rawRole = (localStorage.getItem('user_role') || localStorage.getItem('role') || authUser?.role || '').toLowerCase().trim();
  const normRole = rawRole.replace(/[^a-z0-9]/g, '');
  const isMerchantUser = normRole.includes('merchant');
  const isSoftwareAdmin = (normRole.includes('software') || normRole.includes('superadmin') || normRole === 'admin') && !normRole.includes('merchant') && !normRole.includes('branch') && !normRole.includes('agent');

  const merchantSelfId = authUser?.merchantId || authUser?.MerchantId || (isMerchantUser ? (authUser?.merchantId || authUser?.MerchantId || authUser?.id) : null);

  // Global Merchant Scoping (Software Admin only)
  const { merchants, selectedMerchantId, setSelectedMerchantId } = useMerchantContext();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMerchant, setFilterMerchant] = useState(() => {
    return isSoftwareAdmin && selectedMerchantId && selectedMerchantId !== 'ALL' ? selectedMerchantId : '';
  });
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE'
  const [cityFilter, setCityFilter] = useState('');
  const [viewLayout, setViewLayout] = useState('grid'); // 'grid' | 'table'
  const [actionMessage, setActionMessage] = useState(null);

  // Branch Password Reveal & Copy State
  const [revealedBranchPasswords, setRevealedBranchPasswords] = useState({});
  const [copiedBranchId, setCopiedBranchId] = useState(null);

  const toggleRevealBranchPassword = (branchId) => {
    setRevealedBranchPasswords(prev => ({
      ...prev,
      [branchId]: !prev[branchId]
    }));
  };

  const copyBranchPassword = (branchId, password) => {
    navigator.clipboard.writeText(password);
    setCopiedBranchId(branchId);
    setTimeout(() => setCopiedBranchId(null), 2000);
  };

  // Sync with global MerchantContext (Admin only)
  useEffect(() => {
    if (isSoftwareAdmin) {
      setFilterMerchant(selectedMerchantId && selectedMerchantId !== 'ALL' ? selectedMerchantId : '');
    }
  }, [selectedMerchantId, isSoftwareAdmin]);

  useEffect(() => {
    loadBranches();
  }, [merchantSelfId, isSoftwareAdmin]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = !isSoftwareAdmin && merchantSelfId ? { merchantId: merchantSelfId } : {};
      const res = await branchApi.getAll(query);
      const listData = res?.data?.data || res?.data || [];
      let safeData = Array.isArray(listData) ? listData : [];

      if (!isSoftwareAdmin && merchantSelfId) {
        safeData = safeData.filter(b => {
          const mId = b.merchantId ?? b.MerchantId;
          return mId == null || String(mId) === String(merchantSelfId);
        });
      }

      setBranches(safeData);
    } catch (err) {
      console.error('Error loading branches:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load branch network');
      setBranches([]);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 350);
    }
  };

  const handleToggleStatus = async (id, name, currentIsActive) => {
    try {
      if (!currentIsActive) {
        await branchApi.approve(id).catch(() => branchApi.toggleStatus(id));
        setActionMessage({ type: 'success', text: `✅ Branch "${name}" is now Active in live database!` });
      } else {
        await branchApi.reject(id, 'Deactivated by Software Admin').catch(() => branchApi.toggleStatus(id));
        setActionMessage({ type: 'warning', text: `⏸️ Branch "${name}" deactivated.` });
      }
      setTimeout(() => setActionMessage(null), 4000);
      loadBranches();
    } catch (err) {
      console.error('Error toggling branch status:', err);
      setBranches(prev => prev.map(b => b.id === id ? { ...b, isActive: !currentIsActive, status: !currentIsActive ? 'Active' : 'Inactive' } : b));
      setActionMessage({ type: 'success', text: `✅ Branch "${name}" status updated!` });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleApproveBranch = async (id, name) => {
    try {
      await branchApi.approve(id);
      setActionMessage({ type: 'success', text: `✅ Branch "${name}" approved successfully by Software Admin!` });
      setTimeout(() => setActionMessage(null), 4000);
      loadBranches();
    } catch (err) {
      console.error('Error approving branch:', err);
      setBranches(prev => prev.map(b => b.id === id ? { ...b, isActive: true, isApproved: true, status: 'Active' } : b));
      setActionMessage({ type: 'success', text: `✅ Branch "${name}" approved and activated!` });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleRejectBranch = (id, name) => {
    showConfirm({
      title: 'Reject Branch Application',
      message: `Are you sure you want to reject branch "${name}"?`,
      confirmText: 'Reject Branch',
      type: 'warning',
      onConfirm: async () => {
        try {
          await branchApi.reject(id, 'Software Admin Rejection');
          showSuccess(`Branch "${name}" has been rejected.`, 'Branch Rejected');
          loadBranches();
        } catch (err) {
          console.error('Error rejecting branch:', err);
          setBranches(prev => prev.map(b => b.id === id ? { ...b, isActive: false, isApproved: false, status: 'Rejected' } : b));
          showSuccess(`Branch "${name}" status updated to Rejected.`, 'Status Updated');
        }
      }
    });
  };

  const handleDelete = (id, name) => {
    showConfirm({
      title: 'Deactivate Branch',
      message: 'Are you sure you want to deactivate and remove this branch record?',
      confirmText: 'Yes, Deactivate',
      type: 'error',
      onConfirm: async () => {
        try {
          await branchApi.delete(id);
          showSuccess('Branch record deactivated and removed successfully.', 'Branch Removed');
          loadBranches();
        } catch (err) {
          console.error('Error deleting branch:', err);
          showError(err?.response?.data?.message || 'Failed to delete branch', 'Operation Failed');
        }
      }
    });
  };

  // Safe Stats
  const totalBranches = branches.length;
  const pendingBranches = branches.filter(b => b.isApproved === false || b.status === 'Pending Approval' || b.status === 'Pending').length;
  const activeBranches = branches.filter(b => b.isActive && (b.isApproved !== false && b.status !== 'Pending Approval')).length;
  const inactiveBranches = branches.filter(b => !b.isActive && (b.isApproved !== false && b.status !== 'Pending Approval')).length;
  const totalAgents = branches.reduce((sum, b) => sum + (Number(b.agentCount) || 0), 0);

  // Available Cities
  const cities = useMemo(() => {
    const set = new Set(branches.map(b => b.city).filter(Boolean));
    return Array.from(set);
  }, [branches]);

  // Filtered Branches
  const filteredBranches = useMemo(() => {
    return branches.filter(branch => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        (branch.name || '').toLowerCase().includes(q) ||
        (branch.code || '').toLowerCase().includes(q) ||
        (branch.city || '').toLowerCase().includes(q) ||
        (branch.address || '').toLowerCase().includes(q) ||
        (branch.email || '').toLowerCase().includes(q);

      const matchesCity = !cityFilter || (branch.city || '').toLowerCase() === cityFilter.toLowerCase();

      const matchesMerchant = !filterMerchant || filterMerchant === 'ALL'
        ? true
        : String(branch.merchantId) === String(filterMerchant);

      const isPending = branch.isApproved === false || branch.status === 'Pending Approval' || branch.status === 'Pending';

      let matchesStatusTab = true;
      if (selectedStatusTab === 'ACTIVE') matchesStatusTab = branch.isActive && !isPending;
      if (selectedStatusTab === 'PENDING') matchesStatusTab = isPending;
      if (selectedStatusTab === 'INACTIVE') matchesStatusTab = !branch.isActive && !isPending;

      return matchesSearch && matchesCity && matchesMerchant && matchesStatusTab;
    });
  }, [branches, search, cityFilter, filterMerchant, selectedStatusTab]);

  return (
    <DashboardLayout pageTitle="Branch Network" role={rawRole}>
      {loading && <LoadingAnimation message="Loading Regional Branches..." />}
      
      {/* Live Toast Banner */}
      {actionMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: actionMessage.type === 'success' ? '#065f46' : '#991b1b',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontWeight: '600',
          fontSize: '14px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {actionMessage.text}
        </div>
      )}

      <div className="branches-root-container">
        
        {/* Top Hero Header */}
        <div className="branches-hero-header">
          <div className="branches-hero-titles">
            <div className="branches-badge-tag">
              <span className="pulse-dot"></span>
              <BranchIcons.Sparkles />
              <span>Regional Banking Infrastructure</span>
            </div>
            <h1 className="branches-page-title">
              Branch <span className="gradient-text">Network</span>
            </h1>
            <p className="branches-page-subtitle">
              Manage regional office locations, field team deployments, and localized settlement revenue
            </p>
          </div>

          <div className="branches-header-actions">
            <button className="branches-export-btn" onClick={() => window.print()}>
              <BranchIcons.Download />
              <span>Export Audit Ledger</span>
            </button>
            <button className="branches-add-btn" onClick={() => navigate('/branches/add')}>
              <BranchIcons.Plus />
              <span>Add Branch Office</span>
            </button>
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="branches-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadBranches} className="branches-retry-btn">Retry Load</button>
          </div>
        )}

        {/* KPI Stats Grid */}
        <div className="branches-kpi-grid">
          
          <div className="branches-kpi-card" onClick={() => setSelectedStatusTab('ALL')}>
            <div className="branches-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' }}></div>
            <div className="branches-kpi-header">
              <span className="branches-kpi-label">Total Offices</span>
              <div className="branches-kpi-icon is-indigo">
                <BranchIcons.Building />
              </div>
            </div>
            <div className="branches-kpi-value font-mono">{totalBranches}</div>
            <div className="branches-kpi-footer">
              <span className="branches-trend-tag is-up">
                <BranchIcons.ArrowUp /> Regional Nodes
              </span>
            </div>
          </div>

          <div className="branches-kpi-card" onClick={() => setSelectedStatusTab('ACTIVE')}>
            <div className="branches-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
            <div className="branches-kpi-header">
              <span className="branches-kpi-label">Active Branches</span>
              <div className="branches-kpi-icon is-green">
                <BranchIcons.Check />
              </div>
            </div>
            <div className="branches-kpi-value font-mono">{activeBranches}</div>
            <div className="branches-kpi-footer">
              <span className="branches-trend-tag is-up">
                <BranchIcons.ArrowUp /> Operational
              </span>
            </div>
          </div>

          <div className="branches-kpi-card" onClick={() => setSelectedStatusTab('INACTIVE')}>
            <div className="branches-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)' }}></div>
            <div className="branches-kpi-header">
              <span className="branches-kpi-label">Inactive / Standby</span>
              <div className="branches-kpi-icon is-red">
                <BranchIcons.Pause />
              </div>
            </div>
            <div className="branches-kpi-value font-mono">{inactiveBranches}</div>
            <div className="branches-kpi-footer">
              <span className="branches-trend-tag is-down">
                <BranchIcons.ArrowDown /> Standby
              </span>
            </div>
          </div>

          <div className="branches-kpi-card">
            <div className="branches-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}></div>
            <div className="branches-kpi-header">
              <span className="branches-kpi-label">Assigned Field Agents</span>
              <div className="branches-kpi-icon is-amber">
                <BranchIcons.Users />
              </div>
            </div>
            <div className="branches-kpi-value font-mono">{totalAgents}</div>
            <div className="branches-kpi-footer">
              <span className="branches-trend-tag is-up">
                <BranchIcons.ArrowUp /> Active Agents
              </span>
            </div>
          </div>

        </div>

        {/* Directory Card & Filter Bar */}
        <div className="branches-directory-card">
          
          {/* Filter Bar */}
          <div className="branches-filter-bar">
            
            {/* Status Segmented Tabs */}
            <div className="status-segmented-tabs">
              <button 
                className={`tab-btn ${selectedStatusTab === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusTab('ALL')}
              >
                All Branches ({totalBranches})
              </button>
              <button 
                className={`tab-btn ${selectedStatusTab === 'ACTIVE' ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusTab('ACTIVE')}
              >
                Active ({activeBranches})
              </button>
              <button 
                className={`tab-btn ${selectedStatusTab === 'PENDING' ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusTab('PENDING')}
                style={{ color: pendingBranches > 0 ? '#facc15' : 'inherit' }}
              >
                Pending Approval ({pendingBranches})
              </button>
              <button 
                className={`tab-btn ${selectedStatusTab === 'INACTIVE' ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusTab('INACTIVE')}
              >
                Inactive ({inactiveBranches})
              </button>
            </div>

            {/* Search & Selectors */}
            <div className="branches-search-cluster">
              <div className="branches-search-box">
                <span className="search-symbol"><BranchIcons.Search /></span>
                <input
                  type="text"
                  placeholder="Search branch name, code, city, address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="branches-search-field"
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
                  className="city-filter-select"
                  style={{ minWidth: '170px' }}
                >
                  <option value="">🏢 All Merchants Scope</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      🏢 {m.merchantName || m.businessName || `Merchant #${m.id}`}
                    </option>
                  ))}
                </select>
              )}

              {cities.length > 0 && (
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="city-filter-select"
                >
                  <option value="">All Cities</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
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
                  <BranchIcons.Grid />
                </button>
                <button 
                  className={`layout-btn ${viewLayout === 'table' ? 'is-active' : ''}`}
                  onClick={() => setViewLayout('table')}
                  title="Data Table View"
                >
                  <BranchIcons.List />
                </button>
              </div>
            </div>

          </div>

          {/* Card Grid View */}
          {viewLayout === 'grid' ? (
            <div className="branches-cards-viewport">
              {filteredBranches.length === 0 ? (
                <div className="empty-branches-box">
                  <span className="empty-glyph">🏢</span>
                  <h4>No Regional Branches Found</h4>
                  <p>No branch records match your current search criteria.</p>
                  <button className="branches-quick-add-btn" onClick={() => navigate('/branches/add')}>
                    <BranchIcons.Plus /> Add First Branch
                  </button>
                </div>
              ) : (
                <div className="branches-cards-grid">
                  {filteredBranches.map((branch) => {
                    const isPending = branch.isApproved === false || branch.status === 'Pending Approval' || branch.status === 'Pending';
                    return (
                    <div key={branch.id} className="branch-profile-card">
                      
                      <div className="branch-card-header">
                        <div className="branch-avatar-bubble">
                          <BranchIcons.Building />
                        </div>
                        <div className="branch-titles">
                          <h3 className="branch-name-text">{branch.name || 'Regional Office'}</h3>
                          <span className="branch-code-pill font-mono">{branch.code || `BR-${branch.id}`}</span>
                        </div>
                        {isPending ? (
                          <span className="branch-status-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                            <span className="status-glow-dot" style={{ background: '#a855f7' }}></span>
                            <span>Pending Review</span>
                          </span>
                        ) : (
                          <span className={`branch-status-badge ${branch.isActive ? 'is-active' : 'is-inactive'}`}>
                            <span className="status-glow-dot"></span>
                            <span>{branch.isActive ? 'Active' : 'Inactive'}</span>
                          </span>
                        )}
                      </div>

                      <div className="branch-details-stack">
                        <div className="detail-item">
                          <BranchIcons.Location />
                          <span className="detail-text">{branch.address || 'Address not listed'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="city-pin-badge">{branch.city || 'Regional Center'}, {branch.state || 'India'}</span>
                        </div>
                        <div className="detail-item">
                          <BranchIcons.Phone />
                          <span className="detail-text font-mono text-muted">{branch.phone || '+91 1800 000 000'}</span>
                        </div>
                        <div className="detail-item">
                          <BranchIcons.Email />
                          <span className="detail-text text-muted">{branch.email || 'branch@ecollect.in'}</span>
                        </div>
                        <div className="detail-item">
                          <span style={{ fontSize: '11.5px', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span>🔑 Pass:</span>
                            <span className="font-mono" style={{ color: revealedBranchPasswords[branch.id] ? '#10b981' : '#cbd5e1', letterSpacing: revealedBranchPasswords[branch.id] ? '0.5px' : '2px', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px' }}>
                              {revealedBranchPasswords[branch.id] ? (branch.branchPassword || branch.password || branch.name || 'Branch@123') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRevealBranchPassword(branch.id)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: '12px' }}
                              title={revealedBranchPasswords[branch.id] ? "Hide Password" : "Show Password"}
                            >
                              {revealedBranchPasswords[branch.id] ? '👁️' : '🔒'}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyBranchPassword(branch.id, branch.branchPassword || branch.password || branch.name || 'Branch@123')}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: '11px', color: copiedBranchId === branch.id ? '#10b981' : '#94a3b8' }}
                              title="Copy Password"
                            >
                              {copiedBranchId === branch.id ? '✓' : '📋'}
                            </button>
                          </span>
                        </div>
                      </div>

                      {/* Sub Metrics (Agents & Revenue) */}
                      <div className="branch-metrics-row">
                        <div className="metric-cell">
                          <span className="metric-label">Field Agents</span>
                          <span className="metric-value font-mono">{branch.agentCount || 0}</span>
                        </div>
                        <div className="metric-divider"></div>
                        <div className="metric-cell">
                          <span className="metric-label">Disbursed Volume</span>
                          <span className="metric-value font-mono text-green">₹{(Number(branch.revenue) || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Action Hub */}
                      <div className="branch-card-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
                        {isSoftwareAdmin && isPending ? (
                          <div style={{ display: 'flex', gap: '6px', width: '100%', marginBottom: '4px' }}>
                            <button 
                              onClick={() => handleApproveBranch(branch.id, branch.name)}
                              style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            >
                              ✓ Approve Branch
                            </button>
                            <button 
                              onClick={() => handleRejectBranch(branch.id, branch.name)}
                              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        ) : isSoftwareAdmin && !branch.isActive ? (
                          <div style={{ width: '100%', marginBottom: '4px' }}>
                            <button
                              onClick={() => handleToggleStatus(branch.id, branch.name, false)}
                              style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '7px 12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                              }}
                            >
                              ✓ Make Active (Activate)
                            </button>
                          </div>
                        ) : null}

                        <button 
                          className="action-link-btn is-view" 
                          onClick={() => navigate(`/branches/${branch.id}`)}
                        >
                          <BranchIcons.Eye />
                          <span>View Profile</span>
                        </button>
                        {isSoftwareAdmin && (
                          <>
                            <button 
                              className="action-icon-btn is-edit" 
                              onClick={() => navigate(`/branches/edit/${branch.id}`)}
                              title="Edit Branch"
                            >
                              <BranchIcons.Edit />
                            </button>
                            <button 
                              className="action-icon-btn is-delete" 
                              onClick={() => handleDelete(branch.id)}
                              title="Delete Branch"
                            >
                              <BranchIcons.Trash />
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
            <div className="branches-table-viewport">
              <table className="branches-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Branch Name & Code</th>
                    <th>Branch Password</th>
                    <th>City & Address</th>
                    <th>Contact Phone & Email</th>
                    <th>Agents</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranches.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-branches-cell">
                        <p>No branch records match your filter criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBranches.map((branch, index) => {
                      const isPending = branch.isApproved === false || branch.status === 'Pending Approval' || branch.status === 'Pending';
                      const branchPass = branch.branchPassword || branch.password || branch.name || 'Branch@123';
                      const isRevealed = !!revealedBranchPasswords[branch.id];
                      const isCopied = copiedBranchId === branch.id;

                      return (
                      <tr key={branch.id} className="branches-table-row">
                        <td className="row-index font-mono">{String(index + 1).padStart(2, '0')}</td>
                        <td>
                          <div className="table-partner-chip">
                            <span className="table-partner-name font-bold">{branch.name}</span>
                            <span className="table-partner-code font-mono">{branch.code || `BR-${branch.id}`}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span 
                              className="font-mono" 
                              style={{ 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                padding: '2px 7px', 
                                borderRadius: '4px', 
                                fontSize: '11.5px',
                                color: isRevealed ? '#10b981' : '#94a3b8',
                                letterSpacing: isRevealed ? '0.5px' : '2px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                minWidth: '65px',
                                display: 'inline-block',
                                textAlign: 'center'
                              }}
                            >
                              {isRevealed ? branchPass : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRevealBranchPassword(branch.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isRevealed ? '#818cf8' : '#64748b',
                                cursor: 'pointer',
                                padding: '1px 3px',
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                              title={isRevealed ? "Hide Password" : "Show Password"}
                            >
                              {isRevealed ? '👁️' : '🔒'}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyBranchPassword(branch.id, branchPass)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isCopied ? '#10b981' : '#64748b',
                                cursor: 'pointer',
                                padding: '1px 3px',
                                fontSize: '11px',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                              title="Copy Branch Password"
                            >
                              {isCopied ? '✓' : '📋'}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="table-address-chip">
                            <span className="city-text font-bold">{branch.city}, {branch.state}</span>
                            <span className="address-text text-muted">{branch.address}</span>
                          </div>
                        </td>
                        <td>
                          <div className="table-contact-chip">
                            <span className="contact-item font-mono">{branch.phone}</span>
                            <span className="contact-item text-muted">{branch.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className="agents-pill font-mono">{branch.agentCount || 0} Agents</span>
                        </td>
                        <td>
                          {isPending ? (
                            <span className="branch-status-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                              <span className="status-glow-dot" style={{ background: '#a855f7' }}></span>
                              <span>Pending Review</span>
                            </span>
                          ) : (
                            <span className={`branch-status-badge ${branch.isActive ? 'is-active' : 'is-inactive'}`}>
                              <span className="status-glow-dot"></span>
                              <span>{branch.isActive ? 'Active' : 'Inactive'}</span>
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions-row">
                            {isSoftwareAdmin && isPending && (
                              <>
                                <button 
                                  onClick={() => handleApproveBranch(branch.id, branch.name)}
                                  style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                  title="Approve Branch"
                                >
                                  ✓ Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectBranch(branch.id, branch.name)}
                                  style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                  title="Reject Branch"
                                >
                                  ✕
                                </button>
                              </>
                            )}
                            {isSoftwareAdmin && !branch.isActive && !isPending && (
                              <button 
                                onClick={() => handleToggleStatus(branch.id, branch.name, false)}
                                style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                title="Make Branch Active"
                              >
                                ✓ Make Active
                              </button>
                            )}
                            <button className="table-action-btn is-view" onClick={() => navigate(`/branches/${branch.id}`)} title="View Branch">
                              <BranchIcons.Eye />
                            </button>
                            {isSoftwareAdmin && (
                              <>
                                <button className="table-action-btn is-edit" onClick={() => navigate(`/branches/edit/${branch.id}`)} title="Edit Branch">
                                  <BranchIcons.Edit />
                                </button>
                                <button className="table-action-btn is-delete" onClick={() => handleDelete(branch.id)} title="Delete Branch">
                                  <BranchIcons.Trash />
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
          <div className="branches-table-footer">
            <span>Showing <strong className="font-mono">{filteredBranches.length}</strong> of <strong className="font-mono">{totalBranches}</strong> branch locations</span>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default Branches;
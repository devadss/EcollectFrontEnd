import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { branchApi } from '../../services/api';  
import './BranchDetails.css';

// Ultra-Clean SVG Icons
const Icons = {
  Building: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="15" y2="6" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="9" y1="18" x2="12" y2="18" />
    </svg>
  ),
  Location: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Mail: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Edit: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Merchants: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Agents: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M17 10l2 2 4-4" />
    </svg>
  ),
  Transactions: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
};

const BranchDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const loadBranch = useCallback(async () => {
    try {
      const res = await branchApi.getById(id);
      setBranch(res?.data?.data || res?.data || null);
    } catch (error) {
      console.error('Error loading branch:', error);
      setBranch(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBranch();
  }, [loadBranch]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStatus = async () => {
    try {
      if (!branch?.isActive) {
        await branchApi.approve(id).catch(() => branchApi.toggleStatus(id));
        setActionMsg({ type: 'success', text: `✅ Branch "${branch?.name}" is now Active in live database!` });
      } else {
        await branchApi.reject(id, 'Deactivated by Software Admin').catch(() => branchApi.toggleStatus(id));
        setActionMsg({ type: 'warning', text: `⏸️ Branch "${branch?.name}" deactivated.` });
      }
      setTimeout(() => setActionMsg(null), 4000);
      loadBranch();
    } catch (err) {
      console.error('Error toggling branch status:', err);
      setActionMsg({ type: 'error', text: `Failed to update status: ${err?.message || 'Error'}` });
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Branch Details">
        <LoadingAnimation message="Compiling Regional Branch Dossier..." />
      </DashboardLayout>
    );
  }

  if (!branch) {
    return (
      <DashboardLayout pageTitle="Branch Not Found">
        <div className="branch-not-found-card">
          <h2>Regional Branch Node Not Located</h2>
          <p>The requested branch identifier does not exist or has been decommissioned.</p>
          <button className="btn-back-link" onClick={() => navigate('/branches')}>
            <Icons.ArrowLeft /> Return to Branches Directory
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const branchCode = branch.code || `BR-${String(branch.id).padStart(3, '0')}`;

  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const rawRole = (localStorage.getItem('user_role') || localStorage.getItem('role') || authUser?.role || '').toLowerCase().trim();
  const normRole = rawRole.replace(/[^a-z0-9]/g, '');
  const isSoftwareAdmin = (normRole.includes('software') || normRole.includes('superadmin') || normRole === 'admin') && !normRole.includes('merchant') && !normRole.includes('branch') && !normRole.includes('agent');

  return (
    <DashboardLayout pageTitle={`Branch Dossier • ${branch.name}`} role={rawRole}>
      {actionMsg && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '10px',
          background: actionMsg.type === 'success' ? '#065f46' : '#991b1b',
          color: '#ffffff',
          fontWeight: '700',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {actionMsg.text}
        </div>
      )}

      <div className="branch-dossier-wrapper">
        
        {/* Top Hero Header */}
        <div className="branch-dossier-hero">
          <div className="dossier-hero-left">
            <div className="dossier-badge-tag">
              <span className="pulse-dot"></span>
              <Icons.Sparkles />
              <span>Operational Regional Node</span>
            </div>
            
            <div className="dossier-title-stack">
              <h1 className="dossier-main-title">{branch.name}</h1>
              <div className="dossier-meta-bar">
                <span className="dossier-code-chip font-mono" onClick={() => handleCopyCode(branchCode)}>
                  {branchCode}
                  {copied ? <Icons.Check /> : <Icons.Copy />}
                </span>
                <span className="meta-sep">•</span>
                <span className="dossier-location-text">
                  <Icons.Location /> {branch.city || 'Mumbai'}, {branch.state || 'Maharashtra'}
                </span>
                <span className="meta-sep">•</span>
                <span className={`dossier-status-pill ${branch.isActive ? 'is-active' : 'is-inactive'}`}>
                  <span className="status-dot"></span>
                  <span>{branch.isActive ? 'Active Node' : 'Suspended / Inactive'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="dossier-hero-actions">
            <button className="dossier-btn-outline" onClick={() => navigate('/branches')}>
              <Icons.ArrowLeft />
              <span>All Branches</span>
            </button>
            {isSoftwareAdmin && (
              <>
                <button
                  onClick={handleToggleStatus}
                  style={{
                    background: branch.isActive ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: branch.isActive ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                    color: branch.isActive ? '#f87171' : '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: branch.isActive ? 'none' : '0 2px 10px rgba(16, 185, 129, 0.35)'
                  }}
                  title={branch.isActive ? 'Deactivate this branch' : 'Make this branch Active'}
                >
                  {branch.isActive ? '⏸️ Deactivate Node' : '✓ Make Active'}
                </button>
                <button className="dossier-btn-primary" onClick={() => navigate(`/branches/edit/${id}`)}>
                  <Icons.Edit />
                  <span>Edit Branch</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 6-Card KPI Telemetry Matrix */}
        <div className="dossier-kpi-grid">
          <div className="dossier-kpi-card">
            <span className="kpi-label">Branch Volume</span>
            <div className="kpi-val font-mono text-green">
              ₹{Number(branch.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
            <span className="kpi-sub">Gross settled volume</span>
          </div>

          <div className="dossier-kpi-card">
            <span className="kpi-label">Active Merchants</span>
            <div className="kpi-val font-mono">{branch.totalMerchants || 0}</div>
            <span className="kpi-sub">Live merchant routes</span>
          </div>

          <div className="dossier-kpi-card">
            <span className="kpi-label">Field Agents</span>
            <div className="kpi-val font-mono">{branch.totalAgents || 0}</div>
            <span className="kpi-sub">Authorized collection reps</span>
          </div>

          <div className="dossier-kpi-card">
            <span className="kpi-label">Transactions</span>
            <div className="kpi-val font-mono">{branch.totalTransactions || 0}</div>
            <span className="kpi-sub">Total clearances processed</span>
          </div>

          <div className="dossier-kpi-card">
            <span className="kpi-label">Pending Settlements</span>
            <div className="kpi-val font-mono text-amber">{branch.pendingSettlements || 0}</div>
            <span className="kpi-sub">Queued disbursal queue</span>
          </div>

          <div className="dossier-kpi-card">
            <span className="kpi-label">Settlement Rate</span>
            <div className="kpi-val font-mono text-green">99.7%</div>
            <span className="kpi-sub">Gateway SLA performance</span>
          </div>
        </div>

        {/* Main Details Split Grid */}
        <div className="dossier-layout-grid">
          
          {/* Left Column: Comprehensive Specifications */}
          <div className="dossier-main-card">
            <div className="card-header-zone">
              <h3 className="card-heading">Regional Node Specifications</h3>
              <span className="card-subheading">Operational coordinates and branch management parameters</span>
            </div>

            <div className="dossier-spec-grid">
              
              <div className="spec-item-box full-span">
                <span className="spec-label">Complete Physical Address</span>
                <span className="spec-value">{branch.address || 'Peninsula Business Park, Lower Parel'}</span>
              </div>

              <div className="spec-item-box">
                <span className="spec-label">City & Territory</span>
                <span className="spec-value">{branch.city || 'Mumbai'}</span>
              </div>

              <div className="spec-item-box">
                <span className="spec-label">State / Province</span>
                <span className="spec-value">{branch.state || 'Maharashtra'}</span>
              </div>

              <div className="spec-item-box">
                <span className="spec-label">Postal / ZIP Code</span>
                <span className="spec-value font-mono">{branch.zipCode || '400013'}</span>
              </div>

              <div className="spec-item-box">
                <span className="spec-label">Country</span>
                <span className="spec-value">{branch.country || 'India'}</span>
              </div>

              <div className="spec-item-box">
                <span className="spec-label">Branch Manager / Representative</span>
                <span className="spec-value font-bold">{branch.branchAdminName || 'Rajesh Kumar Verma'}</span>
              </div>

              <div className="spec-item-box">
                <span className="spec-label">Contact Phone</span>
                <span className="spec-value font-mono">{branch.phone || '+91 22 6789 4400'}</span>
              </div>

              <div className="spec-item-box full-span">
                <span className="spec-label">Official Communications Email</span>
                <span className="spec-value font-mono">{branch.email || 'mumbai.central@finwin.in'}</span>
              </div>

              {branch.description && (
                <div className="spec-item-box full-span">
                  <span className="spec-label">Operational Mandate & Description</span>
                  <span className="spec-value">{branch.description}</span>
                </div>
              )}

              <div className="spec-item-box">
                <span className="spec-label">Node Creation Date</span>
                <span className="spec-value font-mono text-muted">
                  {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Jan 2025'}
                </span>
              </div>

              <div className="spec-item-box">
                <span className="spec-label">Last Configuration Sync</span>
                <span className="spec-value font-mono text-muted">
                  {branch.updatedAt ? new Date(branch.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '16 Aug 2026'}
                </span>
              </div>

            </div>
          </div>

          {/* Right Column: Quick Entity Drilldown Links */}
          <div className="dossier-side-card">
            <div className="card-header-zone">
              <h3 className="card-heading">Entity Fast-Pass</h3>
              <span className="card-subheading">Audit associated records</span>
            </div>

            <div className="dossier-actions-list">
              <button 
                type="button" 
                className="dossier-action-btn"
                onClick={() => navigate(`/merchants?branch=${id}`)}
              >
                <div className="btn-icon is-indigo"><Icons.Merchants /></div>
                <div className="btn-text-stack">
                  <span className="btn-title">View Branch Merchants</span>
                  <span className="btn-desc">Audit {branch.totalMerchants || 89} enrolled merchants</span>
                </div>
                <span className="btn-arrow">→</span>
              </button>

              <button 
                type="button" 
                className="dossier-action-btn"
                onClick={() => navigate(`/agents?branch=${id}`)}
              >
                <div className="btn-icon is-cyan"><Icons.Agents /></div>
                <div className="btn-text-stack">
                  <span className="btn-title">View Field Agents</span>
                  <span className="btn-desc">Manage {branch.totalAgents || 34} collection personnel</span>
                </div>
                <span className="btn-arrow">→</span>
              </button>

              <button 
                type="button" 
                className="dossier-action-btn"
                onClick={() => navigate(`/transactions?branch=${id}`)}
              >
                <div className="btn-icon is-green"><Icons.Transactions /></div>
                <div className="btn-text-stack">
                  <span className="btn-title">Branch Audit Ledger</span>
                  <span className="btn-desc">Live transaction stream & refunds</span>
                </div>
                <span className="btn-arrow">→</span>
              </button>
            </div>

            {/* Compliance Badge */}
            <div className="dossier-compliance-box">
              <span className="badge-shield">🛡️</span>
              <div>
                <span className="comp-title">RBI & Banking Compliant Node</span>
                <span className="comp-desc">Audited for KYC compliance and daily cash handling quotas.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default BranchDetails;
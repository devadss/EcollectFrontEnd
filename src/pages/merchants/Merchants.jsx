import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { useDialog } from '../../context/DialogContext';
import { merchantApi } from '../../services/api';
import './Merchants.css';

// Crisp SVG Icons
const MerchIcons = {
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
  Building: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Check: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Pause: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  Clock: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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
  Settings: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
  )
};

const Merchants = () => {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE'
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewLayout, setViewLayout] = useState('table'); // 'grid' | 'table'
  const [approvingId, setApprovingId] = useState(null);
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
  const isSoftwareAdmin = (normRole.includes('software') || normRole.includes('superadmin') || normRole === 'admin') && !normRole.includes('merchant') && !normRole.includes('branch') && !normRole.includes('agent');

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await merchantApi.getAll();
      const listData = res?.data?.data || res?.data || [];
      const safeData = Array.isArray(listData) ? listData : [];

      setMerchants(safeData);
    } catch (err) {
      console.error('Error loading merchants:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load merchants directory');
      setMerchants([]);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 350);
    }
  };

  const handleApproveMerchant = (id, name) => {
    showConfirm({
      title: 'Approve Merchant KYC',
      message: `Are you sure you want to approve and activate merchant "${name}"? This will enable live payment processing.`,
      confirmText: 'Yes, Approve',
      type: 'confirm',
      onConfirm: async () => {
        try {
          setApprovingId(id);
          await merchantApi.approve(id);
          showSuccess(`Merchant "${name}" KYC has been verified and account is now active.`, "Merchant Approved");
          loadMerchants();
        } catch (err) {
          console.error('Error approving merchant:', err);
          showError(err?.response?.data?.message || err.message || 'Failed to approve merchant.', 'Approval Failed');
        } finally {
          setApprovingId(null);
        }
      }
    });
  };

  const handleDelete = (id, name) => {
    showConfirm({
      title: 'Deactivate Merchant',
      message: `Are you sure you want to deactivate merchant "${name || id}"? All connected agents and branch routing will be suspended.`,
      confirmText: 'Yes, Deactivate',
      type: 'warning',
      onConfirm: async () => {
        try {
          await merchantApi.delete(id);
          showSuccess(`Merchant "${name || id}" has been deactivated successfully.`, "Merchant Deactivated");
          loadMerchants();
        } catch (err) {
          console.error('Error deleting merchant:', err);
          showError(err?.response?.data?.message || err.message || 'Failed to delete merchant.', 'Deactivation Failed');
        }
      }
    });
  };

  // Safe Stats Calculation
  const totalMerchants = merchants.length;
  const activeMerchants = merchants.filter(m => m.isActive && (m.isApproved !== false)).length;
  const pendingApprovals = merchants.filter(m => m.isApproved === false).length;
  const inactiveMerchants = merchants.filter(m => !m.isActive).length;

  // Filter Logic
  const filteredMerchants = useMemo(() => {
    return merchants.filter(m => {
      const q = search.toLowerCase().trim();
      const tradeName = (m.merchantTradeName || m.companyLegalName || m.merchantName || m.name || '').toLowerCase();
      const email = (m.registeredEmail || m.email || '').toLowerCase();
      const phone = (m.registeredPhone || m.phone || '');
      const cat = (m.businessCategory || '').toLowerCase();
      const pan = (m.panNumber || '').toLowerCase();
      const idStr = String(m.id || '');

      const matchesSearch = !q || tradeName.includes(q) || email.includes(q) || phone.includes(q) || cat.includes(q) || pan.includes(q) || idStr.includes(q);
      const matchesCategory = !categoryFilter || cat === categoryFilter.toLowerCase();

      let matchesStatusTab = true;
      if (selectedStatusTab === 'ACTIVE') matchesStatusTab = m.isActive && (m.isApproved !== false);
      if (selectedStatusTab === 'PENDING') matchesStatusTab = m.isApproved === false;
      if (selectedStatusTab === 'INACTIVE') matchesStatusTab = !m.isActive;

      return matchesSearch && matchesCategory && matchesStatusTab;
    });
  }, [merchants, search, categoryFilter, selectedStatusTab]);

  return (
    <DashboardLayout pageTitle="Merchants Directory">
      {loading && <LoadingAnimation message="Loading Merchant Records..." />}
      
      <div className="merchants-root-container">
        
        {/* Top Header Row */}
        <div className="merch-hero-header">
          <div className="merch-hero-titles">
            <div className="merch-badge-tag">
              <span className="pulse-dot"></span>
              <MerchIcons.Sparkles />
              <span>Verified Enterprise Merchant Network</span>
            </div>
            <h1 className="merch-page-title">
              Merchant <span className="gradient-text">Directory</span>
            </h1>
            <p className="merch-page-subtitle">
              Audit corporate credentials, gateway integration routing, settlement banks, and compliance status
            </p>
          </div>

          <div className="merch-header-actions">
            <button className="merch-export-btn" onClick={() => window.print()}>
              <MerchIcons.Download />
              <span>Export Ledger</span>
            </button>
            
            <button className="merch-add-btn" onClick={() => navigate('/merchants/add')}>
              <MerchIcons.Plus />
              <span>Onboard Merchant</span>
            </button>
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="merch-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadMerchants} className="merch-retry-btn">Retry Load</button>
          </div>
        )}

        {/* KPI Stats Grid */}
        <div className="merch-kpi-grid">
          
          <div className="merch-kpi-card" onClick={() => setSelectedStatusTab('ALL')}>
            <div className="merch-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)' }}></div>
            <div className="merch-kpi-header">
              <span className="merch-kpi-label">Total Partners</span>
              <div className="merch-kpi-icon is-indigo">
                <MerchIcons.Building />
              </div>
            </div>
            <div className="merch-kpi-value font-mono">{totalMerchants}</div>
            <div className="merch-kpi-footer">
              <span className="merch-trend-tag is-up">
                <MerchIcons.ArrowUp /> Registered
              </span>
            </div>
          </div>

          <div className="merch-kpi-card" onClick={() => setSelectedStatusTab('ACTIVE')}>
            <div className="merch-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)' }}></div>
            <div className="merch-kpi-header">
              <span className="merch-kpi-label">Active & Live</span>
              <div className="merch-kpi-icon is-green">
                <MerchIcons.Check />
              </div>
            </div>
            <div className="merch-kpi-value font-mono">{activeMerchants}</div>
            <div className="merch-kpi-footer">
              <span className="merch-trend-tag is-up">
                <MerchIcons.ArrowUp /> Live Gateways
              </span>
            </div>
          </div>

          <div className="merch-kpi-card" onClick={() => setSelectedStatusTab('PENDING')}>
            <div className="merch-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)' }}></div>
            <div className="merch-kpi-header">
              <span className="merch-kpi-label">Pending Approval</span>
              <div className="merch-kpi-icon is-amber">
                <MerchIcons.Clock />
              </div>
            </div>
            <div className="merch-kpi-value font-mono">{pendingApprovals}</div>
            <div className="merch-kpi-footer">
              <span className="merch-trend-tag is-down">
                <MerchIcons.ArrowDown /> Requires Review
              </span>
            </div>
          </div>

          <div className="merch-kpi-card" onClick={() => setSelectedStatusTab('INACTIVE')}>
            <div className="merch-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)' }}></div>
            <div className="merch-kpi-header">
              <span className="merch-kpi-label">Inactive / Suspended</span>
              <div className="merch-kpi-icon is-red">
                <MerchIcons.Pause />
              </div>
            </div>
            <div className="merch-kpi-value font-mono">{inactiveMerchants}</div>
            <div className="merch-kpi-footer">
              <span className="merch-trend-tag is-down">
                <MerchIcons.ArrowDown /> Suspended
              </span>
            </div>
          </div>

        </div>

        {/* Filter Bar & Directory Table Card */}
        <div className="merch-directory-card">
          
          {/* Filter Bar */}
          <div className="merch-filter-bar">
            
            {/* Status Segmented Tabs */}
            <div className="status-segmented-tabs">
              <button 
                className={`tab-btn ${selectedStatusTab === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusTab('ALL')}
              >
                All Partners ({totalMerchants})
              </button>
              <button 
                className={`tab-btn ${selectedStatusTab === 'ACTIVE' ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusTab('ACTIVE')}
              >
                Active ({activeMerchants})
              </button>
              <button 
                className={`tab-btn ${selectedStatusTab === 'PENDING' ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusTab('PENDING')}
              >
                Pending ({pendingApprovals})
              </button>
              <button 
                className={`tab-btn ${selectedStatusTab === 'INACTIVE' ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusTab('INACTIVE')}
              >
                Inactive ({inactiveMerchants})
              </button>
            </div>

            {/* Search, Category, and Layout Switcher Cluster */}
            <div className="filter-controls-cluster">
              <div className="search-input-box">
                <span className="search-symbol"><MerchIcons.Search /></span>
                <input
                  type="text"
                  placeholder="Search partner, PAN, email, phone, ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="merch-search-field"
                />
                {search && (
                  <button className="clear-search-btn" onClick={() => setSearch('')}>✕</button>
                )}
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="category-filter-select"
              >
                <option value="">All Categories</option>
                <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                <option value="SaaS & Technology">SaaS & Technology</option>
                <option value="Fintech & Lending">Fintech & Lending</option>
                <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                <option value="Agriculture & Supply">Agriculture & Supply</option>
                <option value="Electronics & Hardware">Electronics & Hardware</option>
              </select>

              {/* View Mode Toggle */}
              <div className="merch-view-switcher">
                <button
                  className={`view-btn ${viewLayout === 'table' ? 'is-active' : ''}`}
                  onClick={() => setViewLayout('table')}
                  title="Table View"
                >
                  ☰
                </button>
                <button
                  className={`view-btn ${viewLayout === 'grid' ? 'is-active' : ''}`}
                  onClick={() => setViewLayout('grid')}
                  title="Grid Cards View"
                >
                  ⊞
                </button>
              </div>
            </div>

          </div>

          {/* Grid Layout View */}
          {viewLayout === 'grid' ? (
            <div className="merch-cards-grid">
              {filteredMerchants.length === 0 ? (
                <div className="empty-merch-box" style={{ gridColumn: '1 / -1', padding: '60px 20px' }}>
                  <span className="empty-glyph">🏪</span>
                  <h4>No Merchant Partners Found</h4>
                  <p>No records match your search filter or selected status tab.</p>
                  <button className="merch-quick-add-btn" onClick={() => navigate('/merchants/add')}>
                    <MerchIcons.Plus /> Onboard First Merchant
                  </button>
                </div>
              ) : (
                filteredMerchants.map((m) => {
                  const tradeName = m.merchantTradeName || m.companyLegalName || m.merchantName || m.name || `Merchant #${m.id}`;
                  const legalName = m.companyLegalName || '';
                  const isGatewayLive = m.integrationStatus === 'Y' || m.IntegrationStatus === 'Y' || m.integrationStatus === 'Yes' || m.isActive;
                  const isKycApproved = m.isApproved !== false;

                  return (
                    <div key={m.id} className="merch-card-profile">
                      <div className="merch-card-top">
                        <div className="merch-avatar-big">
                          {tradeName.charAt(0).toUpperCase()}
                        </div>
                        <div className="merch-card-info">
                          <h4 className="merch-card-name" title={tradeName}>{tradeName}</h4>
                          {legalName && legalName !== tradeName && (
                            <span className="merch-card-legal" title={legalName}>{legalName}</span>
                          )}
                          <span className="merch-card-id font-mono">ID: #{m.id}</span>
                        </div>
                      </div>

                      <div className="merch-card-tags">
                        <span className="merch-pill-category">{m.businessCategory || 'General Partner'}</span>
                        {m.entityType && <span className="merch-pill-entity">{m.entityType}</span>}
                        <span className={`merch-pill-gateway ${isGatewayLive ? 'is-live' : 'is-manual'}`}>
                          <span className="pill-dot"></span>
                          {isGatewayLive ? '⚡ Live Gateway' : 'Standard'}
                        </span>
                      </div>

                      <div className="merch-card-details">
                        <div className="detail-row">
                          <span className="detail-label">Email:</span>
                          <span className="detail-val">{m.registeredEmail || m.email || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Phone:</span>
                          <span className="detail-val font-mono">{m.registeredPhone || m.phone || 'N/A'}</span>
                        </div>
                        {m.panNumber && (
                          <div className="detail-row">
                            <span className="detail-label">PAN:</span>
                            <span className="detail-val font-mono text-amber">{m.panNumber}</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span className="detail-label">KYC Status:</span>
                          <span className={`kyc-status-chip ${isKycApproved ? 'approved' : 'pending'}`}>
                            {isKycApproved ? '✓ KYC Verified' : '⏳ Pending Review'}
                          </span>
                        </div>
                      </div>

                      <div className="merch-card-actions">
                        <button className="btn-action is-view" onClick={() => navigate(`/merchants/${m.id}`)}>
                          <MerchIcons.Eye /> Dossier
                        </button>
                        <button className="btn-action is-config" onClick={() => navigate(`/merchants/merchantconfig?merchant=${m.id}`)}>
                          <MerchIcons.Settings /> Config
                        </button>
                        <button className="btn-action is-edit" onClick={() => navigate(`/merchants/edit/${m.id}`)}>
                          <MerchIcons.Edit /> Edit
                        </button>
                        {isSoftwareAdmin && !isKycApproved && (
                          <button
                            className="btn-action is-approve"
                            disabled={approvingId === m.id}
                            onClick={() => handleApproveMerchant(m.id, tradeName)}
                          >
                            ✓ Approve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Table Viewport */
            <div className="merch-table-viewport">
              <table className="merch-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Merchant Partner</th>
                    <th>Contact Credentials</th>
                    <th>Business Category</th>
                    <th>Integration Gateway</th>
                    <th>Compliance Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMerchants.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-merch-cell">
                        <div className="empty-merch-box">
                          <span className="empty-glyph">🏪</span>
                          <h4>No Merchant Partners Found</h4>
                          <p>No records match your search filter or selected status tab.</p>
                          <button className="merch-quick-add-btn" onClick={() => navigate('/merchants/add')}>
                            <MerchIcons.Plus /> Onboard First Merchant
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMerchants.map((m, index) => {
                      const tradeName = m.merchantTradeName || m.companyLegalName || m.merchantName || m.name || `Merchant #${m.id}`;
                      const legalName = m.companyLegalName || '';
                      const isGatewayLive = m.integrationStatus === 'Y' || m.IntegrationStatus === 'Y' || m.integrationStatus === 'Yes' || m.isActive;
                      const isKycApproved = m.isApproved !== false;

                      return (
                        <tr key={m.id || index} className="merch-table-row">
                          <td className="row-index-cell font-mono">
                            {String(index + 1).padStart(2, '0')}
                          </td>
                          
                          {/* Merchant Avatar & Name */}
                          <td>
                            <div className="partner-cell-card">
                              <div className="partner-avatar-bubble">
                                {tradeName.charAt(0).toUpperCase()}
                              </div>
                              <div className="partner-titles">
                                <span className="partner-name-text" title={tradeName}>
                                  {tradeName}
                                </span>
                                {legalName && legalName !== tradeName && (
                                  <span className="partner-legal-text" title={legalName}>
                                    {legalName}
                                  </span>
                                )}
                                <span className="partner-id-badge font-mono">
                                  ID: #{m.id} {m.panNumber ? `• PAN: ${m.panNumber}` : ''}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact Details */}
                          <td>
                            <div className="contact-cell-stack">
                              <span className="contact-item">
                                <MerchIcons.Mail /> {m.registeredEmail || m.email || 'no-email@partner.com'}
                              </span>
                              <span className="contact-item font-mono text-muted">
                                <MerchIcons.Phone /> {m.registeredPhone || m.phone || 'N/A'}
                              </span>
                            </div>
                          </td>

                          {/* Business Category */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span className="category-tag-pill">
                                {m.businessCategory || 'Enterprise Partner'}
                              </span>
                              {m.entityType && (
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{m.entityType}</span>
                              )}
                            </div>
                          </td>

                          {/* Integration Status */}
                          <td>
                            <span className={`integration-chip font-mono ${isGatewayLive ? 'is-live' : 'is-manual'}`}>
                              <span className="integration-dot"></span>
                              {isGatewayLive ? '⚡ Live Gateway' : 'Standard Manual'}
                            </span>
                          </td>

                          {/* Compliance Status */}
                          <td>
                            <span className={`partner-status-badge ${isKycApproved ? 'is-active' : 'is-pending'}`}>
                              <span className="status-glow-dot"></span>
                              <span>{isKycApproved ? '✓ KYC Approved' : '⏳ Pending KYC'}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="merch-action-buttons-row">
                              {isSoftwareAdmin && !isKycApproved && (
                                <button
                                  className="action-btn-pill is-approve-text"
                                  disabled={approvingId === m.id}
                                  onClick={() => handleApproveMerchant(m.id, tradeName)}
                                  title="Approve Merchant KYC"
                                >
                                  {approvingId === m.id ? '...' : '✓ Approve'}
                                </button>
                              )}
                              <button 
                                className="action-btn-pill is-view" 
                                onClick={() => navigate(`/merchants/${m.id}`)}
                                title="View Merchant Profile"
                              >
                                <MerchIcons.Eye />
                                <span>Dossier</span>
                              </button>
                              <button 
                                className="action-btn-pill is-config" 
                                onClick={() => navigate(`/merchants/merchantconfig?merchant=${m.id}`)}
                                title="Gateway Configuration"
                              >
                                <MerchIcons.Settings />
                              </button>
                              <button 
                                className="action-btn-pill is-edit" 
                                onClick={() => navigate(`/merchants/edit/${m.id}`)}
                                title="Edit Credentials"
                              >
                                <MerchIcons.Edit />
                              </button>
                              <button 
                                className="action-btn-pill is-delete" 
                                onClick={() => handleDelete(m.id, tradeName)}
                                title="Deactivate Merchant"
                              >
                                <MerchIcons.Trash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          <div className="merch-table-footer">
            <span>Showing <strong className="font-mono">{filteredMerchants.length}</strong> of <strong className="font-mono">{totalMerchants}</strong> merchant records</span>
            <div className="footer-pagination-info">
              <span>Page 1 of 1</span>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default Merchants;

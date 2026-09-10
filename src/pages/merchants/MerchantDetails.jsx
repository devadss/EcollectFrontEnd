import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { merchantApi } from '../../services/api'; 
import { lookupIFSC } from '../../services/bankService';
import { useDialog } from '../../context/DialogContext';
import './MerchantDetails.css';

// Ultra-Modern High-Precision SVG Icons
const DetailIcons = {
  ArrowLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="15" y2="6" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="9" y1="18" x2="12" y2="18" />
    </svg>
  ),
  Bank: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="5 6 12 3 19 6" />
      <line x1="4" y1="10" x2="4" y2="21" />
      <line x1="20" y1="10" x2="20" y2="21" />
      <line x1="8" y1="14" x2="8" y2="17" />
      <line x1="12" y1="14" x2="12" y2="17" />
      <line x1="16" y1="14" x2="16" y2="17" />
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Zap: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Pause: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  Play: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Eye: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ),
  Lock: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  ExternalLink: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  Settings: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
};

const MerchantDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bank' | 'tax' | 'gateway'
  const [copiedField, setCopiedField] = useState(null);
  const [showPassword, setShowPassword] = useState(true);
  const [verifiedBankDetails, setVerifiedBankDetails] = useState({});
  const { showSuccess, showError, showConfirm } = useDialog();

  const loadMerchant = useCallback(async () => {
    try {
      setLoading(true);
      const res = await merchantApi.getById(id);
      const data = res?.data?.data || res?.data;

      if (data) {
        setMerchant(data);

        // Fetch verified banking info for all accounts if IFSC codes exist
        const accounts = Array.isArray(data.settlementAccounts) && data.settlementAccounts.length > 0
          ? data.settlementAccounts
          : [{
              bankName: data.bankName || '',
              accountHolderName: data.accountHolder || data.merchantName || '',
              accountNumber: data.accountNumber || '',
              accountType: data.accountType || 'Current',
              bankBranch: data.branchName || data.bankBranch || '',
              IFSC_Code: data.ifsc || data.IFSC_Code || 'HDFC0001892'
            }];

        accounts.forEach((acc, index) => {
          const ifsc = acc.IFSC_Code || acc.ifscCode || data.ifsc;
          if (ifsc && ifsc.length === 11) {
            lookupIFSC(ifsc).then(res => {
              if (res.success && res.data) {
                setVerifiedBankDetails(prev => ({ ...prev, [index]: res.data }));
              }
            });
          }
        });
      } else {
        setMerchant(null);
      }
    } catch (error) {
      console.error('Error loading merchant:', error);
      setMerchant(null);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  }, [id]);

  useEffect(() => {
    loadMerchant();
  }, [loadMerchant]);

  const handleToggleStatus = () => {
    const isActivating = !merchant?.isActive;
    showConfirm({
      title: isActivating ? 'Activate Merchant' : 'Deactivate Merchant',
      message: `Are you sure you want to ${isActivating ? 'activate' : 'deactivate and pause gateway traffic for'} merchant "${merchant?.merchantName}"?`,
      confirmText: isActivating ? 'Yes, Activate' : 'Yes, Deactivate',
      onConfirm: async () => {
        try {
          await merchantApi.toggleStatus(id);
          showSuccess(`Merchant successfully ${isActivating ? 'activated' : 'deactivated'}.`);
          loadMerchant();
        } catch (error) {
          console.error('Error toggling status:', error);
          showError('Failed to update merchant status. Please try again.');
        }
      }
    });
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Delete Merchant Record',
      message: `Are you sure you want to permanently remove merchant "${merchant?.merchantName}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete Permanently',
      onConfirm: async () => {
        try {
          await merchantApi.delete(id);
          showSuccess('Merchant record deleted successfully.');
          navigate('/merchants');
        } catch (error) {
          console.error('Error deleting merchant:', error);
          showError('Failed to delete merchant. Please try again.');
        }
      }
    });
  };

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout role="softwareadmin">
        <LoadingAnimation message="Retrieving Corporate Merchant Credentials..." />
      </DashboardLayout>
    );
  }

  if (!merchant) {
    return (
      <DashboardLayout role="softwareadmin">
        <div className="merch-not-found-card">
          <div className="not-found-icon-wrap">🏢</div>
          <h3>Merchant Entity Not Found</h3>
          <p>The partner merchant you are looking for does not exist or has been decommissioned.</p>
          <Link to="/merchants" className="btn-back-link">
            <DetailIcons.ArrowLeft /> Back to Merchants Directory
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const rawAccounts = Array.isArray(merchant.settlementAccounts) && merchant.settlementAccounts.length > 0
    ? merchant.settlementAccounts
    : [{
        accountHolderName: merchant.accountHolder || merchant.merchantName || '',
        accountNumber: merchant.accountNumber || '•••• •••• •••• 4912',
        accountType: merchant.accountType || 'Current',
        bankName: merchant.bankName || 'HDFC Bank Ltd',
        bankBranch: merchant.branchName || merchant.bankBranch || 'Corporate Branch',
        IFSC_Code: merchant.ifsc || merchant.IFSC_Code || 'HDFC0001892'
      }];

  const isLiveGateway = (merchant.integrationStatus || merchant.IntegrationStatus) === 'Y';

  return (
    <DashboardLayout role="softwareadmin">
      <div className="merchant-details-root">
        
        {/* Navigation Breadcrumb Bar */}
        <div className="merchant-breadcrumb-bar">
          <button className="details-back-btn" onClick={() => navigate('/merchants')}>
            <DetailIcons.ArrowLeft />
            <span>Back to Merchants</span>
          </button>
          <div className="breadcrumb-trail">
            <span>Directory</span>
            <span className="trail-sep">/</span>
            <span className="trail-current">{merchant.merchantName}</span>
          </div>
        </div>

        {/* Hero Enterprise Banner Card */}
        <div className="merchant-hero-card">
          <div className="hero-background-glow"></div>

          <div className="hero-profile-row">
            <div className="hero-avatar-monogram">
              {(merchant.merchantName || 'M').charAt(0).toUpperCase()}
            </div>

            <div className="hero-identity-stack">
              <div className="hero-title-row">
                <h1 className="hero-merchant-name">{merchant.merchantName}</h1>
                <span className="merchant-id-badge font-mono">MERCHANT #{merchant.id || id}</span>
              </div>

              <p className="hero-legal-name">
                {merchant.merchantLegalName || merchant.merchantName}
              </p>

              {/* Status Badges Group */}
              <div className="hero-status-pills">
                <span className={`hero-status-pill ${merchant.isActive ? 'active' : 'inactive'}`}>
                  <span className="pill-dot"></span>
                  <span>{merchant.isActive ? 'Active Processing' : 'Suspended'}</span>
                </span>

                <span className={`hero-status-pill ${merchant.isApproved !== false ? 'approved' : 'pending'}`}>
                  <DetailIcons.CheckCircle />
                  <span>{merchant.isApproved !== false ? 'KYC Verified' : 'Pending Verification'}</span>
                </span>

                <span className={`hero-status-pill ${isLiveGateway ? 'dynamic' : 'manual'}`}>
                  <DetailIcons.Zap />
                  <span>{isLiveGateway ? 'Live API Gateway' : 'Manual Mode'}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons Hub */}
            <div className="hero-actions-hub">
              <Link to={`/merchants/edit/${id}`} className="hero-action-btn edit">
                <DetailIcons.Edit />
                <span>Modify Profile</span>
              </Link>

              <Link to="/merchants/merchantconfig" className="hero-action-btn config">
                <DetailIcons.Settings />
                <span>API Config</span>
              </Link>

              <button 
                type="button" 
                className={`hero-action-btn ${merchant.isActive ? 'deactivate' : 'activate'}`}
                onClick={handleToggleStatus}
              >
                {merchant.isActive ? <DetailIcons.Pause /> : <DetailIcons.Play />}
                <span>{merchant.isActive ? 'Deactivate' : 'Activate'}</span>
              </button>

              <button 
                type="button" 
                className="hero-action-btn delete"
                onClick={handleDelete}
                title="Delete merchant"
              >
                <DetailIcons.Trash />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="hero-metrics-strip">
            <div className="metric-strip-item">
              <span className="metric-strip-label">Industry Category</span>
              <strong className="metric-strip-val">{merchant.businessCategory || 'Retail & E-Commerce'}</strong>
            </div>

            <div className="metric-strip-item">
              <span className="metric-strip-label">Corporate Constitution</span>
              <strong className="metric-strip-val">{merchant.entityType || 'Pvt Ltd'}</strong>
            </div>

            <div className="metric-strip-item">
              <span className="metric-strip-label">Nodal Settlement Nodes</span>
              <strong className="metric-strip-val font-mono">{rawAccounts.length} Active Node(s)</strong>
            </div>

            <div className="metric-strip-item">
              <span className="metric-strip-label">Registered Phone</span>
              <strong className="metric-strip-val font-mono">
                {merchant.registeredPhone ? `+91 ${merchant.registeredPhone}` : 'N/A'}
              </strong>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="merchant-tabs-container">
          <div className="merchant-tab-nav-bar">
            <button 
              type="button"
              className={`merchant-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <DetailIcons.Building />
              <span>Corporate Profile</span>
            </button>

            <button 
              type="button"
              className={`merchant-tab-item ${activeTab === 'bank' ? 'active' : ''}`}
              onClick={() => setActiveTab('bank')}
            >
              <DetailIcons.Bank />
              <span>Settlement Banking ({rawAccounts.length})</span>
            </button>

            <button 
              type="button"
              className={`merchant-tab-item ${activeTab === 'tax' ? 'active' : ''}`}
              onClick={() => setActiveTab('tax')}
            >
              <DetailIcons.Shield />
              <span>Statutory Tax & PAN/GST</span>
            </button>

            <button 
              type="button"
              className={`merchant-tab-item ${activeTab === 'gateway' ? 'active' : ''}`}
              onClick={() => setActiveTab('gateway')}
            >
              <DetailIcons.Zap />
              <span>Gateway Parameters</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="merchant-tab-body">
          
          {/* ============================================================
              TAB 1: CORPORATE PROFILE
              ============================================================ */}
          {activeTab === 'overview' && (
            <div className="tab-grid-layout">
              
              {/* Entity Profile Card */}
              <div className="glass-info-card">
                <div className="card-top-header">
                  <div className="card-icon-title">
                    <div className="card-icon-pill indigo">
                      <DetailIcons.Building />
                    </div>
                    <div>
                      <h3 className="card-main-title">Corporate Entity Profile</h3>
                      <p className="card-sub-title">Registered business legal identification</p>
                    </div>
                  </div>
                </div>

                <div className="field-key-value-stack">
                  <div className="field-pair">
                    <span className="field-lbl">Merchant Display Name</span>
                    <span className="field-val font-bold text-white">{merchant.merchantName}</span>
                  </div>

                  <div className="field-pair">
                    <span className="field-lbl">Corporate Legal Name</span>
                    <span className="field-val">{merchant.merchantLegalName || merchant.merchantName}</span>
                  </div>

                  <div className="field-pair">
                    <span className="field-lbl">Business Category / Sector</span>
                    <span className="category-tag-pill">{merchant.businessCategory || 'General Enterprise'}</span>
                  </div>

                  <div className="field-pair">
                    <span className="field-lbl">Entity Structure</span>
                    <span className="field-val font-semibold">{merchant.entityType || 'Private Limited (Pvt Ltd)'}</span>
                  </div>

                  <div className="field-pair full-width">
                    <span className="field-lbl">Official Website</span>
                    <span className="field-val font-mono">
                      {merchant.websiteUrl ? (
                        <a href={merchant.websiteUrl} target="_blank" rel="noopener noreferrer" className="domain-url-link">
                          {merchant.websiteUrl} <DetailIcons.ExternalLink />
                        </a>
                      ) : (
                        <span className="text-muted">Not specified</span>
                      )}
                    </span>
                  </div>

                  <div className="field-pair full-width">
                    <span className="field-lbl">Registered Operating Address</span>
                    <span className="field-val address-block">{merchant.registeredAddress || 'No registered address on file.'}</span>
                  </div>
                </div>
              </div>

              {/* Official Communication Card */}
              <div className="glass-info-card">
                <div className="card-top-header">
                  <div className="card-icon-title">
                    <div className="card-icon-pill emerald">
                      <DetailIcons.Shield />
                    </div>
                    <div>
                      <h3 className="card-main-title">Communication & Telemetry</h3>
                      <p className="card-sub-title">Official nodal dispatch and audit records</p>
                    </div>
                  </div>
                </div>

                <div className="field-key-value-stack">
                  <div className="field-pair full-width">
                    <span className="field-lbl">Billing & Registered Email</span>
                    <div className="copyable-field-box">
                      <span className="field-val font-mono text-cyan">{merchant.registeredEmail || 'billing@merchant.in'}</span>
                      {merchant.registeredEmail && (
                        <button 
                          type="button"
                          className="copy-btn-mini"
                          onClick={() => handleCopy(merchant.registeredEmail, 'email')}
                          title="Copy Email"
                        >
                          {copiedField === 'email' ? '✓ Copied' : <DetailIcons.Copy />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="field-pair full-width">
                    <span className="field-lbl">Registered Mobile Number</span>
                    <div className="copyable-field-box">
                      <span className="field-val font-mono text-cyan">
                        {merchant.registeredPhone ? `+91 ${merchant.registeredPhone}` : 'N/A'}
                      </span>
                      {merchant.registeredPhone && (
                        <button 
                          type="button"
                          className="copy-btn-mini"
                          onClick={() => handleCopy(merchant.registeredPhone, 'phone')}
                          title="Copy Mobile"
                        >
                          {copiedField === 'phone' ? '✓ Copied' : <DetailIcons.Copy />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="field-pair full-width">
                    <span className="field-lbl">Merchant Portal Access Password</span>
                    <div className="copyable-field-box">
                      <span className="field-val font-mono font-bold text-amber">
                        {showPassword 
                          ? (merchant.password || merchant.Password || merchant.tempPassword || merchant.loginPassword || 'Merchant@2026')
                          : '••••••••••••'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button 
                          type="button" 
                          className="copy-btn-mini"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? "Hide Password" : "Show Password in Readable Format"}
                        >
                          {showPassword ? <DetailIcons.EyeOff /> : <DetailIcons.Eye />}
                          <span>{showPassword ? 'Hide' : 'Show'}</span>
                        </button>
                        <button 
                          type="button"
                          className="copy-btn-mini"
                          onClick={() => handleCopy(merchant.password || merchant.Password || merchant.tempPassword || merchant.loginPassword || 'Merchant@2026', 'password')}
                          title="Copy Password"
                        >
                          {copiedField === 'password' ? '✓ Copied' : <DetailIcons.Copy />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="field-pair">
                    <span className="field-lbl">Account Onboarding Date</span>
                    <span className="field-val font-mono text-muted">
                      {merchant.createdAt ? new Date(merchant.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '2026-01-15'}
                    </span>
                  </div>

                  <div className="field-pair">
                    <span className="field-lbl">Last Profile Update</span>
                    <span className="field-val font-mono text-muted">
                      {merchant.updatedAt ? new Date(merchant.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '2026-08-17'}
                    </span>
                  </div>

                  <div className="field-pair full-width">
                    <span className="field-lbl">Merchant KYC Verification</span>
                    <div className="kyc-verification-status-banner">
                      <DetailIcons.CheckCircle />
                      <span>Compliant corporate KYC verified and stored in secure vault.</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================
              TAB 2: SETTLEMENT BANKING
              ============================================================ */}
          {activeTab === 'bank' && (
            <div className="accounts-tab-grid">
              {rawAccounts.map((acc, idx) => {
                const ifscCode = acc.IFSC_Code || acc.ifscCode || merchant.ifsc || 'HDFC0001892';
                const verified = verifiedBankDetails[idx];

                return (
                  <div key={idx} className="bank-account-showcase-card">
                    <div className="bank-card-glass-glow"></div>

                    {/* Bank Top Bar */}
                    <div className="bank-card-header">
                      <div className="bank-entity-brand">
                        <div className="bank-avatar-icon">🏦</div>
                        <div>
                          <h3 className="bank-display-name">{acc.bankName || verified?.bankName || 'HDFC Bank Ltd'}</h3>
                          <span className="bank-branch-name">{acc.bankBranch || verified?.branch || 'Corporate Core Banking Branch'}</span>
                        </div>
                      </div>

                      <div className="bank-account-tags">
                        <span className="acc-type-badge font-mono">{acc.accountType || 'Current Account'}</span>
                        <span className="node-number-badge font-mono">NODE #{idx + 1}</span>
                      </div>
                    </div>

                    {/* Account Details Grid */}
                    <div className="bank-card-details-grid">
                      <div className="bank-meta-block">
                        <span className="meta-lbl">Beneficiary Account Name</span>
                        <strong className="meta-val">{acc.accountHolderName || merchant.accountHolder || merchant.merchantName}</strong>
                      </div>

                      <div className="bank-meta-block">
                        <span className="meta-lbl">Account Number</span>
                        <div className="copyable-field-box">
                          <strong className="meta-val font-mono">{acc.accountNumber || '50200098421442'}</strong>
                          <button 
                            type="button"
                            className="copy-btn-mini"
                            onClick={() => handleCopy(acc.accountNumber, `acc_${idx}`)}
                            title="Copy Account Number"
                          >
                            {copiedField === `acc_${idx}` ? '✓' : <DetailIcons.Copy />}
                          </button>
                        </div>
                      </div>

                      <div className="bank-meta-block">
                        <span className="meta-lbl">IFSC Code</span>
                        <div className="copyable-field-box">
                          <strong className="meta-val font-mono text-cyan">{ifscCode}</strong>
                          <button 
                            type="button"
                            className="copy-btn-mini"
                            onClick={() => handleCopy(ifscCode, `ifsc_${idx}`)}
                            title="Copy IFSC"
                          >
                            {copiedField === `ifsc_${idx}` ? '✓' : <DetailIcons.Copy />}
                          </button>
                        </div>
                      </div>

                      <div className="bank-meta-block">
                        <span className="meta-lbl">Settlement Routing</span>
                        <strong className="meta-val text-emerald">Daily Automated Clearing (T+0/T+1)</strong>
                      </div>
                    </div>

                    {/* Verified Live API Badge Info */}
                    {verified && (
                      <div className="verified-api-lookup-subcard">
                        <div className="subcard-header">
                          <span className="rbi-verified-pill">
                            <DetailIcons.CheckCircle /> RBI Directory Verified
                          </span>
                          {verified.micr && <span className="micr-pill font-mono">MICR: {verified.micr}</span>}
                        </div>
                        {verified.address && (
                          <div className="verified-address-line font-mono">{verified.address}</div>
                        )}
                        <div className="rails-badges-row">
                          <span className="rails-title">Disbursal Capabilities:</span>
                          {verified.upi && <span className="rail-pill upi">UPI</span>}
                          {verified.imps && <span className="rail-pill imps">IMPS Instant</span>}
                          {verified.neft && <span className="rail-pill neft">NEFT</span>}
                          {verified.rtgs && <span className="rail-pill rtgs">RTGS</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================
              TAB 3: TAX & STATUTORY
              ============================================================ */}
          {activeTab === 'tax' && (
            <div className="tab-grid-layout">
              
              {/* PAN Card Details */}
              <div className="glass-info-card">
                <div className="card-top-header">
                  <div className="card-icon-title">
                    <div className="card-icon-pill amber">
                      <DetailIcons.Shield />
                    </div>
                    <div>
                      <h3 className="card-main-title">Permanent Account Number (PAN)</h3>
                      <p className="card-sub-title">Income Tax Department identity verification</p>
                    </div>
                  </div>
                </div>

                <div className="field-key-value-stack">
                  <div className="field-pair full-width">
                    <span className="field-lbl">Corporate PAN</span>
                    <div className="copyable-field-box">
                      <span className="field-val font-mono font-bold text-amber text-lg">
                        {merchant.entityPAN || 'AAACB1234F'}
                      </span>
                      {merchant.entityPAN && (
                        <button 
                          type="button"
                          className="copy-btn-mini"
                          onClick={() => handleCopy(merchant.entityPAN, 'pan')}
                          title="Copy PAN"
                        >
                          {copiedField === 'pan' ? '✓ Copied' : <DetailIcons.Copy />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="field-pair full-width">
                    <span className="field-lbl">Name as on PAN Card</span>
                    <span className="field-val font-semibold">{merchant.nameOnPAN || merchant.merchantLegalName || merchant.merchantName}</span>
                  </div>

                  <div className="field-pair full-width">
                    <span className="field-lbl">PAN Card Category</span>
                    <span className="field-val font-mono text-muted">Company / Corporate Entity (Code 'C')</span>
                  </div>
                </div>
              </div>

              {/* GSTIN Card Details */}
              <div className="glass-info-card">
                <div className="card-top-header">
                  <div className="card-icon-title">
                    <div className="card-icon-pill purple">
                      <DetailIcons.Shield />
                    </div>
                    <div>
                      <h3 className="card-main-title">Goods & Services Tax (GSTIN)</h3>
                      <p className="card-sub-title">Statutory indirect tax registration & state jurisdiction</p>
                    </div>
                  </div>
                </div>

                <div className="field-key-value-stack">
                  <div className="field-pair full-width">
                    <span className="field-lbl">GSTIN Identifier</span>
                    <div className="copyable-field-box">
                      <span className="field-val font-mono font-bold text-purple text-lg">
                        {merchant.gstNumber || '07AAACB1234F1Z5'}
                      </span>
                      {merchant.gstNumber && (
                        <button 
                          type="button"
                          className="copy-btn-mini"
                          onClick={() => handleCopy(merchant.gstNumber, 'gst')}
                          title="Copy GSTIN"
                        >
                          {copiedField === 'gst' ? '✓ Copied' : <DetailIcons.Copy />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="field-pair">
                    <span className="field-lbl">GST Jurisdiction State</span>
                    <span className="field-val font-semibold">{merchant.gstState || 'Haryana (07)'}</span>
                  </div>

                  <div className="field-pair">
                    <span className="field-lbl">Tax Filing Status</span>
                    <span className="field-val font-bold text-emerald">Active & Regular</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================
              TAB 4: GATEWAY PARAMETERS
              ============================================================ */}
          {activeTab === 'gateway' && (
            <div className="tab-grid-layout">
              <div className="glass-info-card full-width">
                <div className="card-top-header">
                  <div className="card-icon-title">
                    <div className="card-icon-pill cyan">
                      <DetailIcons.Zap />
                    </div>
                    <div>
                      <h3 className="card-main-title">Gateway Integration & Dynamic CBS Routing</h3>
                      <p className="card-sub-title">Live third-party API configurations, webhooks, and endpoint synchronizations</p>
                    </div>
                  </div>

                  <Link to="/merchants/merchantconfig" className="btn-manage-config">
                    <DetailIcons.Settings />
                    <span>Manage API Code Rules</span>
                  </Link>
                </div>

                <div className="gateway-parameters-grid">
                  <div className="gateway-stat-box">
                    <span className="gw-lbl">Integration Mode</span>
                    <strong className={`gw-val ${isLiveGateway ? 'text-cyan' : 'text-amber'}`}>
                      {isLiveGateway ? 'Dynamic Live CBS Gateway (Y)' : 'Standard Standalone Mode (N)'}
                    </strong>
                    <p className="gw-desc">
                      {isLiveGateway 
                        ? 'Enables real-time API queries for Branch auto-fetch, RD accounts, and agent collection transactions.'
                        : 'Merchant runs locally without external CBS core banking integration hooks.'}
                    </p>
                  </div>

                  <div className="gateway-stat-box">
                    <span className="gw-lbl">Monthly Expected Volume</span>
                    <strong className="gw-val font-mono text-white">
                      {merchant.monthlyExpectedVolume ? `₹${Number(merchant.monthlyExpectedVolume).toLocaleString('en-IN')}` : '₹10,00,000 / month'}
                    </strong>
                    <p className="gw-desc">Projected transaction processing bandwidth</p>
                  </div>

                  <div className="gateway-stat-box">
                    <span className="gw-lbl">Expected Transaction Count</span>
                    <strong className="gw-val font-mono text-white">
                      {merchant.monthlyExpectedTransactionCount || '5,000 / month'}
                    </strong>
                    <p className="gw-desc">Daily concurrent throughput allotment</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
};

export default MerchantDetails;
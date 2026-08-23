import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { merchantApi } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import './MerchantsConfig.css';

// SVG Icons
const ConfigIcons = {
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
  Code: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Layers: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Eye: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
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
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
    </svg>
  )
};

const MerchantsConfig = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccess, showError, showConfirm } = useDialog();
  const [merchantsConfig, setMerchantsConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMerchants();
  }, [id]);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await merchantApi.getAllMerchantConfig();
      const listData = res?.data?.data || res?.data || [];
      const configArray = Array.isArray(listData) ? listData : (listData.result || [listData]);
      setMerchantsConfig(configArray);
    } catch (err) {
      console.error('Error fetching merchant config:', err);
      setError('Failed to load merchant configurations.');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 350);
    }
  };

  const handleDelete = (configId) => {
    showConfirm({
      title: 'Delete API Configuration',
      message: 'Are you sure you want to delete this merchant API configuration?',
      confirmText: 'Yes, Delete',
      type: 'error',
      onConfirm: async () => {
        try {
          const response = await merchantApi.configMerchantDelete(configId);
          showSuccess(response?.data?.message || 'Configuration deleted successfully.', 'Configuration Deleted');
          loadMerchants();
        } catch (err) {
          console.error('Error deleting merchant config:', err);
          showError(err?.response?.data?.message || 'Failed to delete merchant configuration. Please try again.', 'Operation Failed');
        }
      }
    });
  };

  const totalConfigs = merchantsConfig.length;
  const activeConfigs = merchantsConfig.filter(m => m.isActive !== false).length;

  const filteredConfigs = useMemo(() => {
    return merchantsConfig.filter(m => {
      const q = search.toLowerCase().trim();
      return !q ||
        (m.merchantName || '').toLowerCase().includes(q) ||
        (m.apiName || '').toLowerCase().includes(q) ||
        (m.apiCode || '').toLowerCase().includes(q) ||
        (m.productType || '').toLowerCase().includes(q) ||
        (m.httpMethod || '').toLowerCase().includes(q);
    });
  }, [merchantsConfig, search]);

  const getMethodBadgeClass = (method) => {
    const m = (method || 'POST').toUpperCase();
    if (m === 'GET') return 'is-get';
    if (m === 'POST') return 'is-post';
    if (m === 'PUT' || m === 'PATCH') return 'is-put';
    if (m === 'DELETE') return 'is-delete';
    return 'is-post';
  };

  return (
    <DashboardLayout pageTitle="API Gateway Config">
      {loading && <LoadingAnimation message="Loading Endpoint Configurations..." />}
      
      <div className="merch-config-root">
        
        {/* Top Hero Header */}
        <div className="config-hero-header">
          <div className="config-hero-titles">
            <div className="config-badge-tag">
              <span className="pulse-dot"></span>
              <ConfigIcons.Sparkles />
              <span>Integration Orchestration</span>
            </div>
            <h1 className="config-page-title">
              Merchants <span className="gradient-text">API Config</span>
            </h1>
            <p className="config-page-subtitle">
              Manage endpoint routing, webhook definitions, and payment product credentials
            </p>
          </div>

          <div className="config-header-actions">
            <button className="config-export-btn" onClick={() => window.print()}>
              <ConfigIcons.Download />
              <span>Export Schemas</span>
            </button>
            <button className="config-add-btn" onClick={() => navigate('/merchants/merchantconfig/add')}>
              <ConfigIcons.Plus />
              <span>Add Endpoint Config</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="config-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadMerchants} className="config-retry-btn">Retry Load</button>
          </div>
        )}

        {/* KPI Stats Grid */}
        <div className="config-kpi-grid">
          <div className="config-kpi-card">
            <div className="kpi-header-row">
              <span className="kpi-label">Active API Endpoints</span>
              <div className="kpi-icon is-indigo"><ConfigIcons.Code /></div>
            </div>
            <div className="kpi-value font-mono">{totalConfigs}</div>
            <div className="kpi-subtext">Configured routing services</div>
          </div>

          <div className="config-kpi-card">
            <div className="kpi-header-row">
              <span className="kpi-label">Live Gateway Channels</span>
              <div className="kpi-icon is-green"><ConfigIcons.Check /></div>
            </div>
            <div className="kpi-value font-mono">{activeConfigs}</div>
            <div className="kpi-subtext">Endpoints active & ready</div>
          </div>

          <div className="config-kpi-card">
            <div className="kpi-header-row">
              <span className="kpi-label">Supported Protocols</span>
              <div className="kpi-icon is-cyan"><ConfigIcons.Layers /></div>
            </div>
            <div className="kpi-value font-mono">REST / JSON</div>
            <div className="kpi-subtext">HMAC-SHA256 Signed</div>
          </div>
        </div>

        {/* Table & Filter Card */}
        <div className="config-directory-card">
          
          <div className="config-filter-bar">
            <div className="config-search-box">
              <span className="search-symbol"><ConfigIcons.Search /></span>
              <input
                type="text"
                placeholder="Search API code, merchant name, endpoint, product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="config-search-field"
              />
              {search && (
                <button className="clear-search-btn" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
          </div>

          {/* Table Viewport */}
          <div className="config-table-viewport">
            <table className="config-data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Merchant Partner</th>
                  <th>Product Category</th>
                  <th>API Identifier</th>
                  <th>Service Operation</th>
                  <th>HTTP Method</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConfigs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-config-cell">
                      <div className="empty-config-box">
                        <span className="empty-symbol">⚙️</span>
                        <h4>No Merchant API Configurations Found</h4>
                        <p>Configure API integrations to connect payment gateway webhooks and endpoints.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredConfigs.map((m, index) => (
                    <tr key={m.id || index} className="config-table-row">
                      <td className="row-index font-mono">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td>
                        <span className="partner-name font-bold">{m.merchantName || 'Unnamed Merchant'}</span>
                      </td>
                      <td>
                        <span className="product-type-chip">{m.productType || 'Payment Gateway'}</span>
                      </td>
                      <td>
                        <span className="api-code-badge font-mono">{m.apiCode || 'API_GENERIC'}</span>
                      </td>
                      <td>
                        <span className="api-name-text">{m.apiName || 'Process Transaction'}</span>
                      </td>
                      <td>
                        <span className={`method-badge ${getMethodBadgeClass(m.httpMethod)} font-mono`}>
                          {m.httpMethod || 'POST'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-pill-group">
                          <button 
                            className="config-action-btn is-view" 
                            onClick={() => navigate(`/merchants/merchantconfigdetails/${m.id}`)}
                            title="View Configuration"
                          >
                            <ConfigIcons.Eye />
                          </button>
                          <button 
                            className="config-action-btn is-edit" 
                            onClick={() => navigate(`/merchants/merchantconfig/edit/${m.id}`)}
                            title="Edit Configuration"
                          >
                            <ConfigIcons.Edit />
                          </button>
                          <button 
                            className="config-action-btn is-delete" 
                            onClick={() => handleDelete(m.id)}
                            title="Delete Configuration"
                          >
                            <ConfigIcons.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="config-table-footer">
            <span>Showing <strong className="font-mono">{filteredConfigs.length}</strong> of <strong className="font-mono">{totalConfigs}</strong> API configurations</span>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default MerchantsConfig;
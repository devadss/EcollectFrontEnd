import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { refundApi } from '../../services/api';
import './Refund.css';

// SVG Icons
const RefundIcons = {
  RotateCcw: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Coins: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
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
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Copy: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  CheckMark: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
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
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Print: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
};

const Refunds = () => {
  const navigate = useNavigate();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [filter, setFilter] = useState({
    search: '',
    statusTab: 'ALL', // 'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED'
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await refundApi.getAll();
      const listData = res?.data?.data || res?.data || [];
      const safeData = Array.isArray(listData) ? listData : [];

      setRefunds(safeData);
    } catch (err) {
      console.error('Error loading refunds:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load refunds');
      setRefunds([]);
    } finally {
      setTimeout(() => setLoading(false), 350);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Safe Filter Logic
  const filteredRefunds = useMemo(() => {
    return refunds.filter(r => {
      const q = filter.search.toLowerCase().trim();
      const matchesSearch = !q ||
        (r.id || '').toLowerCase().includes(q) ||
        (r.transactionId || '').toLowerCase().includes(q) ||
        (r.merchant || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q);

      let matchesStatusTab = true;
      const s = (r.status || '').toLowerCase();
      if (filter.statusTab === 'COMPLETED') matchesStatusTab = s === 'completed' || s === 'success';
      if (filter.statusTab === 'PENDING') matchesStatusTab = s === 'pending' || s === 'processing';
      if (filter.statusTab === 'FAILED') matchesStatusTab = s === 'failed';

      let matchesDate = true;
      if (filter.dateFrom) {
        matchesDate = new Date(r.date || r.createdAt) >= new Date(filter.dateFrom);
      }
      if (filter.dateTo && matchesDate) {
        matchesDate = new Date(r.date || r.createdAt) <= new Date(filter.dateTo);
      }

      return matchesSearch && matchesStatusTab && matchesDate;
    });
  }, [refunds, filter]);

  // Statistics
  const stats = useMemo(() => {
    const total = refunds.length;
    const completed = refunds.filter(r => (r.status || '').toLowerCase() === 'completed').length;
    const pending = refunds.filter(r => (r.status || '').toLowerCase() === 'pending' || (r.status || '').toLowerCase() === 'processing').length;
    const totalAmount = refunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    return { total, completed, pending, totalAmount };
  }, [refunds]);

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'success') return 'is-completed';
    if (s === 'processing') return 'is-processing';
    if (s === 'pending') return 'is-pending';
    return 'is-failed';
  };

  return (
    <DashboardLayout pageTitle="Refunds & Reversals">
      {loading && <LoadingAnimation message="Loading Refund Disbursal Engine..." />}
      
      <div className="refunds-root-container">
        
        {/* Top Hero Header */}
        <div className="refunds-hero-header">
          <div className="refunds-hero-titles">
            <div className="refunds-badge-tag">
              <span className="pulse-dot"></span>
              <RefundIcons.Sparkles />
              <span>Reversal & Disbursal Engine</span>
            </div>
            <h1 className="refunds-page-title">
              Merchant <span className="gradient-text">Refunds</span>
            </h1>
            <p className="refunds-page-subtitle">
              Manage instant customer clawbacks, dispute resolutions, and automated banking reversals
            </p>
          </div>

          <div className="refunds-header-actions">
            <button className="refunds-export-btn" onClick={() => window.print()}>
              <RefundIcons.Download />
              <span>Export Reversal Ledger</span>
            </button>
            <button className="refunds-add-btn" onClick={() => navigate('/refunds/create')}>
              <RefundIcons.Plus />
              <span>Initiate Refund</span>
            </button>
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="refunds-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadRefunds} className="refunds-retry-btn">Retry Load</button>
          </div>
        )}

        {/* KPI Stats Grid */}
        <div className="refunds-kpi-grid">
          
          <div className="refunds-kpi-card" onClick={() => setFilter(prev => ({ ...prev, statusTab: 'ALL' }))}>
            <div className="refunds-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' }}></div>
            <div className="refunds-kpi-header">
              <span className="refunds-kpi-label">Total Refund Logs</span>
              <div className="refunds-kpi-icon is-indigo"><RefundIcons.RotateCcw /></div>
            </div>
            <div className="refunds-kpi-value font-mono">{stats.total}</div>
            <div className="refunds-kpi-footer">
              <span className="refunds-trend-tag is-up"><RefundIcons.ArrowUp /> Reversals Logged</span>
            </div>
          </div>

          <div className="refunds-kpi-card" onClick={() => setFilter(prev => ({ ...prev, statusTab: 'COMPLETED' }))}>
            <div className="refunds-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
            <div className="refunds-kpi-header">
              <span className="refunds-kpi-label">Disbursed & Settled</span>
              <div className="refunds-kpi-icon is-green"><RefundIcons.Check /></div>
            </div>
            <div className="refunds-kpi-value font-mono">{stats.completed}</div>
            <div className="refunds-kpi-footer">
              <span className="refunds-trend-tag is-up"><RefundIcons.ArrowUp /> Bank Cleared</span>
            </div>
          </div>

          <div className="refunds-kpi-card" onClick={() => setFilter(prev => ({ ...prev, statusTab: 'PENDING' }))}>
            <div className="refunds-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}></div>
            <div className="refunds-kpi-header">
              <span className="refunds-kpi-label">Pending / Processing</span>
              <div className="refunds-kpi-icon is-amber"><RefundIcons.Clock /></div>
            </div>
            <div className="refunds-kpi-value font-mono">{stats.pending}</div>
            <div className="refunds-kpi-footer">
              <span className="refunds-trend-tag is-down"><RefundIcons.ArrowDown /> In Queue</span>
            </div>
          </div>

          <div className="refunds-kpi-card">
            <div className="refunds-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)' }}></div>
            <div className="refunds-kpi-header">
              <span className="refunds-kpi-label">Total Reversed Volume</span>
              <div className="refunds-kpi-icon is-red"><RefundIcons.Coins /></div>
            </div>
            <div className="refunds-kpi-value font-mono text-cyan">₹{stats.totalAmount.toLocaleString('en-IN')}</div>
            <div className="refunds-kpi-footer">
              <span className="refunds-trend-tag is-up"><RefundIcons.ArrowUp /> Clawback Volume</span>
            </div>
          </div>

        </div>

        {/* Ledger Directory Card */}
        <div className="refunds-directory-card">
          
          {/* Filter Bar */}
          <div className="refunds-filter-bar">
            
            {/* Status Segmented Tabs */}
            <div className="status-segmented-tabs">
              <button 
                className={`tab-btn ${filter.statusTab === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setFilter(prev => ({ ...prev, statusTab: 'ALL' }))}
              >
                All Reversals ({refunds.length})
              </button>
              <button 
                className={`tab-btn ${filter.statusTab === 'COMPLETED' ? 'is-active' : ''}`}
                onClick={() => setFilter(prev => ({ ...prev, statusTab: 'COMPLETED' }))}
              >
                Completed ({stats.completed})
              </button>
              <button 
                className={`tab-btn ${filter.statusTab === 'PENDING' ? 'is-active' : ''}`}
                onClick={() => setFilter(prev => ({ ...prev, statusTab: 'PENDING' }))}
              >
                Pending / Processing ({stats.pending})
              </button>
              <button 
                className={`tab-btn ${filter.statusTab === 'FAILED' ? 'is-active' : ''}`}
                onClick={() => setFilter(prev => ({ ...prev, statusTab: 'FAILED' }))}
              >
                Failed
              </button>
            </div>

            {/* Search Cluster */}
            <div className="refunds-search-cluster">
              <div className="refunds-search-box">
                <span className="search-symbol"><RefundIcons.Search /></span>
                <input
                  type="text"
                  placeholder="Search Refund ID, Txn Reference, Reason..."
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="refunds-search-field"
                />
                {filter.search && (
                  <button className="clear-search-btn" onClick={() => setFilter(prev => ({ ...prev, search: '' }))}>✕</button>
                )}
              </div>

              <div className="date-picker-wrap">
                <RefundIcons.Calendar />
                <input
                  type="date"
                  value={filter.dateFrom}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="refunds-date-input"
                  title="From Date"
                />
              </div>

              <div className="date-picker-wrap">
                <RefundIcons.Calendar />
                <input
                  type="date"
                  value={filter.dateTo}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="refunds-date-input"
                  title="To Date"
                />
              </div>
            </div>

          </div>

          {/* Table Viewport */}
          <div className="refunds-table-viewport">
            <table className="refunds-data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Refund ID</th>
                  <th>Original Txn Ref</th>
                  <th>Merchant Partner</th>
                  <th>Refund Amount</th>
                  <th>Dispute / Reversal Reason</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Audit</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-refunds-cell">
                      <div className="empty-refunds-box">
                        <span className="empty-glyph">↩️</span>
                        <h4>No Refund Records Found</h4>
                        <p>No reversal logs match your active filter filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRefunds.map((r, index) => {
                    const statusClass = getStatusClass(r.status);
                    const isCopied = copiedId === r.id;

                    return (
                      <tr key={r.id || index} className="refunds-table-row">
                        <td className="row-index font-mono">{String(index + 1).padStart(2, '0')}</td>
                        
                        {/* Refund ID */}
                        <td>
                          <span className="refund-id-badge font-mono">
                            #{r.id}
                            <button className="mini-copy-btn" onClick={() => handleCopy(r.id, r.id)} title="Copy ID">
                              {isCopied ? <RefundIcons.CheckMark /> : <RefundIcons.Copy />}
                            </button>
                          </span>
                        </td>

                        {/* Txn Reference */}
                        <td>
                          <Link to={`/transactions/${r.transactionId}`} className="txn-link-badge font-mono">
                            #{r.transactionId} ↗
                          </Link>
                        </td>

                        {/* Merchant */}
                        <td>
                          <span className="merchant-name-text font-bold">{r.merchant || 'Apex Retail Services'}</span>
                        </td>

                        {/* Amount */}
                        <td>
                          <span className="refund-amount-text font-mono font-bold">
                            ₹{(Number(r.amount) || 0).toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Reason */}
                        <td>
                          <span className="reason-tag-pill">{r.reason || 'Customer Return'}</span>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`refund-status-pill ${statusClass}`}>
                            <span className="status-dot"></span>
                            <span>{r.status || 'Completed'}</span>
                          </span>
                        </td>

                        {/* Date */}
                        <td>
                          <span className="timestamp-text font-mono text-muted">
                            {r.date ? new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '16 Aug 2026'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="refund-inspect-btn" 
                            onClick={() => setSelectedRefund(r)}
                            title="Inspect Reversal Telemetry"
                          >
                            <RefundIcons.Eye />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="refunds-table-footer">
            <span>Showing <strong className="font-mono">{filteredRefunds.length}</strong> of <strong className="font-mono">{refunds.length}</strong> refund requests</span>
          </div>

        </div>

        {/* Modal: Refund Receipt Audit */}
        {selectedRefund && (
          <div className="refund-modal-backdrop" onClick={() => setSelectedRefund(null)}>
            <div className="refund-modal-card" onClick={(e) => e.stopPropagation()}>
              
              <div className="refund-modal-header">
                <div className="modal-title-row">
                  <div className="modal-avatar">
                    <RefundIcons.RotateCcw />
                  </div>
                  <div>
                    <h3 className="modal-title">Reversal Voucher</h3>
                    <span className="modal-code font-mono">#{selectedRefund.id}</span>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedRefund(null)}>
                  <RefundIcons.Close />
                </button>
              </div>

              <div className="refund-modal-body">
                
                <div className="modal-amount-hero">
                  <span className="hero-amount-label">Reversed Amount</span>
                  <div className="hero-amount-value font-mono">₹{(Number(selectedRefund.amount) || 0).toLocaleString('en-IN')}</div>
                  <span className={`modal-status-badge ${getStatusClass(selectedRefund.status)}`}>
                    <span className="status-dot"></span>
                    <span>{selectedRefund.status || 'Completed'}</span>
                  </span>
                </div>

                <div className="modal-telemetry-grid">
                  <div className="telemetry-item">
                    <span className="item-label">Parent Transaction Reference</span>
                    <span className="item-val font-mono font-bold">#{selectedRefund.transactionId}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Merchant Partner</span>
                    <span className="item-val">{selectedRefund.merchant || 'Apex Retail Services'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Destination Bank Account</span>
                    <span className="item-val font-mono">{selectedRefund.customerAccount || 'SBI Bank •••• 4412'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Reversal RRN</span>
                    <span className="item-val font-mono">{selectedRefund.rrn || 'REF-RRN-9901'}</span>
                  </div>
                  <div className="telemetry-item full-width">
                    <span className="item-label">Justification / Reason</span>
                    <span className="item-val">{selectedRefund.reason || 'Customer Return / Order Cancelled'}</span>
                  </div>
                </div>

              </div>

              <div className="refund-modal-footer">
                <button className="modal-print-btn" onClick={() => window.print()}>
                  <RefundIcons.Print />
                  <span>Print Voucher</span>
                </button>
                <button className="modal-dismiss-btn" onClick={() => setSelectedRefund(null)}>
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Refunds;
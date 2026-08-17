import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { commissionApi } from '../../services/api';  
import './Commission.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// SVG Icons
const CommIcons = {
  Coins: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
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
  Trending: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
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
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
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
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
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

const Commission = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState([]);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [filter, setFilter] = useState({
    search: '',
    statusTab: 'ALL', // 'ALL' | 'PAID' | 'PENDING'
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const res = await commissionApi.getAll();
      const listData = res?.data?.data || res?.data || [];
      const safeData = Array.isArray(listData) ? listData : [];

      setCommissions(safeData);
    } catch (error) {
      console.error('Error loading commissions:', error);
      setCommissions([]);
    } finally {
      setTimeout(() => setLoading(false), 350);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter Logic
  const filteredCommissions = useMemo(() => {
    return commissions.filter(c => {
      const q = filter.search.toLowerCase().trim();
      const matchesSearch = !q ||
        (c.id || '').toLowerCase().includes(q) ||
        (c.agent || '').toLowerCase().includes(q) ||
        (c.agentCode || '').toLowerCase().includes(q) ||
        (c.merchant || '').toLowerCase().includes(q);

      let matchesStatusTab = true;
      const s = (c.status || '').toLowerCase();
      if (filter.statusTab === 'PAID') matchesStatusTab = s === 'paid';
      if (filter.statusTab === 'PENDING') matchesStatusTab = s === 'pending' || s === 'processing';

      let matchesDate = true;
      if (filter.dateFrom) {
        matchesDate = new Date(c.date) >= new Date(filter.dateFrom);
      }
      if (filter.dateTo && matchesDate) {
        matchesDate = new Date(c.date) <= new Date(filter.dateTo);
      }

      return matchesSearch && matchesStatusTab && matchesDate;
    });
  }, [commissions, filter]);

  // Statistics
  const stats = useMemo(() => {
    const totalAmount = filteredCommissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const paidAmount = filteredCommissions.filter(c => (c.status || '').toLowerCase() === 'paid').reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const pendingAmount = filteredCommissions.filter(c => (c.status || '').toLowerCase() === 'pending' || (c.status || '').toLowerCase() === 'processing').reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const totalRecords = filteredCommissions.length;
    return { totalAmount, paidAmount, pendingAmount, totalRecords };
  }, [filteredCommissions]);

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'is-paid';
    if (s === 'processing') return 'is-processing';
    return 'is-pending';
  };

  return (
    <DashboardLayout pageTitle="Commission Schedule">
      {loading && <LoadingAnimation message="Compiling Representative Commissions..." />}
      
      <div className="comm-root-container">
        
        {/* Hero Header */}
        <div className="comm-hero-header">
          <div className="comm-hero-titles">
            <div className="comm-badge-tag">
              <span className="pulse-dot"></span>
              <CommIcons.Sparkles />
              <span>Field Incentive Engine</span>
            </div>
            <h1 className="comm-page-title">
              Agent <span className="gradient-text">Commissions</span>
            </h1>
            <p className="comm-page-subtitle">
              Audit representative collection yields, merchant route shares, and automated disbursement batches
            </p>
          </div>

          <div className="comm-header-actions">
            <button className="comm-export-btn" onClick={() => window.print()}>
              <CommIcons.Download />
              <span>Export Commission Ledger</span>
            </button>
            <button className="comm-add-btn" onClick={() => navigate('/commissions/create')}>
              <CommIcons.Plus />
              <span>Record Commission</span>
            </button>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="comm-kpi-grid">
          
          <div className="comm-kpi-card" onClick={() => setFilter(prev => ({ ...prev, statusTab: 'ALL' }))}>
            <div className="comm-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' }}></div>
            <div className="comm-kpi-header">
              <span className="comm-kpi-label">Gross Commission</span>
              <div className="comm-kpi-icon is-indigo"><CommIcons.Coins /></div>
            </div>
            <div className="comm-kpi-value font-mono text-green">₹{stats.totalAmount.toLocaleString('en-IN')}</div>
            <div className="comm-kpi-footer">
              <span className="comm-trend-tag is-up"><CommIcons.ArrowUp /> {stats.totalRecords} Records</span>
            </div>
          </div>

          <div className="comm-kpi-card" onClick={() => setFilter(prev => ({ ...prev, statusTab: 'PAID' }))}>
            <div className="comm-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
            <div className="comm-kpi-header">
              <span className="comm-kpi-label">Disbursed & Cleared</span>
              <div className="comm-kpi-icon is-green"><CommIcons.Check /></div>
            </div>
            <div className="comm-kpi-value font-mono">₹{stats.paidAmount.toLocaleString('en-IN')}</div>
            <div className="comm-kpi-footer">
              <span className="comm-trend-tag is-up"><CommIcons.ArrowUp /> Bank Cleared</span>
            </div>
          </div>

          <div className="comm-kpi-card" onClick={() => setFilter(prev => ({ ...prev, statusTab: 'PENDING' }))}>
            <div className="comm-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}></div>
            <div className="comm-kpi-header">
              <span className="comm-kpi-label">Pending Approval</span>
              <div className="comm-kpi-icon is-amber"><CommIcons.Clock /></div>
            </div>
            <div className="comm-kpi-value font-mono text-amber">₹{stats.pendingAmount.toLocaleString('en-IN')}</div>
            <div className="comm-kpi-footer">
              <span className="comm-trend-tag is-down"><CommIcons.ArrowUp /> Pending Clearance</span>
            </div>
          </div>

          <div className="comm-kpi-card">
            <div className="comm-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)' }}></div>
            <div className="comm-kpi-header">
              <span className="comm-kpi-label">Avg Commission Rate</span>
              <div className="comm-kpi-icon is-cyan"><CommIcons.Trending /></div>
            </div>
            <div className="comm-kpi-value font-mono">1.6%</div>
            <div className="comm-kpi-footer">
              <span className="comm-trend-tag is-up"><CommIcons.ArrowUp /> Standard Share</span>
            </div>
          </div>

        </div>

        {/* Charts Row: Monthly Payout Bars (8 cols) & Status Doughnut (4 cols) */}
        <div className="comm-charts-grid-row">
          
          <div className="comm-chart-card is-col-8">
            <div className="chart-header-zone">
              <div>
                <h3 className="chart-title">Commission Payout Trajectory</h3>
                <span className="chart-subtitle">Monthly field incentive disbursements</span>
              </div>
              <span className="velocity-metric-badge font-mono">₹32k Peak Dec</span>
            </div>
            <div className="chart-canvas-box">
              <Bar
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                  datasets: [{
                    label: 'Payout (₹)',
                    data: [12000, 15000, 10000, 18000, 14000, 22000, 16000, 25000, 19000, 28000, 22000, 32000],
                    backgroundColor: 'rgba(99, 102, 241, 0.85)',
                    hoverBackgroundColor: 'var(--accent, #6366f1)',
                    borderRadius: 6,
                    barPercentage: 0.55,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(9, 13, 22, 0.95)',
                      titleColor: '#ffffff',
                      bodyColor: 'rgba(255,255,255,0.7)',
                      padding: 12,
                      cornerRadius: 10,
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
                      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
                    },
                    x: {
                      ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
                      grid: { display: false }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="comm-chart-card is-col-4">
            <div className="chart-header-zone">
              <div>
                <h3 className="chart-title">Status Breakdown</h3>
                <span className="chart-subtitle">Clearance ratio</span>
              </div>
            </div>
            <div className="chart-canvas-box doughnut-wrap">
              <Doughnut
                data={{
                  labels: ['Paid', 'Pending', 'Processing'],
                  datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#10b981', '#f59e0b', '#6366f1'],
                    borderColor: 'var(--bgCard, #111827)',
                    borderWidth: 3,
                    hoverOffset: 8,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '74%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: '#94a3b8',
                        padding: 10,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 11, weight: '600' }
                      }
                    }
                  }
                }}
              />
              <div className="doughnut-center-info">
                <span className="center-bold font-mono">65%</span>
                <span className="center-tag">Paid</span>
              </div>
            </div>
          </div>

        </div>

        {/* Directory Ledger Card */}
        <div className="comm-directory-card">
          
          {/* Filter Bar */}
          <div className="comm-filter-bar">
            
            {/* Status Segmented Tabs */}
            <div className="status-segmented-tabs">
              <button 
                className={`tab-btn ${filter.statusTab === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setFilter(prev => ({ ...prev, statusTab: 'ALL' }))}
              >
                All Commissions ({commissions.length})
              </button>
              <button 
                className={`tab-btn ${filter.statusTab === 'PAID' ? 'is-active' : ''}`}
                onClick={() => setFilter(prev => ({ ...prev, statusTab: 'PAID' }))}
              >
                Paid & Cleared
              </button>
              <button 
                className={`tab-btn ${filter.statusTab === 'PENDING' ? 'is-active' : ''}`}
                onClick={() => setFilter(prev => ({ ...prev, statusTab: 'PENDING' }))}
              >
                Pending Approval
              </button>
            </div>

            {/* Search Cluster */}
            <div className="comm-search-cluster">
              <div className="comm-search-box">
                <span className="search-symbol"><CommIcons.Search /></span>
                <input
                  type="text"
                  placeholder="Search agent name, code, merchant..."
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="comm-search-field"
                />
                {filter.search && (
                  <button className="clear-search-btn" onClick={() => setFilter(prev => ({ ...prev, search: '' }))}>✕</button>
                )}
              </div>

              <div className="date-picker-wrap">
                <CommIcons.Calendar />
                <input
                  type="date"
                  value={filter.dateFrom}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="comm-date-input"
                  title="From Date"
                />
              </div>

              <div className="date-picker-wrap">
                <CommIcons.Calendar />
                <input
                  type="date"
                  value={filter.dateTo}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="comm-date-input"
                  title="To Date"
                />
              </div>
            </div>

          </div>

          {/* Table Viewport */}
          <div className="comm-table-viewport">
            <table className="comm-data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Commission Voucher</th>
                  <th>Field Representative</th>
                  <th>Merchant Route</th>
                  <th>Commission Amount</th>
                  <th>Yield Rate</th>
                  <th>Status</th>
                  <th>Payout Date</th>
                  <th style={{ textAlign: 'right' }}>Audit</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-comm-cell">
                      <div className="empty-comm-box">
                        <span className="empty-glyph">💰</span>
                        <h4>No Commission Records Found</h4>
                        <p>No incentive payout logs match your active filter filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCommissions.map((c, index) => {
                    const statusClass = getStatusClass(c.status);
                    const isCopied = copiedId === c.id;

                    return (
                      <tr key={c.id || index} className="comm-table-row">
                        <td className="row-index font-mono">{String(index + 1).padStart(2, '0')}</td>
                        
                        {/* Voucher ID */}
                        <td>
                          <span className="voucher-id-badge font-mono">
                            #{c.id}
                            <button className="mini-copy-btn" onClick={() => handleCopy(c.id, c.id)} title="Copy ID">
                              {isCopied ? <CommIcons.CheckMark /> : <CommIcons.Copy />}
                            </button>
                          </span>
                        </td>

                        {/* Agent */}
                        <td>
                          <div className="agent-cell-chip">
                            <span className="agent-name font-bold">{c.agent || 'Field Agent'}</span>
                            <span className="agent-code font-mono text-muted">{c.agentCode || 'AG-DEL-101'}</span>
                          </div>
                        </td>

                        {/* Merchant */}
                        <td>
                          <span className="merchant-route-tag">{c.merchant || 'Apex Retail Services'}</span>
                        </td>

                        {/* Amount */}
                        <td>
                          <span className="amount-val-text font-mono font-bold text-green">
                            ₹{(Number(c.amount) || 0).toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Yield */}
                        <td>
                          <span className="rate-badge font-mono">{c.rate || '1.5'}%</span>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`comm-status-pill ${statusClass}`}>
                            <span className="status-dot"></span>
                            <span>{c.status || 'Paid'}</span>
                          </span>
                        </td>

                        {/* Date */}
                        <td>
                          <span className="date-val-text font-mono text-muted">
                            {c.date ? new Date(c.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '16 Aug 2026'}
                          </span>
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="comm-inspect-btn" 
                            onClick={() => setSelectedCommission(c)}
                            title="Inspect Commission Voucher"
                          >
                            <CommIcons.Eye />
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
          <div className="comm-table-footer">
            <span>Showing <strong className="font-mono">{filteredCommissions.length}</strong> of <strong className="font-mono">{commissions.length}</strong> commission vouchers</span>
          </div>

        </div>

        {/* Modal: Commission Voucher Disbursal Card */}
        {selectedCommission && (
          <div className="comm-modal-backdrop" onClick={() => setSelectedCommission(null)}>
            <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
              
              <div className="comm-modal-header">
                <div className="modal-title-row">
                  <div className="modal-avatar">
                    <CommIcons.Coins />
                  </div>
                  <div>
                    <h3 className="modal-title">Commission Voucher</h3>
                    <span className="modal-code font-mono">#{selectedCommission.id}</span>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedCommission(null)}>
                  <CommIcons.Close />
                </button>
              </div>

              <div className="comm-modal-body">
                
                <div className="modal-amount-hero">
                  <span className="hero-amount-label">Incentive Yield Value</span>
                  <div className="hero-amount-value font-mono">₹{(Number(selectedCommission.amount) || 0).toLocaleString('en-IN')}</div>
                  <span className={`modal-status-badge ${getStatusClass(selectedCommission.status)}`}>
                    <span className="status-dot"></span>
                    <span>{selectedCommission.status || 'Paid'}</span>
                  </span>
                </div>

                <div className="modal-telemetry-grid">
                  <div className="telemetry-item">
                    <span className="item-label">Field Representative</span>
                    <span className="item-val font-bold">{selectedCommission.agent} ({selectedCommission.agentCode})</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Merchant Route</span>
                    <span className="item-val">{selectedCommission.merchant}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Disbursement Bank Account</span>
                    <span className="item-val font-mono">{selectedCommission.bankName || 'SBI Bank •••• 8812'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Banking Payout UTR</span>
                    <span className="item-val font-mono">{selectedCommission.payoutRef || 'UTR-CMS-99120'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Commission Rate</span>
                    <span className="item-val font-mono">{selectedCommission.rate || 1.5}% Share</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Payout Date</span>
                    <span className="item-val font-mono text-muted">
                      {selectedCommission.date ? new Date(selectedCommission.date).toLocaleString() : '16 Aug 2026'}
                    </span>
                  </div>
                </div>

              </div>

              <div className="comm-modal-footer">
                <button className="modal-print-btn" onClick={() => window.print()}>
                  <CommIcons.Print />
                  <span>Print Voucher</span>
                </button>
                <button className="modal-dismiss-btn" onClick={() => setSelectedCommission(null)}>
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

export default Commission;
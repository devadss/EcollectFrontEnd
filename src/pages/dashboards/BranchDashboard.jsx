import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { dashboardApi } from '../../services/api';
import './BranchDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// High-Precision SVG Icons
const BranchIcons = {
  Building: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="15" y2="6" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="9" y1="18" x2="12" y2="18" />
    </svg>
  ),
  Merchants: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Agents: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M17 10l2 2 4-4" />
    </svg>
  ),
  Revenue: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  ),
  Transactions: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  UserCheck: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  ),
  Location: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Shield: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
};

const BranchDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('bar');

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const rawRole = localStorage.getItem('user_role') || localStorage.getItem('role') || 'branchadmin';
  const branchId = user?.branchId || localStorage.getItem('branchId') || user?.id || 1;

  const [profile, setProfile] = useState({
    name: user?.branchName || user?.branch || 'Branch Operations Hub',
    code: 'BR-01',
    city: '',
    state: '',
  });

  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayVolume: 0,
    totalMerchants: 0,
    totalAgents: 0,
    totalTransactions: 0,
    revenueChange: '0%',
    merchantChange: '0%',
    agentChange: '0%'
  });

  const [topAgents, setTopAgents] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [revenueDataLabels, setRevenueDataLabels] = useState([]);
  const [revenueDataValues, setRevenueDataValues] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);

  const fetchBranchTelemetry = useCallback(async () => {
    if (!branchId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await dashboardApi.getBranchDashboard(branchId);
      const data = res?.data || {};

      if (data.profile) {
        setProfile({
          name: data.profile.name || user?.branchName || 'Branch Operations Hub',
          code: data.profile.code || `BR-${branchId}`,
          city: data.profile.city || '',
          state: data.profile.state || '',
        });
      }

      if (data.stats) {
        setStats({
          totalRevenue: Number(data.stats.totalRevenue) || 0,
          todayVolume: Number(data.stats.todayVolume) || 0,
          totalMerchants: Number(data.stats.totalMerchants) || 0,
          totalAgents: Number(data.stats.totalAgents) || 0,
          totalTransactions: Number(data.stats.totalTransactions) || 0,
          revenueChange: data.stats.revenueChange || '0%',
          merchantChange: data.stats.merchantChange || '0%',
          agentChange: data.stats.agentChange || '0%'
        });
      }

      if (Array.isArray(data.agents)) {
        setTopAgents(data.agents.map(ag => ({
          name: ag.name || 'Field Representative',
          code: ag.code || `AG-${ag.id}`,
          collections: Number(ag.collections) >= 100000 
            ? `₹${(Number(ag.collections) / 100000).toFixed(2)}L` 
            : `₹${Number(ag.collections || 0).toLocaleString('en-IN')}`,
          yieldRate: '100%',
          txns: ag.txns || 0,
          status: ag.isActive ? 'Active' : 'Inactive'
        })));
      } else {
        setTopAgents([]);
      }

      if (Array.isArray(data.recentTransactions)) {
        setRecentTxns(data.recentTransactions.map(tx => ({
          id: tx.id,
          merchant: tx.merchant || 'Merchant',
          customer: tx.customer || 'Customer',
          amount: Number(tx.amount) || 0,
          mode: tx.mode || 'UPI',
          status: tx.status || 'Pending',
          time: tx.time || tx.timeAgo || 'Recently'
        })));
      } else {
        setRecentTxns([]);
      }

      if (data.volumeChart && Array.isArray(data.volumeChart.labels)) {
        setRevenueDataLabels(data.volumeChart.labels);
        setRevenueDataValues(data.volumeChart.data || []);
      }

      if (Array.isArray(data.paymentMethods)) {
        setPaymentBreakdown(data.paymentMethods.map(m => ({
          label: m.method || m.label || 'Unknown',
          value: Number(m.value) || Number(m.count) || 0
        })));
      } else {
        setPaymentBreakdown([]);
      }

    } catch (err) {
      console.warn('⚠️ Telemetry error from backend table query for branch:', err.message);
    } finally {
      setLoading(false);
    }
  }, [branchId, user?.branchName]);

  useEffect(() => {
    fetchBranchTelemetry();
  }, [fetchBranchTelemetry]);

  // Revenue Chart Data
  const revenueData = {
    labels: revenueDataLabels.length > 0 ? revenueDataLabels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Settlement (₹)',
      data: revenueDataValues.length > 0 ? revenueDataValues : [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(99, 102, 241, 0.85)',
      hoverBackgroundColor: 'var(--accent, #6366f1)',
      borderRadius: 6,
      barPercentage: 0.55,
      borderColor: '#6366f1',
      fill: chartMode === 'line',
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: 'var(--bgCard, #111827)',
      pointBorderWidth: 2,
      pointRadius: chartMode === 'line' ? 5 : 0,
    }]
  };

  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(9, 13, 22, 0.95)',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.7)',
        cornerRadius: 10,
        padding: 12,
        callbacks: {
          label: (context) => ` Volume: ₹ ${(context.parsed.y || 0).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: '600' },
          callback: (v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)
        },
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
      },
      x: {
        ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
        grid: { display: false }
      }
    }
  };

  const branchName = profile.name || 'Branch Operations Hub';

  return (
    <DashboardLayout pageTitle={`Branch • ${branchName}`} role={rawRole}>
      {loading && <LoadingAnimation message="Compiling Branch Telemetry Matrix..." />}
      
      <div className="branch-dash-container">
        
        {/* Top Hero Header */}
        <div className="branch-hero-header">
          <div className="branch-hero-titles">
            <div className="branch-badge-tag">
              <span className="pulse-dot"></span>
              <BranchIcons.Sparkles />
              <span>Regional Operations Console</span>
            </div>
            <h1 className="branch-page-title">
              <strong className="branch-bold-top-name">{branchName}</strong>
              <span className="gradient-text"> Operations Hub</span>
            </h1>
            <p className="branch-page-subtitle">
              Manage field collection routes, agent activities, and localized settlement velocity
            </p>
          </div>

          <div className="branch-header-actions">
            <button className="branch-export-btn" onClick={fetchBranchTelemetry} title="Refresh Telemetry">
              <BranchIcons.Refresh />
              <span>Refresh</span>
            </button>
            <button className="branch-export-btn" onClick={() => window.print()}>
              <BranchIcons.Download />
              <span>Export Dossier</span>
            </button>
            <button className="branch-add-btn" onClick={() => navigate('/accounts')}>
              <BranchIcons.Building />
              <span>Branch Accounts</span>
            </button>
          </div>
        </div>

        {/* Branch Metadata Bar */}
        <div className="branch-metadata-strip">
          <div className="meta-strip-item">
            <BranchIcons.Building />
            <span>Node: <strong className="font-mono">{profile.code}</strong></span>
          </div>
          <div className="meta-strip-sep"></div>
          <div className="meta-strip-item">
            <BranchIcons.Location />
            <span>Location: <strong>{profile.city ? `${profile.city}, ${profile.state}` : 'Main Circle'}</strong></span>
          </div>
          <div className="meta-strip-sep"></div>
          <div className="meta-strip-item">
            <BranchIcons.Shield />
            <span>Branch Console: <strong>{branchName}</strong></span>
          </div>
          <div className="meta-strip-sep"></div>
          <div className="meta-strip-item is-growth">
            <BranchIcons.ArrowUp />
            <span className="font-mono">{stats.revenueChange || '0%'} Velocity</span>
          </div>
        </div>

        {/* 4 Primary KPI Stats Grid */}
        <div className="branch-kpi-grid">
          
          <div className="branch-kpi-card" onClick={() => navigate('/accounts')} style={{ cursor: 'pointer' }}>
            <div className="branch-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
            <div className="branch-kpi-header">
              <span className="branch-kpi-label">Disbursed Volume</span>
              <div className="branch-kpi-icon is-green"><BranchIcons.Revenue /></div>
            </div>
            <div className="branch-kpi-value font-mono text-green">₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</div>
            <div className="branch-kpi-footer">
              <span className="merchant-trend-tag is-up"><BranchIcons.ArrowUp /> Today: ₹{(stats.todayVolume || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="branch-kpi-card" onClick={() => navigate('/accounts')} style={{ cursor: 'pointer' }}>
            <div className="branch-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' }}></div>
            <div className="branch-kpi-header">
              <span className="branch-kpi-label">Branch Accounts</span>
              <div className="branch-kpi-icon is-indigo"><BranchIcons.Building /></div>
            </div>
            <div className="branch-kpi-value font-mono">{stats.totalMerchants || stats.totalAccounts || 0}</div>
            <div className="branch-kpi-footer">
              <span className="merchant-trend-tag is-up"><BranchIcons.ArrowUp /> Active Customer Accounts</span>
            </div>
          </div>

          <div className="branch-kpi-card" onClick={() => navigate('/accounts')} style={{ cursor: 'pointer' }}>
            <div className="branch-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)' }}></div>
            <div className="branch-kpi-header">
              <span className="branch-kpi-label">Collection Accounts</span>
              <div className="branch-kpi-icon is-cyan"><BranchIcons.Revenue /></div>
            </div>
            <div className="branch-kpi-value font-mono">{stats.totalAgents || 0}</div>
            <div className="branch-kpi-footer">
              <span className="merchant-trend-tag is-up"><BranchIcons.ArrowUp /> Active Portfolios</span>
            </div>
          </div>

          <div className="branch-kpi-card" onClick={() => navigate('/transactions')} style={{ cursor: 'pointer' }}>
            <div className="branch-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}></div>
            <div className="branch-kpi-header">
              <span className="branch-kpi-label">Cleared Transactions</span>
              <div className="branch-kpi-icon is-amber"><BranchIcons.Transactions /></div>
            </div>
            <div className="branch-kpi-value font-mono">{(stats.totalTransactions || 0).toLocaleString('en-IN')}</div>
            <div className="branch-kpi-footer">
              <span className="merchant-trend-tag is-up"><BranchIcons.ArrowUp /> Total Branch Transactions</span>
            </div>
          </div>

        </div>

        {/* Row 1: Weekly Revenue Velocity (8 cols) & Channel Ratio (4 cols) */}
        <div className="branch-charts-row">
          
          <div className="branch-chart-panel is-col-8">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Weekly Clearance Velocity</h3>
                <span className="panel-subtitle">Localized daily transaction volume across 7 active cycles</span>
              </div>
              
              <div className="panel-ctrl-group">
                <div className="mode-toggle-group">
                  <button 
                    className={`mode-btn ${chartMode === 'bar' ? 'is-active' : ''}`}
                    onClick={() => setChartMode('bar')}
                  >
                    Bars
                  </button>
                  <button 
                    className={`mode-btn ${chartMode === 'line' ? 'is-active' : ''}`}
                    onClick={() => setChartMode('line')}
                  >
                    Area
                  </button>
                </div>
                <span className="panel-metric-chip font-mono">Today: ₹{(stats.todayVolume || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="panel-canvas-box">
              {chartMode === 'bar' ? (
                <Bar data={revenueData} options={revenueOptions} />
              ) : (
                <Line data={revenueData} options={revenueOptions} />
              )}
            </div>
          </div>

          <div className="branch-chart-panel is-col-4">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Payment Channel Split</h3>
                <span className="panel-subtitle">Branch transaction rails</span>
              </div>
            </div>
            
            <div className="panel-canvas-box doughnut-wrap">
              <Doughnut
                data={{
                  labels: paymentBreakdown.length > 0 ? paymentBreakdown.map(p => p.label) : ['UPI'],
                  datasets: [{
                    data: paymentBreakdown.length > 0 ? paymentBreakdown.map(p => p.value) : [100],
                    backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
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
                <span className="center-bold font-mono">{stats.totalTransactions || 0}</span>
                <span className="center-tag">Transactions</span>
              </div>
            </div>
          </div>

        </div>

        {/* Row 2: Top Branch Agents (6 cols) & Real-Time Transactions Feed (6 cols) */}
        <div className="branch-charts-row">
          
          {/* Top Collection Accounts */}
          <div className="branch-chart-panel is-col-6">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Top Collection Portfolios</h3>
                <span className="panel-subtitle">Branch customer account activity</span>
              </div>
              <button className="view-all-link-btn" onClick={() => navigate('/accounts')}>
                View Accounts →
              </button>
            </div>

            <div className="branch-leaderboard-table-wrap">
              <table className="branch-mini-table">
                <thead>
                  <tr>
                    <th>Representative</th>
                    <th>Volume</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Txns</th>
                  </tr>
                </thead>
                <tbody>
                  {topAgents.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        No agents assigned to this branch yet.
                      </td>
                    </tr>
                  ) : (
                    topAgents.map((ag, i) => (
                      <tr key={i} className="mini-table-row">
                        <td>
                          <div className="agent-cell-stack">
                            <span className="agent-name font-bold">{ag.name}</span>
                            <span className="agent-code font-mono text-muted">{ag.code}</span>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono text-green font-bold">{ag.collections}</span>
                        </td>
                        <td>
                          <span className="yield-badge font-mono">{ag.status}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-mono font-bold">{ag.txns}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Branch Activity Feed */}
          <div className="branch-chart-panel is-col-6">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Live Settlement Stream</h3>
                <span className="panel-subtitle">Real-time branch transaction feed</span>
              </div>
              <button className="view-all-link-btn" onClick={() => navigate('/transactions')}>
                Audit Ledger →
              </button>
            </div>

            <div className="branch-activity-feed-wrap">
              {recentTxns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                  No recent transaction records for this branch yet.
                </div>
              ) : (
                recentTxns.map((tx, idx) => (
                  <div key={idx} className="feed-item-card">
                    <div className="feed-left">
                      <span className="feed-id-chip font-mono">#{tx.id}</span>
                      <div className="feed-merchant-stack">
                        <span className="merchant-name font-bold">{tx.merchant}</span>
                        <span className="feed-time font-mono text-muted">{tx.time} • {tx.mode}</span>
                      </div>
                    </div>

                    <div className="feed-right">
                      <span className="feed-amount font-mono font-bold text-green">₹{(tx.amount || 0).toLocaleString('en-IN')}</span>
                      <span className={`feed-status-pill ${tx.status === 'Success' || tx.status === 'SUCCESS' ? 'is-success' : 'is-pending'}`}>
                        <span className="status-dot"></span>
                        <span>{tx.status}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default BranchDashboard;
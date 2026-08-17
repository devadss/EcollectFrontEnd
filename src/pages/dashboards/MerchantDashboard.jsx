import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { dashboardApi } from '../../services/api';
import './MerchantDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

// High-Precision SVG Icons
const MerchantIcons = {
  Transactions: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Settlement: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  Agents: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Branches: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 2 7 22 7 12 2" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  CreditCard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
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

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('bar');

  // Authenticated Merchant Identity
  const rawRole = localStorage.getItem('user_role') || localStorage.getItem('role') || 'merchant';
  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const merchantId = authUser.merchantId || localStorage.getItem('merchantId') || authUser.id;

  const [profile, setProfile] = useState({
    name: authUser.merchantName || authUser.company || authUser.fullName || 'Merchant Partner',
    mid: merchantId ? `MRC-${merchantId}` : '',
    payoutCycle: 'T+1 Settlement',
    account: '',
  });

  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingSettlement: 0,
    totalBranches: 0,
    totalAgents: 0,
    todayVolume: 0,
    totalTransactions: 0,
    revenueChange: '0%',
    agentChange: '0%',
    branchChange: '0%'
  });

  const [branches, setBranches] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [volumeChart, setVolumeChart] = useState({
    labels: [],
    data: []
  });
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);

  const fetchMerchantTelemetry = useCallback(async () => {
    if (!merchantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const res = await dashboardApi.getMerchantDashboard(merchantId);
      const data = res?.data || {};

      if (data.profile) {
        setProfile({
          name: data.profile.name || data.profile.legalName || authUser.merchantName || authUser.company || authUser.fullName || 'Merchant Partner',
          mid: `MRC-${data.profile.merchantId || merchantId}`,
          payoutCycle: data.profile.payoutCycle || 'T+1 Settlement',
          account: data.profile.account || 'No Bank Account Configured',
        });
      }

      if (data.stats) {
        setStats({
          totalRevenue: Number(data.stats.totalRevenue) || 0,
          pendingSettlement: Number(data.stats.pendingSettlement) || 0,
          totalBranches: Number(data.stats.totalBranches) || 0,
          totalAgents: Number(data.stats.totalAgents) || 0,
          todayVolume: Number(data.stats.todayVolume) || 0,
          totalTransactions: Number(data.stats.totalTransactions) || 0,
          revenueChange: data.stats.revenueChange || '0%',
          agentChange: data.stats.agentChange || '0%',
          branchChange: data.stats.branchChange || '0%'
        });
      }

      if (Array.isArray(data.branches)) {
        setBranches(data.branches.map(b => ({
          name: b.name || `Branch #${b.id}`,
          code: b.code || `BR-${b.id}`,
          volume: Number(b.volume) >= 100000 
            ? `₹${(Number(b.volume) / 100000).toFixed(2)}L` 
            : `₹${Number(b.volume || 0).toLocaleString('en-IN')}`,
          agents: b.agentCount || 0,
          status: b.isActive ? 'Active' : 'Inactive'
        })));
      } else {
        setBranches([]);
      }

      if (Array.isArray(data.recentTransactions)) {
        setRecentTransactions(data.recentTransactions.map(tx => ({
          id: tx.id,
          customer: tx.customer || 'Customer',
          amount: Number(tx.amount) || 0,
          mode: tx.mode || 'UPI',
          status: tx.status || 'Pending',
          time: tx.time || tx.timeAgo || 'Recently'
        })));
      } else {
        setRecentTransactions([]);
      }

      if (data.volumeChart && Array.isArray(data.volumeChart.labels)) {
        setVolumeChart({
          labels: data.volumeChart.labels,
          data: data.volumeChart.data || []
        });
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
      console.warn('⚠️ Telemetry error from backend table query:', err.message);
    } finally {
      setLoading(false);
    }
  }, [merchantId, authUser.merchantName, authUser.company, authUser.fullName]);

  useEffect(() => {
    fetchMerchantTelemetry();
  }, [fetchMerchantTelemetry]);

  // Volume Chart Config
  const volumeChartData = {
    labels: volumeChart.labels.length > 0 ? volumeChart.labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Volume (₹)',
      data: volumeChart.data.length > 0 ? volumeChart.data : [0, 0, 0, 0, 0, 0, 0],
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

  const volumeChartOptions = {
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
          label: (context) => ` Processed: ₹ ${(context.parsed.y || 0).toLocaleString('en-IN')}`
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

  return (
    <DashboardLayout pageTitle="Merchant Dashboard" role={rawRole}>
      {loading && <LoadingAnimation message="Compiling Merchant Telemetry & Gateway Analytics..." />}

      <div className="merchant-dash-container">
        
        {/* Top Hero Header */}
        <div className="merchant-hero-header">
          <div className="merchant-hero-titles">
            <div className="merchant-badge-tag">
              <span className="pulse-dot"></span>
              <MerchantIcons.Sparkles />
              <span>Merchant Master Console</span>
            </div>
            <h1 className="merchant-page-title">
              {profile.name} <span className="gradient-text">Operations</span>
            </h1>
            <p className="merchant-page-subtitle">
              Monitor incoming customer transactions, automated T+1 settlement disbursals, and branch network
            </p>
          </div>

          <div className="merchant-header-actions">
            <button className="merchant-export-btn" onClick={fetchMerchantTelemetry} title="Refresh Merchant Telemetry">
              <MerchantIcons.Refresh />
              <span>Refresh</span>
            </button>
            <button className="merchant-export-btn" onClick={() => window.print()}>
              <MerchantIcons.Download />
              <span>Export Dossier</span>
            </button>
            <button className="merchant-add-btn" onClick={() => navigate('/branches/add')}>
              <MerchantIcons.Plus />
              <span>Add Branch Outlet</span>
            </button>
          </div>
        </div>

        {/* Merchant Metadata Strip */}
        <div className="merchant-metadata-strip">
          <div className="meta-strip-item">
            <MerchantIcons.CreditCard />
            <span>MID: <strong className="font-mono">{profile.mid}</strong></span>
          </div>
          <div className="meta-strip-sep"></div>
          <div className="meta-strip-item">
            <MerchantIcons.Settlement />
            <span>Payout Protocol: <strong>{profile.payoutCycle}</strong></span>
          </div>
          <div className="meta-strip-sep"></div>
          <div className="meta-strip-item">
            <MerchantIcons.ShieldCheck />
            <span>Settlement Route: <strong>{profile.account}</strong></span>
          </div>
          <div className="meta-strip-sep"></div>
          <div className="meta-strip-item is-growth">
            <MerchantIcons.ArrowUp />
            <span className="font-mono">{stats.revenueChange || '+22.4%'} MoM Velocity</span>
          </div>
        </div>

        {/* 4 Primary KPI Stats Grid */}
        <div className="merchant-kpi-grid">
          
          <div className="merchant-kpi-card">
            <div className="merchant-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' }}></div>
            <div className="merchant-kpi-header">
              <span className="merchant-kpi-label">Gross Processed Volume</span>
              <div className="merchant-kpi-icon is-indigo"><MerchantIcons.Transactions /></div>
            </div>
            <div className="merchant-kpi-value font-mono">₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</div>
            <div className="merchant-kpi-footer">
              <span className="merchant-trend-tag is-up"><MerchantIcons.ArrowUp /> {stats.revenueChange || '+22.4%'} Gross Volume</span>
            </div>
          </div>

          <div className="merchant-kpi-card">
            <div className="merchant-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
            <div className="merchant-kpi-header">
              <span className="merchant-kpi-label">Pending / Pipeline Settlements</span>
              <div className="merchant-kpi-icon is-green"><MerchantIcons.Settlement /></div>
            </div>
            <div className="merchant-kpi-value font-mono text-green">₹{(stats.pendingSettlement || 0).toLocaleString('en-IN')}</div>
            <div className="merchant-kpi-footer">
              <span className="merchant-trend-tag is-up"><MerchantIcons.ArrowUp /> T+1 Cycle Clearance</span>
            </div>
          </div>

          <div className="merchant-kpi-card" onClick={() => navigate('/branches')} style={{ cursor: 'pointer' }}>
            <div className="merchant-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)' }}></div>
            <div className="merchant-kpi-header">
              <span className="merchant-kpi-label">Branch Outlets</span>
              <div className="merchant-kpi-icon is-cyan"><MerchantIcons.Branches /></div>
            </div>
            <div className="merchant-kpi-value font-mono">{stats.totalBranches || 0}</div>
            <div className="merchant-kpi-footer">
              <span className="merchant-trend-tag is-up"><MerchantIcons.ArrowUp /> {stats.branchChange || '+5.2%'} Operational Nodes</span>
            </div>
          </div>

          <div className="merchant-kpi-card" onClick={() => navigate('/agents')} style={{ cursor: 'pointer' }}>
            <div className="merchant-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}></div>
            <div className="merchant-kpi-header">
              <span className="merchant-kpi-label">Authorized Field Agents</span>
              <div className="merchant-kpi-icon is-amber"><MerchantIcons.Agents /></div>
            </div>
            <div className="merchant-kpi-value font-mono">{stats.totalAgents || 0}</div>
            <div className="merchant-kpi-footer">
              <span className="merchant-trend-tag is-up"><MerchantIcons.ArrowUp /> {stats.agentChange || '+8.3%'} Active Representatives</span>
            </div>
          </div>

        </div>

        {/* Row 1: Weekly Volume Velocity (8 cols) & Payment Rails Split (4 cols) */}
        <div className="merchant-charts-row">
          
          <div className="merchant-chart-panel is-col-8">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Checkout Processing Velocity</h3>
                <span className="panel-subtitle">Daily payment volume across active merchant collection routes</span>
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
                <Bar data={volumeChartData} options={volumeChartOptions} />
              ) : (
                <Line data={volumeChartData} options={volumeChartOptions} />
              )}
            </div>
          </div>

          <div className="merchant-chart-panel is-col-4">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Customer Payment Rails</h3>
                <span className="panel-subtitle">Channel distribution ratio</span>
              </div>
            </div>
            
            <div className="panel-canvas-box doughnut-wrap">
              <Doughnut
                data={{
                  labels: paymentBreakdown.map(p => p.label),
                  datasets: [{
                    data: paymentBreakdown.map(p => p.value),
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

        {/* Row 2: Merchant Branches Network (6 cols) & Real-Time Inbound Feed (6 cols) */}
        <div className="merchant-charts-row">
          
          {/* Branches Matrix */}
          <div className="merchant-chart-panel is-col-6">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Branch Outlets Network</h3>
                <span className="panel-subtitle">Regional outlet settlement performance</span>
              </div>
              <button className="view-all-link-btn" onClick={() => navigate('/branches')}>
                Manage Branches →
              </button>
            </div>

            <div className="merchant-leaderboard-table-wrap">
              <table className="merchant-mini-table">
                <thead>
                  <tr>
                    <th>Branch Outlet</th>
                    <th>Volume</th>
                    <th>Agents</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        No branch outlets registered under this merchant yet.
                      </td>
                    </tr>
                  ) : (
                    branches.map((br, i) => (
                      <tr key={i} className="mini-table-row">
                        <td>
                          <div className="branch-cell-stack">
                            <span className="branch-name font-bold">{br.name}</span>
                            <span className="branch-code font-mono text-muted">{br.code}</span>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono text-green font-bold">{br.volume}</span>
                        </td>
                        <td>
                          <span className="font-mono">{br.agents}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="clearance-badge font-mono">{br.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-Time Inbound Transactions Stream */}
          <div className="merchant-chart-panel is-col-6">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Inbound Checkout Stream</h3>
                <span className="panel-subtitle">Real-time payment authorization stream</span>
              </div>
              <button className="view-all-link-btn" onClick={() => navigate('/transactions')}>
                Full History →
              </button>
            </div>

            <div className="merchant-activity-feed-wrap">
              {recentTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                  No recent transaction records found for this merchant.
                </div>
              ) : (
                recentTransactions.map((tx, idx) => (
                  <div key={idx} className="feed-item-card">
                    <div className="feed-left">
                      <span className="feed-id-chip font-mono">#{tx.id}</span>
                      <div className="feed-customer-stack">
                        <span className="customer-name font-bold">{tx.customer}</span>
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

export default MerchantDashboard;
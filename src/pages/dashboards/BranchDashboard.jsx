import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { dashboardApi, transactionApi } from '../../services/api';
import { getDayShiftState, saveDayShiftState, calculateDayEndSummary, runGoLivePreFlightCheck } from '../../services/dayOperationsService';
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
  const authUser = user;

  const rawRole = localStorage.getItem('user_role') || localStorage.getItem('role') || 'branchadmin';
  const branchId = user?.branchId || user?.BranchId || user?.branch_id || localStorage.getItem('branchId') || user?.id || 1;

  // Integration Status check (Model Y = Integrated CBS, Model N = Standalone Ledger)
  const isIntegratedMode = useMemo(() => {
    const rawInteg = localStorage.getItem('integrationStatus') || user?.integrationStatus || user?.IntegrationStatus || 'No';
    return String(rawInteg).toUpperCase() === 'Y' || String(rawInteg).toUpperCase() === 'YES' || rawInteg === true;
  }, [user]);
  const isNonIntegrated = !isIntegratedMode;

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

  // Day Operations & Shift State
  const [isDayOpsModalOpen, setIsDayOpsModalOpen] = useState(false);
  const [dayOpsTab, setDayOpsTab] = useState('BOD');
  const [dayShiftState, setDayShiftState] = useState(() => getDayShiftState());
  const [dayOpsNotes, setDayOpsNotes] = useState('');

  useEffect(() => {
    const handleShiftEvent = (e) => {
      if (e?.detail) {
        setDayShiftState(e.detail);
      } else {
        setDayShiftState(getDayShiftState());
      }
    };
    window.addEventListener('ecollect:day_shift_changed', handleShiftEvent);
    window.addEventListener('storage', handleShiftEvent);
    return () => {
      window.removeEventListener('ecollect:day_shift_changed', handleShiftEvent);
      window.removeEventListener('storage', handleShiftEvent);
    };
  }, []);

  const eodSummary = useMemo(() => {
    return calculateDayEndSummary({
      accounts: [],
      transactions: recentTxns || []
    });
  }, [recentTxns]);

  const goLiveReport = useMemo(() => {
    return runGoLivePreFlightCheck({
      merchantId: authUser?.merchantId || 4,
      accounts: [],
      user: authUser,
      isNonIntegrated: true
    });
  }, [authUser]);

  const handleStartBodShift = () => {
    const updated = {
      date: new Date().toISOString().slice(0, 10),
      shiftStatus: 'OPEN',
      openedAt: new Date().toISOString(),
      closedAt: null,
      openedBy: authUser?.fullName || authUser?.name || 'Branch Manager',
      closedBy: null,
      notes: dayOpsNotes || 'Daily field collection operations active.'
    };
    setDayShiftState(updated);
    saveDayShiftState(updated);
  };

  const handleCompleteEodSettlement = () => {
    const updated = {
      ...dayShiftState,
      shiftStatus: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy: authUser?.fullName || authUser?.name || 'Branch Manager',
      reconciledSummary: eodSummary,
      notes: dayOpsNotes || 'Daily collections reconciled and shift closed.'
    };

    setDayShiftState(updated);
    saveDayShiftState(updated);
    setDayOpsTab('CERTIFICATE');
  };

  const handlePrintEodCertificate = () => {
    window.print();
  };

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

      let txList = [];
      try {
        const txRes = await transactionApi.getByBranch(branchId).catch(() => transactionApi.getAll({ branchId })).catch(() => transactionApi.getHistory({ branchId }));
        const rawTxs = txRes?.data?.data || txRes?.data?.items || txRes?.data || [];
        if (Array.isArray(rawTxs)) {
          txList = rawTxs.map(t => {
            const amt = Number(t.amount ?? t.Amount ?? t.netAmount ?? t.NetAmount ?? t.totalAmount ?? t.TotalAmount ?? 0);
            const rawD = t.createdAt || t.CreatedAt || t.transactionDate || t.TransactionDate || t.date || t.Date || t.timestamp;
            const parsedD = rawD ? new Date(rawD) : new Date();
            return {
              ...t,
              id: t.id || t.Id || t.transactionId || t.TransactionId,
              merchant: t.merchantName || t.MerchantName || t.merchant || 'Merchant',
              customer: t.customer || t.Customer || t.customerName || t.CustomerName || 'Customer',
              amount: amt,
              mode: (t.paymentMode || t.PaymentMode || t.method || t.Method || t.mode || 'UPI').toUpperCase(),
              status: (t.status || t.Status || t.transactionStatus || 'SUCCESS').toUpperCase(),
              dateObj: isNaN(parsedD.getTime()) ? new Date() : parsedD,
              time: rawD ? new Date(rawD).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Recently'
            };
          });
        }
      } catch (txErr) {
        console.warn('Could not load transaction records for branch:', txErr.message);
      }

      if (Array.isArray(data.recentTransactions) && data.recentTransactions.length > 0) {
        setRecentTxns(data.recentTransactions.slice(0, 5).map(tx => ({
          id: tx.id,
          merchant: tx.merchant || 'Merchant',
          customer: tx.customer || 'Customer',
          amount: Number(tx.amount) || 0,
          mode: tx.mode || 'UPI',
          status: tx.status || 'Pending',
          time: tx.time || tx.timeAgo || 'Recently'
        })));
      } else if (txList.length > 0) {
        setRecentTxns(txList.slice(0, 5));
      } else {
        setRecentTxns([]);
      }

      if (data.volumeChart && Array.isArray(data.volumeChart.labels) && data.volumeChart.labels.length > 0 && Array.isArray(data.volumeChart.data) && data.volumeChart.data.some(v => Number(v) > 0)) {
        setRevenueDataLabels(data.volumeChart.labels);
        setRevenueDataValues(data.volumeChart.data);
      } else if (txList.length > 0) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        const chartLabels = [];
        const chartBuckets = [0, 0, 0, 0, 0, 0, 0];

        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          chartLabels.push(days[d.getDay()]);
        }

        let matched = 0;
        txList.forEach(t => {
          const diffDays = Math.floor((now - t.dateObj) / 86400000);
          if (diffDays >= 0 && diffDays < 7) {
            const idx = 6 - diffDays;
            chartBuckets[idx] += t.amount;
            matched++;
          }
        });

        if (matched === 0) {
          txList.forEach(t => {
            const dIdx = t.dateObj.getDay();
            const targetDay = days[dIdx];
            const lIdx = chartLabels.lastIndexOf(targetDay);
            if (lIdx !== -1) chartBuckets[lIdx] += t.amount;
            else chartBuckets[dIdx % 7] += t.amount;
          });
        }

        setRevenueDataLabels(chartLabels);
        setRevenueDataValues(chartBuckets);
      }

      if (Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0) {
        setPaymentBreakdown(data.paymentMethods.map(m => ({
          label: m.method || m.label || 'Unknown',
          value: Number(m.value) || Number(m.count) || 0
        })));
      } else if (txList.length > 0) {
        const methodCounts = {};
        txList.forEach(t => {
          const m = t.mode || 'UPI';
          methodCounts[m] = (methodCounts[m] || 0) + t.amount;
        });
        setPaymentBreakdown(Object.entries(methodCounts).map(([label, value]) => ({ label, value })));
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
            {isNonIntegrated && (
              <>
                <button 
                  type="button"
                  className="branch-export-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: dayShiftState?.shiftStatus === 'OPEN'
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))'
                      : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.25))',
                    borderColor: dayShiftState?.shiftStatus === 'OPEN'
                      ? 'rgba(16, 185, 129, 0.4)'
                      : 'rgba(239, 68, 68, 0.4)',
                    color: dayShiftState?.shiftStatus === 'OPEN' ? '#10b981' : '#f87171',
                    fontWeight: 800
                  }}
                  onClick={() => setIsDayOpsModalOpen(true)}
                  title="Open Day Begin (BOD), Day End (EOD) Settlement Suite"
                >
                  <span>{dayShiftState?.shiftStatus === 'OPEN' ? '☀️ Shift: OPEN' : '🌙 Shift: CLOSED'}</span>
                </button>

                <button className="branch-export-btn" onClick={() => navigate('/due-list')} title="View Daily Due List & Demand Ledger" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.35)', color: '#818cf8', fontWeight: 800 }}>
                  <span>📋 Daily Due List</span>
                </button>
                <button className="branch-export-btn" onClick={() => navigate('/buckets')} title="View Delinquency Aging & Recovery Buckets" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#f87171', fontWeight: 800 }}>
                  <span>🗂️ Delinquency Buckets</span>
                </button>
              </>
            )}
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

        {/* 🔒 Mandatory Day Begin (BOD) Shift Closed Alert Banner (Model N Only) */}
        {isNonIntegrated && dayShiftState?.shiftStatus !== 'OPEN' && (
          <div style={{
            padding: '14px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(185, 28, 28, 0.28))',
            border: '1px solid #ef4444',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '28px' }}>🔒</span>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                  Daily Collection Shift is Currently CLOSED (Action Required)
                </div>
                <div style={{ fontSize: '12.5px', color: '#fca5a5', marginTop: '2px' }}>
                  Please perform <strong>Day Begin (BOD)</strong> to activate field agent cash handling, dynamic QR billing, and daily ledger collections.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDayOpsTab('BOD');
                setIsDayOpsModalOpen(true);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <span>☀️ Start Day Begin (BOD) Now</span>
            </button>
          </div>
        )}

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
          
          {/* Top Collection Agents */}
          <div className="branch-chart-panel is-col-6">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Top Branch Agents</h3>
                <span className="panel-subtitle">Field representative collection activity</span>
              </div>
              <button className="view-all-link-btn" onClick={() => navigate('/agents')}>
                View All Agents →
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
                recentTxns.slice(0, 5).map((tx, idx) => (
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

        {/* DAY OPERATIONS (BOD / EOD) SUITE MODAL (Model N Only) */}
        {isNonIntegrated && isDayOpsModalOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="modal-card" style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', color: '#f8fafc', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>☀️ Day Begin (BOD) & 🌙 Day End (EOD) Operations</h2>
                  <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '4px 0 0 0' }}>Manage daily collection shift lifecycle and perform manual Day-End (EOD) settlement</p>
                </div>
                <button type="button" onClick={() => setIsDayOpsModalOpen(false)} style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px' }}>✕</button>
              </div>

              {/* TABS */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(255, 255, 255, 0.03)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('BOD')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'BOD' ? '#10b981' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ☀️ 1. Day Begin (BOD)
                </button>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('EOD')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'EOD' ? '#ef4444' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🌙 2. Day End (EOD) Settlement
                </button>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('CERTIFICATE')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'CERTIFICATE' ? '#3b82f6' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📜 3. Settlement Scroll
                </button>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('GOLIVE')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'GOLIVE' ? '#6366f1' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🚀 4. Go-Live Audit ({goLiveReport.percentage}%)
                </button>
              </div>

              {/* TAB 1: BOD */}
              {dayOpsTab === 'BOD' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: '14px',
                    background: dayShiftState?.shiftStatus === 'OPEN' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: dayShiftState?.shiftStatus === 'OPEN' ? '1px solid #10b981' : '1px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>CURRENT SHIFT STATUS</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: dayShiftState?.shiftStatus === 'OPEN' ? '#34d399' : '#f87171' }}>
                        {dayShiftState?.shiftStatus === 'OPEN' ? '☀️ SHIFT IS OPEN & ACTIVE' : '🌙 SHIFT IS CURRENTLY CLOSED'}
                      </div>
                      {dayShiftState?.openedAt && (
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
                          Opened at: {new Date(dayShiftState.openedAt).toLocaleTimeString()} by {dayShiftState.openedBy || 'Manager'}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '32px' }}>{dayShiftState?.shiftStatus === 'OPEN' ? '🟢' : '🔒'}</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Morning Shift Operational Notes</label>
                    <input
                      type="text"
                      value={dayOpsNotes}
                      onChange={e => setDayOpsNotes(e.target.value)}
                      placeholder="e.g. Standard morning field collection run"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleStartBodShift}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {dayShiftState?.shiftStatus === 'OPEN' ? '✓ Shift Already Active (Click to Refresh)' : '☀️ Start Day Begin (BOD) & Unlock Operations'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: EOD */}
              {dayOpsTab === 'EOD' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>DOORSTEP CASH</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>₹{eodSummary.cashCollectedAmount.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>DYNAMIC UPI QR</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#818cf8', fontFamily: 'monospace' }}>₹{eodSummary.upiCollectedAmount.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>PAYMENT LINKS</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace' }}>₹{(eodSummary.linkCollectedAmount || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <div style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 700 }}>TOTAL COLLECTED</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>₹{eodSummary.totalCollectedAmount.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>Manual Day-End Settlement</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        Review today's total collections ({eodSummary.totalTransactionsCount} transactions) and seal the daily ledger.
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                      Efficiency: {eodSummary.collectionEfficiencyPercent}%
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleCompleteEodSettlement}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      🌙 Complete Day-End (EOD) Settlement & Close Shift
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: CERTIFICATE */}
              {dayOpsTab === 'CERTIFICATE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#fff', color: '#000', padding: '24px', borderRadius: '12px', fontFamily: 'serif' }}>
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
                      <h2 style={{ margin: 0, fontSize: '20px', textTransform: 'uppercase' }}>FINWIN eCollect - Enterprise Settlement Certificate</h2>
                      <div style={{ fontSize: '12px', color: '#555' }}>Daily Treasury & Doorstep Collection Reconciliation Dossier</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '16px' }}>
                      <div>Date: <strong>{dayShiftState?.date || new Date().toLocaleDateString('en-IN')}</strong></div>
                      <div>Branch Node: <strong>{profile.code} - {branchName}</strong></div>
                      <div>Shift Status: <strong>{dayShiftState?.shiftStatus || 'CLOSED'}</strong></div>
                      <div>Reconciled By: <strong>{dayShiftState?.closedBy || authUser?.name || 'Manager'}</strong></div>
                      <div>Total Collections: <strong>₹{eodSummary.totalCollectedAmount.toLocaleString('en-IN')}</strong></div>
                      <div>Doorstep Cash: <strong>₹{eodSummary.cashCollectedAmount.toLocaleString('en-IN')}</strong></div>
                      <div>UPI QR Collections: <strong>₹{eodSummary.upiCollectedAmount.toLocaleString('en-IN')}</strong></div>
                      <div>Payment Link Collections: <strong>₹{(eodSummary.linkCollectedAmount || 0).toLocaleString('en-IN')}</strong></div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#777', borderTop: '1px dashed #aaa', paddingTop: '10px' }}>
                      Autonomous Verification Signed • eCollect Core Ledger Security Protocol
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handlePrintEodCertificate}
                      style={{ padding: '10px 20px', borderRadius: '10px', background: '#3b82f6', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                    >
                      🖨️ Print Certificate
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: GO-LIVE AUDIT */}
              {dayOpsTab === 'GOLIVE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#818cf8' }}>Pre-Flight Readiness Score: {goLiveReport.score} ({goLiveReport.percentage}%)</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{goLiveReport.isReadyForGoLive ? '✓ System meets all compliance standards for field go-live' : '⚠️ Action required before field go-live'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                    {goLiveReport.checks.map(chk => (
                      <div key={chk.id} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{chk.title}</div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{chk.desc}</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', background: chk.status.startsWith('PASSED') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: chk.status.startsWith('PASSED') ? '#34d399' : '#f87171' }}>
                          {chk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default BranchDashboard;
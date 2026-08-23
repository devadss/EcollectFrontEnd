import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { dashboardApi, transactionApi } from '../../services/api';
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

// Crisp SVG Icons
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
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Filter: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
};

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartMode, setChartMode] = useState('bar');

  // Active Date Filter Period
  // 'today' | 'yesterday' | 'week' | 'lastweek' | 'month' | 'lastmonth' | 'year' | 'all' | 'custom'
  const [activePeriod, setActivePeriod] = useState('week');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [activeRangeLabel, setActiveRangeLabel] = useState('');

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
    successfulTransactions: 0,
    failedTransactions: 0,
    successRate: 100,
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

  // Fetch telemetry with date filter
  const fetchMerchantTelemetry = useCallback(async () => {
    if (!merchantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const queryParams = {
        period: activePeriod
      };

      if (activePeriod === 'custom' && fromDate) {
        queryParams.fromDate = fromDate;
      }
      if (activePeriod === 'custom' && toDate) {
        queryParams.toDate = toDate;
      }

      const res = await dashboardApi.getMerchantDashboard(merchantId, queryParams);
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
          successfulTransactions: Number(data.stats.successfulTransactions) || 0,
          failedTransactions: Number(data.stats.failedTransactions) || 0,
          successRate: data.stats.successRate !== undefined ? Number(data.stats.successRate) : 100,
          revenueChange: data.stats.revenueChange || '0%',
          agentChange: data.stats.agentChange || '0%',
          branchChange: data.stats.branchChange || '0%'
        });
      }

      if (data.filterRange) {
        const { startDate, endDate } = data.filterRange;
        if (startDate && endDate) {
          setActiveRangeLabel(`${startDate} to ${endDate}`);
        } else if (startDate) {
          setActiveRangeLabel(`From ${startDate}`);
        } else {
          setActiveRangeLabel('All-Time Active Window');
        }
      }

      if (Array.isArray(data.branches)) {
        setBranches(data.branches.map(b => ({
          name: b.name || `Branch #${b.id}`,
          code: b.code || `BR-${b.id}`,
          volume: Number(b.volume) >= 100000 
            ? `₹${(Number(b.volume) / 100000).toFixed(2)}L` 
            : `₹${Number(b.volume || 0).toLocaleString('en-IN')}`,
          agents: b.agentCount || 0,
          txCount: b.txCount || 0,
          status: b.isActive ? 'Active' : 'Inactive'
        })));
      } else {
        setBranches([]);
      }

      let txList = [];
      try {
        const txRes = await transactionApi.getHistory({ merchantId, count: 150 }).catch(() => transactionApi.getAll({ merchantId }));
        const rawTxs = txRes?.data?.data || txRes?.data?.items || txRes?.data || [];
        if (Array.isArray(rawTxs)) {
          txList = rawTxs.map(t => {
            const amt = Number(t.amount ?? t.Amount ?? t.netAmount ?? t.NetAmount ?? t.totalAmount ?? t.TotalAmount ?? 0);
            const rawD = t.createdAt || t.CreatedAt || t.transactionDate || t.TransactionDate || t.date || t.Date || t.timestamp;
            const parsedD = rawD ? new Date(rawD) : new Date();
            return {
              ...t,
              id: t.id || t.Id || t.transactionId || t.TransactionId,
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
        console.warn('Could not load extra transaction records for merchant:', txErr.message);
      }

      if (Array.isArray(data.recentTransactions) && data.recentTransactions.length > 0) {
        setRecentTransactions(data.recentTransactions.slice(0, 10).map(tx => ({
          id: tx.id,
          customer: tx.customer || 'Customer',
          amount: Number(tx.amount) || 0,
          mode: tx.mode || 'UPI',
          status: tx.status || 'Pending',
          time: tx.time || tx.timeAgo || 'Recently'
        })));
      } else if (txList.length > 0) {
        setRecentTransactions(txList.slice(0, 10));
      } else {
        setRecentTransactions([]);
      }

      if (data.volumeChart && Array.isArray(data.volumeChart.labels) && data.volumeChart.labels.length > 0 && Array.isArray(data.volumeChart.data) && data.volumeChart.data.some(v => Number(v) > 0)) {
        setVolumeChart({
          labels: data.volumeChart.labels,
          data: data.volumeChart.data
        });
      } else if (txList.length > 0) {
        // Dynamically compute volume chart from real transactions
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

        setVolumeChart({
          labels: chartLabels,
          data: chartBuckets
        });
      }

      if (Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0) {
        setPaymentBreakdown(data.paymentMethods.map(m => ({
          label: m.method || m.label || 'Unknown',
          value: Number(m.volume) || Number(m.count) || Number(m.value) || 0
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
      console.warn('⚠️ Telemetry error from backend table query:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [merchantId, activePeriod, fromDate, toDate, authUser.merchantName, authUser.company, authUser.fullName]);

  useEffect(() => {
    fetchMerchantTelemetry();
  }, [fetchMerchantTelemetry]);

  const handlePeriodChange = (period) => {
    setActivePeriod(period);
    if (period !== 'custom') {
      setShowCustomPicker(false);
    } else {
      setShowCustomPicker(true);
    }
  };

  const handleApplyCustomFilter = (e) => {
    e.preventDefault();
    fetchMerchantTelemetry();
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchMerchantTelemetry();
  };

  // Contextual Dynamic Labels for Revenue Card & Chart
  const periodLabelMap = {
    today: "Today's Revenue",
    yesterday: "Yesterday's Revenue",
    week: "Weekly Revenue (Last 7 Days)",
    lastweek: "Last Week's Revenue",
    month: "Monthly Revenue (MTD)",
    lastmonth: "Last Month's Revenue",
    year: "Annual Revenue (YTD)",
    all: "Gross Lifetime Revenue",
    custom: "Period Revenue"
  };

  const chartSubtitleMap = {
    today: "Hourly checkout volume trajectory (00:00 - 24:00)",
    yesterday: "Hourly checkout volume for yesterday (00:00 - 24:00)",
    week: "Daily payment volume across the last 7 calendar days",
    lastweek: "Daily payment volume across the prior 7-day cycle",
    month: "Weekly processing volume distribution for current month",
    lastmonth: "Weekly processing volume distribution for prior month",
    year: "Monthly transaction volume trajectory across current year",
    all: "Monthly transaction volume clearance trajectory",
    custom: "Transaction volume trajectory across specified custom range"
  };

  // Volume Chart Config
  const volumeChartData = useMemo(() => ({
    labels: volumeChart.labels.length > 0 ? volumeChart.labels : ['Interval 1', 'Interval 2', 'Interval 3', 'Interval 4'],
    datasets: [{
      label: 'Volume (₹)',
      data: volumeChart.data.length > 0 ? volumeChart.data : [0, 0, 0, 0],
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
  }), [volumeChart, chartMode]);

  const volumeChartOptions = useMemo(() => ({
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
  }), []);

  return (
    <DashboardLayout pageTitle="Merchant Dashboard" role={rawRole}>
      {loading && <LoadingAnimation message="Compiling Date-Filtered Telemetry & Gateway Analytics..." />}

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
              Real-time payment clearance, automated T+1 settlement disbursals, and branch network telemetry.
            </p>
          </div>

          <div className="merchant-header-actions">
            <button className={`merchant-export-btn ${refreshing ? 'is-spinning' : ''}`} onClick={handleManualRefresh} title="Refresh Merchant Telemetry">
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

        {/* DATE-WISE FILTER TOOLBAR STRIP */}
        <div className="merchant-date-filter-panel">
          <div className="filter-header-left">
            <div className="filter-title-wrap">
              <MerchantIcons.Filter />
              <span className="filter-title-text">Telemetry Time Horizon:</span>
            </div>

            {/* Segmented Filter Pills */}
            <div className="merchant-filter-pills">
              <button
                className={`filter-pill ${activePeriod === 'today' ? 'is-active' : ''}`}
                onClick={() => handlePeriodChange('today')}
              >
                Today
              </button>
              <button
                className={`filter-pill ${activePeriod === 'yesterday' ? 'is-active' : ''}`}
                onClick={() => handlePeriodChange('yesterday')}
              >
                Yesterday
              </button>
              <button
                className={`filter-pill ${activePeriod === 'week' ? 'is-active' : ''}`}
                onClick={() => handlePeriodChange('week')}
              >
                This Week (7D)
              </button>
              <button
                className={`filter-pill ${activePeriod === 'lastweek' ? 'is-active' : ''}`}
                onClick={() => handlePeriodChange('lastweek')}
              >
                Last Week
              </button>
              <button
                className={`filter-pill ${activePeriod === 'month' ? 'is-active' : ''}`}
                onClick={() => handlePeriodChange('month')}
              >
                This Month
              </button>
              <button
                className={`filter-pill ${activePeriod === 'lastmonth' ? 'is-active' : ''}`}
                onClick={() => handlePeriodChange('lastmonth')}
              >
                Last Month
              </button>
              <button
                className={`filter-pill ${activePeriod === 'year' ? 'is-active' : ''}`}
                onClick={() => handlePeriodChange('year')}
              >
                This Year
              </button>
              <button
                className={`filter-pill ${activePeriod === 'all' ? 'is-active' : ''}`}
                onClick={() => handlePeriodChange('all')}
              >
                All Time
              </button>
              <button
                className={`filter-pill has-icon ${activePeriod === 'custom' ? 'is-active' : ''}`}
                onClick={() => handlePeriodChange('custom')}
              >
                <MerchantIcons.Calendar />
                <span>Custom Range</span>
              </button>
            </div>
          </div>

          {/* Active Range Badge Info */}
          {activeRangeLabel && (
            <div className="active-range-badge">
              <span className="range-dot"></span>
              <span className="range-text">{activeRangeLabel}</span>
            </div>
          )}
        </div>

        {/* Custom Date Range Picker Dropdown/Drawer */}
        {showCustomPicker && (
          <form className="merchant-custom-date-drawer" onSubmit={handleApplyCustomFilter}>
            <div className="custom-date-inputs">
              <div className="date-field-group">
                <label>From Date:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="merchant-date-input"
                  required
                />
              </div>
              <div className="date-field-group">
                <label>To Date:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="merchant-date-input"
                  required
                />
              </div>
              <button type="submit" className="custom-date-apply-btn">
                Apply Horizon
              </button>
            </div>
          </form>
        )}

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
            <span className="font-mono">{stats.successRate}% Success Clearance</span>
          </div>
        </div>

        {/* 4 Primary KPI Stats Grid */}
        <div className="merchant-kpi-grid">
          
          {/* 1. Period Volume */}
          <div className="merchant-kpi-card">
            <div className="merchant-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' }}></div>
            <div className="merchant-kpi-header">
              <span className="merchant-kpi-label">{periodLabelMap[activePeriod] || "Gross Processed Volume"}</span>
              <div className="merchant-kpi-icon is-indigo"><MerchantIcons.Transactions /></div>
            </div>
            <div className="merchant-kpi-value font-mono">₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</div>
            <div className="merchant-kpi-footer">
              <span className="merchant-trend-tag is-up">
                <MerchantIcons.ArrowUp /> {stats.successfulTransactions} Cleared Payments
              </span>
            </div>
          </div>

          {/* 2. Pending Settlements */}
          <div className="merchant-kpi-card">
            <div className="merchant-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
            <div className="merchant-kpi-header">
              <span className="merchant-kpi-label">Pending Settlements</span>
              <div className="merchant-kpi-icon is-green"><MerchantIcons.Settlement /></div>
            </div>
            <div className="merchant-kpi-value font-mono text-green">₹{(stats.pendingSettlement || 0).toLocaleString('en-IN')}</div>
            <div className="merchant-kpi-footer">
              <span className="merchant-trend-tag is-up">
                <MerchantIcons.ArrowUp /> T+1 Cycle Clearance
              </span>
            </div>
          </div>

          {/* 3. Branch Outlets */}
          <div className="merchant-kpi-card" onClick={() => navigate('/branches')} style={{ cursor: 'pointer' }}>
            <div className="merchant-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)' }}></div>
            <div className="merchant-kpi-header">
              <span className="merchant-kpi-label">Branch Outlets</span>
              <div className="merchant-kpi-icon is-cyan"><MerchantIcons.Branches /></div>
            </div>
            <div className="merchant-kpi-value font-mono">{stats.totalBranches || 0}</div>
            <div className="merchant-kpi-footer">
              <span className="merchant-trend-tag is-up">
                <MerchantIcons.ArrowUp /> Operational Nodes
              </span>
            </div>
          </div>

          {/* 4. Authorized Field Agents */}
          <div className="merchant-kpi-card" onClick={() => navigate('/agents')} style={{ cursor: 'pointer' }}>
            <div className="merchant-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}></div>
            <div className="merchant-kpi-header">
              <span className="merchant-kpi-label">Authorized Field Agents</span>
              <div className="merchant-kpi-icon is-amber"><MerchantIcons.Agents /></div>
            </div>
            <div className="merchant-kpi-value font-mono">{stats.totalAgents || 0}</div>
            <div className="merchant-kpi-footer">
              <span className="merchant-trend-tag is-up">
                <MerchantIcons.ArrowUp /> Active Representatives
              </span>
            </div>
          </div>

        </div>

        {/* Row 1: Volume Velocity (8 cols) & Payment Rails Split (4 cols) */}
        <div className="merchant-charts-row">
          
          <div className="merchant-chart-panel is-col-8">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Processing Velocity</h3>
                <span className="panel-subtitle">{chartSubtitleMap[activePeriod] || "Payment volume trajectory across active collection routes"}</span>
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
                <span className="panel-subtitle">Channel share in selected horizon</span>
              </div>
            </div>
            
            <div className="panel-canvas-box doughnut-wrap">
              <Doughnut
                data={{
                  labels: paymentBreakdown.length > 0 ? paymentBreakdown.map(p => p.label) : ['UPI', 'Card', 'Net Banking'],
                  datasets: [{
                    data: paymentBreakdown.length > 0 ? paymentBreakdown.map(p => p.value) : [100, 0, 0],
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
                <span className="center-tag">Txns in Period</span>
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
                <h3 className="panel-title">Branch Outlets Performance</h3>
                <span className="panel-subtitle">Regional performance for active horizon</span>
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
                    <th>Horizon Volume</th>
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
                <h3 className="panel-title">Inbound Transaction Stream</h3>
                <span className="panel-subtitle">Latest payment records in active horizon</span>
              </div>
              <button className="view-all-link-btn" onClick={() => navigate('/transactions')}>
                Full History →
              </button>
            </div>

            <div className="merchant-activity-feed-wrap">
              {recentTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                  No transaction records found for this merchant in the selected period.
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
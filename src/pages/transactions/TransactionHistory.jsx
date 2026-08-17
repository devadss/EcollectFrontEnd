import React, { useState, useEffect, useMemo } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
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
import { transactionApi, dashboardApi } from '../../services/api';
import './TransactionHistory.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Crisp SVG Icons
const TxIcons = {
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  Export: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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
  Txn: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  XCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
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
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
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

const TransactionHistory = () => {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();
  const rawRole = localStorage.getItem('user_role') || localStorage.getItem('role') || 'softwareadmin';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [backendVolume, setBackendVolume] = useState(null);
  const [backendPaymentMethods, setBackendPaymentMethods] = useState(null);

  const [filter, setFilter] = useState({
    search: '',
    statusTab: 'ALL', // 'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'
    paymentMode: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadTransactions(), loadChartData()]);
    } catch (err) {
      console.error('Error loading transaction history:', err);
      setError(err.message || 'Failed to load transaction records');
    } finally {
      setTimeout(() => setLoading(false), 350);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await transactionApi.getHistory();
      const listData = res?.data?.data || res?.data || [];
      const safeData = Array.isArray(listData) ? listData : [];

      setTransactions(safeData);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactions([]);
    }
  };

  const loadChartData = async () => {
    try {
      const merchantId = user?.merchantId;
      const branchId = user?.branchId;

      const [volumeRes, paymentRes] = await Promise.all([
        dashboardApi.getTransactionVolume({ merchantId, branchId }).catch(() => null),
        dashboardApi.getPaymentMethods({ merchantId, branchId }).catch(() => null)
      ]);

      if (volumeRes?.data?.labels && volumeRes?.data?.data && volumeRes.data.data.some(v => v > 0)) {
        setBackendVolume({ labels: volumeRes.data.labels, data: volumeRes.data.data });
      }

      if (paymentRes?.data && Array.isArray(paymentRes.data) && paymentRes.data.length > 0 && paymentRes.data.some(d => (d.value || d.count) > 0)) {
        setBackendPaymentMethods({
          labels: paymentRes.data.map(d => d.label || d.method || 'Unknown'),
          data: paymentRes.data.map(d => d.value || d.count || 0)
        });
      }
    } catch (err) {
      console.error('Error loading telemetry charts:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Safe Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = filter.search.toLowerCase().trim();
      const matchesSearch = !q ||
        (t.id || '').toLowerCase().includes(q) ||
        (t.transactionId || '').toLowerCase().includes(q) ||
        (t.utr || '').toLowerCase().includes(q) ||
        (t.merchant || t.merchantName || '').toLowerCase().includes(q) ||
        (t.customer || t.customerName || '').toLowerCase().includes(q);

      const matchesMode = !filter.paymentMode || (t.paymentMode || '').toLowerCase() === filter.paymentMode.toLowerCase();

      let matchesStatusTab = true;
      const statusLower = (t.status || '').toLowerCase();
      if (filter.statusTab === 'SUCCESS') matchesStatusTab = statusLower === 'success' || statusLower === 'completed';
      if (filter.statusTab === 'PENDING') matchesStatusTab = statusLower === 'pending';
      if (filter.statusTab === 'FAILED') matchesStatusTab = statusLower === 'failed';

      let matchesDate = true;
      if (filter.dateFrom) {
        const txDate = new Date(t.date || t.createdAt);
        matchesDate = txDate >= new Date(filter.dateFrom);
      }
      if (filter.dateTo && matchesDate) {
        const txDate = new Date(t.date || t.createdAt);
        matchesDate = txDate <= new Date(filter.dateTo);
      }

      return matchesSearch && matchesMode && matchesStatusTab && matchesDate;
    });
  }, [transactions, filter]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredTransactions.length;
    const successful = filteredTransactions.filter(t => (t.status || '').toLowerCase() === 'success').length;
    const failed = filteredTransactions.filter(t => (t.status || '').toLowerCase() === 'failed').length;
    const pending = filteredTransactions.filter(t => (t.status || '').toLowerCase() === 'pending').length;
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : '100';

    return { total, successful, failed, pending, totalAmount, successRate };
  }, [filteredTransactions]);

  // Dynamic Weekly / Daily Volume Data derived from actual transactions or backend
  const dynamicVolumeChart = useMemo(() => {
    if (backendVolume?.labels?.length > 0 && backendVolume.data?.some(v => v > 0)) {
      return backendVolume;
    }

    const days = [];
    const counts = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toISOString().split('T')[0];

      const dayTxns = transactions.filter(t => {
        const tDate = (t.createdAt || t.date || '').split('T')[0];
        return tDate === dateStr;
      });

      days.push(dayLabel);
      counts.push(dayTxns.length);
    }

    return {
      labels: days,
      data: counts
    };
  }, [transactions, backendVolume]);

  // Dynamic Payment Methods Data derived from actual transactions or backend
  const dynamicPaymentMethods = useMemo(() => {
    if (backendPaymentMethods?.labels?.length > 0 && backendPaymentMethods.data?.some(v => v > 0)) {
      const total = backendPaymentMethods.data.reduce((a, b) => a + b, 0);
      let maxIdx = 0;
      backendPaymentMethods.data.forEach((val, idx) => {
        if (val > backendPaymentMethods.data[maxIdx]) maxIdx = idx;
      });
      const topMethod = backendPaymentMethods.labels[maxIdx] || 'UPI';
      const topPercent = total > 0 ? Math.round((backendPaymentMethods.data[maxIdx] / total) * 100) : 0;
      return {
        ...backendPaymentMethods,
        topMethod,
        topPercent
      };
    }

    if (!transactions || transactions.length === 0) {
      return {
        labels: ['UPI', 'Card', 'Net Banking', 'Cash'],
        data: [0, 0, 0, 0],
        topMethod: 'None',
        topPercent: 0
      };
    }

    const modeCounts = {};
    transactions.forEach(t => {
      const rawMode = (t.paymentMode || t.mode || t.paymentChannel || 'UPI').trim().toUpperCase();
      const normMode = rawMode.includes('UPI') ? 'UPI' :
                       rawMode.includes('CARD') ? 'Card' :
                       rawMode.includes('NET') || rawMode.includes('BANK') ? 'Net Banking' :
                       rawMode.includes('CASH') ? 'Cash' :
                       rawMode.includes('WALLET') ? 'Wallet' :
                       rawMode.includes('MANDATE') ? 'E-Mandate' : rawMode;
      modeCounts[normMode] = (modeCounts[normMode] || 0) + 1;
    });

    const labels = Object.keys(modeCounts);
    const data = labels.map(l => modeCounts[l]);
    const total = data.reduce((a, b) => a + b, 0);

    let topMethod = 'None';
    let maxCount = 0;
    labels.forEach(l => {
      if (modeCounts[l] > maxCount) {
        maxCount = modeCounts[l];
        topMethod = l;
      }
    });

    const topPercent = total > 0 ? Math.round((maxCount / total) * 100) : 0;

    return {
      labels: labels.length > 0 ? labels : ['No Data'],
      data: data.length > 0 ? data : [0],
      topMethod,
      topPercent
    };
  }, [transactions, backendPaymentMethods]);

  const peakTxns = useMemo(() => {
    const vals = dynamicVolumeChart.data || [];
    return vals.length > 0 ? Math.max(...vals, 0) : 0;
  }, [dynamicVolumeChart]);

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'success' || s === 'completed') return 'is-success';
    if (s === 'pending') return 'is-pending';
    if (s === 'failed') return 'is-failed';
    return 'is-refunded';
  };

  return (
    <DashboardLayout pageTitle="Transaction Ledger" role={rawRole}>
      {loading && <LoadingAnimation message="Loading Gateway Telemetry..." />}
      
      <div className="tx-root-container">
        
        {/* Top Hero Header */}
        <div className="tx-hero-header">
          <div className="tx-hero-titles">
            <div className="tx-badge-tag">
              <span className="pulse-dot"></span>
              <TxIcons.Sparkles />
              <span>Real-Time Settlement Telemetry</span>
            </div>
            <h1 className="tx-page-title">
              Transaction <span className="gradient-text">History</span>
            </h1>
            <p className="tx-page-subtitle">
              Audit live payment routing, customer fulfillments, and gateway clearance logs
            </p>
          </div>

          <div className="tx-header-actions">
            <button className={`tx-refresh-btn ${refreshing ? 'is-spinning' : ''}`} onClick={handleRefresh} title="Refresh Ledger">
              <TxIcons.Refresh />
              <span>Refresh</span>
            </button>
            <button className="tx-export-btn" onClick={() => window.print()}>
              <TxIcons.Export />
              <span>Export Ledger</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="tx-kpi-grid">
          
          <div className="tx-kpi-card">
            <div className="tx-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' }}></div>
            <div className="tx-kpi-header">
              <span className="tx-kpi-label">Total Transactions</span>
              <div className="tx-kpi-icon is-indigo"><TxIcons.Txn /></div>
            </div>
            <div className="tx-kpi-value font-mono">{stats.total.toLocaleString()}</div>
            <div className="tx-kpi-footer">
              <span className="tx-trend-tag is-up"><TxIcons.ArrowUp /> Active Query Set</span>
            </div>
          </div>

          <div className="tx-kpi-card">
            <div className="tx-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
            <div className="tx-kpi-header">
              <span className="tx-kpi-label">Success Clearance Rate</span>
              <div className="tx-kpi-icon is-green"><TxIcons.Check /></div>
            </div>
            <div className="tx-kpi-value font-mono text-green">{stats.successRate}%</div>
            <div className="tx-kpi-footer">
              <span className="tx-trend-tag is-up"><TxIcons.ArrowUp /> {stats.successful} Cleared</span>
            </div>
          </div>

          <div className="tx-kpi-card">
            <div className="tx-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)' }}></div>
            <div className="tx-kpi-header">
              <span className="tx-kpi-label">Failed / Pending</span>
              <div className="tx-kpi-icon is-red"><TxIcons.XCircle /></div>
            </div>
            <div className="tx-kpi-value font-mono text-red">{stats.failed + stats.pending}</div>
            <div className="tx-kpi-footer">
              <span className="tx-trend-tag is-down"><TxIcons.ArrowUp /> {stats.failed} Failed / {stats.pending} Pending</span>
            </div>
          </div>

          <div className="tx-kpi-card">
            <div className="tx-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}></div>
            <div className="tx-kpi-header">
              <span className="tx-kpi-label">Gross Processed Volume</span>
              <div className="tx-kpi-icon is-amber"><TxIcons.Coins /></div>
            </div>
            <div className="tx-kpi-value font-mono text-green">₹{stats.totalAmount.toLocaleString('en-IN')}</div>
            <div className="tx-kpi-footer">
              <span className="tx-trend-tag is-up"><TxIcons.ArrowUp /> Settled Gross</span>
            </div>
          </div>

        </div>

        {/* Telemetry Charts Row */}
        <div className="tx-charts-grid-row">
          
          {/* Weekly Trajectory Area Chart */}
          <div className="tx-chart-card is-col-8">
            <div className="tx-chart-header">
              <div>
                <h3 className="tx-chart-title">Processing Velocity</h3>
                <span className="tx-chart-subtitle">Weekly transaction distribution trajectory</span>
              </div>
              <span className="velocity-metric-badge font-mono">⚡ {peakTxns.toLocaleString('en-IN')} Peak Txns</span>
            </div>
            <div className="tx-chart-canvas">
              <Line 
                data={{
                  labels: dynamicVolumeChart.labels,
                  datasets: [{
                    label: 'Transactions',
                    data: dynamicVolumeChart.data,
                    borderColor: 'var(--accent, #6366f1)',
                    backgroundColor: (context) => {
                      const chart = context.chart;
                      const { ctx, chartArea } = chart;
                      if (!chartArea) return 'rgba(0,0,0,0)';
                      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
                      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
                      return gradient;
                    },
                    tension: 0.45,
                    fill: true,
                    pointBackgroundColor: 'var(--accent, #6366f1)',
                    pointBorderColor: 'var(--bgCard, #111827)',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    borderWidth: 2.5,
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
                      borderColor: 'rgba(99, 102, 241, 0.3)',
                      borderWidth: 1,
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

          {/* Payment Methods Doughnut */}
          <div className="tx-chart-card is-col-4">
            <div className="tx-chart-header">
              <div>
                <h3 className="tx-chart-title">Payment Methods</h3>
                <span className="tx-chart-subtitle">Channel distribution share</span>
              </div>
            </div>
            <div className="tx-chart-canvas doughnut-box">
              <Doughnut 
                data={{
                  labels: dynamicPaymentMethods.labels,
                  datasets: [{
                    data: dynamicPaymentMethods.data,
                    backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'],
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
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 11, weight: '600' }
                      }
                    }
                  }
                }}
              />
              <div className="tx-doughnut-badge">
                <span className="badge-stat font-mono">{dynamicPaymentMethods.topPercent}%</span>
                <span className="badge-tag">{dynamicPaymentMethods.topMethod} Top</span>
              </div>
            </div>
          </div>

        </div>

        {/* Directory Ledger Card */}
        <div className="tx-directory-card">
          
          <div className="tx-filter-bar">
            
            {/* Status Segmented Tabs */}
            <div className="status-segmented-tabs">
              <button 
                className={`tab-btn ${filter.statusTab === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setFilter(prev => ({ ...prev, statusTab: 'ALL' }))}
              >
                All Txns ({transactions.length})
              </button>
              <button 
                className={`tab-btn ${filter.statusTab === 'SUCCESS' ? 'is-active' : ''}`}
                onClick={() => setFilter(prev => ({ ...prev, statusTab: 'SUCCESS' }))}
              >
                Success
              </button>
              <button 
                className={`tab-btn ${filter.statusTab === 'PENDING' ? 'is-active' : ''}`}
                onClick={() => setFilter(prev => ({ ...prev, statusTab: 'PENDING' }))}
              >
                Pending
              </button>
              <button 
                className={`tab-btn ${filter.statusTab === 'FAILED' ? 'is-active' : ''}`}
                onClick={() => setFilter(prev => ({ ...prev, statusTab: 'FAILED' }))}
              >
                Failed
              </button>
            </div>

            {/* Filter Search Cluster */}
            <div className="tx-search-cluster">
              <div className="tx-search-box">
                <span className="search-symbol"><TxIcons.Search /></span>
                <input
                  type="text"
                  placeholder="Search Txn ID, UTR, merchant, customer..."
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="tx-search-field"
                />
                {filter.search && (
                  <button className="clear-search-btn" onClick={() => setFilter(prev => ({ ...prev, search: '' }))}>✕</button>
                )}
              </div>

              <select
                value={filter.paymentMode}
                onChange={(e) => setFilter(prev => ({ ...prev, paymentMode: e.target.value }))}
                className="tx-mode-select"
              >
                <option value="">All Payment Modes</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
              </select>

              <div className="date-picker-wrap">
                <TxIcons.Calendar />
                <input
                  type="date"
                  value={filter.dateFrom}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="tx-date-input"
                  title="From Date"
                />
              </div>

              <div className="date-picker-wrap">
                <TxIcons.Calendar />
                <input
                  type="date"
                  value={filter.dateTo}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="tx-date-input"
                  title="To Date"
                />
              </div>
            </div>

          </div>

          {/* Ledger Table Viewport */}
          <div className="tx-table-viewport">
            <table className="tx-data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Transaction ID / UTR</th>
                  <th>Merchant Partner</th>
                  <th>Customer Payer</th>
                  <th>Amount</th>
                  <th>Payment Channel</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Audit</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-tx-cell">
                      <div className="empty-tx-box">
                        <span className="empty-glyph">📋</span>
                        <h4>No Transactions Found</h4>
                        <p>No transaction logs match your active filter filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t, index) => {
                    const statusClass = getStatusClass(t.status);
                    const isCopied = copiedId === (t.id || t.transactionId);

                    return (
                      <tr key={t.id || t.transactionId || index} className="tx-table-row">
                        <td className="row-index font-mono">{String(index + 1).padStart(2, '0')}</td>
                        
                        {/* Transaction ID & UTR */}
                        <td>
                          <div className="tx-id-cell">
                            <span className="tx-id-badge font-mono">
                              #{t.transactionId || t.id || 'TXN-0000'}
                              <button className="mini-copy-btn" onClick={() => handleCopy(t.transactionId || t.id, t.id || t.transactionId)} title="Copy ID">
                                {isCopied ? <TxIcons.CheckMark /> : <TxIcons.Copy />}
                              </button>
                            </span>
                            <span className="tx-utr-code font-mono text-muted">{t.utr || `UTR-2026-${index + 900}`}</span>
                          </div>
                        </td>

                        {/* Merchant */}
                        <td>
                          <div className="tx-merchant-cell">
                            <div className="merchant-avatar-mini">
                              {(t.merchant || t.merchantName || 'M').charAt(0).toUpperCase()}
                            </div>
                            <span className="merchant-name-text font-bold">{t.merchant || t.merchantName || 'Apex Retail Services'}</span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td>
                          <span className="customer-name-text text-muted">{t.customer || t.customerName || 'Payer Account'}</span>
                        </td>

                        {/* Amount */}
                        <td>
                          <span className="tx-amount-text font-mono font-bold">
                            ₹{(Number(t.amount) || 0).toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Mode */}
                        <td>
                          <span className="tx-channel-chip font-mono">
                            {t.paymentMode || t.method || 'UPI'}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`tx-status-pill ${statusClass}`}>
                            <span className="status-dot"></span>
                            <span>{t.status || 'Success'}</span>
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td>
                          <div className="tx-date-stack">
                            <span className="date-main">
                              {t.date ? new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '16 Aug 2026'}
                            </span>
                            <span className="time-sub font-mono text-muted">
                              {t.date ? new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '14:32 IST'}
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="tx-inspect-btn" 
                            onClick={() => setSelectedTxn(t)}
                            title="Inspect Telemetry Details"
                          >
                            <TxIcons.Eye />
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
          <div className="tx-table-footer">
            <span>Showing <strong className="font-mono">{filteredTransactions.length}</strong> of <strong className="font-mono">{transactions.length}</strong> processed transactions</span>
          </div>

        </div>

        {/* Modal: Transaction Details Audit Sheet */}
        {selectedTxn && (
          <div className="tx-modal-backdrop" onClick={() => setSelectedTxn(null)}>
            <div className="tx-modal-card" onClick={(e) => e.stopPropagation()}>
              
              <div className="tx-modal-header">
                <div className="modal-title-row">
                  <div className="modal-avatar">
                    <TxIcons.Txn />
                  </div>
                  <div>
                    <h3 className="modal-title">Transaction Receipt</h3>
                    <span className="modal-code font-mono">#{selectedTxn.transactionId || selectedTxn.id}</span>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedTxn(null)}>
                  <TxIcons.Close />
                </button>
              </div>

              <div className="tx-modal-body">
                
                {/* Status Hero */}
                <div className="modal-amount-hero">
                  <span className="hero-amount-label">Gross Captured Value</span>
                  <div className="hero-amount-value font-mono">₹{(Number(selectedTxn.amount) || 0).toLocaleString('en-IN')}</div>
                  <span className={`modal-status-badge ${getStatusClass(selectedTxn.status)}`}>
                    <span className="status-dot"></span>
                    <span>{selectedTxn.status || 'Success'}</span>
                  </span>
                </div>

                {/* Key Telemetry Breakdown */}
                <div className="modal-telemetry-grid">
                  <div className="telemetry-item">
                    <span className="item-label">Merchant Partner</span>
                    <span className="item-val font-bold">{selectedTxn.merchant || selectedTxn.merchantName || 'Apex Retail Services'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Customer Payer</span>
                    <span className="item-val">{selectedTxn.customer || selectedTxn.customerName || 'Direct Payer'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Banking UTR Reference</span>
                    <span className="item-val font-mono">{selectedTxn.utr || 'UTR-2026-99120'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Payment Channel</span>
                    <span className="item-val font-mono">{selectedTxn.paymentMode || 'UPI'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Gateway RRN</span>
                    <span className="item-val font-mono">{selectedTxn.rrn || 'RRN-8812903'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Processed Timestamp</span>
                    <span className="item-val font-mono text-muted">
                      {selectedTxn.date ? new Date(selectedTxn.date).toLocaleString() : '16 Aug 2026, 14:32:00 IST'}
                    </span>
                  </div>
                </div>

              </div>

              <div className="tx-modal-footer">
                <button className="modal-print-btn" onClick={() => window.print()}>
                  <TxIcons.Print />
                  <span>Print Receipt</span>
                </button>
                <button className="modal-dismiss-btn" onClick={() => setSelectedTxn(null)}>
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

export default TransactionHistory;
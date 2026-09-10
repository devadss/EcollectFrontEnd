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
import { dashboardApi, transactionApi, walletApi, branchApi, merchantApi } from '../../services/api';
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
    integrationStatus: authUser.integrationStatus || authUser.IntegrationStatus || localStorage.getItem('integrationStatus') || 'N'
  });

  // Boolean flag for Integration Status ('Y' = API Integrated Mode, 'N' = Manual Non-Integrated Mode)
  const isIntegrated = useMemo(() => {
    const raw = String(
      profile.integrationStatus || 
      authUser.integrationStatus || 
      authUser.IntegrationStatus || 
      localStorage.getItem('integrationStatus') || 
      'N'
    ).trim().toUpperCase();
    return raw === 'Y' || raw === 'YES' || raw === 'INTEGRATED' || raw === 'TRUE';
  }, [profile.integrationStatus, authUser.integrationStatus, authUser.IntegrationStatus]);

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

  // Merchant Communication Credits Wallet & Multi-Branch States
  const [walletData, setWalletData] = useState({
    balance: 750.00,
    currency: 'INR',
    lowBalanceThreshold: 100.00,
    rates: { SMS: 0.20, WhatsApp: 0.45, Call: 0.90 },
    totalRecharged: 1000.00,
    totalSpent: 250.00
  });
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [branchAllocations, setBranchAllocations] = useState([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [activeWalletTab, setActiveWalletTab] = useState('recharge');
  const [topUpForm, setTopUpForm] = useState({ amount: 1000, paymentMethod: 'UPI' });
  const [customTopUpAmount, setCustomTopUpAmount] = useState('');
  const [isRechargingWallet, setIsRechargingWallet] = useState(false);
  const [selectedBranchConfig, setSelectedBranchConfig] = useState(null);

  // Load Wallet and Multi-Branch Allocations (Only relevant for Non-Integrated mode)
  const loadWalletAndBranchAllocations = useCallback(async () => {
    if (isIntegrated) return;
    try {
      const mId = Number(merchantId || 1);
      const [balRes, txRes, brRes] = await Promise.allSettled([
        walletApi.getBalance(mId),
        walletApi.getTransactions(mId),
        branchApi.getAll({ merchantId: mId })
      ]);

      if (balRes.status === 'fulfilled' && balRes.value?.data?.data) {
        setWalletData(balRes.value.data.data);
      }
      if (txRes.status === 'fulfilled' && Array.isArray(txRes.value?.data?.data)) {
        setWalletTransactions(txRes.value.data.data);
      }

      // Compile branch communications & credit allocation
      let rawBranches = [];
      if (brRes.status === 'fulfilled') {
        const d = brRes.value?.data;
        rawBranches = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []);
      }

      const storedAllocations = JSON.parse(localStorage.getItem(`merchant_branch_allocations_${mId}`) || '{}');

      const compiled = (rawBranches.length > 0 ? rawBranches : [
        { id: 1, branchName: 'Mumbai Central Regional Branch', branchCode: '01', isIntegrated: false },
        { id: 2, branchName: 'Navi Mumbai Retail Clearing Hub', branchCode: '02', isIntegrated: false },
        { id: 3, branchName: 'Pune Commercial Ledger Division', branchCode: '03', isIntegrated: false }
      ]).map((b, idx) => {
        const bCode = b.branchCode || b.code || `0${idx + 1}`;
        const bName = b.branchName || b.name || `Branch ${bCode}`;
        const quotaConfig = storedAllocations[bCode] || {
          allocatedCredits: 500,
          dailyLimit: 100,
          enableWhatsApp: true,
          enableSms: true,
          enableCall: false,
          status: 'Active'
        };

        return {
          id: b.id || idx + 1,
          branchCode: bCode,
          branchName: bName,
          integrationMode: b.isIntegrated ? 'Integrated (Y)' : 'Non-Integrated (N)',
          isNonIntegrated: !b.isIntegrated,
          allocatedCredits: quotaConfig.allocatedCredits || 500,
          usedCredits: Math.floor(Math.random() * 45) + 10,
          smsCount: Math.floor(Math.random() * 35) + 20,
          whatsAppCount: Math.floor(Math.random() * 25) + 15,
          callCount: Math.floor(Math.random() * 5),
          enableWhatsApp: quotaConfig.enableWhatsApp !== false,
          enableSms: quotaConfig.enableSms !== false,
          enableCall: !!quotaConfig.enableCall,
          status: quotaConfig.status || 'Active'
        };
      });

      setBranchAllocations(compiled);
    } catch (err) {
      console.warn('Wallet/Branch allocations load note:', err);
    }
  }, [merchantId, isIntegrated]);

  useEffect(() => {
    loadWalletAndBranchAllocations();
    window.addEventListener('wallet_updated', loadWalletAndBranchAllocations);
    return () => {
      window.removeEventListener('wallet_updated', loadWalletAndBranchAllocations);
    };
  }, [loadWalletAndBranchAllocations]);

  const handleTopUpWallet = async (e) => {
    e?.preventDefault();
    const amount = Number(customTopUpAmount || topUpForm.amount || 0);
    if (amount <= 0) return;

    setIsRechargingWallet(true);
    try {
      const res = await walletApi.topUp({
        merchantId: Number(merchantId || 1),
        amount,
        paymentMethod: topUpForm.paymentMethod || 'UPI'
      });

      if (res?.data?.success) {
        setCustomTopUpAmount('');
        await loadWalletAndBranchAllocations();
        setActiveWalletTab('branches');
      }
    } catch (err) {
      console.error('Wallet top up error:', err);
    } finally {
      setIsRechargingWallet(false);
    }
  };

  const handleSaveBranchQuota = (branchCode, updatedQuota) => {
    const mId = Number(merchantId || 1);
    const prev = JSON.parse(localStorage.getItem(`merchant_branch_allocations_${mId}`) || '{}');
    const merged = { ...prev, [branchCode]: updatedQuota };
    localStorage.setItem(`merchant_branch_allocations_${mId}`, JSON.stringify(merged));
    loadWalletAndBranchAllocations();
    setSelectedBranchConfig(null);
  };

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
          integrationStatus: data.profile.integrationStatus || data.profile.IntegrationStatus || authUser.integrationStatus || authUser.IntegrationStatus || localStorage.getItem('integrationStatus') || 'N'
        });
      }

      // Also query live merchant configuration to ensure accurate integrationStatus
      try {
        const mRes = await merchantApi.getById(merchantId);
        const mData = mRes?.data?.data || mRes?.data;
        if (mData) {
          const status = mData.integrationStatus || mData.IntegrationStatus;
          if (status) {
            setProfile(prev => ({
              ...prev,
              integrationStatus: status
            }));
            localStorage.setItem('integrationStatus', status);
          }
        }
      } catch (mErr) {
        // Fallback silently to existing profile/authUser status
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

      // Show ONLY latest 5 transactions in Merchant Dashboard
      if (Array.isArray(data.recentTransactions) && data.recentTransactions.length > 0) {
        setRecentTransactions(data.recentTransactions.slice(0, 5).map(tx => ({
          id: tx.id,
          customer: tx.customer || 'Customer',
          amount: Number(tx.amount) || 0,
          mode: tx.mode || 'UPI',
          status: tx.status || 'Pending',
          time: tx.time || tx.timeAgo || 'Recently'
        })));
      } else if (txList.length > 0) {
        setRecentTransactions(txList.slice(0, 5));
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
  }, [merchantId, activePeriod, fromDate, toDate, authUser.merchantName, authUser.company, authUser.fullName, authUser.integrationStatus, authUser.IntegrationStatus]);

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
            {!isIntegrated && (
              <button 
                type="button"
                className={`merchant-wallet-btn ${walletData.balance <= 0 ? 'is-empty' : (walletData.balance < (walletData.lowBalanceThreshold || 100) ? 'is-low' : 'is-healthy')}`}
                onClick={() => {
                  loadWalletAndBranchAllocations();
                  setIsWalletModalOpen(true);
                }}
                title="Manage Communication Credits Wallet & Configure All Branches"
              >
                <MerchantIcons.CreditCard />
                <span>Credits Wallet: <strong>₹{walletData.balance.toFixed(2)}</strong></span>
              </button>
            )}

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
            <span>Gateway Mode: <strong className={isIntegrated ? 'text-green' : 'text-cyan'}>{isIntegrated ? 'API Integrated (Y)' : 'Standard Manual (N)'}</strong></span>
          </div>
          <div className="meta-strip-sep"></div>
          <div className="meta-strip-item is-growth">
            <MerchantIcons.ArrowUp />
            <span className="font-mono">{stats.successRate}% Success Clearance</span>
          </div>
        </div>

        {/* Primary KPI Stats Grid */}
        <div className={`merchant-kpi-grid ${isIntegrated ? 'is-4col' : 'is-5col'}`}>
          
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

          {/* 3. Communication Credits Wallet (Only shown in Non-Integrated Mode 'N') */}
          {!isIntegrated && (
            <div className="merchant-kpi-card is-wallet-kpi" onClick={() => { loadWalletAndBranchAllocations(); setIsWalletModalOpen(true); }} style={{ cursor: 'pointer' }}>
              <div className="merchant-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
              <div className="merchant-kpi-header">
                <span className="merchant-kpi-label">Credits Wallet (All Branches)</span>
                <div className="merchant-kpi-icon is-emerald"><MerchantIcons.CreditCard /></div>
              </div>
              <div className="merchant-kpi-value font-mono text-green">₹{(walletData.balance || 0).toFixed(2)}</div>
              <div className="merchant-kpi-footer">
                <span className="merchant-trend-tag is-up">
                  <MerchantIcons.Sparkles /> ~{Math.floor(walletData.balance / 0.45)} WhatsApp / {Math.floor(walletData.balance / 0.20)} SMS
                </span>
              </div>
            </div>
          )}

          {/* 4. Branch Outlets */}
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

          {/* 5. Authorized Field Agents */}
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
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--textMuted, #64748b)' }}>
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

          {/* Real-Time Inbound Transactions Stream (Showing Latest 5 Transactions) */}
          <div className="merchant-chart-panel is-col-6">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Inbound Transaction Stream</h3>
                <span className="panel-subtitle">Latest 5 payment records in active horizon</span>
              </div>
              <button className="view-all-link-btn" onClick={() => navigate('/transactions')}>
                Full History →
              </button>
            </div>

            <div className="merchant-activity-feed-wrap">
              {recentTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--textMuted, #64748b)' }}>
                  No transaction records found for this merchant in the selected period.
                </div>
              ) : (
                recentTransactions.slice(0, 5).map((tx, idx) => (
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

        {/* Row 3: Multi-Branch Communication Credits & Auto-Reminder Operations Panel (Only for Non-Integrated Mode) */}
        {!isIntegrated && (
          <div className="merchant-chart-panel is-col-12 merchant-branches-wallet-panel">
            <div className="panel-header-zone">
              <div>
                <div className="branch-wallet-tag">
                  <MerchantIcons.CreditCard />
                  <span>Multi-Branch Communication Hub</span>
                </div>
                <h3 className="panel-title">Branch-Wise Reminder Credits & Allocation Matrix</h3>
                <span className="panel-subtitle">Manage prepaid SMS, WhatsApp & Voice call quotas across all active regional branches</span>
              </div>
              
              <div className="panel-ctrl-group">
                <button 
                  className="merchant-wallet-cta-btn" 
                  onClick={() => {
                    loadWalletAndBranchAllocations();
                    setIsWalletModalOpen(true);
                    setActiveWalletTab('recharge');
                  }}
                >
                  <MerchantIcons.Plus />
                  <span>Top-Up Central Wallet</span>
                </button>
                <button 
                  className="merchant-export-btn" 
                  onClick={() => {
                    loadWalletAndBranchAllocations();
                    setIsWalletModalOpen(true);
                    setActiveWalletTab('branches');
                  }}
                >
                  <span>⚙️ Configure All Branch Quotas</span>
                </button>
              </div>
            </div>

            <div className="merchant-leaderboard-table-wrap">
              <table className="merchant-mini-table font-mono">
                <thead>
                  <tr>
                    <th>Branch Outlet</th>
                    <th>Integration Status</th>
                    <th>Allocated Quota</th>
                    <th>Credits Consumed</th>
                    <th>WhatsApp Sent</th>
                    <th>SMS Sent</th>
                    <th>Voice Calls</th>
                    <th>Auto-Reminder Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branchAllocations.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--textMuted, #64748b)' }}>
                        No branches found for this merchant.
                      </td>
                    </tr>
                  ) : (
                    branchAllocations.map((br) => (
                      <tr key={br.branchCode} className="mini-table-row">
                        <td>
                          <div className="branch-cell-stack">
                            <span className="branch-name font-bold">{br.branchName}</span>
                            <span className="branch-code text-muted">Code: {br.branchCode}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`integration-pill ${br.isNonIntegrated ? 'is-non-integ' : 'is-integ'}`}>
                            {br.integrationMode}
                          </span>
                        </td>
                        <td>
                          <span className="font-bold text-green">₹{br.allocatedCredits}</span>
                        </td>
                        <td>
                          <span className="text-purple font-bold">₹{br.usedCredits}</span>
                        </td>
                        <td>
                          <span className="font-bold">{br.whatsAppCount} msgs</span>
                        </td>
                        <td>
                          <span>{br.smsCount} alerts</span>
                        </td>
                        <td>
                          <span>{br.callCount} calls</span>
                        </td>
                        <td>
                          <span className={`status-pill ${br.status === 'Active' ? 'is-active' : 'is-paused'}`}>
                            {br.status === 'Active' ? '🟢 Auto Active' : '🔴 Paused'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn-branch-config-mini"
                            onClick={() => {
                              setSelectedBranchConfig(br);
                              setIsWalletModalOpen(true);
                              setActiveWalletTab('branches');
                            }}
                          >
                            ⚙️ Configure
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ============================================================
          MERCHANT CREDITS WALLET & MULTI-BRANCH CONFIGURATION MODAL (Only for Non-Integrated Mode)
         ============================================================ */}
      {!isIntegrated && isWalletModalOpen && (
        <div className="merchant-modal-overlay" onClick={() => setIsWalletModalOpen(false)}>
          <div className="merchant-modal-container" onClick={e => e.stopPropagation()}>
            <div className="merchant-modal-head">
              <div className="modal-title-stack">
                <div className="modal-badge-tag is-wallet">
                  <MerchantIcons.CreditCard />
                  <span>Central Communication Treasury</span>
                </div>
                <h2>Merchant Credits Wallet & Multi-Branch Configuration</h2>
                <p>Manage prepaid communication balances and branch-level dispatch policies for {profile.name} (MID: {profile.mid || 'MRC-01'}).</p>
              </div>
              <button className="btn-modal-close" onClick={() => setIsWalletModalOpen(false)}>✕</button>
            </div>

            <div className="merchant-modal-body">
              {/* Navigation Tabs */}
              <div className="merchant-wallet-tabs">
                <button
                  type="button"
                  className={`m-wallet-tab ${activeWalletTab === 'recharge' ? 'is-active' : ''}`}
                  onClick={() => setActiveWalletTab('recharge')}
                >
                  <span>💳 Top-Up Central Wallet</span>
                </button>
                <button
                  type="button"
                  className={`m-wallet-tab ${activeWalletTab === 'branches' ? 'is-active' : ''}`}
                  onClick={() => setActiveWalletTab('branches')}
                >
                  <span>🏢 Multi-Branch Allocations & Rules</span>
                  <span className="tab-badge-count font-mono">{branchAllocations.length} Branches</span>
                </button>
                <button
                  type="button"
                  className={`m-wallet-tab ${activeWalletTab === 'ledger' ? 'is-active' : ''}`}
                  onClick={() => setActiveWalletTab('ledger')}
                >
                  <span>📜 Unified Transaction Ledger</span>
                  <span className="tab-badge-count font-mono">{walletTransactions.length}</span>
                </button>
                <button
                  type="button"
                  className={`m-wallet-tab ${activeWalletTab === 'rates' ? 'is-active' : ''}`}
                  onClick={() => setActiveWalletTab('rates')}
                >
                  <span>🏷️ Unit Rates & DLT Rules</span>
                </button>
              </div>

              {/* TAB 1: RECHARGE */}
              {activeWalletTab === 'recharge' && (
                <div className="wallet-tab-content">
                  {/* Hero Balance Showcase Card */}
                  <div className="m-wallet-balance-hero">
                    <div className="m-wbh-left">
                      <span className="m-wbh-label">Company Prepaid Balance (All Branches)</span>
                      <div className="m-wbh-amount font-mono">
                        <span className="curr">₹</span>{(walletData.balance || 0).toFixed(2)}
                      </div>
                      <div className="m-wbh-status">
                        {walletData.balance <= 0 ? (
                          <span className="whb-chip is-red">🔴 Balance Exhausted (Dispatches Paused)</span>
                        ) : walletData.balance < (walletData.lowBalanceThreshold || 100) ? (
                          <span className="whb-chip is-amber">🟡 Low Balance Alert</span>
                        ) : (
                          <span className="whb-chip is-green">🟢 Active & Healthy</span>
                        )}
                      </div>
                    </div>

                    <div className="m-wbh-breakdown font-mono">
                      <div className="m-unit-item">
                        <span className="unit-icon">💬</span>
                        <div>
                          <strong>~{Math.floor(walletData.balance / 0.45)}</strong>
                          <span>WhatsApp API Msgs</span>
                        </div>
                      </div>
                      <div className="m-unit-item">
                        <span className="unit-icon">📱</span>
                        <div>
                          <strong>~{Math.floor(walletData.balance / 0.20)}</strong>
                          <span>SMS Alerts</span>
                        </div>
                      </div>
                      <div className="m-unit-item">
                        <span className="unit-icon">📞</span>
                        <div>
                          <strong>~{Math.floor(walletData.balance / 0.90)}</strong>
                          <span>Voice IVR Calls</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Packages Form */}
                  <form onSubmit={handleTopUpWallet} className="m-recharge-form">
                    <h4 className="m-form-section-title">Select Central Top-Up Amount</h4>
                    <div className="m-packages-grid">
                      {[
                        { amount: 250, name: 'Starter Pack', msgs: '1,250 SMS / 550 WhatsApp', popular: false },
                        { amount: 500, name: 'Growth Pack', msgs: '2,500 SMS / 1,110 WhatsApp', popular: false },
                        { amount: 1000, name: 'Popular Pack', msgs: '5,000 SMS / 2,220 WhatsApp', popular: true },
                        { amount: 2500, name: 'Professional', msgs: '12,500 SMS / 5,550 WhatsApp', popular: false },
                        { amount: 5000, name: 'Enterprise', msgs: '25,000 SMS / 11,100 WhatsApp', popular: false },
                      ].map((pkg) => (
                        <div
                          key={pkg.amount}
                          className={`m-package-card ${topUpForm.amount === pkg.amount && !customTopUpAmount ? 'is-selected' : ''}`}
                          onClick={() => {
                            setTopUpForm(p => ({ ...p, amount: pkg.amount }));
                            setCustomTopUpAmount('');
                          }}
                        >
                          {pkg.popular && <span className="m-pkg-badge">Popular</span>}
                          <div className="m-pkg-amount font-mono">₹{pkg.amount.toLocaleString('en-IN')}</div>
                          <div className="m-pkg-name">{pkg.name}</div>
                          <div className="m-pkg-sub">{pkg.msgs}</div>
                        </div>
                      ))}
                    </div>

                    <div className="m-custom-amount-row">
                      <label>Or Enter Custom Amount (₹):</label>
                      <div className="m-amount-input-box font-mono">
                        <span className="prefix">₹</span>
                        <input
                          type="number"
                          min="100"
                          step="50"
                          placeholder="e.g. 1500"
                          value={customTopUpAmount}
                          onChange={e => {
                            setCustomTopUpAmount(e.target.value);
                            if (e.target.value) setTopUpForm(p => ({ ...p, amount: Number(e.target.value) }));
                          }}
                          className="m-amount-input"
                        />
                      </div>
                    </div>

                    <div className="m-payment-channels-group">
                      <label>Payment Channel</label>
                      <div className="m-channels-grid">
                        <label className={`m-channel-chip ${topUpForm.paymentMethod === 'UPI' ? 'is-selected' : ''}`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="UPI"
                            checked={topUpForm.paymentMethod === 'UPI'}
                            onChange={e => setTopUpForm(p => ({ ...p, paymentMethod: e.target.value }))}
                          />
                          <span>⚡ Instant UPI (GPay / PhonePe / Paytm)</span>
                        </label>
                        <label className={`m-channel-chip ${topUpForm.paymentMethod === 'NetBanking' ? 'is-selected' : ''}`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="NetBanking"
                            checked={topUpForm.paymentMethod === 'NetBanking'}
                            onChange={e => setTopUpForm(p => ({ ...p, paymentMethod: e.target.value }))}
                          />
                          <span>🏦 Corporate Net Banking</span>
                        </label>
                        <label className={`m-channel-chip ${topUpForm.paymentMethod === 'Card' ? 'is-selected' : ''}`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="Card"
                            checked={topUpForm.paymentMethod === 'Card'}
                            onChange={e => setTopUpForm(p => ({ ...p, paymentMethod: e.target.value }))}
                          />
                          <span>💳 Business Credit / Debit Card</span>
                        </label>
                      </div>
                    </div>

                    <div className="m-modal-actions-foot">
                      <button
                        type="submit"
                        className="m-btn-recharge-cta"
                        disabled={isRechargingWallet}
                      >
                        {isRechargingWallet ? 'Processing Top-Up...' : `Recharge ₹${(Number(customTopUpAmount || topUpForm.amount || 0)).toLocaleString('en-IN')} Now`}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: MULTI-BRANCH ALLOCATION & CONFIGURATION */}
              {activeWalletTab === 'branches' && (
                <div className="wallet-tab-content">
                  <div className="m-branch-config-banner">
                    <div>
                      <strong>🏢 Centralized Branch Credit Controls</strong>
                      <span>Allocate specific communication credits, set daily reminder caps, and toggle active channels for every branch.</span>
                    </div>
                  </div>

                  <div className="m-branch-config-grid">
                    {branchAllocations.map((br) => (
                      <div key={br.branchCode} className={`m-branch-config-card ${selectedBranchConfig?.branchCode === br.branchCode ? 'is-highlighted' : ''}`}>
                        <div className="m-bcc-header">
                          <div>
                            <span className="m-bcc-name font-bold">{br.branchName}</span>
                            <span className="m-bcc-code font-mono text-muted">Branch Code: {br.branchCode} • {br.integrationMode}</span>
                          </div>
                          <span className={`status-pill ${br.status === 'Active' ? 'is-active' : 'is-paused'}`}>
                            {br.status}
                          </span>
                        </div>

                        <div className="m-bcc-body font-mono">
                          <div className="m-bcc-row">
                            <span className="lbl">Allocated Quota:</span>
                            <div className="m-inline-input-group">
                              <span className="prefix">₹</span>
                              <input
                                type="number"
                                defaultValue={br.allocatedCredits}
                                onBlur={(e) => handleSaveBranchQuota(br.branchCode, { ...br, allocatedCredits: Number(e.target.value) })}
                                className="m-mini-input"
                              />
                            </div>
                          </div>

                          <div className="m-bcc-row">
                            <span className="lbl">Daily Dispatch Cap:</span>
                            <div className="m-inline-input-group">
                              <span className="prefix">₹</span>
                              <input
                                type="number"
                                defaultValue={br.dailyLimit || 100}
                                onBlur={(e) => handleSaveBranchQuota(br.branchCode, { ...br, dailyLimit: Number(e.target.value) })}
                                className="m-mini-input"
                              />
                            </div>
                          </div>

                          <div className="m-bcc-channels">
                            <label className="m-chk-label">
                              <input
                                type="checkbox"
                                defaultChecked={br.enableWhatsApp}
                                onChange={(e) => handleSaveBranchQuota(br.branchCode, { ...br, enableWhatsApp: e.target.checked })}
                              />
                              <span>WhatsApp (₹0.45)</span>
                            </label>
                            <label className="m-chk-label">
                              <input
                                type="checkbox"
                                defaultChecked={br.enableSms}
                                onChange={(e) => handleSaveBranchQuota(br.branchCode, { ...br, enableSms: e.target.checked })}
                              />
                              <span>SMS (₹0.20)</span>
                            </label>
                            <label className="m-chk-label">
                              <input
                                type="checkbox"
                                defaultChecked={br.enableCall}
                                onChange={(e) => handleSaveBranchQuota(br.branchCode, { ...br, enableCall: e.target.checked })}
                              />
                              <span>Voice IVR (₹0.90)</span>
                            </label>
                          </div>
                        </div>

                        <div className="m-bcc-footer">
                          <button
                            type="button"
                            className={`m-btn-toggle-status ${br.status === 'Active' ? 'is-pause' : 'is-activate'}`}
                            onClick={() => handleSaveBranchQuota(br.branchCode, { ...br, status: br.status === 'Active' ? 'Paused' : 'Active' })}
                          >
                            {br.status === 'Active' ? '⏸️ Pause Branch Reminders' : '▶️ Activate Branch Reminders'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: UNIFIED TRANSACTION LEDGER */}
              {activeWalletTab === 'ledger' && (
                <div className="wallet-tab-content">
                  <div className="m-ledger-stats-bar font-mono">
                    <div className="m-ls-card">
                      <span>Total Recharged</span>
                      <strong>₹{(walletData.totalRecharged || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="m-ls-card">
                      <span>Total Consumed</span>
                      <strong className="text-purple">₹{(walletData.totalSpent || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="m-ls-card">
                      <span>Available Balance</span>
                      <strong className="text-green">₹{(walletData.balance || 0).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="merchant-leaderboard-table-wrap">
                    <table className="merchant-mini-table font-mono">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Reference</th>
                          <th>Type</th>
                          <th>Channel / Route</th>
                          <th>Recipients</th>
                          <th>Amount (₹)</th>
                          <th>Closing Balance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {walletTransactions.map((tx, idx) => (
                          <tr key={tx.id || idx}>
                            <td>{new Date(tx.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                            <td className="text-muted">{tx.referenceId}</td>
                            <td>
                              <span className={`txn-type-pill ${tx.type === 'TOPUP' ? 'is-topup' : 'is-deduction'}`}>
                                {tx.type === 'TOPUP' ? '🟢 Credit (+)' : '🟣 Debit (-)'}
                              </span>
                            </td>
                            <td>{tx.channel}</td>
                            <td>{tx.recipientCount > 0 ? `${tx.recipientCount} msgs` : '-'}</td>
                            <td className={tx.type === 'TOPUP' ? 'text-green font-bold' : 'text-purple font-bold'}>
                              {tx.type === 'TOPUP' ? `+₹${Number(tx.amount).toFixed(2)}` : `-₹${Number(tx.amount).toFixed(2)}`}
                            </td>
                            <td className="font-bold">₹{Number(tx.closingBalance).toFixed(2)}</td>
                            <td><span className="status-pill is-active">{tx.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: MESSAGE RATES */}
              {activeWalletTab === 'rates' && (
                <div className="wallet-tab-content">
                  <div className="m-rates-cards-grid font-mono">
                    <div className="m-rate-card is-sms">
                      <span className="mrc-icon">📱</span>
                      <div className="mrc-title">Transactional SMS</div>
                      <div className="mrc-price">₹0.20 <span className="unit">/ SMS</span></div>
                      <div className="mrc-desc">Standard 160-character DLT-approved header alert via telecom network rail.</div>
                    </div>

                    <div className="m-rate-card is-wa">
                      <span className="mrc-icon">💬</span>
                      <div className="mrc-title">WhatsApp Business API</div>
                      <div className="mrc-price">₹0.45 <span className="unit">/ Msg</span></div>
                      <div className="mrc-desc">Meta verified high-delivery interactive notice with instant UPI pay buttons.</div>
                    </div>

                    <div className="m-rate-card is-call">
                      <span className="mrc-icon">📞</span>
                      <div className="mrc-title">Automated Voice / IVR</div>
                      <div className="mrc-price">₹0.90 <span className="unit">/ Call</span></div>
                      <div className="mrc-desc">30-second automated spoken vernacular voice reminder call to borrower.</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="merchant-modal-foot">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsWalletModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MerchantDashboard;
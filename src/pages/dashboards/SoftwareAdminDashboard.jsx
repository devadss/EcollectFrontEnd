import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { useTheme } from '../../context/ThemeContext';
import { 
  dashboardApi, 
  branchApi, 
  agentApi, 
  merchantApi, 
  transactionApi, 
  settlementApi 
} from '../../services/api';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import './SoftwareAdminDashboard.css';

// Register ChartJS components
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
const DashIcons = {
  Merchants: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Agents: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Branches: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 2 7 22 7 12 2" />
    </svg>
  ),
  Revenue: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Calendar: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Clock: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
    </svg>
  ),
  Trending: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  ChartBar: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  ChartLine: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Filter: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Building: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <line x1="8" y1="6" x2="8.01" y2="6" />
      <line x1="16" y1="6" x2="16.01" y2="6" />
      <line x1="8" y1="10" x2="8.01" y2="10" />
      <line x1="16" y1="10" x2="16.01" y2="10" />
      <line x1="8" y1="14" x2="8.01" y2="14" />
      <line x1="16" y1="14" x2="16.01" y2="14" />
    </svg>
  ),
  UserCheck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  ),
  Globe: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
};

const SoftwareAdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentTheme } = useTheme();

  // Active Merchant Scope (Default 'ALL', or merchant ID)
  const [selectedMerchantId, setSelectedMerchantId] = useState(searchParams.get('merchantId') || 'ALL');

  // Chart & View Controls
  const [chartKey, setChartKey] = useState(0);
  const [activeRange, setActiveRange] = useState('Week'); // 'Today' | 'Week' | 'Month' | 'Year'
  const [chartViewMode, setChartViewMode] = useState('area'); // 'area' | 'bar'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Raw Backend Data Repositories
  const [merchantsList, setMerchantsList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [transactionsList, setTransactionsList] = useState([]);
  const [settlementsList, setSettlementsList] = useState([]);

  // Pending Approvals State
  const [pendingBranches, setPendingBranches] = useState([]);
  const [pendingAgents, setPendingAgents] = useState([]);
  const [activeApprovalTab, setActiveApprovalTab] = useState('ALL');
  const [approvingId, setApprovingId] = useState(null);
  const [actionToast, setActionToast] = useState(null);

  // Merchant Directory Filter & Layout
  const [merchantSearch, setMerchantSearch] = useState('');
  const [merchantViewLayout, setMerchantViewLayout] = useState('grid');
  const [merchantDetailTab, setMerchantDetailTab] = useState('branches'); // 'branches' | 'agents' | 'recent_tx'

  // Update query params when selected merchant changes
  const handleSelectMerchant = (merchantId) => {
    setSelectedMerchantId(merchantId);
    if (merchantId && merchantId !== 'ALL') {
      setSearchParams({ merchantId });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [currentTheme, chartViewMode, selectedMerchantId, activeRange]);

  // ============================================================
  // FETCH ALL REAL BACKEND TELEMETRY DATA
  // ============================================================
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Concurrently query live backend repositories
      const [
        merchantsRes,
        branchesRes,
        agentsRes,
        txRes,
        settlementsRes
      ] = await Promise.allSettled([
        merchantApi.getAll(),
        branchApi.getAll(),
        agentApi.getAll(),
        transactionApi.getHistory({ count: 250 }),
        settlementApi.getAll(),
        dashboardApi.getStats()
      ]);

      // 1. Raw Merchants
      const rawMerchants = merchantsRes.status === 'fulfilled' 
        ? (merchantsRes.value?.data?.data || merchantsRes.value?.data || []) 
        : [];
      const safeMerchants = Array.isArray(rawMerchants) ? rawMerchants : [];
      setMerchantsList(safeMerchants);

      // Merchant ID Lookup Map
      const mLookup = {};
      safeMerchants.forEach(m => {
        mLookup[m.id] = m.merchantTradeName || m.companyLegalName || m.name || `Merchant #${m.id}`;
      });

      // 2. Raw Branches
      const rawBranches = branchesRes.status === 'fulfilled'
        ? (branchesRes.value?.data?.data || branchesRes.value?.data || [])
        : [];
      const safeBranches = (Array.isArray(rawBranches) ? rawBranches : []).map(b => ({
        ...b,
        merchantName: mLookup[b.merchantId] || b.merchantName || `Merchant #${b.merchantId || 'N/A'}`
      }));
      setBranchesList(safeBranches);

      // 3. Raw Agents
      const rawAgents = agentsRes.status === 'fulfilled'
        ? (agentsRes.value?.data?.data || agentsRes.value?.data || [])
        : [];
      const safeAgents = (Array.isArray(rawAgents) ? rawAgents : []).map(a => ({
        ...a,
        merchantName: mLookup[a.merchantId] || a.merchantName || `Merchant #${a.merchantId || 'N/A'}`
      }));
      setAgentsList(safeAgents);

      // 4. Raw Transactions
      const rawTx = txRes.status === 'fulfilled'
        ? (txRes.value?.data?.data || txRes.value?.data || [])
        : [];
      const safeTx = (Array.isArray(rawTx) ? rawTx : []).map(t => {
        const mId = t.merchantId || t.MerchantId;
        const mName = mLookup[mId] || t.merchantName || t.merchant || (mId ? `Merchant #${mId}` : 'Enterprise Partner');
        return {
          ...t,
          merchantId: mId,
          merchantName: mName,
          merchant: mName,
          amountNum: Number(t.amount || t.netAmount || 0),
          statusNorm: (t.status || t.transactionStatus || 'SUCCESS').toUpperCase(),
          dateObj: t.createdAt || t.createdDate || t.date || t.timestamp ? new Date(t.createdAt || t.createdDate || t.date || t.timestamp) : new Date()
        };
      });
      setTransactionsList(safeTx);

      // 5. Raw Settlements
      const rawSettlements = settlementsRes.status === 'fulfilled'
        ? (settlementsRes.value?.data?.data || settlementsRes.value?.data || [])
        : [];
      setSettlementsList(Array.isArray(rawSettlements) ? rawSettlements : []);

      // 6. Pending Approvals Queue
      const pBranches = safeBranches.filter(
        b => b.isApproved === false || b.status === 'Pending Approval' || b.status === 'Pending' || b.isApproved === 0
      );
      const pAgents = safeAgents.filter(
        a => a.isVerified === false || a.isApproved === false || a.status === 'Pending Approval' || a.status === 'Pending' || a.isApproved === 0
      );

      setPendingBranches(pBranches);
      setPendingAgents(pAgents);

    } catch (err) {
      console.error('Error fetching live dashboard telemetry:', err);
      setError(err?.message || 'Failed to load live operational telemetry');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ============================================================
  // SCOPED LIVE COMPUTATIONS FOR SELECTED MERCHANT OR GLOBAL
  // ============================================================
  const isGlobalView = !selectedMerchantId || selectedMerchantId === 'ALL';

  // Active Merchant Profile Object (if specific merchant selected)
  const currentSelectedMerchant = useMemo(() => {
    if (isGlobalView) return null;
    return merchantsList.find(m => String(m.id) === String(selectedMerchantId)) || null;
  }, [isGlobalView, selectedMerchantId, merchantsList]);

  // Scoped Branches
  const scopedBranches = useMemo(() => {
    if (isGlobalView) return branchesList;
    return branchesList.filter(b => String(b.merchantId) === String(selectedMerchantId));
  }, [isGlobalView, branchesList, selectedMerchantId]);

  // Scoped Agents
  const scopedAgents = useMemo(() => {
    if (isGlobalView) return agentsList;
    return agentsList.filter(a => String(a.merchantId) === String(selectedMerchantId));
  }, [isGlobalView, agentsList, selectedMerchantId]);

  // Scoped Transactions
  const scopedTransactions = useMemo(() => {
    if (isGlobalView) return transactionsList;
    const smId = String(selectedMerchantId);
    const smName = currentSelectedMerchant 
      ? (currentSelectedMerchant.merchantTradeName || currentSelectedMerchant.companyLegalName || currentSelectedMerchant.name || '').toLowerCase()
      : '';

    return transactionsList.filter(t => {
      if (t.merchantId && String(t.merchantId) === smId) return true;
      if (t.merchantName && t.merchantName.toLowerCase() === smName) return true;
      if (t.merchant && t.merchant.toLowerCase() === smName) return true;
      return false;
    });
  }, [isGlobalView, transactionsList, selectedMerchantId, currentSelectedMerchant]);

  // Scoped Settlements
  const scopedSettlements = useMemo(() => {
    if (isGlobalView) return settlementsList;
    return settlementsList.filter(s => String(s.merchantId) === String(selectedMerchantId));
  }, [isGlobalView, settlementsList, selectedMerchantId]);

  // Scoped Pending Approvals
  const scopedPendingBranches = useMemo(() => {
    if (isGlobalView) return pendingBranches;
    return pendingBranches.filter(b => String(b.merchantId) === String(selectedMerchantId));
  }, [isGlobalView, pendingBranches, selectedMerchantId]);

  const scopedPendingAgents = useMemo(() => {
    if (isGlobalView) return pendingAgents;
    return pendingAgents.filter(a => String(a.merchantId) === String(selectedMerchantId));
  }, [isGlobalView, pendingAgents, selectedMerchantId]);

  // Total Revenue / Gross Volume from Scoped Transactions
  const scopedMetrics = useMemo(() => {
    const successfulTx = scopedTransactions.filter(
      t => t.statusNorm === 'SUCCESS' || t.statusNorm === 'COMPLETED' || t.statusNorm === 'SETTLED'
    );
    
    const totalVolume = successfulTx.reduce((sum, t) => sum + (t.amountNum || 0), 0);
    const totalTxCount = scopedTransactions.length;
    const successRate = totalTxCount > 0 ? ((successfulTx.length / totalTxCount) * 100).toFixed(1) : '100.0';
    const avgTicket = successfulTx.length > 0 ? (totalVolume / successfulTx.length).toFixed(0) : '0';

    const activeBranches = scopedBranches.filter(b => b.isActive !== false).length;
    const activeAgents = scopedAgents.filter(a => a.isActive !== false).length;

    const settledVolume = scopedSettlements.reduce((sum, s) => sum + Number(s.amount || s.netSettlementAmount || 0), 0);

    return {
      totalVolume,
      successfulTxCount: successfulTx.length,
      totalTxCount,
      successRate,
      avgTicket,
      activeBranches,
      totalBranches: scopedBranches.length,
      activeAgents,
      totalAgents: scopedAgents.length,
      settledVolume
    };
  }, [scopedTransactions, scopedBranches, scopedAgents, scopedSettlements]);

  // ============================================================
  // DYNAMIC CHART DATASETS FROM LIVE BACKEND TRANSACTIONS
  // ============================================================

  // 1. Dynamic Revenue Settlement Chart across Timeline
  const revenueChartData = useMemo(() => {
    let labels = [];
    let dataPoints = [];

    const now = new Date();

    if (activeRange === 'Today') {
      labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
      const buckets = [0, 0, 0, 0, 0, 0, 0];
      
      scopedTransactions.forEach(t => {
        const hour = t.dateObj.getHours();
        const amt = t.amountNum || 0;
        if (hour < 4) buckets[0] += amt;
        else if (hour < 8) buckets[1] += amt;
        else if (hour < 12) buckets[2] += amt;
        else if (hour < 16) buckets[3] += amt;
        else if (hour < 20) buckets[4] += amt;
        else buckets[5] += amt;
      });
      dataPoints = buckets;
    } else if (activeRange === 'Week') {
      // Last 7 Days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      labels = [];
      const buckets = [0, 0, 0, 0, 0, 0, 0];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        labels.push(days[d.getDay()]);
      }

      scopedTransactions.forEach(t => {
        const diffDays = Math.floor((now - t.dateObj) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const idx = 6 - diffDays;
          if (idx >= 0 && idx < 7) {
            buckets[idx] += t.amountNum || 0;
          }
        }
      });
      dataPoints = buckets;
    } else if (activeRange === 'Month') {
      // 4 Weeks
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const buckets = [0, 0, 0, 0];

      scopedTransactions.forEach(t => {
        const diffDays = Math.floor((now - t.dateObj) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) buckets[3] += t.amountNum || 0;
        else if (diffDays < 14) buckets[2] += t.amountNum || 0;
        else if (diffDays < 21) buckets[1] += t.amountNum || 0;
        else if (diffDays < 30) buckets[0] += t.amountNum || 0;
      });
      dataPoints = buckets;
    } else {
      // 12 Months
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const buckets = new Array(12).fill(0);

      scopedTransactions.forEach(t => {
        const mIdx = t.dateObj.getMonth();
        buckets[mIdx] += t.amountNum || 0;
      });
      dataPoints = buckets;
    }

    if (chartViewMode === 'area') {
      return {
        labels,
        datasets: [{
          label: 'Revenue (₹)',
          data: dataPoints,
          borderColor: '#6366f1',
          borderWidth: 3,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(99, 102, 241, 0.2)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
            gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
            gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
            return gradient;
          },
          tension: 0.45,
          fill: true,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 8,
        }]
      };
    }

    return {
      labels,
      datasets: [{
        label: 'Revenue (₹)',
        data: dataPoints,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(99, 102, 241, 0.8)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, '#6366f1');
          gradient.addColorStop(1, '#a855f7');
          return gradient;
        },
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 8,
        barPercentage: 0.5,
        hoverBackgroundColor: '#818cf8',
      }]
    };
  }, [scopedTransactions, activeRange, chartViewMode]);

  // 2. Dynamic Payment Methods Share (Doughnut Chart)
  const paymentMethodsData = useMemo(() => {
    const counts = { UPI: 0, Cards: 0, NetBanking: 0, QR: 0, Cash: 0, Wallets: 0 };

    scopedTransactions.forEach(t => {
      const mode = (t.paymentMode || t.paymentMethod || t.mode || t.channel || 'UPI').toUpperCase();
      if (mode.includes('UPI')) counts.UPI++;
      else if (mode.includes('CARD')) counts.Cards++;
      else if (mode.includes('NET') || mode.includes('BANK')) counts.NetBanking++;
      else if (mode.includes('QR')) counts.QR++;
      else if (mode.includes('CASH')) counts.Cash++;
      else counts.Wallets++;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    // If no transactions yet, show clean distribution
    const labels = Object.keys(counts).filter(k => total === 0 || counts[k] > 0);
    const data = labels.map(k => total === 0 ? 0 : counts[k]);

    return {
      labels: labels.length > 0 ? labels : ['UPI Intent', 'Cards', 'Net Banking'],
      datasets: [{
        data: data.length > 0 ? data : [60, 25, 15],
        backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
        borderColor: 'rgba(17, 24, 39, 0.9)',
        borderWidth: 4,
        hoverOffset: 6,
      }]
    };
  }, [scopedTransactions]);

  // 3. Dynamic Transaction Velocity Line Chart
  const velocityChartData = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();

    scopedTransactions.forEach(t => {
      const diffDays = Math.floor((now - t.dateObj) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        const idx = 6 - diffDays;
        if (idx >= 0 && idx < 7) {
          buckets[idx]++;
        }
      }
    });

    return {
      labels,
      datasets: [{
        label: 'Transactions',
        data: buckets,
        borderColor: '#06b6d4',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(6, 182, 212, 0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
          gradient.addColorStop(0.6, 'rgba(6, 182, 212, 0.1)');
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
          return gradient;
        },
        tension: 0.45,
        fill: true,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        borderWidth: 2.5,
      }]
    };
  }, [scopedTransactions]);

  // 4. Dynamic Status Distribution (Doughnut Chart)
  const statusDistributionData = useMemo(() => {
    const counts = { Success: 0, Pending: 0, Failed: 0, Refunded: 0 };

    scopedTransactions.forEach(t => {
      const st = t.statusNorm;
      if (st.includes('SUCCESS') || st.includes('COMPLETED') || st.includes('SETTLED')) counts.Success++;
      else if (st.includes('PEND') || st.includes('PROCESS')) counts.Pending++;
      else if (st.includes('FAIL') || st.includes('DECLINE')) counts.Failed++;
      else if (st.includes('REFUND')) counts.Refunded++;
      else counts.Success++;
    });

    return {
      labels: ['Success', 'Pending', 'Failed', 'Refunded'],
      datasets: [{
        data: [counts.Success, counts.Pending, counts.Failed, counts.Refunded],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderColor: 'rgba(17, 24, 39, 0.9)',
        borderWidth: 4,
        hoverOffset: 6,
      }]
    };
  }, [scopedTransactions]);

  // Chart Options
  const revenueOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        cornerRadius: 10,
        padding: 14,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: '700' },
        bodyFont: { family: 'JetBrains Mono', size: 13, weight: '600' },
        callbacks: {
          label: (context) => ` Settlement: ₹${Number(context.parsed.y || 0).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
          font: { family: 'JetBrains Mono', size: 11, weight: '500' },
          callback: (val) => val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
        },
        grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false }
      },
      x: {
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } },
        grid: { display: false }
      }
    }
  }), []);

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
          boxWidth: 8,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        cornerRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} Txns`
        }
      }
    }
  }), []);

  // ============================================================
  // APPROVAL HANDLERS (BRANCH & AGENT)
  // ============================================================
  const handleApproveBranch = async (id, name) => {
    try {
      setApprovingId(`branch-${id}`);
      await branchApi.approve(id);
      setPendingBranches(prev => prev.filter(b => b.id !== id));
      setBranchesList(prev => prev.map(b => b.id === id ? { ...b, isApproved: true, isActive: true, status: 'Active' } : b));
      setActionToast({ type: 'success', text: `✅ Branch "${name}" approved and activated in live database!` });
      setTimeout(() => setActionToast(null), 4500);
    } catch (err) {
      console.error('Error approving branch:', err);
      setActionToast({ type: 'error', text: `Failed to approve branch: ${err?.message || 'Error'}` });
      setTimeout(() => setActionToast(null), 4500);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectBranch = async (id, name) => {
    if (window.confirm(`Are you sure you want to reject branch "${name}"?`)) {
      try {
        setApprovingId(`branch-${id}`);
        await branchApi.reject(id, 'Software Admin Rejection');
        setPendingBranches(prev => prev.filter(b => b.id !== id));
        setActionToast({ type: 'warning', text: `❌ Branch "${name}" rejected.` });
        setTimeout(() => setActionToast(null), 4500);
      } catch (err) {
        console.error('Error rejecting branch:', err);
        setActionToast({ type: 'error', text: `Failed to reject branch: ${err?.message || 'Error'}` });
        setTimeout(() => setActionToast(null), 4500);
      } finally {
        setApprovingId(null);
      }
    }
  };

  const handleApproveAgent = async (id, name) => {
    try {
      setApprovingId(`agent-${id}`);
      await agentApi.approve(id);
      setPendingAgents(prev => prev.filter(a => a.id !== id));
      setAgentsList(prev => prev.map(a => a.id === id ? { ...a, isVerified: true, isApproved: true, isActive: true, status: 'Active' } : a));
      setActionToast({ type: 'success', text: `✅ Field Agent "${name}" approved and verified in live database!` });
      setTimeout(() => setActionToast(null), 4500);
    } catch (err) {
      console.error('Error approving agent:', err);
      setActionToast({ type: 'error', text: `Failed to approve agent: ${err?.message || 'Error'}` });
      setTimeout(() => setActionToast(null), 4500);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectAgent = async (id, name) => {
    if (window.confirm(`Are you sure you want to reject field agent "${name}"?`)) {
      try {
        setApprovingId(`agent-${id}`);
        await agentApi.reject(id, 'Software Admin Rejection');
        setPendingAgents(prev => prev.filter(a => a.id !== id));
        setActionToast({ type: 'warning', text: `❌ Field Agent "${name}" rejected.` });
        setTimeout(() => setActionToast(null), 4500);
      } catch (err) {
        console.error('Error rejecting agent:', err);
        setActionToast({ type: 'error', text: `Failed to reject agent: ${err?.message || 'Error'}` });
        setTimeout(() => setActionToast(null), 4500);
      } finally {
        setApprovingId(null);
      }
    }
  };

  // Filtered merchants for dashboard directory search
  const filteredDashboardMerchants = useMemo(() => {
    if (!merchantSearch) return merchantsList;
    const q = merchantSearch.toLowerCase().trim();
    return merchantsList.filter(m => {
      const name = (m.merchantTradeName || m.companyLegalName || m.merchantName || m.name || '').toLowerCase();
      const email = (m.registeredEmail || m.email || '').toLowerCase();
      const phone = (m.registeredPhone || m.phone || '');
      const cat = (m.businessCategory || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || cat.includes(q) || String(m.id).includes(q);
    });
  }, [merchantsList, merchantSearch]);

  if (loading) {
    return (
      <DashboardLayout pageTitle="Software Admin Dashboard">
        <LoadingAnimation message="Connecting to Live Core Telemetry & Computing Metrics..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Software Admin Dashboard">
      <div className="admin-dashboard-root">
        
        {/* ============================================================
            TOP EXECUTIVE HERO HEADER & LIVE MERCHANT SELECTOR
            ============================================================ */}
        <div className="dash-hero-header">
          <div className="dash-hero-titles">
            <div className="dash-status-badge">
              <span className="pulse-dot"></span>
              <DashIcons.Sparkles />
              <span>Live Core Banking & Gateway Telemetry</span>
            </div>
            
            <h1 className="dash-main-title">
              Software <span className="gradient-text">Admin Dashboard</span>
            </h1>
            
            <p className="dash-main-subtitle">
              {isGlobalView 
                ? 'Global platform aggregate across all enterprise merchants, regional branches, and gross transaction settlements.'
                : `Dedicated operational telemetry view focused on merchant partner "${currentSelectedMerchant?.merchantTradeName || currentSelectedMerchant?.name || 'Selected Merchant'}".`
              }
            </p>
          </div>

          {/* Action Cluster & Interactive Merchant Selector */}
          <div className="dash-hero-actions">
            
            {/* Live Merchant Selector Dropdown */}
            <div className="merchant-scope-selector-box">
              <span className="scope-icon"><DashIcons.Filter /></span>
              <select 
                className="merchant-scope-select"
                value={selectedMerchantId}
                onChange={(e) => handleSelectMerchant(e.target.value)}
              >
                <option value="ALL">🌐 All Merchants (Global Aggregate - {merchantsList.length} Partners)</option>
                {merchantsList.map(m => {
                  const tName = m.merchantTradeName || m.companyLegalName || m.name || `Merchant #${m.id}`;
                  const isY = m.integrationStatus === 'Y' || m.IntegrationStatus === 'Y';
                  return (
                    <option key={m.id} value={m.id}>
                      🏢 {tName} (#{m.id}) — [{isY ? 'API Integrated (Y)' : 'Standard (N)'}]
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Scope Reset Button (when specific merchant is active) */}
            {!isGlobalView && (
              <button 
                className="btn-reset-scope" 
                onClick={() => handleSelectMerchant('ALL')}
                title="Reset to Global All-Merchants View"
              >
                ✕ Reset to All
              </button>
            )}

            {/* Refresh Live Feed */}
            <button className="dash-refresh-btn" onClick={fetchDashboardData} title="Refresh Live Telemetry">
              <DashIcons.Refresh />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="dash-error-callout">
            <span>⚠️ {error}</span>
            <button onClick={fetchDashboardData} className="dash-retry-btn">Retry Connection</button>
          </div>
        )}

        {/* Toast Alert */}
        {actionToast && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            background: actionToast.type === 'success' ? '#065f46' : actionToast.type === 'warning' ? '#9a3412' : '#991b1b',
            color: '#ffffff',
            padding: '14px 24px',
            borderRadius: '12px',
            boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
            fontWeight: '700',
            fontSize: '14px',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'popInModal 0.3s ease-out'
          }}>
            {actionToast.text}
          </div>
        )}

        {/* ============================================================
            SELECTED MERCHANT HIGHLIGHT HERO BANNER (When Merchant Active)
            ============================================================ */}
        {!isGlobalView && currentSelectedMerchant && (
          <div className="merchant-focused-hero-card">
            <div className="focused-card-ambient-glow"></div>
            
            <div className="focused-merchant-header">
              <div className="focused-avatar-box">
                {(currentSelectedMerchant.merchantTradeName || currentSelectedMerchant.name || 'M').charAt(0).toUpperCase()}
              </div>

              <div className="focused-titles">
                <div className="focused-badges-row">
                  <span className="focused-id-pill font-mono">MERCHANT #{currentSelectedMerchant.id}</span>
                  
                  {currentSelectedMerchant.integrationStatus === 'Y' || currentSelectedMerchant.IntegrationStatus === 'Y' ? (
                    <span className="focused-tag is-api">⚡ Dynamic External API (Y)</span>
                  ) : (
                    <span className="focused-tag is-std">📝 Standard Manual Roster (N)</span>
                  )}

                  <span className="focused-tag is-kyc">
                    {currentSelectedMerchant.isApproved !== false ? '✓ KYC Verified' : '⏳ KYC Pending'}
                  </span>
                </div>

                <h2 className="focused-trade-name">
                  {currentSelectedMerchant.merchantTradeName || currentSelectedMerchant.name || 'Enterprise Merchant'}
                </h2>
                
                <p className="focused-legal-name">
                  Legal Entity: {currentSelectedMerchant.companyLegalName || currentSelectedMerchant.name || 'Registered Corporate Entity'} • Category: {currentSelectedMerchant.businessCategory || 'Fintech / Retail'}
                </p>
              </div>
            </div>

            {/* Merchant Quick Info Strip */}
            <div className="focused-info-grid">
              <div className="info-item">
                <span className="info-label">Contact Email</span>
                <span className="info-value">{currentSelectedMerchant.registeredEmail || currentSelectedMerchant.email || 'N/A'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Phone Hotline</span>
                <span className="info-value font-mono">{currentSelectedMerchant.registeredPhone || currentSelectedMerchant.phone || 'N/A'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">PAN Number</span>
                <span className="info-value font-mono text-amber">{currentSelectedMerchant.panNumber || 'N/A'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Settlement IFSC</span>
                <span className="info-value font-mono text-cyan">{currentSelectedMerchant.bankIfsc || currentSelectedMerchant.ifscCode || 'N/A'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Primary Account</span>
                <span className="info-value font-mono">{currentSelectedMerchant.bankAccountNumber || 'N/A'}</span>
              </div>
            </div>

            {/* Merchant Quick Action Cluster */}
            <div className="focused-action-cluster">
              <button
                className="btn-merchant-action is-branch"
                onClick={() => navigate(`/branches/add?merchantId=${currentSelectedMerchant.id}`)}
              >
                <span>🏢 + Add Branch for this Merchant</span>
              </button>

              <button
                className="btn-merchant-action is-agent"
                onClick={() => navigate(`/agents/add?merchantId=${currentSelectedMerchant.id}`)}
              >
                <span>👤 + Add Agent for this Merchant</span>
              </button>

              <button
                className="btn-merchant-action is-view"
                onClick={() => navigate(`/merchants/${currentSelectedMerchant.id}`)}
              >
                <span>👁️ Full Merchant Details</span>
              </button>

              <button
                className="btn-merchant-action is-reset"
                onClick={() => handleSelectMerchant('ALL')}
              >
                <span>🌐 Switch to All Merchants</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            PRIMARY KPI METRIC CARDS (DYNAMICALLY COMPUTED FROM REAL DATA)
            ============================================================ */}
        <div className="dash-kpi-grid">
          
          {/* KPI 1: Gross Volume / Revenue */}
          <div className="kpi-glass-card">
            <div className="kpi-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%)' }}></div>
            
            <div className="kpi-header-row">
              <div className="kpi-icon-emblem" style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#10b981' }}>
                <DashIcons.Revenue />
              </div>
              <div className="kpi-trend-pill" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}>
                <DashIcons.ArrowUp />
                <span>{scopedMetrics.successRate}% Success</span>
              </div>
            </div>

            <div className="kpi-body">
              <div className="kpi-value-text font-mono">
                ₹{scopedMetrics.totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="kpi-label-text">
                {isGlobalView ? 'Total Platform Revenue' : 'Merchant Gross Volume'}
              </div>
            </div>

            <div className="kpi-footer-row">
              <span className="kpi-subtitle-text">
                {scopedMetrics.successfulTxCount} successful processing orders
              </span>
            </div>
          </div>

          {/* KPI 2: Merchants / Total Transactions */}
          <div className="kpi-glass-card">
            <div className="kpi-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)' }}></div>
            
            <div className="kpi-header-row">
              <div className="kpi-icon-emblem" style={{ background: 'rgba(99, 102, 241, 0.18)', color: '#6366f1' }}>
                {isGlobalView ? <DashIcons.Merchants /> : <DashIcons.Trending />}
              </div>
              <div className="kpi-trend-pill" style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.15)' }}>
                <DashIcons.ArrowUp />
                <span>{isGlobalView ? `${merchantsList.length} Active` : `₹${scopedMetrics.avgTicket} Avg`}</span>
              </div>
            </div>

            <div className="kpi-body">
              <div className="kpi-value-text font-mono">
                {isGlobalView ? `${merchantsList.length} Partners` : `${scopedMetrics.totalTxCount} Orders`}
              </div>
              <div className="kpi-label-text">
                {isGlobalView ? 'Enterprise Merchants' : 'Processed Transactions'}
              </div>
            </div>

            <div className="kpi-footer-row">
              <span className="kpi-subtitle-text">
                {isGlobalView 
                  ? `${merchantsList.filter(m => m.integrationStatus === 'Y').length} API Integrated, ${merchantsList.filter(m => m.integrationStatus !== 'Y').length} Standard`
                  : `Average ticket size: ₹${scopedMetrics.avgTicket}`
                }
              </span>
            </div>
          </div>

          {/* KPI 3: Regional Branches */}
          <div className="kpi-glass-card">
            <div className="kpi-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, transparent 70%)' }}></div>
            
            <div className="kpi-header-row">
              <div className="kpi-icon-emblem" style={{ background: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b' }}>
                <DashIcons.Branches />
              </div>
              <div className="kpi-trend-pill" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)' }}>
                <DashIcons.ArrowUp />
                <span>{scopedMetrics.activeBranches} Active</span>
              </div>
            </div>

            <div className="kpi-body">
              <div className="kpi-value-text font-mono">
                {scopedMetrics.totalBranches} Branches
              </div>
              <div className="kpi-label-text">
                {isGlobalView ? 'Bank & Regional Branches' : 'Branches of this Merchant'}
              </div>
            </div>

            <div className="kpi-footer-row">
              <span className="kpi-subtitle-text">
                {scopedPendingBranches.length > 0 
                  ? `⚠️ ${scopedPendingBranches.length} branches pending approval`
                  : `${scopedMetrics.activeBranches} operational units live`
                }
              </span>
            </div>
          </div>

          {/* KPI 4: Field Agents */}
          <div className="kpi-glass-card">
            <div className="kpi-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, transparent 70%)' }}></div>
            
            <div className="kpi-header-row">
              <div className="kpi-icon-emblem" style={{ background: 'rgba(6, 182, 212, 0.18)', color: '#06b6d4' }}>
                <DashIcons.Agents />
              </div>
              <div className="kpi-trend-pill" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.15)' }}>
                <DashIcons.ArrowUp />
                <span>{scopedMetrics.activeAgents} Verified</span>
              </div>
            </div>

            <div className="kpi-body">
              <div className="kpi-value-text font-mono">
                {scopedMetrics.totalAgents} Agents
              </div>
              <div className="kpi-label-text">
                {isGlobalView ? 'Field Collection Units' : 'Agents of this Merchant'}
              </div>
            </div>

            <div className="kpi-footer-row">
              <span className="kpi-subtitle-text">
                {scopedPendingAgents.length > 0
                  ? `⚠️ ${scopedPendingAgents.length} agents pending verification`
                  : `${scopedMetrics.activeAgents} active field collectors`
                }
              </span>
            </div>
          </div>

        </div>

        {/* ============================================================
            EXECUTIVE APPROVALS & COMPLIANCE GOVERNANCE CONSOLE
            ============================================================ */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 22, 36, 0.95) 0%, rgba(13, 17, 28, 0.98) 100%)',
          border: (scopedPendingBranches.length + scopedPendingAgents.length) > 0 ? '1px solid rgba(234, 179, 8, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '24px',
          boxShadow: (scopedPendingBranches.length + scopedPendingAgents.length) > 0 
            ? '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(234, 179, 8, 0.12)' 
            : '0 12px 32px rgba(0, 0, 0, 0.35)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: (scopedPendingBranches.length + scopedPendingAgents.length) > 0 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
            paddingBottom: (scopedPendingBranches.length + scopedPendingAgents.length) > 0 ? '18px' : '0',
            marginBottom: (scopedPendingBranches.length + scopedPendingAgents.length) > 0 ? '20px' : '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: (scopedPendingBranches.length + scopedPendingAgents.length) > 0 ? 'rgba(234, 179, 8, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                border: (scopedPendingBranches.length + scopedPendingAgents.length) > 0 ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                {(scopedPendingBranches.length + scopedPendingAgents.length) > 0 ? '🛡️' : '✅'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#ffffff' }}>
                    Executive Approvals & Governance Console
                  </h3>
                  {(scopedPendingBranches.length + scopedPendingAgents.length) > 0 ? (
                    <span style={{
                      background: '#eab308',
                      color: '#000000',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 10px',
                      borderRadius: '9999px'
                    }}>
                      {scopedPendingBranches.length + scopedPendingAgents.length} Actionable Items
                    </span>
                  ) : (
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#6ee7b7',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 10px',
                      borderRadius: '9999px'
                    }}>
                      All Entities Synchronized
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                  {(scopedPendingBranches.length + scopedPendingAgents.length) > 0
                    ? `Review and verify compliance authorization for newly registered branches and field agents${!isGlobalView ? ` under ${currentSelectedMerchant?.merchantTradeName || 'this merchant'}` : ''}.`
                    : `All regional branches and field representatives${!isGlobalView ? ` for ${currentSelectedMerchant?.merchantTradeName || 'this merchant'}` : ''} are active and approved in live database.`}
                </p>
              </div>
            </div>

            {/* Tab Filters / Navigation */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {(scopedPendingBranches.length + scopedPendingAgents.length) > 0 && (
                <div style={{
                  display: 'flex',
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <button
                    onClick={() => setActiveApprovalTab('ALL')}
                    style={{
                      background: activeApprovalTab === 'ALL' ? '#6366f1' : 'transparent',
                      color: activeApprovalTab === 'ALL' ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    All ({scopedPendingBranches.length + scopedPendingAgents.length})
                  </button>
                  <button
                    onClick={() => setActiveApprovalTab('BRANCHES')}
                    style={{
                      background: activeApprovalTab === 'BRANCHES' ? '#10b981' : 'transparent',
                      color: activeApprovalTab === 'BRANCHES' ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    🏢 Branches ({scopedPendingBranches.length})
                  </button>
                  <button
                    onClick={() => setActiveApprovalTab('AGENTS')}
                    style={{
                      background: activeApprovalTab === 'AGENTS' ? '#06b6d4' : 'transparent',
                      color: activeApprovalTab === 'AGENTS' ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    👤 Agents ({scopedPendingAgents.length})
                  </button>
                </div>
              )}
              <button
                onClick={() => navigate('/branches')}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#6ee7b7',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🏢 Branches Directory
              </button>
              <button
                onClick={() => navigate('/agents')}
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  color: '#a5b4fc',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                👤 Agents Directory
              </button>
            </div>
          </div>

          {/* Action Items List */}
          {(scopedPendingBranches.length + scopedPendingAgents.length) > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Pending Branches */}
              {(activeApprovalTab === 'ALL' || activeApprovalTab === 'BRANCHES') && scopedPendingBranches.map((branch) => (
                <div
                  key={`branch-${branch.id}`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.18)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      🏢
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', color: '#ffffff', fontSize: '15px' }}>{branch.name}</span>
                        <span style={{
                          fontFamily: 'monospace',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#6ee7b7',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>
                          {branch.code || branch.external_branch_id || `BR-${branch.id}`}
                        </span>
                        <span style={{
                          background: 'rgba(234, 179, 8, 0.15)',
                          color: '#facc15',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          Branch Verification
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                        <span style={{ color: '#cbd5e1' }}>Merchant:</span> {branch.merchantName} • <span style={{ color: '#cbd5e1' }}>Location:</span> {branch.city || 'N/A'}, {branch.state || 'India'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleApproveBranch(branch.id, branch.name)}
                      disabled={approvingId === `branch-${branch.id}`}
                      style={{
                        background: '#10b981',
                        color: '#000000',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: approvingId === `branch-${branch.id}` ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      {approvingId === `branch-${branch.id}` ? 'Approving...' : '✓ Approve Branch'}
                    </button>
                    <button
                      onClick={() => handleRejectBranch(branch.id, branch.name)}
                      disabled={approvingId === `branch-${branch.id}`}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}

              {/* Pending Agents */}
              {(activeApprovalTab === 'ALL' || activeApprovalTab === 'AGENTS') && scopedPendingAgents.map((agent) => (
                <div
                  key={`agent-${agent.id}`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(6, 182, 212, 0.18)',
                      color: '#06b6d4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      👤
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', color: '#ffffff', fontSize: '15px' }}>{agent.name}</span>
                        <span style={{
                          fontFamily: 'monospace',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#67e8f9',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>
                          {agent.agentCode || agent.external_agent_id || `AG-${agent.id}`}
                        </span>
                        <span style={{
                          background: 'rgba(234, 179, 8, 0.15)',
                          color: '#facc15',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          Agent Authorization
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                        <span style={{ color: '#cbd5e1' }}>Merchant:</span> {agent.merchantName} • <span style={{ color: '#cbd5e1' }}>Commission:</span> {agent.commissionRate || 2.5}% • <span style={{ color: '#cbd5e1' }}>Contact:</span> {agent.email || agent.phone || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleApproveAgent(agent.id, agent.name)}
                      disabled={approvingId === `agent-${agent.id}`}
                      style={{
                        background: '#06b6d4',
                        color: '#000000',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: approvingId === `agent-${agent.id}` ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
                      }}
                    >
                      {approvingId === `agent-${agent.id}` ? 'Approving...' : '✓ Approve Agent'}
                    </button>
                    <button
                      onClick={() => handleRejectAgent(agent.id, agent.name)}
                      disabled={approvingId === `agent-${agent.id}`}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}

            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>✨</span>
                <span style={{ color: '#6ee7b7', fontSize: '13px', fontWeight: '600' }}>
                  No pending approvals in queue. All merchant branches and field representatives are fully synchronized and authorized.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            CHARTS ROW 1: REVENUE SETTLEMENTS & PAYMENT CHANNELS
            ============================================================ */}
        <div className="dash-charts-grid-row">
          
          {/* Main Revenue Settlements Chart */}
          <div className="chart-glass-panel chart-col-8">
            <div className="chart-panel-header">
              <div className="chart-title-zone">
                <div className="chart-title-top">
                  <h3 className="chart-panel-title">
                    Revenue <span className="gradient-text">Settlements</span>
                  </h3>
                  <span className="chart-metric-badge font-mono">
                    Total: ₹{scopedMetrics.totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="chart-panel-subtitle">
                  {isGlobalView 
                    ? 'Gross processed volume computed across all connected merchant partners' 
                    : `Gross processed volume for "${currentSelectedMerchant?.merchantTradeName || currentSelectedMerchant?.name || 'Selected Merchant'}"`
                  }
                </p>
              </div>

              <div className="chart-controls-cluster">
                {/* View Mode Toggle (Area / Bar) */}
                <div className="chart-mode-toggle">
                  <button 
                    className={`mode-btn ${chartViewMode === 'area' ? 'is-active' : ''}`}
                    onClick={() => setChartViewMode('area')}
                    title="Area View"
                  >
                    <DashIcons.ChartLine />
                  </button>
                  <button 
                    className={`mode-btn ${chartViewMode === 'bar' ? 'is-active' : ''}`}
                    onClick={() => setChartViewMode('bar')}
                    title="Bar View"
                  >
                    <DashIcons.ChartBar />
                  </button>
                </div>

                {/* Range Switcher */}
                <div className="chart-range-switcher">
                  {['Today', 'Week', 'Month', 'Year'].map((range) => (
                    <button 
                      key={range}
                      className={`range-pill-btn ${activeRange === range ? 'is-active' : ''}`}
                      onClick={() => setActiveRange(range)}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart-canvas-wrapper" style={{ height: '310px' }}>
              {chartViewMode === 'area' ? (
                <Line key={`rev-area-${chartKey}`} data={revenueChartData} options={revenueOptions} />
              ) : (
                <Bar key={`rev-bar-${chartKey}`} data={revenueChartData} options={revenueOptions} />
              )}
            </div>
          </div>

          {/* Payment Methods Split */}
          <div className="chart-glass-panel chart-col-4">
            <div className="chart-panel-header">
              <div>
                <h3 className="chart-panel-title">
                  Payment <span className="gradient-text">Channels</span>
                </h3>
                <p className="chart-panel-subtitle">Method distribution ratio</p>
              </div>
            </div>

            <div className="chart-canvas-wrapper doughnut-container" style={{ height: '310px' }}>
              <div className="doughnut-center-badge">
                <span className="center-stat font-mono">{scopedMetrics.totalTxCount}</span>
                <span className="center-tag">Live Txns</span>
              </div>
              <Doughnut key={`pm-doughnut-${chartKey}`} data={paymentMethodsData} options={doughnutOptions} />
            </div>
          </div>

        </div>

        {/* ============================================================
            CHARTS ROW 2: VELOCITY & STATUS FULFILLMENT
            ============================================================ */}
        <div className="dash-charts-grid-row">
          
          {/* Velocity Line Chart */}
          <div className="chart-glass-panel chart-col-6">
            <div className="chart-panel-header">
              <div>
                <h3 className="chart-panel-title">
                  Transaction <span className="gradient-text">Velocity</span>
                </h3>
                <p className="chart-panel-subtitle">Order volume cadence over past 7 days</p>
              </div>
              <span className="status-kpi-pill is-cyan font-mono">
                ⚡ {scopedMetrics.totalTxCount} Total Orders
              </span>
            </div>

            <div className="chart-canvas-wrapper" style={{ height: '270px' }}>
              <Line key={`vol-line-${chartKey}`} data={velocityChartData} options={revenueOptions} />
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="chart-glass-panel chart-col-6">
            <div className="chart-panel-header">
              <div>
                <h3 className="chart-panel-title">
                  Status <span className="gradient-text">Fulfillment</span>
                </h3>
                <p className="chart-panel-subtitle">Success rate vs. Exception telemetry</p>
              </div>
              <span className="status-kpi-pill is-green font-mono">
                {scopedMetrics.successRate}% Success Rate
              </span>
            </div>

            <div className="chart-canvas-wrapper doughnut-container" style={{ height: '270px' }}>
              <div className="doughnut-center-badge">
                <span className="center-stat font-mono">{scopedMetrics.successRate}%</span>
                <span className="center-tag">Fulfilled</span>
              </div>
              <Doughnut key={`st-doughnut-${chartKey}`} data={statusDistributionData} options={doughnutOptions} />
            </div>
          </div>

        </div>

        {/* ============================================================
            SPECIFIC MERCHANT ROSTER EXPLORER (When specific merchant selected)
            ============================================================ */}
        {!isGlobalView && currentSelectedMerchant && (
          <div className="dash-table-glass-card" style={{ marginBottom: '28px' }}>
            <div className="table-card-top-row" style={{ flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px' }}>🏢</span>
                  <h3 className="table-card-heading" style={{ margin: 0 }}>
                    Operational Roster for <span className="gradient-text">{currentSelectedMerchant.merchantTradeName || currentSelectedMerchant.name}</span>
                  </h3>
                </div>
                <p className="table-card-subheading">Regional branch locations and verified field collection agents belonging strictly to this merchant</p>
              </div>

              {/* Tab Selector for Focused Merchant */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  display: 'flex',
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '3px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <button
                    onClick={() => setMerchantDetailTab('branches')}
                    style={{
                      background: merchantDetailTab === 'branches' ? '#10b981' : 'transparent',
                      color: merchantDetailTab === 'branches' ? '#000000' : '#94a3b8',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    🏢 Branches ({scopedBranches.length})
                  </button>
                  <button
                    onClick={() => setMerchantDetailTab('agents')}
                    style={{
                      background: merchantDetailTab === 'agents' ? '#06b6d4' : 'transparent',
                      color: merchantDetailTab === 'agents' ? '#000000' : '#94a3b8',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    👤 Agents ({scopedAgents.length})
                  </button>
                </div>

                <button
                  onClick={() => navigate(merchantDetailTab === 'branches' ? `/branches/add?merchantId=${currentSelectedMerchant.id}` : `/agents/add?merchantId=${currentSelectedMerchant.id}`)}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {merchantDetailTab === 'branches' ? '+ Add Branch' : '+ Add Agent'}
                </button>
              </div>
            </div>

            {/* Content for Branches Tab */}
            {merchantDetailTab === 'branches' && (
              <div className="table-viewport-wrapper">
                {scopedBranches.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>🏢</div>
                    <div style={{ fontWeight: '700', color: '#ffffff' }}>No Branches Found for this Merchant</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>Click "+ Add Branch" to create a new regional branch.</div>
                  </div>
                ) : (
                  <table className="ultra-data-table">
                    <thead>
                      <tr>
                        <th>Branch Name</th>
                        <th>Branch Code</th>
                        <th>Location</th>
                        <th>Manager / Contact</th>
                        <th>Integration</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scopedBranches.map((b) => (
                        <tr key={b.id} className="data-table-row">
                          <td>
                            <div style={{ fontWeight: '700', color: '#ffffff' }}>{b.name || b.branchName}</div>
                          </td>
                          <td>
                            <span className="order-id-pill font-mono">{b.code || b.branchCode || `BR-${b.id}`}</span>
                          </td>
                          <td>
                            <span style={{ color: '#cbd5e1', fontSize: '12.5px' }}>{b.city || 'N/A'}, {b.state || 'India'}</span>
                          </td>
                          <td>
                            <span style={{ color: '#94a3b8', fontSize: '12.5px' }}>{b.managerName || b.phone || b.email || 'N/A'}</span>
                          </td>
                          <td>
                            <span style={{
                              background: b.external_branch_id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: b.external_branch_id ? '#a5b4fc' : '#cbd5e1',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>
                              {b.external_branch_id ? 'API Synced' : 'Internal'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-status-pill is-${b.isActive !== false ? 'success' : 'pending'}`}>
                              <span className="badge-status-dot"></span>
                              <span>{b.isActive !== false ? 'Active' : 'Pending'}</span>
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => navigate(`/branches`)}
                              style={{
                                background: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                color: '#a5b4fc',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Manage →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Content for Agents Tab */}
            {merchantDetailTab === 'agents' && (
              <div className="table-viewport-wrapper">
                {scopedAgents.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>👤</div>
                    <div style={{ fontWeight: '700', color: '#ffffff' }}>No Agents Found for this Merchant</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>Click "+ Add Agent" to onboard field collection personnel.</div>
                  </div>
                ) : (
                  <table className="ultra-data-table">
                    <thead>
                      <tr>
                        <th>Agent Name</th>
                        <th>Agent Code</th>
                        <th>Contact Number</th>
                        <th>Commission</th>
                        <th>Verification</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scopedAgents.map((a) => (
                        <tr key={a.id} className="data-table-row">
                          <td>
                            <div style={{ fontWeight: '700', color: '#ffffff' }}>{a.name || a.agentName}</div>
                          </td>
                          <td>
                            <span className="order-id-pill font-mono">{a.agentCode || a.external_agent_id || `AG-${a.id}`}</span>
                          </td>
                          <td>
                            <span className="font-mono" style={{ color: '#cbd5e1', fontSize: '12.5px' }}>{a.phone || a.mobile || a.email || 'N/A'}</span>
                          </td>
                          <td>
                            <span style={{ color: '#10b981', fontWeight: '700', fontSize: '12.5px' }}>{a.commissionRate || 2.5}%</span>
                          </td>
                          <td>
                            <span style={{
                              background: a.isVerified !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                              color: a.isVerified !== false ? '#6ee7b7' : '#facc15',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>
                              {a.isVerified !== false ? '✓ Verified' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-status-pill is-${a.isActive !== false ? 'success' : 'pending'}`}>
                              <span className="badge-status-dot"></span>
                              <span>{a.isActive !== false ? 'Active' : 'Pending'}</span>
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => navigate(`/agents`)}
                              style={{
                                background: 'rgba(6, 182, 212, 0.15)',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                color: '#67e8f9',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Manage →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

          </div>
        )}

        {/* ============================================================
            ENTERPRISE MERCHANT NETWORK DIRECTORY (Global Directory)
            ============================================================ */}
        <div className="dash-table-glass-card" style={{ marginBottom: '28px' }}>
          <div className="table-card-top-row" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '18px' }}>🏪</span>
                <h3 className="table-card-heading" style={{ margin: 0 }}>
                  Enterprise <span className="gradient-text">Merchant Network</span>
                </h3>
                <span style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {merchantsList.length} Connected Partners
                </span>
              </div>
              <p className="table-card-subheading">Select any merchant below to instantly focus the entire dashboard telemetry on their network</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Search Field */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '6px 12px'
              }}>
                <span style={{ color: '#94a3b8', marginRight: '8px', fontSize: '14px' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search merchant, PAN, phone..."
                  value={merchantSearch}
                  onChange={(e) => setMerchantSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    outline: 'none',
                    width: '190px'
                  }}
                />
                {merchantSearch && (
                  <button
                    onClick={() => setMerchantSearch('')}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* View Layout Toggle */}
              <div style={{
                display: 'flex',
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button
                  onClick={() => setMerchantViewLayout('grid')}
                  style={{
                    background: merchantViewLayout === 'grid' ? '#6366f1' : 'transparent',
                    color: merchantViewLayout === 'grid' ? '#fff' : '#94a3b8',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  title="Card Grid View"
                >
                  ⊞ Cards
                </button>
                <button
                  onClick={() => setMerchantViewLayout('table')}
                  style={{
                    background: merchantViewLayout === 'table' ? '#6366f1' : 'transparent',
                    color: merchantViewLayout === 'table' ? '#fff' : '#94a3b8',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  title="Table View"
                >
                  ☰ Table
                </button>
              </div>

              <button
                className="merch-add-btn"
                onClick={() => navigate('/merchants/add')}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                }}
              >
                <span>+ Onboard Merchant</span>
              </button>

              <button
                onClick={() => navigate('/branches/add')}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Create a new Branch and assign to a Merchant"
              >
                <span>🏢 + Branch</span>
              </button>

              <button
                onClick={() => navigate('/agents/add')}
                style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: '#67e8f9',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Create a new Agent and assign to a Merchant"
              >
                <span>👤 + Agent</span>
              </button>

              <button 
                className="table-action-link-btn" 
                onClick={() => navigate('/merchants')}
                style={{ fontSize: '12.5px' }}
              >
                <span>All Directory →</span>
              </button>
            </div>
          </div>

          {/* Cards Grid Layout */}
          {merchantViewLayout === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '18px',
              marginTop: '16px'
            }}>
              {filteredDashboardMerchants.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏪</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>No Merchant Partners Found</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>No merchants match your search filter.</div>
                </div>
              ) : (
                filteredDashboardMerchants.slice(0, 9).map((m) => {
                  const tradeName = m.merchantTradeName || m.merchantName || m.companyLegalName || m.name || 'Enterprise Merchant';
                  const legalName = m.companyLegalName || m.name;
                  const isGatewayLive = m.integrationStatus === 'Y' || m.IntegrationStatus === 'Y' || m.integrationStatus === 'Yes' || m.isActive;
                  const isKycApproved = m.isApproved !== false;
                  const isSelected = String(selectedMerchantId) === String(m.id);

                  // Count branches & agents for this merchant
                  const mBranchesCount = branchesList.filter(b => String(b.merchantId) === String(m.id)).length;
                  const mAgentsCount = agentsList.filter(a => String(a.merchantId) === String(m.id)).length;

                  return (
                    <div
                      key={m.id}
                      style={{
                        background: isSelected 
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(16, 22, 36, 0.9) 100%)' 
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(16, 22, 36, 0.6) 100%)',
                        border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.25s',
                        boxShadow: isSelected ? '0 12px 35px rgba(99, 102, 241, 0.35)' : '0 8px 24px rgba(0, 0, 0, 0.25)'
                      }}
                    >
                      {/* Top Row: Avatar + Name + Selection Indicator */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: '800',
                          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                          flexShrink: 0
                        }}>
                          {tradeName.charAt(0).toUpperCase()}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <h4 style={{
                              margin: 0,
                              fontSize: '15px',
                              fontWeight: '800',
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={tradeName}>
                              {tradeName}
                            </h4>
                            <span style={{
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: '#a5b4fc',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: '700'
                            }}>
                              #{m.id}
                            </span>
                          </div>

                          {legalName && legalName !== tradeName && (
                            <div style={{
                              fontSize: '12px',
                              color: '#94a3b8',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: '2px'
                            }}>
                              {legalName}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle: Badges and Counts */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isGatewayLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isGatewayLive ? '#6ee7b7' : '#fcd34d',
                          border: isGatewayLive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          {isGatewayLive ? '⚡ Dynamic API (Y)' : 'Standard (N)'}
                        </span>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isKycApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: isKycApproved ? '#6ee7b7' : '#facc15'
                        }}>
                          {isKycApproved ? '✓ KYC' : 'Pending KYC'}
                        </span>

                        <span style={{
                          fontSize: '11.5px',
                          color: '#cbd5e1',
                          marginLeft: 'auto'
                        }}>
                          🏢 {mBranchesCount} BR • 👤 {mAgentsCount} AG
                        </span>
                      </div>

                      {/* Footer Actions: Focus Dashboard + Quick Actions */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '12px',
                        marginTop: '4px'
                      }}>
                        {/* Primary Dashboard Focus Button */}
                        <button
                          onClick={() => handleSelectMerchant(isSelected ? 'ALL' : m.id)}
                          style={{
                            background: isSelected ? '#ef4444' : '#6366f1',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <span>{isSelected ? '✕ Reset Scope' : '📊 Filter Dashboard'}</span>
                        </button>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => navigate(`/branches/add?merchantId=${m.id}`)}
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#6ee7b7',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                            title={`Create Branch for ${tradeName}`}
                          >
                            + Branch
                          </button>
                          
                          <button
                            onClick={() => navigate(`/agents/add?merchantId=${m.id}`)}
                            style={{
                              background: 'rgba(6, 182, 212, 0.15)',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              color: '#67e8f9',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                            title={`Create Agent for ${tradeName}`}
                          >
                            + Agent
                          </button>

                          <button
                            onClick={() => navigate(`/merchants/${m.id}`)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#cbd5e1',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            View
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Table View Layout */
            <div className="table-viewport-wrapper" style={{ marginTop: '16px' }}>
              <table className="ultra-data-table">
                <thead>
                  <tr>
                    <th>Merchant Entity</th>
                    <th>Category</th>
                    <th>PAN / Tax ID</th>
                    <th>Contact Hotline</th>
                    <th>Integration</th>
                    <th>KYC State</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDashboardMerchants.map((m) => {
                    const tradeName = m.merchantTradeName || m.merchantName || m.companyLegalName || m.name || 'Enterprise Merchant';
                    const isGatewayLive = m.integrationStatus === 'Y' || m.IntegrationStatus === 'Y';
                    const isKycApproved = m.isApproved !== false;
                    const isSelected = String(selectedMerchantId) === String(m.id);

                    return (
                      <tr key={m.id} className="data-table-row" style={{ background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: '800'
                            }}>
                              {tradeName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#ffffff' }}>{tradeName}</div>
                              <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>ID: #{m.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: '600' }}>
                            {m.businessCategory || 'General Partner'}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-amber" style={{ fontSize: '12px', fontWeight: '700' }}>
                            {m.panNumber || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                            <div>{m.registeredEmail || m.email || 'N/A'}</div>
                            <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>{m.registeredPhone || m.phone || ''}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            background: isGatewayLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isGatewayLive ? '#6ee7b7' : '#fcd34d',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {isGatewayLive ? '⚡ Dynamic API' : 'Standard'}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            background: isKycApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: isKycApproved ? '#6ee7b7' : '#facc15',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {isKycApproved ? '✓ KYC' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleSelectMerchant(isSelected ? 'ALL' : m.id)}
                              style={{
                                background: isSelected ? '#ef4444' : '#6366f1',
                                color: '#ffffff',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '800',
                                cursor: 'pointer'
                              }}
                            >
                              {isSelected ? '✕ Reset' : '📊 Filter'}
                            </button>
                            <button
                              onClick={() => navigate(`/branches/add?merchantId=${m.id}`)}
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: '#6ee7b7',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              + Branch
                            </button>
                            <button
                              onClick={() => navigate(`/agents/add?merchantId=${m.id}`)}
                              style={{
                                background: 'rgba(6, 182, 212, 0.15)',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                color: '#67e8f9',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              + Agent
                            </button>
                            <button
                              onClick={() => navigate(`/merchants/${m.id}`)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#cbd5e1',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ============================================================
            RECENT TRANSACTIONS LIVE AUDIT LEDGER (Scoped to Filter)
            ============================================================ */}
        <div className="dash-table-glass-card">
          <div className="table-card-top-row">
            <div>
              <h3 className="table-card-heading">
                Recent <span className="gradient-text">Transactions</span>
              </h3>
              <p className="table-card-subheading">
                {isGlobalView 
                  ? 'Live financial audit trail across all merchant partners' 
                  : `Recent financial transactions recorded for "${currentSelectedMerchant?.merchantTradeName || currentSelectedMerchant?.name || 'Selected Merchant'}"`
                }
              </p>
            </div>
            
            <button 
              className="table-action-link-btn" 
              onClick={() => navigate(isGlobalView ? '/transactions' : `/transactions?merchantId=${selectedMerchantId}`)}
            >
              <span>Explore All Ledger</span>
              <span className="arrow-glyph">→</span>
            </button>
          </div>

          <div className="table-viewport-wrapper">
            {scopedTransactions.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💳</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>No Transaction Records Found</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                  {isGlobalView ? 'No transactions have been recorded across the platform yet.' : 'No transactions found for this merchant in the system.'}
                </div>
              </div>
            ) : (
              <table className="ultra-data-table">
                <thead>
                  <tr>
                    <th>Order Reference</th>
                    <th>Merchant Partner</th>
                    <th>Settlement Amount</th>
                    <th>Payment Mode</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {scopedTransactions.slice(0, 8).map((tx, i) => (
                    <tr key={tx.id || i} className="data-table-row">
                      <td>
                        <span className="order-id-pill font-mono">
                          {tx.id || tx.transactionId || tx.referenceNo || `TXN-${i + 1}`}
                        </span>
                      </td>
                      <td>
                        <div className="merchant-cell-chip">
                          <div className="merchant-cell-avatar">
                            {(tx.merchantName || tx.merchant || 'M').charAt(0)}
                          </div>
                          <span className="merchant-cell-name">{tx.merchantName || tx.merchant}</span>
                        </div>
                      </td>
                      <td>
                        <span className="amount-cell-text font-mono">
                          ₹{Number(tx.amount || tx.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#a5b4fc',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          fontFamily: 'monospace'
                        }}>
                          {tx.paymentMode || tx.paymentMethod || tx.mode || 'UPI'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status-pill is-${(tx.statusNorm || 'success').toLowerCase()}`}>
                          <span className="badge-status-dot"></span>
                          <span>{tx.statusNorm}</span>
                        </span>
                      </td>
                      <td>
                        <div className="timestamp-cell">
                          <span className="timestamp-date">
                            {tx.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="timestamp-time font-mono">
                            <DashIcons.Clock /> {tx.dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default SoftwareAdminDashboard;
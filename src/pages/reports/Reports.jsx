import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useMerchantContext } from '../../context/MerchantContext';
import { useDialog } from '../../context/DialogContext';
import { 
  transactionApi, 
  merchantApi, 
  settlementApi, 
  branchApi, 
  agentApi 
} from '../../services/api';
import './Reports.css';

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

// Helper: Extract Date Object Safely
const getTxDate = (t) => {
  if (!t) return null;
  const raw = t.createdAt || t.CreatedAt || t.created_at || t.createdDate || t.CreatedDate || t.date || t.Date || t.transactionDate || t.TransactionDate || t.timestamp;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

// Helper: Format Date in Local Timezone (YYYY-MM-DD)
const formatLocalDate = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper: Generate Page Numbers with Ellipsis for Pagination
const getPageNumbers = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
};

// Crisp SVG Icons
const ReportIcons = {
  Trending: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
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
  Txn: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Building: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Print: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
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
  FileText: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  Filter: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Copy: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  CheckMark: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
};

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'merchants'
  const [copiedId, setCopiedId] = useState(null);
  const { showWarning } = useDialog();

  // Global Merchant Scoping from MerchantContext
  const { selectedMerchantId, setSelectedMerchantId, isSoftwareAdmin } = useMerchantContext();

  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const rawRole = (localStorage.getItem('user_role') || localStorage.getItem('role') || authUser?.role || '').toLowerCase().trim();
  const isMerchantUser = rawRole.includes('merchant');
  const isBranchUser = rawRole.includes('branch') && !rawRole.includes('merchant');
  const branchSelfId = authUser?.branchId || authUser?.BranchId || authUser?.branch_id || localStorage.getItem('branchId');
  const merchantSelfId = authUser?.merchantId || authUser?.MerchantId || (isMerchantUser ? (authUser?.merchantId || authUser?.MerchantId || authUser?.id) : null);
  const activeMerchantId = isSoftwareAdmin ? (selectedMerchantId === 'ALL' ? null : selectedMerchantId) : (isBranchUser ? null : merchantSelfId);

  // Filter States
  const [activePeriod, setActivePeriod] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState(isBranchUser && branchSelfId ? branchSelfId : 'ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL'); // 'ALL' | 'CASH' | 'UPI'
  const [collectionTypeFilter, setCollectionTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'

  // Pagination States
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(10);
  const [merchantPage, setMerchantPage] = useState(1);
  const [merchantPageSize, setMerchantPageSize] = useState(10);

  // Live Backend Data Repositories
  const [transactions, setTransactions] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [branches, setBranches] = useState([]);
  const [agents, setAgents] = useState([]);

  // Copy helper
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset page to 1 when filters change
  const handleFilterChange = (setter, value) => {
    setter(value);
    setLedgerPage(1);
    setMerchantPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setActivePeriod('ALL');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setBranchFilter('ALL');
    setAgentFilter('ALL');
    setModeFilter('ALL');
    setCollectionTypeFilter('ALL');
    setStatusFilter('ALL');
    setLedgerPage(1);
    setMerchantPage(1);
  };

  // ============================================================
  // LOAD LIVE DATA DIRECTLY FROM BACKEND TABLES
  // ============================================================
  const loadReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        txRes,
        merchantsRes,
        settlementsRes,
        branchesRes,
        agentsRes
      ] = await Promise.allSettled([
        transactionApi.getHistory({ count: 500, pageSize: 500 }),
        merchantApi.getAll(),
        settlementApi.getAll(),
        branchApi.getAll(),
        agentApi.getAll()
      ]);

      // 1. Process Merchants
      const rawMerchants = merchantsRes.status === 'fulfilled' ? (merchantsRes.value?.data?.data || merchantsRes.value?.data || []) : [];
      const safeMerchants = Array.isArray(rawMerchants) ? rawMerchants : [];
      setMerchants(safeMerchants);

      const mLookup = {};
      safeMerchants.forEach(m => {
        mLookup[m.id] = m.merchantTradeName || m.companyLegalName || m.name || `Merchant #${m.id}`;
      });

      // 2. Process Branches
      const rawBranches = branchesRes.status === 'fulfilled' ? (branchesRes.value?.data?.data || branchesRes.value?.data || []) : [];
      setBranches(Array.isArray(rawBranches) ? rawBranches : []);

      // 3. Process Agents
      const rawAgents = agentsRes.status === 'fulfilled' ? (agentsRes.value?.data?.data || agentsRes.value?.data || []) : [];
      setAgents(Array.isArray(rawAgents) ? rawAgents : []);

      // 4. Process Settlements
      const rawSettlements = settlementsRes.status === 'fulfilled' ? (settlementsRes.value?.data?.data || settlementsRes.value?.data || []) : [];
      setSettlements(Array.isArray(rawSettlements) ? rawSettlements : []);

      // 5. Process Transactions
      const rawTx = txRes.status === 'fulfilled' ? (txRes.value?.data?.data || txRes.value?.data || []) : [];
      const safeTx = (Array.isArray(rawTx) ? rawTx : []).map(t => {
        const mId = t.merchantId ?? t.MerchantId ?? null;
        const mName = mLookup[mId] || t.merchantName || t.MerchantName || t.merchant || (mId ? `Merchant #${mId}` : 'Enterprise Partner');
        const dObj = getTxDate(t) || new Date();
        
        return {
          ...t,
          id: t.id ?? t.Id ?? t.transactionId ?? t.TransactionId,
          orderId: t.orderId ?? t.OrderId ?? '',
          transactionId: t.transactionId ?? t.TransactionId ?? t.paymentGatewayTransactionId ?? '',
          merchantId: mId,
          merchantName: mName,
          branchId: t.branchId ?? t.BranchId ?? t.branch_id ?? null,
          branchName: t.branchName || t.BranchName || t.branch || t.Branch || '',
          branchCode: t.branchCode || t.BranchCode || '',
          agentId: t.agentId ?? t.AgentId ?? t.agent_id ?? null,
          agentName: t.agentName || t.AgentName || t.agent || t.Agent || '',
          agentCode: t.agentCode || t.AgentCode || '',
          customer: t.customerName || t.CustomerName || t.customer || 'Direct Payer',
          amountNum: Number(t.amount ?? t.Amount ?? t.netAmount ?? 0),
          paymentMode: (t.paymentMode || t.PaymentMode || t.paymentMethod || t.PaymentMethod || t.mode || 'UPI').toUpperCase(),
          collectionType: (t.collectionType || t.CollectionType || t.udf5 || t.Udf5 || 'RD').toUpperCase(),
          statusNorm: (t.status || t.Status || t.transactionStatus || 'SUCCESS').toUpperCase(),
          utr: t.utr || t.Utr || t.rrn || t.Rrn || t.paymentGatewayTransactionId || '',
          dateObj: dObj
        };
      });
      setTransactions(safeTx);

    } catch (err) {
      console.error('Error loading report analytics:', err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  };

  // Dynamic Collection Types
  const availableCollectionTypes = useMemo(() => {
    const set = new Set();
    transactions.forEach(t => {
      if (t.collectionType) set.add(t.collectionType.toUpperCase());
    });
    if (set.size === 0) {
      ['RD', 'RDCL', 'LOAN', 'SAVINGS', 'PIGMY', 'FD'].forEach(t => set.add(t));
    }
    return Array.from(set);
  }, [transactions]);

  // Branches scoped to active merchant
  const availableBranches = useMemo(() => {
    if (!activeMerchantId) return branches;
    return branches.filter(b => String(b.merchantId) === String(activeMerchantId));
  }, [branches, activeMerchantId]);

  // Agents scoped to active merchant or branch
  const availableAgents = useMemo(() => {
    let list = agents;
    if (activeMerchantId) {
      list = list.filter(a => String(a.merchantId) === String(activeMerchantId));
    }
    if (branchFilter && branchFilter !== 'ALL') {
      list = list.filter(a => String(a.branchId) === String(branchFilter));
    }
    return list;
  }, [agents, activeMerchantId, branchFilter]);

  // ============================================================
  // SCOPE & MULTI-DIMENSIONAL FILTERING (100% Dynamic from Backend)
  // ============================================================
  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter(t => {
      // 1. Merchant Filter
      if (activeMerchantId && String(t.merchantId) !== String(activeMerchantId)) {
        return false;
      }

      // 2. Branch Filter
      if (branchFilter && branchFilter !== 'ALL') {
        const matchesB = String(t.branchId) === String(branchFilter) ||
          (t.branchName && availableBranches.find(b => String(b.id) === String(branchFilter))?.name?.toLowerCase() === t.branchName.toLowerCase());
        if (!matchesB) return false;
      }

      // 3. Agent Filter
      if (agentFilter && agentFilter !== 'ALL') {
        const matchesA = String(t.agentId) === String(agentFilter) ||
          (t.agentName && availableAgents.find(a => String(a.id) === String(agentFilter))?.name?.toLowerCase() === t.agentName.toLowerCase());
        if (!matchesA) return false;
      }

      // 4. Payment Mode Filter
      if (modeFilter && modeFilter !== 'ALL') {
        const mode = (t.paymentMode || 'UPI').toUpperCase();
        if (modeFilter === 'CASH' && !mode.includes('CASH')) return false;
        if (modeFilter === 'UPI' && mode.includes('CASH')) return false;
      }

      // 5. Collection Type Filter
      if (collectionTypeFilter && collectionTypeFilter !== 'ALL') {
        if ((t.collectionType || '').toUpperCase() !== collectionTypeFilter.toUpperCase()) return false;
      }

      // 6. Status Filter
      if (statusFilter && statusFilter !== 'ALL') {
        const st = (t.statusNorm || 'SUCCESS').toUpperCase();
        if (statusFilter === 'SUCCESS' && !(st.includes('SUCCESS') || st.includes('COMPLETED') || st.includes('SETTLED'))) return false;
        if (statusFilter === 'PENDING' && !st.includes('PEND')) return false;
        if (statusFilter === 'FAILED' && !st.includes('FAIL')) return false;
      }

      // 7. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQ =
          (t.id || '').toString().toLowerCase().includes(q) ||
          (t.orderId || '').toLowerCase().includes(q) ||
          (t.transactionId || '').toLowerCase().includes(q) ||
          (t.utr || '').toLowerCase().includes(q) ||
          (t.merchantName || '').toLowerCase().includes(q) ||
          (t.branchName || '').toLowerCase().includes(q) ||
          (t.agentName || '').toLowerCase().includes(q) ||
          (t.customer || '').toLowerCase().includes(q);
        if (!matchesQ) return false;
      }

      // 8. Custom Calendar Date Range
      if (startDate) {
        const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
        const startOfDay = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
        if (t.dateObj < startOfDay) return false;
      }
      if (endDate) {
        const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
        const endOfDay = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
        if (t.dateObj > endOfDay) return false;
      }

      // If custom date range is set, skip predefined period logic
      if (startDate || endDate) return true;

      // 9. Predefined Periods using local date bounds
      const txLocalStr = formatLocalDate(t.dateObj);
      const todayStr = formatLocalDate(now);

      if (activePeriod === 'TODAY') {
        return txLocalStr === todayStr;
      } else if (activePeriod === 'WEEK') {
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
        return t.dateObj >= weekAgo;
      } else if (activePeriod === 'MONTH') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0);
        return t.dateObj >= monthAgo;
      } else if (activePeriod === 'QUARTER') {
        const quarterAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90, 0, 0, 0, 0);
        return t.dateObj >= quarterAgo;
      } else if (activePeriod === 'YEAR') {
        const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        return t.dateObj >= yearStart;
      }
      return true;
    });
  }, [
    transactions,
    activeMerchantId,
    branchFilter,
    agentFilter,
    modeFilter,
    collectionTypeFilter,
    statusFilter,
    searchQuery,
    startDate,
    endDate,
    activePeriod,
    availableBranches,
    availableAgents
  ]);

  // Paginated Slices
  const totalLedgerPages = Math.max(1, Math.ceil(filteredTransactions.length / ledgerPageSize));
  const paginatedLedgerTransactions = useMemo(() => {
    const start = (ledgerPage - 1) * ledgerPageSize;
    return filteredTransactions.slice(start, start + ledgerPageSize);
  }, [filteredTransactions, ledgerPage, ledgerPageSize]);

  // Dynamic KPI Metrics
  const metrics = useMemo(() => {
    const successfulTx = filteredTransactions.filter(
      t => t.statusNorm === 'SUCCESS' || t.statusNorm === 'COMPLETED' || t.statusNorm === 'SETTLED'
    );
    const grossVolume = successfulTx.reduce((sum, t) => sum + (t.amountNum || 0), 0);
    const totalCount = filteredTransactions.length;
    const successRate = totalCount > 0 ? ((successfulTx.length / totalCount) * 100).toFixed(1) : '100.0';
    const avgTicket = successfulTx.length > 0 ? (grossVolume / successfulTx.length).toFixed(0) : '0';

    const activeMerchantsCount = merchants.filter(m => m.isActive !== false).length;
    const totalSettlementVolume = settlements.reduce((sum, s) => sum + Number(s.amount || s.netSettlementAmount || 0), 0);

    return {
      grossVolume,
      clearedCount: successfulTx.length,
      totalCount,
      successRate,
      avgTicket,
      activeMerchantsCount,
      totalSettlementVolume
    };
  }, [filteredTransactions, merchants, settlements]);

  // ============================================================
  // DYNAMIC CHART DATASETS FROM LIVE FILTERED TRANSACTIONS
  // ============================================================

  // 1. Settlement Trajectory Bar Chart
  const trajectoryChartData = useMemo(() => {
    const now = new Date();
    let labels = [];
    let dataPoints = [];

    if (activePeriod === 'TODAY' || (startDate && startDate === endDate)) {
      labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
      const buckets = [0, 0, 0, 0, 0, 0, 0];
      filteredTransactions.forEach(t => {
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
    } else if (activePeriod === 'WEEK') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      labels = [];
      const buckets = [0, 0, 0, 0, 0, 0, 0];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        labels.push(days[d.getDay()]);
      }
      filteredTransactions.forEach(t => {
        const diffDays = Math.floor((now - t.dateObj) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const idx = 6 - diffDays;
          if (idx >= 0 && idx < 7) buckets[idx] += t.amountNum || 0;
        }
      });
      dataPoints = buckets;
    } else if (activePeriod === 'MONTH') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const buckets = [0, 0, 0, 0];
      filteredTransactions.forEach(t => {
        const diffDays = Math.floor((now - t.dateObj) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) buckets[3] += t.amountNum || 0;
        else if (diffDays < 14) buckets[2] += t.amountNum || 0;
        else if (diffDays < 21) buckets[1] += t.amountNum || 0;
        else if (diffDays < 30) buckets[0] += t.amountNum || 0;
      });
      dataPoints = buckets;
    } else if (activePeriod === 'QUARTER') {
      labels = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
      const buckets = [0, 0, 0, 0];
      filteredTransactions.forEach(t => {
        const qIdx = Math.floor(t.dateObj.getMonth() / 3);
        if (qIdx >= 0 && qIdx < 4) buckets[qIdx] += t.amountNum || 0;
      });
      dataPoints = buckets;
    } else {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const buckets = new Array(12).fill(0);
      filteredTransactions.forEach(t => {
        const mIdx = t.dateObj.getMonth();
        if (mIdx >= 0 && mIdx < 12) buckets[mIdx] += t.amountNum || 0;
      });
      dataPoints = buckets;
    }

    return {
      labels,
      datasets: [{
        label: 'Gross Settlement (₹)',
        data: dataPoints,
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        hoverBackgroundColor: '#6366f1',
        borderRadius: 6,
        barPercentage: 0.55,
      }]
    };
  }, [filteredTransactions, activePeriod, startDate, endDate]);

  // 2. Channel Share Doughnut Chart (UPI vs CASH)
  const channelShareData = useMemo(() => {
    const counts = { 'UPI': 0, 'CASH': 0 };

    filteredTransactions.forEach(t => {
      const mode = (t.paymentMode || 'UPI').toUpperCase();
      if (mode.includes('CASH')) counts['CASH'] += (t.amountNum || 1);
      else counts['UPI'] += (t.amountNum || 1);
    });

    const labels = ['UPI', 'CASH'];
    const data = [counts['UPI'], counts['CASH']];
    const hasData = data.some(v => v > 0);

    return {
      labels,
      datasets: [{
        data: hasData ? data : [0, 0],
        backgroundColor: ['#6366f1', '#10b981'],
        borderColor: '#111827',
        borderWidth: 3,
        hoverOffset: 8,
      }]
    };
  }, [filteredTransactions]);

  // 3. Transaction Volume Growth Line Chart
  const growthLineData = useMemo(() => {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets = new Array(12).fill(0);

    filteredTransactions.forEach(t => {
      const mIdx = t.dateObj.getMonth();
      if (mIdx >= 0 && mIdx < 12) buckets[mIdx]++;
    });

    return {
      labels,
      datasets: [{
        label: 'Transactions',
        data: buckets,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        tension: 0.45,
        fill: true,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#111827',
        pointBorderWidth: 2,
        pointRadius: 4,
        borderWidth: 2.5,
      }]
    };
  }, [filteredTransactions]);

  // 4. Fulfillment Health Breakdown Doughnut Chart
  const fulfillmentHealthData = useMemo(() => {
    const counts = { Success: 0, Pending: 0, Failed: 0 };

    filteredTransactions.forEach(t => {
      const st = t.statusNorm;
      if (st.includes('SUCCESS') || st.includes('COMPLETED') || st.includes('SETTLED')) counts.Success++;
      else if (st.includes('PEND') || st.includes('PROCESS')) counts.Pending++;
      else counts.Failed++;
    });

    return {
      labels: ['Success', 'Pending', 'Failed'],
      datasets: [{
        data: [counts.Success, counts.Pending, counts.Failed],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderColor: '#111827',
        borderWidth: 3,
        hoverOffset: 8,
      }]
    };
  }, [filteredTransactions]);

  // ============================================================
  // MERCHANT-WISE SUMMARY BREAKDOWN TABLE & PAGINATION
  // ============================================================
  const merchantSummaries = useMemo(() => {
    const filteredM = merchants.filter(m => {
      if (activeMerchantId && String(m.id) !== String(activeMerchantId)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const name = (m.merchantTradeName || m.companyLegalName || m.name || '').toLowerCase();
        const id = String(m.id || '');
        if (!name.includes(q) && !id.includes(q)) return false;
      }
      return true;
    });

    return filteredM.map(m => {
      const mTx = transactions.filter(t => String(t.merchantId) === String(m.id));
      const mSuccessTx = mTx.filter(t => t.statusNorm === 'SUCCESS' || t.statusNorm === 'COMPLETED' || t.statusNorm === 'SETTLED');
      const mVolume = mSuccessTx.reduce((sum, t) => sum + (t.amountNum || 0), 0);
      const mBranches = branches.filter(b => String(b.merchantId) === String(m.id)).length;
      const mAgents = agents.filter(a => String(a.merchantId) === String(m.id)).length;

      return {
        id: m.id,
        name: m.merchantTradeName || m.companyLegalName || m.name || `Merchant #${m.id}`,
        category: m.businessCategory || 'Retail / Enterprise',
        integration: m.integrationStatus === 'Y' || m.IntegrationStatus === 'Y' ? 'Dynamic API (Y)' : 'Standard (N)',
        totalTxCount: mTx.length,
        grossVolume: mVolume,
        branchesCount: mBranches,
        agentsCount: mAgents,
        kycStatus: m.isApproved !== false ? 'Approved' : 'Pending'
      };
    });
  }, [merchants, transactions, branches, agents, activeMerchantId, searchQuery]);

  const totalMerchantPages = Math.max(1, Math.ceil(merchantSummaries.length / merchantPageSize));
  const paginatedMerchantSummaries = useMemo(() => {
    const start = (merchantPage - 1) * merchantPageSize;
    return merchantSummaries.slice(start, start + merchantPageSize);
  }, [merchantSummaries, merchantPage, merchantPageSize]);

  // ============================================================
  // CSV EXPORT GENERATOR
  // ============================================================
  const exportToCSV = (filename, rows) => {
    if (!rows || !rows.length) {
      showWarning('No records available to export for current filter criteria.', 'Export Notice');
      return;
    }
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map(row => {
          return keys
            .map(k => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator);
        })
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMasterCSV = () => {
    const exportRows = filteredTransactions.map(t => ({
      Id: t.id || t.transactionId,
      OrderId: t.orderId || '',
      Merchant: t.merchantName,
      MerchantId: t.merchantId || '',
      Branch: t.branchName,
      Agent: t.agentName,
      CollectionType: t.collectionType,
      AmountINR: t.amountNum || 0,
      PaymentMode: t.paymentMode,
      Status: t.statusNorm,
      UTR: t.utr || '',
      Date: t.dateObj.toLocaleDateString('en-GB'),
      Time: t.dateObj.toLocaleTimeString('en-US')
    }));
    exportToCSV(`Ecollect_Transaction_Audit_${activePeriod}_${new Date().toISOString().slice(0,10)}.csv`, exportRows);
  };

  const handleExportMerchantSummaryCSV = () => {
    const exportRows = merchantSummaries.map(m => ({
      MerchantId: m.id,
      MerchantName: m.name,
      Category: m.category,
      IntegrationMode: m.integration,
      TotalTransactions: m.totalTxCount,
      GrossVolumeINR: m.grossVolume,
      Branches: m.branchesCount,
      Agents: m.agentsCount,
      KYCStatus: m.kycStatus
    }));
    exportToCSV(`Ecollect_Merchant_Performance_Summary_${new Date().toISOString().slice(0,10)}.csv`, exportRows);
  };

  const handleExportSettlementsCSV = () => {
    const exportRows = settlements.map(s => ({
      SettlementId: s.id || s.settlementId,
      MerchantId: s.merchantId || '',
      AmountINR: s.amount || s.netSettlementAmount || 0,
      UTR: s.utrNumber || s.referenceNo || 'N/A',
      Status: s.status || 'Completed',
      Date: s.settlementDate || s.createdAt || new Date().toLocaleDateString('en-GB')
    }));
    exportToCSV(`Ecollect_Settlements_Reconciliation_${new Date().toISOString().slice(0,10)}.csv`, exportRows);
  };

  return (
    <DashboardLayout pageTitle="Reports & Analytics">
      {loading && <LoadingAnimation message="Compiling Live Financial Telemetry..." />}
      
      <div className="reports-root-container">
        
        {/* ============================================================
            TOP EXECUTIVE HERO HEADER & LIVE FILTER CONTROLS
            ============================================================ */}
        <div className="reports-hero-header">
          <div className="reports-hero-titles">
            <div className="reports-badge-tag">
              <span className="pulse-dot"></span>
              <ReportIcons.Sparkles />
              <span>Real-Time Financial Intelligence & Regulatory Auditing</span>
            </div>
            <h1 className="reports-page-title">
              Analytics & <span className="gradient-text">Reports Center</span>
            </h1>
            <p className="reports-page-subtitle">
              Live audit clearance trajectories, payment rail shares, and statutory tax reconciliation ledgers computed directly from backend database tables.
            </p>
          </div>

          <div className="reports-header-actions">
            {/* Merchant Scope Selector (Software Admin Only) */}
            {isSoftwareAdmin && (
              <div className="reports-scope-selector-box">
                <span className="reports-filter-icon"><ReportIcons.Filter /></span>
                <select
                  className="reports-scope-select"
                  value={selectedMerchantId || 'ALL'}
                  onChange={(e) => handleFilterChange(setSelectedMerchantId, e.target.value)}
                >
                  <option value="ALL">🌐 All Merchants (Global Platform)</option>
                  {merchants.map(m => (
                    <option key={m.id} value={m.id}>
                      🏢 {m.merchantTradeName || m.name} (#{m.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Refresh Button */}
            <button 
              className={`reports-print-btn ${refreshing ? 'is-spinning' : ''}`}
              onClick={handleRefresh}
              title="Refresh Data"
            >
              <ReportIcons.Refresh />
              <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* Print Dossier */}
            <button className="reports-print-btn" onClick={() => window.print()}>
              <ReportIcons.Print />
              <span>Print Dossier</span>
            </button>
            
            {/* Export Master CSV */}
            <button className="reports-export-btn" onClick={handleExportMasterCSV}>
              <ReportIcons.Download />
              <span>Export Master CSV</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            COMPREHENSIVE FILTER TOOLBAR (Date, Search, Branch, Agent, Mode, Collection, Status)
            ============================================================ */}
        <div className="reports-comprehensive-filter-card">
          
          {/* Row 1: Search & Date Presets & Custom Calendar */}
          <div className="reports-filter-top-row">
            
            {/* Search Box */}
            <div className="reports-search-box">
              <ReportIcons.Search />
              <input
                type="text"
                placeholder="Search ID, UTR, merchant, branch, agent, customer..."
                value={searchQuery}
                onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                className="reports-search-input"
              />
              {searchQuery && (
                <button className="clear-search-mini-btn" onClick={() => handleFilterChange(setSearchQuery, '')}>✕</button>
              )}
            </div>

            {/* Date Period Presets */}
            <div className="period-segmented-pill">
              {[
                { key: 'ALL', label: 'All Time' },
                { key: 'TODAY', label: 'Today' },
                { key: 'WEEK', label: 'Last 7 Days' },
                { key: 'MONTH', label: 'Last 30 Days' },
                { key: 'QUARTER', label: 'Quarter' },
                { key: 'YEAR', label: 'YTD' },
              ].map((period) => (
                <button 
                  key={period.key}
                  className={`period-btn ${activePeriod === period.key && !startDate && !endDate ? 'is-active' : ''}`}
                  onClick={() => {
                    setActivePeriod(period.key);
                    setStartDate('');
                    setEndDate('');
                    setLedgerPage(1);
                    setMerchantPage(1);
                  }}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            <div className="reports-custom-calendar-box">
              <div 
                className="date-picker-wrap"
                title="Select From Date"
                onClick={(e) => {
                  const inp = e.currentTarget.querySelector('input');
                  if (inp && typeof inp.showPicker === 'function') {
                    try { inp.showPicker(); } catch (err) {}
                  }
                }}
              >
                <ReportIcons.Calendar />
                <span className="date-input-label">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onClick={(e) => {
                    if (typeof e.target.showPicker === 'function') {
                      try { e.target.showPicker(); } catch (err) {}
                    }
                  }}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setLedgerPage(1);
                    setMerchantPage(1);
                  }}
                  className="reports-date-picker-input"
                />
                {startDate && (
                  <button 
                    className="clear-date-mini-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setStartDate('');
                      setLedgerPage(1);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <span className="date-range-divider">to</span>

              <div 
                className="date-picker-wrap"
                title="Select To Date"
                onClick={(e) => {
                  const inp = e.currentTarget.querySelector('input');
                  if (inp && typeof inp.showPicker === 'function') {
                    try { inp.showPicker(); } catch (err) {}
                  }
                }}
              >
                <ReportIcons.Calendar />
                <span className="date-input-label">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onClick={(e) => {
                    if (typeof e.target.showPicker === 'function') {
                      try { e.target.showPicker(); } catch (err) {}
                    }
                  }}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setLedgerPage(1);
                    setMerchantPage(1);
                  }}
                  className="reports-date-picker-input"
                />
                {endDate && (
                  <button 
                    className="clear-date-mini-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEndDate('');
                      setLedgerPage(1);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Row 2: Dimensional Filter Dropdowns */}
          <div className="reports-filter-bottom-row">
            
            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => handleFilterChange(setBranchFilter, e.target.value)}
              className="reports-select-pill"
            >
              <option value="ALL">🏢 All Branches ({availableBranches.length})</option>
              {availableBranches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name || b.branchName} {b.code ? `(${b.code})` : ''}
                </option>
              ))}
            </select>

            {/* Agent Filter */}
            <select
              value={agentFilter}
              onChange={(e) => handleFilterChange(setAgentFilter, e.target.value)}
              className="reports-select-pill"
            >
              <option value="ALL">👤 All Field Agents ({availableAgents.length})</option>
              {availableAgents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name || a.agentName} {a.agentCode ? `(${a.agentCode})` : ''}
                </option>
              ))}
            </select>

            {/* Payment Mode Filter (CASH / UPI) */}
            <select
              value={modeFilter}
              onChange={(e) => handleFilterChange(setModeFilter, e.target.value)}
              className="reports-select-pill"
            >
              <option value="ALL">💳 All Payment Modes</option>
              <option value="UPI">⚡ UPI</option>
              <option value="CASH">💵 CASH</option>
            </select>

            {/* Collection Type Filter */}
            <select
              value={collectionTypeFilter}
              onChange={(e) => handleFilterChange(setCollectionTypeFilter, e.target.value)}
              className="reports-select-pill"
            >
              <option value="ALL">📁 All Collection Types</option>
              {availableCollectionTypes.map(c => (
                <option key={c} value={c}>
                  📂 {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="reports-select-pill"
            >
              <option value="ALL">🎯 All Statuses</option>
              <option value="SUCCESS">✓ Successful</option>
              <option value="PENDING">⏳ Pending</option>
              <option value="FAILED">✕ Failed</option>
            </select>

            {/* Reset Filters */}
            <button 
              className="reports-reset-btn"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              ✕ Reset All
            </button>

            {/* Record Count Badge */}
            <div className="reports-match-count-badge font-mono">
              <span>Matching: <strong>{filteredTransactions.length}</strong> Records</span>
            </div>

          </div>

        </div>

        {/* ============================================================
            PRIMARY KPI STATS (COMPUTED 100% DYNAMICALLY FROM BACKEND)
            ============================================================ */}
        <div className="reports-kpi-grid">
          
          <div className="report-kpi-card">
            <div className="report-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
            <div className="report-kpi-header">
              <span className="report-kpi-label">Gross Processed Volume</span>
              <div className="report-kpi-icon is-green"><ReportIcons.Coins /></div>
            </div>
            <div className="report-kpi-value font-mono text-green">
              ₹{metrics.grossVolume.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="report-kpi-footer">
              <span className="report-trend-tag is-up">
                <ReportIcons.ArrowUp /> {metrics.clearedCount} Cleared Transactions
              </span>
            </div>
          </div>

          <div className="report-kpi-card">
            <div className="report-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' }}></div>
            <div className="report-kpi-header">
              <span className="report-kpi-label">Cleared Orders</span>
              <div className="report-kpi-icon is-indigo"><ReportIcons.Txn /></div>
            </div>
            <div className="report-kpi-value font-mono">
              {metrics.totalCount.toLocaleString()}
            </div>
            <div className="report-kpi-footer">
              <span className="report-trend-tag is-up">
                <ReportIcons.ArrowUp /> Avg Ticket: ₹{Number(metrics.avgTicket).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="report-kpi-card">
            <div className="report-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)' }}></div>
            <div className="report-kpi-header">
              <span className="report-kpi-label">Active Merchant Network</span>
              <div className="report-kpi-icon is-cyan"><ReportIcons.Building /></div>
            </div>
            <div className="report-kpi-value font-mono">
              {metrics.activeMerchantsCount}
            </div>
            <div className="report-kpi-footer">
              <span className="report-trend-tag is-up">
                <ReportIcons.ArrowUp /> {merchants.length} Connected Partners
              </span>
            </div>
          </div>

          <div className="report-kpi-card">
            <div className="report-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}></div>
            <div className="report-kpi-header">
              <span className="report-kpi-label">Gateway Success Rate</span>
              <div className="report-kpi-icon is-amber"><ReportIcons.Check /></div>
            </div>
            <div className="report-kpi-value font-mono">
              {metrics.successRate}%
            </div>
            <div className="report-kpi-footer">
              <span className="report-trend-tag is-up">
                <ReportIcons.ArrowUp /> High Resilience & Uptime
              </span>
            </div>
          </div>

        </div>

        {/* ============================================================
            CHARTS ROW 1: TRAJECTORY (8 cols) & CHANNEL SHARE (4 cols)
            ============================================================ */}
        <div className="reports-charts-row">
          
          <div className="report-chart-panel is-col-8">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Settlement Trajectory</h3>
                <span className="panel-subtitle">Gross processed volume computed from live transaction database</span>
              </div>
              <span className="panel-metric-chip font-mono">
                ₹{metrics.grossVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Total
              </span>
            </div>
            <div className="panel-canvas-box">
              <Bar
                data={trajectoryChartData}
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
                      callbacks: {
                        label: (ctx) => ` Settlement: ₹${Number(ctx.parsed.y || 0).toLocaleString('en-IN')}`
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: '#64748b',
                        font: { size: 11, weight: '600' },
                        callback: (v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}k`
                      },
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

          <div className="report-chart-panel is-col-4">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Payment Channel Share</h3>
                <span className="panel-subtitle">UPI vs CASH volume ratio</span>
              </div>
            </div>
            <div className="panel-canvas-box doughnut-wrap">
              <Doughnut
                data={channelShareData}
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
                    },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` ${ctx.label}: ₹${Number(ctx.raw || 0).toLocaleString('en-IN')}`
                      }
                    }
                  }
                }}
              />
              <div className="doughnut-center-info">
                <span className="center-bold font-mono">{metrics.totalCount}</span>
                <span className="center-tag">Total Txns</span>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================
            CHARTS ROW 2: VELOCITY (6 cols) & FULFILLMENT HEALTH (6 cols)
            ============================================================ */}
        <div className="reports-charts-row">
          
          <div className="report-chart-panel is-col-6">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Transaction Throughput Growth</h3>
                <span className="panel-subtitle">Cleared transaction frequency across annual cycles</span>
              </div>
              <span className="panel-metric-chip font-mono">{metrics.totalCount} Total</span>
            </div>
            <div className="panel-canvas-box">
              <Line
                data={growthLineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
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

          <div className="report-chart-panel is-col-6">
            <div className="panel-header-zone">
              <div>
                <h3 className="panel-title">Fulfillment Health Breakdown</h3>
                <span className="panel-subtitle">Success, pending, and failure ratios</span>
              </div>
              <span className="panel-metric-chip is-green font-mono">{metrics.successRate}% Success</span>
            </div>
            <div className="panel-canvas-box doughnut-wrap">
              <Doughnut
                data={fulfillmentHealthData}
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
                    },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${ctx.raw} Txns`
                      }
                    }
                  }
                }}
              />
              <div className="doughnut-center-info">
                <span className="center-bold font-mono">{metrics.successRate}%</span>
                <span className="center-tag">Success Rate</span>
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================
            LIVE REPORTS DATA TABLES (Transactions & Merchant Summary with Full Pagination)
            ============================================================ */}
        <div className="report-templates-card">
          <div className="templates-header-row" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 className="templates-title">Live Audit Data Tables</h3>
              <p className="templates-subtitle">Review filtered transactional records or aggregate partner summaries directly from backend tables</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div className="reports-tab-switcher">
                <button
                  className={`tab-btn ${activeTab === 'ledger' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('ledger')}
                >
                  💳 Live Transaction Ledger ({filteredTransactions.length})
                </button>
                <button
                  className={`tab-btn ${activeTab === 'merchants' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('merchants')}
                >
                  🏪 Merchant Performance ({merchantSummaries.length})
                </button>
              </div>

              {activeTab === 'ledger' ? (
                <button className="reports-table-export-btn" onClick={handleExportMasterCSV}>
                  <ReportIcons.Download />
                  <span>Download Ledger CSV</span>
                </button>
              ) : (
                <button className="reports-table-export-btn" onClick={handleExportMerchantSummaryCSV}>
                  <ReportIcons.Download />
                  <span>Download Summary CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab 1: Live Transactions Table with Full Pagination */}
          {activeTab === 'ledger' && (
            <>
              <div className="table-viewport-wrapper">
                {filteredTransactions.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>💳</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>No Transaction Records Found</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>No transactions match your current filter parameters. Try adjusting your filters.</div>
                  </div>
                ) : (
                  <table className="reports-ultra-table">
                    <thead>
                      <tr>
                        <th style={{ width: '45px' }}>#</th>
                        <th>Order / Txn ID</th>
                        {isSoftwareAdmin && <th>Merchant Partner</th>}
                        <th>Branch Outlet</th>
                        <th>Field Agent</th>
                        <th>Customer</th>
                        <th>Collection</th>
                        <th>Gross Amount</th>
                        <th>Payment Rail</th>
                        <th>Status</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLedgerTransactions.map((tx, i) => {
                        const absoluteIndex = (ledgerPage - 1) * ledgerPageSize + i + 1;
                        const isCopied = copiedId === (tx.id || tx.transactionId);

                        return (
                          <tr key={tx.id || i} className="reports-table-row">
                            <td className="row-index font-mono" style={{ color: '#64748b', fontSize: '11.5px' }}>
                              {String(absoluteIndex).padStart(2, '0')}
                            </td>
                            <td>
                              <div className="tx-id-cell">
                                <span className="order-id-pill font-mono">
                                  #{tx.id || tx.transactionId || `TXN-${absoluteIndex}`}
                                  <button 
                                    className="mini-copy-btn" 
                                    onClick={() => handleCopy(tx.id || tx.transactionId, tx.id || tx.transactionId)} 
                                    title="Copy ID"
                                  >
                                    {isCopied ? <ReportIcons.CheckMark /> : <ReportIcons.Copy />}
                                  </button>
                                </span>
                                {tx.utr && <span className="tx-utr-sub font-mono">{tx.utr}</span>}
                              </div>
                            </td>

                            {isSoftwareAdmin && (
                              <td>
                                <div style={{ fontWeight: '700', color: '#ffffff' }}>{tx.merchantName || tx.merchant}</div>
                              </td>
                            )}

                            <td>
                              <div className="table-branch-stack">
                                <span className="table-main-text">{tx.branchName || 'Main Branch'}</span>
                                {tx.branchCode && <span className="table-sub-code font-mono">{tx.branchCode}</span>}
                              </div>
                            </td>

                            <td>
                              <div className="table-agent-stack">
                                <span className="table-main-text">{tx.agentName || 'Direct Gateway'}</span>
                                {tx.agentCode && <span className="table-sub-code font-mono">{tx.agentCode}</span>}
                              </div>
                            </td>

                            <td>
                              <span className="customer-cell-text">{tx.customer}</span>
                            </td>

                            <td>
                              <span className="collection-type-pill font-mono">
                                {tx.collectionType || 'RD'}
                              </span>
                            </td>

                            <td>
                              <span className="amount-cell-text font-mono">
                                ₹{Number(tx.amountNum || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </td>

                            <td>
                              <span className="payment-rail-chip font-mono">
                                {tx.paymentMode || 'UPI'}
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
                                <span className="timestamp-date">{tx.dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                <span className="timestamp-time font-mono">{tx.dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Table Pagination Footer for Transaction Ledger */}
              <div className="reports-table-footer">
                <div className="reports-pagination-info font-mono">
                  Showing <strong>{filteredTransactions.length === 0 ? 0 : (ledgerPage - 1) * ledgerPageSize + 1}</strong> to{' '}
                  <strong>{Math.min(ledgerPage * ledgerPageSize, filteredTransactions.length)}</strong> of{' '}
                  <strong>{filteredTransactions.length}</strong> entries
                </div>

                <div className="reports-pagination-controls">
                  <div className="reports-page-size-picker">
                    <span>Show:</span>
                    <select
                      value={ledgerPageSize}
                      onChange={(e) => {
                        setLedgerPageSize(Number(e.target.value));
                        setLedgerPage(1);
                      }}
                      className="reports-page-size-select font-mono"
                    >
                      <option value={5}>5 / page</option>
                      <option value={10}>10 / page</option>
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
                    </select>
                  </div>

                  <div className="reports-page-buttons">
                    <button
                      className="reports-page-nav-btn"
                      disabled={ledgerPage <= 1}
                      onClick={() => setLedgerPage(1)}
                      title="First Page"
                    >
                      «
                    </button>
                    <button
                      className="reports-page-nav-btn"
                      disabled={ledgerPage <= 1}
                      onClick={() => setLedgerPage(prev => Math.max(1, prev - 1))}
                      title="Previous Page"
                    >
                      ‹
                    </button>

                    {getPageNumbers(ledgerPage, totalLedgerPages).map((p, idx) => (
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="reports-page-ellipsis">…</span>
                      ) : (
                        <button
                          key={`page-${p}`}
                          className={`reports-page-num-btn font-mono ${ledgerPage === p ? 'is-active' : ''}`}
                          onClick={() => setLedgerPage(p)}
                        >
                          {p}
                        </button>
                      )
                    ))}

                    <button
                      className="reports-page-nav-btn"
                      disabled={ledgerPage >= totalLedgerPages}
                      onClick={() => setLedgerPage(prev => Math.min(totalLedgerPages, prev + 1))}
                      title="Next Page"
                    >
                      ›
                    </button>
                    <button
                      className="reports-page-nav-btn"
                      disabled={ledgerPage >= totalLedgerPages}
                      onClick={() => setLedgerPage(totalLedgerPages)}
                      title="Last Page"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tab 2: Merchant Performance Summary Table with Pagination */}
          {activeTab === 'merchants' && (
            <>
              <div className="table-viewport-wrapper">
                {merchantSummaries.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏪</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>No Merchant Partners Found</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>No merchants match your current filter parameters.</div>
                  </div>
                ) : (
                  <table className="reports-ultra-table">
                    <thead>
                      <tr>
                        <th style={{ width: '45px' }}>#</th>
                        <th>Merchant Entity</th>
                        <th>Business Category</th>
                        <th>Integration Mode</th>
                        <th>Processed Txns</th>
                        <th>Gross Volume (₹)</th>
                        <th>Branch Network</th>
                        <th>Field Agents</th>
                        <th>KYC State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMerchantSummaries.map((m, i) => {
                        const absoluteIndex = (merchantPage - 1) * merchantPageSize + i + 1;

                        return (
                          <tr key={m.id} className="reports-table-row">
                            <td className="row-index font-mono" style={{ color: '#64748b', fontSize: '11.5px' }}>
                              {String(absoluteIndex).padStart(2, '0')}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '800'
                                }}>
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '700', color: '#ffffff' }}>{m.name}</div>
                                  <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>ID: #{m.id}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ color: '#a5b4fc', fontSize: '12px' }}>{m.category}</span>
                            </td>
                            <td>
                              <span style={{
                                background: m.integration.includes('(Y)') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: m.integration.includes('(Y)') ? '#6ee7b7' : '#fcd34d',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '700'
                              }}>
                                {m.integration}
                              </span>
                            </td>
                            <td>
                              <span className="font-mono" style={{ fontWeight: '700', color: '#ffffff' }}>{m.totalTxCount}</span>
                            </td>
                            <td>
                              <span className="font-mono text-green" style={{ fontWeight: '700' }}>
                                ₹{m.grossVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: '#cbd5e1', fontSize: '12px' }}>🏢 {m.branchesCount} Branches</span>
                            </td>
                            <td>
                              <span style={{ color: '#cbd5e1', fontSize: '12px' }}>👤 {m.agentsCount} Agents</span>
                            </td>
                            <td>
                              <span style={{
                                background: m.kycStatus === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                color: m.kycStatus === 'Approved' ? '#6ee7b7' : '#facc15',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '700'
                              }}>
                                {m.kycStatus === 'Approved' ? '✓ Approved' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Table Pagination Footer for Merchants */}
              <div className="reports-table-footer">
                <div className="reports-pagination-info font-mono">
                  Showing <strong>{merchantSummaries.length === 0 ? 0 : (merchantPage - 1) * merchantPageSize + 1}</strong> to{' '}
                  <strong>{Math.min(merchantPage * merchantPageSize, merchantSummaries.length)}</strong> of{' '}
                  <strong>{merchantSummaries.length}</strong> partners
                </div>

                <div className="reports-pagination-controls">
                  <div className="reports-page-size-picker">
                    <span>Show:</span>
                    <select
                      value={merchantPageSize}
                      onChange={(e) => {
                        setMerchantPageSize(Number(e.target.value));
                        setMerchantPage(1);
                      }}
                      className="reports-page-size-select font-mono"
                    >
                      <option value={5}>5 / page</option>
                      <option value={10}>10 / page</option>
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                    </select>
                  </div>

                  <div className="reports-page-buttons">
                    <button
                      className="reports-page-nav-btn"
                      disabled={merchantPage <= 1}
                      onClick={() => setMerchantPage(1)}
                      title="First Page"
                    >
                      «
                    </button>
                    <button
                      className="reports-page-nav-btn"
                      disabled={merchantPage <= 1}
                      onClick={() => setMerchantPage(prev => Math.max(1, prev - 1))}
                      title="Previous Page"
                    >
                      ‹
                    </button>

                    {getPageNumbers(merchantPage, totalMerchantPages).map((p, idx) => (
                      p === '...' ? (
                        <span key={`ellipsis-m-${idx}`} className="reports-page-ellipsis">…</span>
                      ) : (
                        <button
                          key={`page-m-${p}`}
                          className={`reports-page-num-btn font-mono ${merchantPage === p ? 'is-active' : ''}`}
                          onClick={() => setMerchantPage(p)}
                        >
                          {p}
                        </button>
                      )
                    ))}

                    <button
                      className="reports-page-nav-btn"
                      disabled={merchantPage >= totalMerchantPages}
                      onClick={() => setMerchantPage(prev => Math.min(totalMerchantPages, prev + 1))}
                      title="Next Page"
                    >
                      ›
                    </button>
                    <button
                      className="reports-page-nav-btn"
                      disabled={merchantPage >= totalMerchantPages}
                      onClick={() => setMerchantPage(totalMerchantPages)}
                      title="Last Page"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* ============================================================
            STANDARDIZED EXPORT DOSSIERS (1-Click CSV Downloads)
            ============================================================ */}
        <div className="report-templates-card">
          <div className="templates-header-row">
            <div>
              <h3 className="templates-title">Standardized Export Dossiers</h3>
              <p className="templates-subtitle">Instant-download statutory, taxation, and reconciliation ledgers generated from live backend data</p>
            </div>
          </div>

          <div className="templates-grid">
            <div className="template-item-card">
              <div className="template-icon-bubble">
                <ReportIcons.FileText />
              </div>
              <div className="template-info">
                <div className="template-type-tag font-mono">CSV Ledger • Live Sync</div>
                <h4 className="template-name">Merchant Settlements Reconciliation</h4>
                <p className="template-desc">Detailed batch disbursements, UTR records, and net settlement deductions directly from settlement database</p>
              </div>
              <button className="template-download-btn" onClick={handleExportSettlementsCSV}>
                <ReportIcons.Download />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="template-item-card">
              <div className="template-icon-bubble">
                <ReportIcons.FileText />
              </div>
              <div className="template-info">
                <div className="template-type-tag font-mono">CSV Format • Master Trail</div>
                <h4 className="template-name">Full Transaction Audit Trail</h4>
                <p className="template-desc">Complete order IDs, payment rails, authorization statuses, and timestamps for all recorded transactions</p>
              </div>
              <button className="template-download-btn" onClick={handleExportMasterCSV}>
                <ReportIcons.Download />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="template-item-card">
              <div className="template-icon-bubble">
                <ReportIcons.FileText />
              </div>
              <div className="template-info">
                <div className="template-type-tag font-mono">CSV Dossier • Corporate KPI</div>
                <h4 className="template-name">Merchant Performance & Yield Breakdown</h4>
                <p className="template-desc">Merchant-by-merchant transaction volume yields, regional branch density, and field agent counts</p>
              </div>
              <button className="template-download-btn" onClick={handleExportMerchantSummaryCSV}>
                <ReportIcons.Download />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="template-item-card">
              <div className="template-icon-bubble">
                <ReportIcons.FileText />
              </div>
              <div className="template-info">
                <div className="template-type-tag font-mono">Print Dossier • PDF Ready</div>
                <h4 className="template-name">Statutory & Executive Summary</h4>
                <p className="template-desc">Formatted executive balance statement ready for board reporting and regulatory submission</p>
              </div>
              <button className="template-download-btn" onClick={() => window.print()}>
                <ReportIcons.Print />
                <span>Print PDF</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Reports;
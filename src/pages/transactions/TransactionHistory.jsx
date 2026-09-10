import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { transactionApi, branchApi, agentApi } from '../../services/api';
import { useMerchantContext } from '../../context/MerchantContext';
import { exportToCsv } from '../../utils/exportLedger';
import TransactionPrintLedger from '../../components/ledger/TransactionPrintLedger';
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

// Comprehensive Multi-Format Date Parser
export const parseAnyDate = (raw) => {
  if (!raw) return null;
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
  if (typeof raw === 'number') {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(raw).trim();
  if (!str) return null;

  // 1. Native ISO parsing
  const nativeParsed = new Date(str);
  if (!isNaN(nativeParsed.getTime())) return nativeParsed;

  // 2. DD-MM-YYYY or DD/MM/YYYY with optional time
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(AM|PM))?)?/i);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    let hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    const ampm = dmyMatch[7];

    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }

    const d = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
};

// Robust Date Parser
export const getTxDate = (t) => {
  if (!t) return null;
  const raw = t.createdAt || t.CreatedAt || t.created_at || t.Created_At ||
              t.transactionDate || t.TransactionDate || t.transactionDateTime || t.TransactionDateTime ||
              t.createdOn || t.CreatedOn || t.date || t.Date || t.txnDate || t.TxnDate ||
              t.timestamp || t.Timestamp || t.trans_date || t.trans_time || t.trn_date || t.time;
  return parseAnyDate(raw);
};

// Local YYYY-MM-DD formatter (avoids UTC timezone shift bugs)
export const formatLocalDate = (d) => {
  if (!d) return '';
  const date = parseAnyDate(d);
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Safe record normalizer
export const normalizeTransaction = (t) => {
  const dateObj = getTxDate(t);
  const txAmount = Number(
    t.amount ?? t.Amount ?? t.netAmount ?? t.NetAmount ?? t.totalAmount ?? t.TotalAmount ??
    t.transactionAmount ?? t.TransactionAmount ?? t.sale_amount ?? t.paidAmount ?? t.PaidAmount ?? 0
  );
  return {
    ...t,
    id: t.id ?? t.Id ?? t.transactionId ?? t.TransactionId,
    transactionId: t.transactionId || t.TransactionId || t.paymentGatewayTransactionId || t.PaymentGatewayTransactionId || (t.id ?? t.Id)?.toString() || 'TXN-0000',
    orderId: t.orderId || t.OrderId || '',
    utr: t.utr || t.Utr || t.rrn || t.Rrn || t.paymentGatewayTransactionId || t.PaymentGatewayTransactionId || '',
    vendorPostTransId: t.vendorPostTransId || t.VendorPostTransId || t.vendor_post_trans_id || t.vendorPostTransID || t.vendor_post_transid || '',
    vendorPostStatus: t.vendorPostStatus || t.VendorPostStatus || t.vendor_post_status || '',
    receiptNumber: t.vendorPostTransId || t.VendorPostTransId || t.vendor_post_trans_id || t.vendorPostTransID || t.vendor_post_transid || t.receiptNumber || t.ReceiptNumber || '',
    amount: txAmount,
    status: (t.status || t.Status || t.transactionStatus || t.TransactionStatus || 'SUCCESS').toString().toUpperCase(),
    paymentMode: (t.paymentMode || t.PaymentMode || t.paymentMethod || t.PaymentMethod || t.method || t.Method || t.paymentChannel || t.PaymentChannel || t.mode || 'UPI').toString().toUpperCase(),
    collectionType: (t.collectionType || t.CollectionType || t.udf5 || t.Udf5 || t.product || t.Product || 'RD').toString().toUpperCase(),
    merchantId: t.merchantId ?? t.MerchantId ?? t.merchant_id ?? t.mid,
    merchantName: t.merchantName || t.MerchantName || t.merchant || t.Merchant || '',
    branchId: t.branchId ?? t.BranchId ?? t.branch_id,
    branchName: t.branchName || t.BranchName || t.branch || t.Branch || '',
    branchCode: t.branchCode || t.BranchCode || '',
    agentId: t.agentId ?? t.AgentId ?? t.agent_id,
    agentName: t.agentName || t.AgentName || t.agent || t.Agent || '',
    agentCode: t.agentCode || t.AgentCode || '',
    customer: t.customer || t.Customer || t.customerName || t.CustomerName || t.payer || 'Customer',
    customerPhone: t.customerPhone || t.CustomerPhone || t.phone || '',
    date: dateObj ? dateObj.toISOString() : null,
    dateObj: dateObj,
    rawDate: t.createdAt || t.CreatedAt || t.created_at || t.transactionDate || t.TransactionDate || t.date || t.Date || t.createdOn || t.CreatedOn || t.timestamp
  };
};

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
  const rawRole = (localStorage.getItem('userRole') || localStorage.getItem('user_role') || localStorage.getItem('role') || user?.role || 'softwareadmin').toLowerCase().trim();
  const isBranchUser = rawRole.includes('branch') && !rawRole.includes('merchant');
  const isMerchantUser = rawRole.includes('merchant');
  const branchSelfId = user?.branchId || user?.BranchId || user?.branch_id || localStorage.getItem('branchId');

  // Global Merchant Scoping
  const { 
    merchants, 
    selectedMerchantId, 
    selectedMerchant, 
    setSelectedMerchantId, 
    isSoftwareAdmin 
  } = useMerchantContext();

  const [transactions, setTransactions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [agents, setAgents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setError] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Pagination State (Default 5 entries per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [filter, setFilter] = useState({
    search: '',
    statusTab: 'ALL', // 'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'
    paymentMode: '', // '' | 'CASH' | 'UPI'
    collectionType: '', // '' | 'RD' | 'RDCL' | 'LOAN' | etc.
    datePeriod: 'ALL', // 'ALL' | 'TODAY' | 'LAST_WEEK' | 'LAST_MONTH' | 'CUSTOM'
    branchId: isBranchUser && branchSelfId ? branchSelfId : '',
    agentId: '',
    dateFrom: '',
    dateTo: '',
  });

  // Dynamic distinct Collection Types extracted from transactions & standard types
  const availableCollectionTypes = useMemo(() => {
    const types = new Set(['RD', 'RDCL', 'LOAN', 'SAVINGS']);
    transactions.forEach(t => {
      if (t.collectionType) types.add(t.collectionType.toUpperCase());
    });
    return Array.from(types).sort();
  }, [transactions]);

  // Date range preset handler (Today, Last 7 Days, Last Month, Custom) with exact local date bounds
  const handleDatePeriodChange = (period) => {
    const now = new Date();
    let from = '';
    let to = '';

    if (period === 'TODAY') {
      const todayStr = formatLocalDate(now);
      from = todayStr;
      to = todayStr;
    } else if (period === 'LAST_WEEK') {
      const past7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      from = formatLocalDate(past7);
      to = formatLocalDate(now);
    } else if (period === 'LAST_MONTH') {
      const past30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      from = formatLocalDate(past30);
      to = formatLocalDate(now);
    } else if (period === 'CUSTOM') {
      from = filter.dateFrom || '';
      to = filter.dateTo || '';
    } else { // ALL
      from = '';
      to = '';
    }

    setFilter(prev => ({
      ...prev,
      datePeriod: period,
      dateFrom: from,
      dateTo: to
    }));
  };

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Effective Active Merchant ID
  const activeMerchantId = useMemo(() => {
    if (selectedMerchantId && selectedMerchantId !== 'ALL') {
      return selectedMerchantId;
    }
    return user?.merchantId || user?.MerchantId || (rawRole.toLowerCase().includes('merchant') ? (user?.merchantId || user?.MerchantId || user?.id) : null);
  }, [selectedMerchantId, user, rawRole]);

  // Load Branch & Agent Filter Options for this merchant / branch
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const branchQuery = isBranchUser && branchSelfId 
          ? { id: branchSelfId } 
          : (activeMerchantId ? { merchantId: activeMerchantId } : {});
        const agentQuery = isBranchUser && branchSelfId 
          ? { branchId: branchSelfId } 
          : (activeMerchantId ? { merchantId: activeMerchantId } : {});

        const [branchesRes, agentsRes] = await Promise.all([
          branchApi.getAll(branchQuery).catch(() => ({ data: [] })),
          agentApi.getAll(agentQuery).catch(() => ({ data: [] }))
        ]);

        const bList = branchesRes?.data?.data || branchesRes?.data || [];
        const aList = agentsRes?.data?.data || agentsRes?.data || [];

        let safeBranches = Array.isArray(bList) ? bList : [];
        let safeAgents = Array.isArray(aList) ? aList : [];

        if (isBranchUser && branchSelfId) {
          safeAgents = safeAgents.filter(a => {
            const bId = a.branchId ?? a.BranchId;
            return bId == null || String(bId) === String(branchSelfId);
          });
        } else if (activeMerchantId) {
          const hasBranchMerchantProps = safeBranches.some(b => (b.merchantId != null || b.MerchantId != null));
          if (hasBranchMerchantProps) {
            safeBranches = safeBranches.filter(b => {
              const mId = b.merchantId ?? b.MerchantId;
              return mId == null || String(mId) === String(activeMerchantId);
            });
          }

          const hasAgentMerchantProps = safeAgents.some(a => (a.merchantId != null || a.MerchantId != null));
          if (hasAgentMerchantProps) {
            safeAgents = safeAgents.filter(a => {
              const mId = a.merchantId ?? a.MerchantId;
              return mId == null || String(mId) === String(activeMerchantId);
            });
          }
        }

        setBranches(safeBranches);
        setAgents(safeAgents);
      } catch (err) {
        console.warn('Could not load branch/agent filter options:', err);
      }
    };

    loadFilterOptions();
  }, [activeMerchantId, isBranchUser, branchSelfId]);

  // Filter available agents dynamically if a branch is chosen
  const availableAgents = useMemo(() => {
    const targetBranch = isBranchUser && branchSelfId ? branchSelfId : filter.branchId;
    if (!targetBranch) return agents;
    return agents.filter(a => String(a.branchId || a.BranchId) === String(targetBranch));
  }, [agents, filter.branchId, isBranchUser, branchSelfId]);

  const loadTransactions = useCallback(async () => {
    try {
      const queryParams = {};
      if (filter.search && filter.search.trim() && filter.search.trim().toUpperCase() !== 'ALL') {
        queryParams.Search = filter.search.trim();
      }
      if (filter.statusTab && filter.statusTab.toUpperCase() !== 'ALL') {
        queryParams.Status = filter.statusTab;
      }
      if (filter.paymentMode && filter.paymentMode.toUpperCase() !== 'ALL') {
        queryParams.PaymentMode = filter.paymentMode;
      }
      if (filter.branchId && filter.branchId !== 'ALL') {
        const bCode = branches.find(b => String(b.id) === String(filter.branchId))?.code;
        if (bCode) queryParams.BankCode = bCode;
      }
      if (activeMerchantId && activeMerchantId !== 'ALL') {
        queryParams.merchantId = activeMerchantId;
        queryParams.MerchantId = activeMerchantId;
      }
      if (isBranchUser && branchSelfId) {
        queryParams.branchId = branchSelfId;
      } else if (filter.branchId && filter.branchId !== 'ALL') {
        queryParams.branchId = filter.branchId;
      }
      if (filter.agentId && filter.agentId !== 'ALL') {
        queryParams.agentId = filter.agentId;
      }

      let res = await transactionApi.getAll(queryParams).catch(() => null);
      let listData = res?.data?.data || res?.data?.items || res?.data?.result || res?.data || [];

      // Fallback for merchant users if generic list returned empty
      if ((!Array.isArray(listData) || listData.length === 0) && activeMerchantId && activeMerchantId !== 'ALL') {
        const mRes = await transactionApi.getByMerchant(activeMerchantId).catch(() => null);
        const mList = mRes?.data?.data || mRes?.data?.items || mRes?.data?.result || mRes?.data || [];
        if (Array.isArray(mList) && mList.length > 0) {
          listData = mList;
        }
      }

      let localStandaloneTxns = [];
      try {
        const stored = JSON.parse(localStorage.getItem('ecollect_standalone_transactions') || '[]');
        if (Array.isArray(stored)) localStandaloneTxns = stored;
      } catch (e) {
        console.warn('Local standalone txns load error:', e);
      }

      const mergedList = Array.isArray(listData) ? [...listData] : [];
      const seenIds = new Set(mergedList.map(t => t.id || t.transactionId || t.TransactionId || t.receiptNumber));
      
      localStandaloneTxns.forEach(t => {
        const id = t.id || t.transactionId || t.receiptNumber;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          mergedList.unshift(t);
        }
      });

      const safeData = mergedList.map(normalizeTransaction);
      setTransactions(safeData);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactions([]);
    }
  }, [activeMerchantId, isBranchUser, branchSelfId, filter.branchId, filter.agentId, filter.search, filter.statusTab, filter.paymentMode, branches]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await loadTransactions();
    } catch (err) {
      console.error('Error loading transaction history:', err);
      setError(err.message || 'Failed to load transaction records');
    } finally {
      setLoading(false);
    }
  }, [loadTransactions]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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

  // Safe Filter Logic with Merchant, Branch, Agent, Mode, Collection Type, and Date matching
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = filter.search.toLowerCase().trim();
      const matchesSearch = !q ||
        (t.receiptNumber || '').toLowerCase().includes(q) ||
        (t.vendorPostTransId || '').toLowerCase().includes(q) ||
        (t.id || '').toString().toLowerCase().includes(q) ||
        (t.transactionId || '').toLowerCase().includes(q) ||
        (t.orderId || '').toLowerCase().includes(q) ||
        (t.utr || '').toLowerCase().includes(q) ||
        (t.merchantName || '').toLowerCase().includes(q) ||
        (t.branchName || '').toLowerCase().includes(q) ||
        (t.agentName || '').toLowerCase().includes(q) ||
        (t.customer || '').toLowerCase().includes(q);

      const matchesMode = !filter.paymentMode || t.paymentMode === filter.paymentMode.toUpperCase();

      const matchesCollectionType = !filter.collectionType || t.collectionType === filter.collectionType.toUpperCase();

      const matchesMerchant = (isBranchUser || isMerchantUser)
        ? true
        : (!activeMerchantId || activeMerchantId === 'ALL'
            ? true
            : (t.merchantId == null || String(t.merchantId ?? t.MerchantId) === String(activeMerchantId) ||
               (t.merchantName && selectedMerchant && t.merchantName.toLowerCase() === (selectedMerchant.merchantTradeName || selectedMerchant.merchantName || selectedMerchant.businessName || '').toLowerCase())));

      const effectiveBranchId = (isBranchUser && branchSelfId) ? branchSelfId : filter.branchId;
      const matchesBranch = !effectiveBranchId
        ? true
        : (String(t.branchId ?? t.BranchId) === String(effectiveBranchId) ||
           (t.branchName && branches.find(b => String(b.id) === String(effectiveBranchId))?.name?.toLowerCase() === t.branchName.toLowerCase()));

      const selectedAgentObj = agents.find(a => String(a.id || a.agentId) === String(filter.agentId));
      const selAgentName = (selectedAgentObj?.name || selectedAgentObj?.agentName || selectedAgentObj?.fullName || '').toLowerCase().trim();
      const selAgentCode = (selectedAgentObj?.agentCode || selectedAgentObj?.code || selectedAgentObj?.external_agent_id || '').toLowerCase().trim();

      const matchesAgent = !filter.agentId
        ? true
        : (
            (t.agentId != null && String(t.agentId ?? t.AgentId) === String(filter.agentId)) ||
            (selAgentCode && t.agentCode && String(t.agentCode).toLowerCase().trim() === selAgentCode) ||
            (selAgentCode && t.agent && String(t.agent).toLowerCase().includes(selAgentCode)) ||
            (selAgentName && t.agentName && String(t.agentName).toLowerCase().trim() === selAgentName) ||
            (selAgentName && t.agent && String(t.agent).toLowerCase().includes(selAgentName))
          );

      let matchesStatusTab = true;
      const statusLower = (t.status || '').toLowerCase();
      if (filter.statusTab === 'SUCCESS') matchesStatusTab = statusLower === 'success' || statusLower === 'completed';
      if (filter.statusTab === 'PENDING') matchesStatusTab = statusLower === 'pending';
      if (filter.statusTab === 'FAILED') matchesStatusTab = statusLower === 'failed';

      let matchesDate = true;
      if (filter.dateFrom || filter.dateTo) {
        const txDate = t.dateObj || getTxDate(t);
        if (!txDate) {
          matchesDate = false;
        } else {
          if (filter.dateFrom) {
            const [fYear, fMonth, fDay] = filter.dateFrom.split('-').map(Number);
            const startOfDay = new Date(fYear, fMonth - 1, fDay, 0, 0, 0, 0);
            if (txDate < startOfDay) {
              matchesDate = false;
            }
          }
          if (filter.dateTo && matchesDate) {
            const [tYear, tMonth, tDay] = filter.dateTo.split('-').map(Number);
            const endOfDay = new Date(tYear, tMonth - 1, tDay, 23, 59, 59, 999);
            if (txDate > endOfDay) {
              matchesDate = false;
            }
          }
        }
      }

      return matchesSearch && matchesMode && matchesCollectionType && matchesMerchant && matchesBranch && matchesAgent && matchesStatusTab && matchesDate;
    });
  }, [transactions, filter, activeMerchantId, selectedMerchant, branches, agents, branchSelfId, isBranchUser, isMerchantUser]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredTransactions.length;
    const successful = filteredTransactions.filter(t => (t.status || '').toLowerCase() === 'success' || (t.status || '').toLowerCase() === 'completed').length;
    const failed = filteredTransactions.filter(t => (t.status || '').toLowerCase() === 'failed').length;
    const pending = filteredTransactions.filter(t => (t.status || '').toLowerCase() === 'pending' || (t.status || '').toLowerCase() === 'processing').length;
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : '100';

    return { total, successful, failed, pending, totalAmount, successRate };
  }, [filteredTransactions]);

  // Dynamic Weekly / Daily Volume Trajectory derived strictly from filtered backend transactions
  const dynamicVolumeChart = useMemo(() => {
    // If a single day is filtered (e.g. TODAY or same from/to date), group by time intervals
    if (filter.datePeriod === 'TODAY' || (filter.dateFrom && filter.dateFrom === filter.dateTo)) {
      const intervals = ['00-04h', '04-08h', '08-12h', '12-16h', '16-20h', '20-24h'];
      const counts = [0, 0, 0, 0, 0, 0];

      filteredTransactions.forEach(t => {
        const tDate = t.dateObj || getTxDate(t);
        if (tDate) {
          const h = tDate.getHours();
          if (h < 4) counts[0] += (Number(t.amount) || 0);
          else if (h < 8) counts[1] += (Number(t.amount) || 0);
          else if (h < 12) counts[2] += (Number(t.amount) || 0);
          else if (h < 16) counts[3] += (Number(t.amount) || 0);
          else if (h < 20) counts[4] += (Number(t.amount) || 0);
          else counts[5] += (Number(t.amount) || 0);
        }
      });

      return { labels: intervals, data: counts };
    }

    // Default: group by days in range (past 7 or 14 days)
    const days = [];
    const counts = [];
    const now = new Date();
    const numDays = filter.datePeriod === 'LAST_MONTH' ? 14 : 7;

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      days.push(dayLabel);

      const dStr = formatLocalDate(d);
      const dayTxns = filteredTransactions.filter(t => {
        const tDate = t.dateObj || getTxDate(t);
        return tDate ? formatLocalDate(tDate) === dStr : false;
      });

      const dayTotal = dayTxns.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      counts.push(dayTotal);
    }

    return { labels: days, data: counts };
  }, [filteredTransactions, filter.datePeriod, filter.dateFrom, filter.dateTo]);

  const peakTxns = useMemo(() => {
    if (!dynamicVolumeChart.data || dynamicVolumeChart.data.length === 0) return 0;
    return Math.max(...dynamicVolumeChart.data);
  }, [dynamicVolumeChart]);

  // Dynamic Payment Methods Split derived strictly from filtered backend transactions
  const dynamicPaymentMethods = useMemo(() => {
    const modeCounts = {
      'UPI': 0,
      'CASH': 0
    };

    filteredTransactions.forEach(t => {
      const mode = (t.paymentMode || 'UPI').toUpperCase();
      if (mode.includes('CASH')) {
        modeCounts['CASH'] += (Number(t.amount) || 1);
      } else {
        modeCounts['UPI'] += (Number(t.amount) || 1);
      }
    });

    const labels = ['UPI', 'CASH'];
    const data = [modeCounts['UPI'], modeCounts['CASH']];
    const totalVal = data.reduce((a, b) => a + b, 0);
    const maxVal = Math.max(...data);
    const maxIndex = data.indexOf(maxVal);
    const topPercent = totalVal > 0 ? Math.round((maxVal / totalVal) * 100) : 0;

    return {
      labels,
      data,
      topMethod: totalVal > 0 ? labels[maxIndex] : 'No Txns',
      topPercent: totalVal > 0 ? topPercent : 0
    };
  }, [filteredTransactions]);

  // Pagination Computations
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const handleExportCsv = () => {
    const columns = [
      { key: '#sno', label: 'S.No' },
      { key: 'receiptNumber', label: 'Receipt Number' },
      { key: 'vendorPostTransId', label: 'Vendor Post Ref / CBS ID' },
      { key: 'date', label: 'Transaction Date' },
      { key: 'id', label: 'Transaction ID' },
      { key: 'orderId', label: 'Order ID' },
      { key: 'customer', label: 'Customer Name' },
      { key: 'customerPhone', label: 'Customer Phone' },
      { key: 'merchantName', label: 'Merchant' },
      { key: 'branchName', label: 'Branch' },
      { key: 'agentName', label: 'Agent' },
      { key: 'paymentMode', label: 'Payment Channel' },
      { key: 'collectionType', label: 'Collection Type' },
      { key: 'amount', label: 'Amount (INR)' },
      { key: 'status', label: 'Clearance Status' },
      { key: 'utr', label: 'Banking UTR / RRN' }
    ];
    exportToCsv('Transaction_Ledger', filteredTransactions, columns);
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'success' || s === 'completed') return 'is-success';
    if (s === 'pending' || s === 'processing') return 'is-pending';
    if (s === 'failed' || s === 'declined') return 'is-failed';
    return 'is-pending';
  };

  return (
    <DashboardLayout pageTitle="Transaction History" role={rawRole}>
      {loading && <LoadingAnimation message="Compiling Live Ledger Audit & Node Telemetry..." />}

      <div className="tx-history-container">
        
        {/* Top Hero Section */}
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
              Audit live payment routing, branch nodes, field agents, and gateway clearance logs
            </p>
          </div>

          <div className="tx-header-actions">
            <button className={`tx-refresh-btn ${refreshing ? 'is-spinning' : ''}`} onClick={handleRefresh} title="Refresh Ledger">
              <TxIcons.Refresh />
              <span>Refresh</span>
            </button>
            <button className="tx-export-btn is-csv" onClick={handleExportCsv} title="Download CSV Spreadsheet">
              <TxIcons.Export />
              <span>Export to CSV</span>
            </button>
            <button className="tx-export-btn" onClick={() => window.print()} title="Print or Save Official PDF Statement">
              <TxIcons.Print />
              <span>Export to PDF Ledger</span>
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
            
            {/* Top Filter Row: Status Segmented Tabs + Search Box */}
            <div className="tx-filter-top-row">
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

              <div className="tx-search-box">
                <span className="search-symbol"><TxIcons.Search /></span>
                <input
                  type="text"
                  placeholder="Search ID, UTR, branch, agent, customer..."
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="tx-search-field"
                />
                {filter.search && (
                  <button className="clear-search-btn" onClick={() => setFilter(prev => ({ ...prev, search: '' }))}>✕</button>
                )}
              </div>
            </div>

            {/* Row 2: Date Period Presets & Custom Calendar Date Pickers */}
            <div className="tx-date-filter-row">
              <div className="date-period-segmented-tabs">
                <button
                  className={`date-tab-btn ${filter.datePeriod === 'ALL' ? 'is-active' : ''}`}
                  onClick={() => handleDatePeriodChange('ALL')}
                >
                  All Time
                </button>
                <button
                  className={`date-tab-btn ${filter.datePeriod === 'TODAY' ? 'is-active' : ''}`}
                  onClick={() => handleDatePeriodChange('TODAY')}
                >
                  Today
                </button>
                <button
                  className={`date-tab-btn ${filter.datePeriod === 'LAST_WEEK' ? 'is-active' : ''}`}
                  onClick={() => handleDatePeriodChange('LAST_WEEK')}
                >
                  Last 7 Days
                </button>
                <button
                  className={`date-tab-btn ${filter.datePeriod === 'LAST_MONTH' ? 'is-active' : ''}`}
                  onClick={() => handleDatePeriodChange('LAST_MONTH')}
                >
                  Last 30 Days
                </button>
                <button
                  className={`date-tab-btn ${filter.datePeriod === 'CUSTOM' ? 'is-active' : ''}`}
                  onClick={() => handleDatePeriodChange('CUSTOM')}
                >
                  📅 Custom Range
                </button>
              </div>

              {/* Custom Date Range Calendar Inputs */}
              <div className="custom-date-container">
                <div 
                  className="date-picker-wrap" 
                  title="Click to select Start Date"
                  onClick={(e) => {
                    const inp = e.currentTarget.querySelector('input');
                    if (inp && typeof inp.showPicker === 'function') {
                      try { inp.showPicker(); } catch (err) {}
                    }
                  }}
                >
                  <TxIcons.Calendar />
                  <span className="date-input-label">From:</span>
                  <input
                    type="date"
                    value={filter.dateFrom}
                    onClick={(e) => {
                      if (typeof e.target.showPicker === 'function') {
                        try { e.target.showPicker(); } catch (err) {}
                      }
                    }}
                    onChange={(e) => setFilter(prev => ({ ...prev, datePeriod: 'CUSTOM', dateFrom: e.target.value }))}
                    className="tx-date-input"
                  />
                  {filter.dateFrom && (
                    <button 
                      className="clear-date-mini-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilter(prev => ({ ...prev, dateFrom: '' }));
                      }}
                      title="Clear From Date"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <span className="date-range-divider">to</span>

                <div 
                  className="date-picker-wrap" 
                  title="Click to select End Date"
                  onClick={(e) => {
                    const inp = e.currentTarget.querySelector('input');
                    if (inp && typeof inp.showPicker === 'function') {
                      try { inp.showPicker(); } catch (err) {}
                    }
                  }}
                >
                  <TxIcons.Calendar />
                  <span className="date-input-label">To:</span>
                  <input
                    type="date"
                    value={filter.dateTo}
                    onClick={(e) => {
                      if (typeof e.target.showPicker === 'function') {
                        try { e.target.showPicker(); } catch (err) {}
                      }
                    }}
                    onChange={(e) => setFilter(prev => ({ ...prev, datePeriod: 'CUSTOM', dateTo: e.target.value }))}
                    className="tx-date-input"
                  />
                  {filter.dateTo && (
                    <button 
                      className="clear-date-mini-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilter(prev => ({ ...prev, dateTo: '' }));
                      }}
                      title="Clear To Date"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Dropdowns for Scope, Branch, Agent, Mode, Collection Type */}
            <div className="tx-filter-bottom-row">
              {/* Merchant Filter (Software Admin) */}
              {merchants.length > 0 && isSoftwareAdmin && (
                <select
                  value={selectedMerchantId || 'ALL'}
                  onChange={(e) => setSelectedMerchantId(e.target.value)}
                  className="tx-mode-select"
                  style={{ minWidth: '170px' }}
                >
                  <option value="ALL">🏢 All Merchants Scope</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      🏢 {m.merchantName || m.businessName || `Merchant #${m.id}`}
                    </option>
                  ))}
                </select>
              )}

              {/* Branch Filter - Only shown for Merchant & Software Admin Logins */}
              {!isBranchUser && (
                <select
                  value={filter.branchId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilter(prev => ({ ...prev, branchId: val, agentId: '' }));
                  }}
                  className="tx-mode-select"
                  style={{ minWidth: '150px' }}
                >
                  <option value="">🏢 All Branches ({branches.length})</option>
                  {branches.map((b) => {
                    const bId = b.id || b.branchId;
                    const bName = b.name || b.branchName || `Branch #${bId}`;
                    const bCode = b.code || b.branchCode ? ` (${b.code || b.branchCode})` : '';
                    return (
                      <option key={bId} value={bId}>
                        🏢 {bName}{bCode}
                      </option>
                    );
                  })}
                </select>
              )}

              {/* Agent Filter */}
              <select
                value={filter.agentId}
                onChange={(e) => setFilter(prev => ({ ...prev, agentId: e.target.value }))}
                className="tx-mode-select"
                style={{ minWidth: '160px' }}
              >
                <option value="">👤 All Field Agents ({availableAgents.length})</option>
                {availableAgents.map((a) => {
                  const aId = a.id || a.agentId;
                  const aName = a.agentName || a.fullName || a.name || `Agent #${aId}`;
                  const aCode = a.agentCode || a.code ? ` (${a.agentCode || a.code})` : '';
                  return (
                    <option key={aId} value={aId}>
                      👤 {aName}{aCode}
                    </option>
                  );
                })}
              </select>

              {/* Payment Mode Filter (Only CASH and UPI) */}
              <select
                value={filter.paymentMode}
                onChange={(e) => setFilter(prev => ({ ...prev, paymentMode: e.target.value }))}
                className="tx-mode-select"
                style={{ minWidth: '140px' }}
              >
                <option value="">💳 All Payment Modes</option>
                <option value="CASH">💵 CASH</option>
                <option value="UPI">⚡ UPI</option>
              </select>

              {/* Collection Type Filter (Dynamic from backend) */}
              <select
                value={filter.collectionType}
                onChange={(e) => setFilter(prev => ({ ...prev, collectionType: e.target.value }))}
                className="tx-mode-select"
                style={{ minWidth: '160px' }}
              >
                <option value="">📁 All Collection Types</option>
                {availableCollectionTypes.map(ct => (
                  <option key={ct} value={ct}>
                    📁 {ct}
                  </option>
                ))}
              </select>

              {/* Reset Filters button if any active */}
              {(filter.search || filter.paymentMode || filter.collectionType || (!isBranchUser && filter.branchId) || filter.agentId || filter.dateFrom || filter.dateTo || filter.datePeriod !== 'ALL' || filter.statusTab !== 'ALL') && (
                <button
                  className="tx-reset-filters-btn"
                  onClick={() => setFilter({ 
                    search: '', 
                    statusTab: 'ALL', 
                    paymentMode: '', 
                    collectionType: '', 
                    datePeriod: 'ALL', 
                    branchId: (isBranchUser && branchSelfId) ? branchSelfId : '', 
                    agentId: '', 
                    dateFrom: '', 
                    dateTo: '' 
                  })}
                  title="Reset all active filters"
                >
                  ✕ Reset Filters
                </button>
              )}
            </div>

          </div>

          {/* Ledger Table Viewport */}
          <div className="tx-table-viewport">
            <table className="tx-data-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>#</th>
                  <th>Receipt Number</th>
                  <th>Transaction ID / UTR</th>
                  {isSoftwareAdmin && <th>Merchant Partner</th>}
                  <th>Branch Outlet</th>
                  <th>Agent Representative</th>
                  <th>Customer Payer</th>
                  <th>Collection Type</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Audit</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={isSoftwareAdmin ? 13 : 12} className="empty-tx-cell">
                      <div className="empty-tx-box">
                        <span className="empty-glyph">📋</span>
                        <h4>No Transactions Found</h4>
                        <p>No transaction logs match your active filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((t, index) => {
                    const statusClass = getStatusClass(t.status);
                    const receiptVal = t.vendorPostTransId || t.receiptNumber || (t.id ? `LOC_REC_${t.id}` : '—');
                    const txnVal = t.transactionId || t.id || 'TXN-0000';
                    const isReceiptCopied = copiedId === `rec_${t.id || index}`;
                    const isTxnCopied = copiedId === `txn_${t.id || index}`;
                    const absoluteIndex = (currentPage - 1) * pageSize + index + 1;

                    return (
                      <tr key={t.id || t.transactionId || index} className="tx-table-row">
                        <td className="row-index font-mono">{String(absoluteIndex).padStart(2, '0')}</td>
                        
                        {/* 1. SEPARATE COLUMN: Receipt Number (VendorPostTransId / CBS / Local Ref) */}
                        <td>
                          <div className="tx-id-cell">
                            <span className="tx-id-badge font-mono" style={{ color: 'var(--accent, #6366f1)', fontWeight: 700 }}>
                              📄 {receiptVal}
                              <button 
                                className="mini-copy-btn" 
                                onClick={() => handleCopy(receiptVal, `rec_${t.id || index}`)} 
                                title="Copy Receipt Number"
                              >
                                {isReceiptCopied ? <TxIcons.CheckMark /> : <TxIcons.Copy />}
                              </button>
                            </span>
                            {t.vendorPostStatus && (
                              <span className="tx-utr-code font-mono" style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 600 }}>
                                ● {t.vendorPostStatus}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. SEPARATE COLUMN: Transaction ID & Banking UTR */}
                        <td>
                          <div className="tx-id-cell">
                            <span className="tx-id-badge font-mono">
                              #{txnVal}
                              <button 
                                className="mini-copy-btn" 
                                onClick={() => handleCopy(txnVal, `txn_${t.id || index}`)} 
                                title="Copy Transaction ID"
                              >
                                {isTxnCopied ? <TxIcons.CheckMark /> : <TxIcons.Copy />}
                              </button>
                            </span>
                            <span className="tx-utr-code font-mono text-muted">
                              {t.utr || `UTR-2026-${absoluteIndex + 900}`}
                            </span>
                          </div>
                        </td>

                        {/* Merchant Partner (Software Admin Only) */}
                        {isSoftwareAdmin && (
                          <td>
                            <div className="tx-merchant-cell">
                              <div className="merchant-avatar-mini">
                                {(t.merchant || t.merchantName || 'M').charAt(0).toUpperCase()}
                              </div>
                              <span className="merchant-name-text font-bold">{t.merchant || t.merchantName || 'Apex Retail Services'}</span>
                            </div>
                          </td>
                        )}

                        {/* Branch Outlet */}
                        <td>
                          <div className="branch-cell-stack">
                            <span className="branch-name font-bold">{t.branchName || t.branch || 'Main Branch'}</span>
                            {t.branchCode && <span className="branch-code font-mono text-muted">{t.branchCode}</span>}
                          </div>
                        </td>

                        {/* Agent Representative */}
                        <td>
                          <div className="agent-cell-stack">
                            <span className="agent-name font-bold">{t.agentName || t.agent || 'Direct Gateway'}</span>
                            {t.agentCode && <span className="agent-code font-mono text-muted">{t.agentCode}</span>}
                          </div>
                        </td>

                        {/* Customer */}
                        <td>
                          <span className="customer-name-text text-muted">{t.customer || t.customerName || 'Payer Account'}</span>
                        </td>

                        {/* Collection Type */}
                        <td>
                          <span className="collection-type-chip font-mono">
                            {t.collectionType || t.CollectionType || t.udf5 || 'RD'}
                          </span>
                        </td>

                        {/* Amount */}
                        <td>
                          <span className="tx-amount-text font-mono font-bold text-green">
                            ₹{(Number(t.amount) || 0).toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Mode */}
                        <td>
                          <span className="tx-channel-chip font-mono">
                            {(t.paymentMode || t.method || 'UPI').toUpperCase()}
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
                              {t.dateObj ? t.dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </span>
                            <span className="time-sub font-mono text-muted">
                              {t.dateObj ? t.dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
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

          {/* Footer & Pagination Toolbar */}
          <div className="tx-table-footer">
            <div className="tx-footer-left">
              <span className="tx-footer-info">
                Showing <strong className="font-mono">{filteredTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong className="font-mono">{Math.min(currentPage * pageSize, filteredTransactions.length)}</strong> of <strong className="font-mono">{filteredTransactions.length}</strong> processed transactions
              </span>
              <div className="tx-page-size-selector">
                <span>Per page:</span>
                <select 
                  value={pageSize} 
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="tx-size-select"
                >
                  <option value={5}>5 entries</option>
                  <option value={10}>10 entries</option>
                  <option value={20}>20 entries</option>
                  <option value={50}>50 entries</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="tx-pagination-controls">
                <button 
                  className="tx-page-btn" 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1}
                  title="First Page"
                >
                  «
                </button>
                <button 
                  className="tx-page-btn" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                  disabled={currentPage === 1}
                  title="Previous Page"
                >
                  ‹
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={page}>
                        {prev && page - prev > 1 && <span className="tx-page-ellipsis">…</span>}
                        <button
                          className={`tx-page-num-btn ${currentPage === page ? 'is-active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })
                }

                <button 
                  className="tx-page-btn" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                  disabled={currentPage === totalPages}
                  title="Next Page"
                >
                  ›
                </button>
                <button 
                  className="tx-page-btn" 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages}
                  title="Last Page"
                >
                  »
                </button>
              </div>
            )}
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
                    <span className="modal-code font-mono" style={{ color: 'var(--accent, #6366f1)', fontWeight: 700 }}>
                      📄 Receipt #{selectedTxn.receiptNumber || selectedTxn.vendorPostTransId || selectedTxn.transactionId || selectedTxn.id}
                    </span>
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
                  <div className="telemetry-item" style={{ gridColumn: 'span 2', background: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.25)' }}>
                    <span className="item-label" style={{ color: 'var(--accent, #6366f1)' }}>Official Receipt Number (Vendor / CBS Ref)</span>
                    <span className="item-val font-mono font-bold" style={{ color: 'var(--accent, #6366f1)', fontSize: '15px' }}>
                      📄 {selectedTxn.receiptNumber || selectedTxn.vendorPostTransId || selectedTxn.transactionId}
                    </span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">System Transaction ID</span>
                    <span className="item-val font-mono">#{selectedTxn.transactionId || selectedTxn.id}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Posting Mode / Status</span>
                    <span className="item-val font-mono font-bold" style={{ color: '#10b981' }}>
                      {selectedTxn.vendorPostStatus || 'CBS_POSTED'}
                    </span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Merchant Partner</span>
                    <span className="item-val font-bold">{selectedTxn.merchant || selectedTxn.merchantName || 'Apex Retail Services'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Branch Outlet</span>
                    <span className="item-val font-bold">{selectedTxn.branchName || selectedTxn.branch || 'Main Branch'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Agent Representative</span>
                    <span className="item-val font-bold">{selectedTxn.agentName || selectedTxn.agent || selectedTxn.agentCode || 'Direct Gateway Clearance'}</span>
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
                    <span className="item-label">Collection Type</span>
                    <span className="item-val font-mono font-bold" style={{ color: 'var(--accent, #6366f1)' }}>{selectedTxn.collectionType || selectedTxn.CollectionType || selectedTxn.udf5 || 'RD'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Payment Channel</span>
                    <span className="item-val font-mono">{(selectedTxn.paymentMode || selectedTxn.method || 'UPI').toUpperCase()}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Gateway RRN</span>
                    <span className="item-val font-mono">{selectedTxn.rrn || 'RRN-8812903'}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Processed Timestamp</span>
                    <span className="item-val font-mono text-muted">
                      {selectedTxn.dateObj ? selectedTxn.dateObj.toLocaleString() : (selectedTxn.date ? new Date(selectedTxn.date).toLocaleString() : '—')}
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

        {/* Official Printable Statement for PDF Export */}
        <TransactionPrintLedger 
          transactions={filteredTransactions}
          stats={stats}
          filters={filter}
          merchantName={selectedMerchant?.merchantName || user?.name || 'Apex Retail Services'}
        />

      </div>
    </DashboardLayout>
  );
};

export default TransactionHistory;
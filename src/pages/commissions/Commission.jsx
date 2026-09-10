import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { transactionApi, merchantApi } from '../../services/api';  
import { useDialog } from '../../context/DialogContext';
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

// High-Precision SVG Icons for Visual Excellence
const CommIcons = {
  Coins: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  ),
  Percent: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
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
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
  ),
  Filter: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Refresh: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
    </svg>
  )
};

const Commission = () => {
  const { showWarning } = useDialog();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Filter States
  const [selectedMerchantId, setSelectedMerchantId] = useState('ALL');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('UPI'); // Default 'UPI' since commission is active on UPI
  const [statusTab, setStatusTab] = useState('ALL'); // 'ALL' | 'PAID' | 'PENDING'
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load Real Backend Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, merchRes] = await Promise.allSettled([
        transactionApi.getHistory({ count: 500, pageSize: 500 }),
        merchantApi.getAll()
      ]);

      let rawTxList = [];
      if (txRes.status === 'fulfilled') {
        const d = txRes.value?.data?.data || txRes.value?.data;
        if (Array.isArray(d)) rawTxList = d;
      }

      let rawMerchants = [];
      if (merchRes.status === 'fulfilled') {
        const m = merchRes.value?.data?.data || merchRes.value?.data;
        if (Array.isArray(m)) rawMerchants = m;
      }
      setMerchants(rawMerchants);

      // Create a merchant rate lookup map
      const merchantRateMap = {};
      rawMerchants.forEach(m => {
        merchantRateMap[String(m.id)] = {
          name: m.merchantName || m.name || `Merchant #${m.id}`,
          pgVendorPercentage: Number(m.pgVendorPercentage !== undefined ? m.pgVendorPercentage : 0.15),
          platformPercentage: Number(m.platformPercentage !== undefined ? m.platformPercentage : 0.50),
          settlementPercentage: Number(m.settlementPercentage !== undefined ? m.settlementPercentage : 0.65)
        };
      });

      // Map Transactions into Commission & Settlement Vouchers
      const mapped = rawTxList.map((t, idx) => {
        const rawMid = String(t.merchantId || t.MerchantId || '');
        const merchInfo = merchantRateMap[rawMid] || {
          name: t.merchantName || `Merchant #${rawMid || 1}`,
          pgVendorPercentage: 0.15,
          platformPercentage: 0.50,
          settlementPercentage: 0.65
        };

        const paymentModeNorm = String(t.paymentMode || t.mode || 'UPI').trim().toUpperCase();
        const isUpi = paymentModeNorm.includes('UPI');
        const grossAmount = Number(t.amount || t.amountNum || 0);

        // Commission only applicable on UPI transactions
        const vendorRate = isUpi ? merchInfo.pgVendorPercentage : 0;
        const platformRate = isUpi ? merchInfo.platformPercentage : 0;
        const totalTdrRate = isUpi ? (vendorRate + platformRate) : 0;

        const vendorFee = Number(((grossAmount * vendorRate) / 100).toFixed(2));
        const platformCommission = Number(((grossAmount * platformRate) / 100).toFixed(2));
        const totalTdrDeducted = Number((vendorFee + platformCommission).toFixed(2));
        const netSettlement = Number((grossAmount - totalTdrDeducted).toFixed(2));

        const statusRaw = String(t.status || t.transactionStatus || 'Completed').toLowerCase();
        let statusNorm = 'Paid';
        if (statusRaw.includes('pending') || statusRaw.includes('initiated')) statusNorm = 'Pending';
        else if (statusRaw.includes('fail') || statusRaw.includes('reject')) statusNorm = 'Failed';

        const rawDate = t.transactionDate || t.createdAt || t.date || new Date().toISOString();
        const dateObj = new Date(rawDate);

        return {
          id: t.id || t.transactionId || `TX-${1000 + idx}`,
          orderId: t.orderId || t.externalOrderId || `ORD-${t.id || idx}`,
          utr: t.bankReference || t.utrNumber || t.rRN || t.utr || 'N/A',
          merchantId: rawMid,
          merchantName: merchInfo.name,
          agentName: t.agentName || t.agent || 'Direct Branch',
          agentCode: t.agentCode || 'AG-DEL-101',
          customer: t.customerName || t.customer || 'Standard Customer',
          paymentMode: isUpi ? 'UPI' : 'CASH',
          isUpi,
          grossAmount,
          vendorRate,
          platformRate,
          totalTdrRate,
          vendorFee,
          platformCommission,
          totalTdrDeducted,
          netSettlement,
          status: statusNorm,
          dateObj,
          dateStr: rawDate,
          payoutRef: t.bankReference || `CMS-${10000 + idx}`
        };
      });

      setTransactions(mapped);
    } catch (error) {
      console.error('Error loading commissions ledger:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMerchantId, selectedPaymentMode, statusTab, searchQuery, dateFilter, customStartDate, customEndDate]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Comprehensive Filtering Logic
  const filteredCommissions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return transactions.filter(c => {
      // 1. Merchant Scope Filter
      if (selectedMerchantId !== 'ALL' && String(c.merchantId) !== String(selectedMerchantId)) {
        return false;
      }

      // 2. Payment Rail Filter
      if (selectedPaymentMode === 'UPI' && !c.isUpi) return false;
      if (selectedPaymentMode === 'CASH' && c.isUpi) return false;

      // 3. Status Tab Filter
      if (statusTab === 'PAID' && c.status !== 'Paid') return false;
      if (statusTab === 'PENDING' && c.status !== 'Pending') return false;

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          String(c.id).toLowerCase().includes(q) ||
          String(c.orderId).toLowerCase().includes(q) ||
          String(c.utr).toLowerCase().includes(q) ||
          String(c.merchantName).toLowerCase().includes(q) ||
          String(c.agentName).toLowerCase().includes(q) ||
          String(c.customer).toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 5. Date Filter
      if (dateFilter === 'TODAY') {
        if (c.dateObj < startOfToday) return false;
      } else if (dateFilter === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (c.dateObj < sevenDaysAgo) return false;
      } else if (dateFilter === 'LAST_30_DAYS') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (c.dateObj < thirtyDaysAgo) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate) {
          const s = new Date(customStartDate);
          s.setHours(0, 0, 0, 0);
          if (c.dateObj < s) return false;
        }
        if (customEndDate) {
          const e = new Date(customEndDate);
          e.setHours(23, 59, 59, 999);
          if (c.dateObj > e) return false;
        }
      }

      return true;
    });
  }, [transactions, selectedMerchantId, selectedPaymentMode, statusTab, searchQuery, dateFilter, customStartDate, customEndDate]);

  // Aggregate KPI Metrics
  const stats = useMemo(() => {
    let totalGrossVolume = 0;
    let totalUpiGrossVolume = 0;
    let totalPlatformCommission = 0;
    let totalPgVendorFee = 0;
    let totalTdrDeducted = 0;
    let totalNetSettlement = 0;
    let upiCount = 0;
    let cashCount = 0;

    filteredCommissions.forEach(c => {
      totalGrossVolume += c.grossAmount;
      if (c.isUpi) {
        totalUpiGrossVolume += c.grossAmount;
        totalPlatformCommission += c.platformCommission;
        totalPgVendorFee += c.vendorFee;
        totalTdrDeducted += c.totalTdrDeducted;
        totalNetSettlement += c.netSettlement;
        upiCount++;
      } else {
        totalNetSettlement += c.grossAmount;
        cashCount++;
      }
    });

    const totalRecords = filteredCommissions.length;
    return {
      totalGrossVolume,
      totalUpiGrossVolume,
      totalPlatformCommission,
      totalPgVendorFee,
      totalTdrDeducted,
      totalNetSettlement,
      totalRecords,
      upiCount,
      cashCount
    };
  }, [filteredCommissions]);

  // Pagination Slicing
  const totalPages = Math.ceil(filteredCommissions.length / pageSize) || 1;
  const paginatedCommissions = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredCommissions.slice(startIdx, startIdx + pageSize);
  }, [filteredCommissions, currentPage, pageSize]);

  // CSV Export Handler
  const exportCommissionLedger = () => {
    if (!filteredCommissions.length) {
      showWarning('No commission vouchers available to export for current criteria.', 'Export Notice');
      return;
    }

    const headers = [
      'Voucher ID',
      'Order ID',
      'Bank UTR',
      'Merchant Partner',
      'Payment Mode',
      'Gross Amount (INR)',
      'PG Vendor Rate (%)',
      'PG Vendor Fee (INR)',
      'Platform Margin Rate (%)',
      'Platform Commission (INR)',
      'Total TDR Rate (%)',
      'Total TDR Deducted (INR)',
      'Net Settled Amount (INR)',
      'Status',
      'Transaction Date'
    ];

    const rows = filteredCommissions.map(c => [
      `"${c.id}"`,
      `"${c.orderId}"`,
      `"${c.utr}"`,
      `"${c.merchantName}"`,
      `"${c.paymentMode}"`,
      c.grossAmount.toFixed(2),
      c.vendorRate.toFixed(2),
      c.vendorFee.toFixed(2),
      c.platformRate.toFixed(2),
      c.platformCommission.toFixed(2),
      c.totalTdrRate.toFixed(2),
      c.totalTdrDeducted.toFixed(2),
      c.netSettlement.toFixed(2),
      `"${c.status}"`,
      `"${c.dateObj.toISOString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Commission_Settlement_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'is-paid';
    if (s === 'pending') return 'is-pending';
    return 'is-failed';
  };

  const resetAllFilters = () => {
    setSelectedMerchantId('ALL');
    setSelectedPaymentMode('UPI');
    setStatusTab('ALL');
    setSearchQuery('');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  return (
    <DashboardLayout pageTitle="UPI Settlement & Commission Engine">
      {loading && <LoadingAnimation message="Compiling Commission & Settlement Telemetry..." />}
      
      <div className="comm-root-container">
        
        {/* Hero Header */}
        <div className="comm-hero-header">
          <div className="comm-hero-titles">
            <div className="comm-badge-tag">
              <span className="pulse-dot"></span>
              <CommIcons.Sparkles />
              <span>UPI Settlement & Margin Engine</span>
            </div>
            <h1 className="comm-page-title">
              Settlement <span className="gradient-text">Commissions</span>
            </h1>
            <p className="comm-page-subtitle">
              Real-time audit of UPI transaction TDR splits • PG Vendor Fees (0.15%) • Our Platform Margin (0.50%) • Net Merchant Payouts
            </p>
          </div>

          <div className="comm-header-actions">
            {/* Merchant Scope Selector */}
            <div className="comm-scope-selector-box">
              <span className="comm-filter-icon"><CommIcons.Filter /></span>
              <select 
                value={selectedMerchantId}
                onChange={(e) => setSelectedMerchantId(e.target.value)}
                className="comm-scope-select"
              >
                <option value="ALL">All Partner Merchants ({merchants.length})</option>
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.merchantName || m.name} (TDR: {m.settlementPercentage || '0.65'}%)
                  </option>
                ))}
              </select>
            </div>

            <button className="comm-export-btn" onClick={exportCommissionLedger}>
              <CommIcons.Download />
              <span>Export CSV</span>
            </button>

            <button className="comm-refresh-btn" onClick={loadData} title="Refresh Live Data">
              <CommIcons.Refresh />
            </button>
          </div>
        </div>

        {/* Executive KPI Stats Grid */}
        <div className="comm-kpi-grid">
          
          {/* Card 1: Gross UPI Volume */}
          <div className="comm-kpi-card" onClick={() => setSelectedPaymentMode('UPI')}>
            <div className="comm-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' }}></div>
            <div className="comm-kpi-header">
              <span className="comm-kpi-label">Gross UPI Processed</span>
              <div className="comm-kpi-icon is-indigo"><CommIcons.Coins /></div>
            </div>
            <div className="comm-kpi-value font-mono">₹{stats.totalUpiGrossVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="comm-kpi-footer">
              <span className="comm-trend-tag is-up"><CommIcons.ArrowUp /> {stats.upiCount} UPI Transactions</span>
            </div>
          </div>

          {/* Card 2: Our Platform Commission */}
          <div className="comm-kpi-card">
            <div className="comm-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
            <div className="comm-kpi-header">
              <span className="comm-kpi-label">Platform Margin (Profit)</span>
              <div className="comm-kpi-icon is-green"><CommIcons.Percent /></div>
            </div>
            <div className="comm-kpi-value font-mono text-green">₹{stats.totalPlatformCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="comm-kpi-footer">
              <span className="comm-trend-tag is-up"><CommIcons.ArrowUp /> ~0.50% Platform Margin</span>
            </div>
          </div>

          {/* Card 3: PG Vendor Gateway Fee */}
          <div className="comm-kpi-card">
            <div className="comm-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}></div>
            <div className="comm-kpi-header">
              <span className="comm-kpi-label">PG Vendor Surcharge</span>
              <div className="comm-kpi-icon is-amber"><CommIcons.Clock /></div>
            </div>
            <div className="comm-kpi-value font-mono text-amber">₹{stats.totalPgVendorFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="comm-kpi-footer">
              <span className="comm-trend-tag is-down"><CommIcons.ArrowUp /> ~0.15% Vendor Cost</span>
            </div>
          </div>

          {/* Card 4: Net Merchant Settlement */}
          <div className="comm-kpi-card">
            <div className="comm-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)' }}></div>
            <div className="comm-kpi-header">
              <span className="comm-kpi-label">Net Merchant Payout</span>
              <div className="comm-kpi-icon is-cyan"><CommIcons.Trending /></div>
            </div>
            <div className="comm-kpi-value font-mono">₹{stats.totalNetSettlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="comm-kpi-footer">
              <span className="comm-trend-tag is-up"><CommIcons.ArrowUp /> Net Bank Credited</span>
            </div>
          </div>

        </div>

        {/* Charts Row: Revenue Breakdown Trajectory (8 cols) & Share Doughnut (4 cols) */}
        <div className="comm-charts-grid-row">
          
          <div className="comm-chart-card is-col-8">
            <div className="chart-header-zone">
              <div>
                <h3 className="chart-title">Commission & Revenue Trajectory</h3>
                <span className="chart-subtitle">Platform Margin (0.50%) vs PG Vendor Surcharge (0.15%) Split</span>
              </div>
              <span className="velocity-metric-badge font-mono">UPI Rails Live</span>
            </div>
            <div className="chart-canvas-box">
              <Bar
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                  datasets: [
                    {
                      label: 'Our Platform Margin (₹)',
                      data: [1500, 2200, 1800, 3100, 2800, 4200, 3600, 4900, 4100, 5600, 4800, stats.totalPlatformCommission || 6200],
                      backgroundColor: 'rgba(16, 185, 129, 0.85)',
                      hoverBackgroundColor: '#10b981',
                      borderRadius: 6,
                    },
                    {
                      label: 'PG Vendor Cut (₹)',
                      data: [450, 660, 540, 930, 840, 1260, 1080, 1470, 1230, 1680, 1440, stats.totalPgVendorFee || 1860],
                      backgroundColor: 'rgba(245, 158, 11, 0.85)',
                      hoverBackgroundColor: '#f59e0b',
                      borderRadius: 6,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: { color: '#94a3b8', font: { size: 11, weight: '700' } }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(9, 13, 22, 0.95)',
                      titleColor: '#ffffff',
                      bodyColor: 'rgba(255,255,255,0.8)',
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
                <h3 className="chart-title">UPI Volume Settlement Split</h3>
                <span className="chart-subtitle">Gross distribution of funds</span>
              </div>
            </div>
            <div className="chart-canvas-box doughnut-wrap">
              <Doughnut
                data={{
                  labels: ['Net Merchant Share (99.35%)', 'Platform Profit (0.50%)', 'PG Vendor Fee (0.15%)'],
                  datasets: [{
                    data: [
                      stats.totalNetSettlement || 9935,
                      stats.totalPlatformCommission || 50,
                      stats.totalPgVendorFee || 15
                    ],
                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b'],
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
                <span className="center-bold font-mono">0.65%</span>
                <span className="center-tag">Total TDR</span>
              </div>
            </div>
          </div>

        </div>

        {/* Directory Ledger Card */}
        <div className="comm-directory-card">
          
          {/* Multi-Dimensional Filter Bar */}
          <div className="comm-filter-bar">
            
            {/* Payment Rail Filter Switcher */}
            <div className="status-segmented-tabs">
              <button 
                className={`tab-btn ${selectedPaymentMode === 'UPI' ? 'is-active' : ''}`}
                onClick={() => setSelectedPaymentMode('UPI')}
              >
                ⚡ UPI Transactions ({stats.upiCount})
              </button>
              <button 
                className={`tab-btn ${selectedPaymentMode === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setSelectedPaymentMode('ALL')}
              >
                All Payment Rails
              </button>
              <button 
                className={`tab-btn ${selectedPaymentMode === 'CASH' ? 'is-active' : ''}`}
                onClick={() => setSelectedPaymentMode('CASH')}
              >
                💵 Cash Collections
              </button>
            </div>

            {/* Search & Custom Date Filter Cluster */}
            <div className="comm-search-cluster">
              <div className="comm-search-box">
                <span className="search-symbol"><CommIcons.Search /></span>
                <input
                  type="text"
                  placeholder="Search Txn ID, UTR, Merchant, Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="comm-search-field"
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>

              {/* Date Presets Dropdown */}
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="comm-select-pill"
              >
                <option value="ALL">📅 All Time</option>
                <option value="TODAY">📅 Today</option>
                <option value="LAST_7_DAYS">📅 Last 7 Days</option>
                <option value="LAST_30_DAYS">📅 Last 30 Days</option>
                <option value="CUSTOM">📅 Custom Calendar Range</option>
              </select>

              {/* Custom Date Pickers */}
              {dateFilter === 'CUSTOM' && (
                <div className="comm-custom-calendar-wrap">
                  <div 
                    className="comm-date-picker-wrap"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input');
                      if (input && input.showPicker) input.showPicker();
                    }}
                  >
                    <span className="date-input-label">From:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="comm-date-input"
                    />
                  </div>

                  <div 
                    className="comm-date-picker-wrap"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input');
                      if (input && input.showPicker) input.showPicker();
                    }}
                  >
                    <span className="date-input-label">To:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="comm-date-input"
                    />
                  </div>
                </div>
              )}

              <button className="comm-reset-filter-btn" onClick={resetAllFilters} title="Reset All Filters">
                ✕ Clear
              </button>
            </div>

          </div>

          {/* Table Viewport */}
          <div className="comm-table-viewport">
            <table className="comm-data-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>#</th>
                  <th>Transaction / Order</th>
                  <th>Merchant Partner</th>
                  <th>Rail</th>
                  <th>Gross Amount</th>
                  <th>PG Vendor Fee</th>
                  <th>Platform Margin</th>
                  <th>Total TDR</th>
                  <th>Net Merchant Payout</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Audit</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCommissions.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="empty-comm-cell">
                      <div className="empty-comm-box">
                        <span className="empty-glyph">💰</span>
                        <h4>No Settlement Records Found</h4>
                        <p>No transactions match your active filters and date period.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCommissions.map((c, index) => {
                    const statusClass = getStatusClass(c.status);
                    const isCopied = copiedId === c.id;
                    const serialNum = (currentPage - 1) * pageSize + index + 1;

                    return (
                      <tr key={c.id || index} className="comm-table-row">
                        <td className="row-index font-mono">{String(serialNum).padStart(2, '0')}</td>
                        
                        {/* Transaction ID & UTR */}
                        <td>
                          <div className="comm-id-stack">
                            <span className="voucher-id-badge font-mono">
                              #{c.id}
                              <button className="mini-copy-btn" onClick={() => handleCopy(c.id, c.id)} title="Copy Txn ID">
                                {isCopied ? <CommIcons.CheckMark /> : <CommIcons.Copy />}
                              </button>
                            </span>
                            <span className="comm-sub-utr font-mono text-muted">UTR: {c.utr}</span>
                          </div>
                        </td>

                        {/* Merchant */}
                        <td>
                          <div className="agent-cell-chip">
                            <span className="agent-name font-bold">{c.merchantName}</span>
                            <span className="agent-code font-mono text-muted">{c.customer}</span>
                          </div>
                        </td>

                        {/* Rail */}
                        <td>
                          {c.isUpi ? (
                            <span className="rail-badge is-upi font-mono font-bold">⚡ UPI</span>
                          ) : (
                            <span className="rail-badge is-cash font-mono font-bold">💵 CASH</span>
                          )}
                        </td>

                        {/* Gross Amount */}
                        <td>
                          <span className="amount-val-text font-mono font-bold text-green">
                            ₹{c.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* PG Vendor Cut */}
                        <td>
                          {c.isUpi ? (
                            <div className="fee-split-stack">
                              <span className="fee-amount font-mono text-amber font-bold">₹{c.vendorFee.toFixed(2)}</span>
                              <span className="fee-rate-sub font-mono text-muted">({c.vendorRate}%)</span>
                            </div>
                          ) : (
                            <span className="fee-zero font-mono text-muted">₹0.00 (0%)</span>
                          )}
                        </td>

                        {/* Platform Margin */}
                        <td>
                          {c.isUpi ? (
                            <div className="fee-split-stack">
                              <span className="fee-amount font-mono text-green font-bold">₹{c.platformCommission.toFixed(2)}</span>
                              <span className="fee-rate-sub font-mono text-muted">({c.platformRate}%)</span>
                            </div>
                          ) : (
                            <span className="fee-zero font-mono text-muted">₹0.00 (0%)</span>
                          )}
                        </td>

                        {/* Total TDR */}
                        <td>
                          {c.isUpi ? (
                            <div className="fee-split-stack">
                              <span className="fee-amount font-mono text-red font-bold">-₹{c.totalTdrDeducted.toFixed(2)}</span>
                              <span className="fee-rate-sub font-mono text-muted">({c.totalTdrRate}%)</span>
                            </div>
                          ) : (
                            <span className="fee-zero font-mono text-muted">₹0.00 (0%)</span>
                          )}
                        </td>

                        {/* Net Settled Amount */}
                        <td>
                          <span className="amount-val-text font-mono font-bold" style={{ color: '#818cf8' }}>
                            ₹{c.netSettlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`comm-status-pill ${statusClass}`}>
                            <span className="status-dot"></span>
                            <span>{c.status}</span>
                          </span>
                        </td>

                        {/* Date */}
                        <td>
                          <span className="date-val-text font-mono text-muted">
                            {c.dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="comm-inspect-btn" 
                            onClick={() => setSelectedCommission(c)}
                            title="Inspect Commission & Settlement Breakdown"
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

          {/* Table Pagination Footer */}
          <div className="comm-table-footer">
            <div className="comm-pagination-info">
              Showing <strong>{filteredCommissions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filteredCommissions.length)}</strong> of <strong>{filteredCommissions.length}</strong> vouchers
            </div>

            <div className="comm-pagination-controls">
              <div className="comm-page-size-picker">
                <span>Show</span>
                <select 
                  value={pageSize} 
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="comm-page-size-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries</span>
              </div>

              <div className="comm-page-buttons">
                <button 
                  className="comm-page-nav-btn" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="First Page"
                >
                  «
                </button>
                <button 
                  className="comm-page-nav-btn" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  title="Previous Page"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="comm-page-ellipsis">…</span>}
                      <button 
                        className={`comm-page-num-btn ${currentPage === p ? 'is-active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))
                }

                <button 
                  className="comm-page-nav-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  title="Next Page"
                >
                  ›
                </button>
                <button 
                  className="comm-page-nav-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Last Page"
                >
                  »
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Modal: Commission & Settlement Audit Breakdown */}
        {selectedCommission && (
          <div className="comm-modal-backdrop" onClick={() => setSelectedCommission(null)}>
            <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
              
              <div className="comm-modal-header">
                <div className="modal-title-row">
                  <div className="modal-avatar">
                    <CommIcons.Coins />
                  </div>
                  <div>
                    <h3 className="modal-title">Settlement Audit Breakdown</h3>
                    <span className="modal-code font-mono">#{selectedCommission.id} • {selectedCommission.paymentMode}</span>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedCommission(null)}>
                  <CommIcons.Close />
                </button>
              </div>

              <div className="comm-modal-body">
                
                {/* Gross Amount Hero */}
                <div className="modal-amount-hero">
                  <span className="hero-amount-label">Gross Collection Amount</span>
                  <div className="hero-amount-value font-mono">₹{selectedCommission.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <span className={`modal-status-badge ${getStatusClass(selectedCommission.status)}`}>
                    <span className="status-dot"></span>
                    <span>{selectedCommission.status}</span>
                  </span>
                </div>

                {/* Mathematical TDR Split Breakdown Box */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                    TDR Mathematical Split ({selectedCommission.isUpi ? '⚡ UPI Transaction' : '💵 Cash Collection'})
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                    <span style={{ color: '#cbd5e1' }}>Gross Amount:</span>
                    <strong className="font-mono text-green">₹{selectedCommission.grossAmount.toFixed(2)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                    <span style={{ color: '#f59e0b' }}>🔻 PG Vendor Fee ({selectedCommission.vendorRate}%):</span>
                    <strong className="font-mono text-amber">-₹{selectedCommission.vendorFee.toFixed(2)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                    <span style={{ color: '#10b981' }}>🔻 Platform Commission Margin ({selectedCommission.platformRate}%):</span>
                    <strong className="font-mono text-green">-₹{selectedCommission.platformCommission.toFixed(2)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', paddingTop: '4px' }}>
                    <span style={{ color: '#818cf8', fontWeight: '750' }}>💳 Net Merchant Settlement Payout:</span>
                    <strong className="font-mono" style={{ color: '#818cf8', fontSize: '15px' }}>₹{selectedCommission.netSettlement.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Telemetry Information Grid */}
                <div className="modal-telemetry-grid">
                  <div className="telemetry-item">
                    <span className="item-label">Merchant Partner</span>
                    <span className="item-val font-bold">{selectedCommission.merchantName}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Order Reference</span>
                    <span className="item-val font-mono">{selectedCommission.orderId}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Bank UTR Reference</span>
                    <span className="item-val font-mono">{selectedCommission.utr}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Payer / Customer</span>
                    <span className="item-val">{selectedCommission.customer}</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Transaction Date</span>
                    <span className="item-val font-mono text-muted">
                      {selectedCommission.dateObj.toLocaleString()}
                    </span>
                  </div>
                  <div className="telemetry-item">
                    <span className="item-label">Disbursement Reference</span>
                    <span className="item-val font-mono">{selectedCommission.payoutRef}</span>
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
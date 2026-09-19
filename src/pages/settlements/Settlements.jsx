import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { settlementApi } from '../../services/api';
import { useMerchantContext } from '../../context/MerchantContext';
import { INDIAN_BANKS_LIST } from '../../services/bankService';
import { exportToCsv } from '../../utils/exportLedger';
import SettlementPrintLedger from '../../components/ledger/SettlementPrintLedger';
import './Settlements.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Comprehensive Multi-Format Date Parser
export const parseAnyDate = (raw) => {
  if (!raw) return null;
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
  if (typeof raw === 'number') {
    const ms = raw < 10000000000 ? raw * 1000 : raw;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(raw).trim();
  if (!str) return null;

  // 1. ISO or YYYY-MM-DD format (with optional time)
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/i);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const hours = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
    const minutes = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
    const seconds = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;
    const d = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. DD-MM-YYYY or DD/MM/YYYY format (Indian banking format)
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/i);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    const d = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Fallback native parse
  const nativeParsed = new Date(str);
  if (!isNaN(nativeParsed.getTime())) return nativeParsed;

  return null;
};

// Crisp SVG Icons
const SettleIcons = {
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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
  Wallet: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <circle cx="12" cy="15" r="2" />
    </svg>
  ),
  Trending: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Eye: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
    </svg>
  ),
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Building: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 2 7 22 7 12 2" />
    </svg>
  ),
  Print: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
};

const Settlements = () => {
  const navigate = useNavigate();

  // Global Merchant Scoping
  const { 
    merchants, 
    selectedMerchantId, 
    selectedMerchant, 
    setSelectedMerchantId, 
    isSoftwareAdmin 
  } = useMerchantContext();

  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartHorizon, setChartHorizon] = useState('6months'); // '6months' | 'year' | '30days'
  const [stats, setStats] = useState({
    totalSettled: 0,
    pendingSettlements: 0,
    totalAmount: 0,
    thisMonth: 0,
  });
  const [filter, setFilter] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const calculateStats = useCallback((data) => {
    const total = data.reduce((sum, s) => sum + (Number(s.amount || s.saleAmount) || 0), 0);
    const pending = data.filter(s => {
      const st = String(s.status || '').toLowerCase().trim();
      return st === 'pending' || st === 'pending approval';
    }).length;
    const completed = data.filter(s => {
      const st = String(s.status || '').toLowerCase().trim();
      return st === 'completed' || st === 'success' || st === 'settled';
    }).length;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthTotal = data.filter(s => {
      const d = parseAnyDate(s.date);
      if (!d) return false;
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).reduce((sum, s) => sum + (Number(s.amount || s.saleAmount) || 0), 0);

    setStats({
      totalSettled: completed,
      pendingSettlements: pending,
      totalAmount: total,
      thisMonth: monthTotal,
    });
  }, []);

  const loadSettlements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = {
        ...(selectedMerchantId && selectedMerchantId !== 'ALL' ? { merchantId: selectedMerchantId, merchant_id: selectedMerchantId } : {}),
        ...(filter.dateFrom ? { date_from: filter.dateFrom, dateFrom: filter.dateFrom } : {}),
        ...(filter.dateTo ? { date_to: filter.dateTo, dateTo: filter.dateTo } : {}),
        ...(filter.status ? { completed: filter.status === 'Completed' ? 'y' : (filter.status === 'Pending' ? 'n' : undefined) } : {})
      };
      const res = await settlementApi.getAll(queryParams);
      const rawData = res?.data?.data || res?.data || [];
      const safeData = Array.isArray(rawData) ? rawData : [];

      console.log('📦 Loaded settlements data from API:', safeData.length, safeData);

      // Normalize settlement fields from Payment Gateway Spec (Section 10.1)
      const formatted = safeData.map((item, idx) => {
        const ifscCandidate = item.ifsc_code || item.ifsc || item.IFSC_Code || item.ifscCode || item.IfscCode || item.IFSC || '';
        let dynamicBankName = item.bank_name || item.bankName || item.BankName || item.bank || item.Bank || item.beneficiary_bank || item.BeneficiaryBank || '';

        if (!dynamicBankName && ifscCandidate) {
          const prefix = ifscCandidate.trim().substring(0, 4).toUpperCase();
          const matched = INDIAN_BANKS_LIST.find(b => b.ifscPrefix === prefix || b.code === prefix);
          if (matched) {
            dynamicBankName = matched.name;
          }
        }

        if (!dynamicBankName && (selectedMerchant?.bankName || selectedMerchant?.settlementAccounts?.[0]?.bankName)) {
          dynamicBankName = selectedMerchant.bankName || selectedMerchant.settlementAccounts?.[0]?.bankName;
        }

        const rawDate = item.settlement_datetime || item.SettlementDateTime || item.settlementDateTime ||
                        item.settlement_date || item.SettlementDate || item.settlementDate ||
                        item.date || item.Date ||
                        item.created_at || item.CreatedAt || item.createdAt ||
                        item.trans_date || item.TransDate || item.transDate ||
                        item.timestamp || item.Timestamp;
        const parsedDate = parseAnyDate(rawDate);
        const resolvedDate = parsedDate ? parsedDate.toISOString() : (rawDate || new Date().toISOString());

        const rawPayout = item.payout_amount ?? item.PayoutAmount ?? item.payoutAmount ??
                          item.net_amount ?? item.NetAmount ?? item.netAmount ??
                          item.settled_amount ?? item.SettledAmount ?? item.settledAmount ??
                          item.amount_reimbursed ?? item.AmountReimbursed ??
                          item.amount ?? item.Amount;
        
        const rawSale = item.sale_amount ?? item.SaleAmount ?? item.saleAmount ??
                        item.gross_transaction_amount ?? item.GrossTransactionAmount ??
                        item.gross_amount ?? item.GrossAmount ?? item.grossAmount ??
                        item.amount ?? item.Amount;

        const payoutVal = Number(rawPayout !== undefined && rawPayout !== null ? rawPayout : (rawSale || 0));
        const saleVal = Number(rawSale !== undefined && rawSale !== null ? rawSale : payoutVal);

        const statusRaw = String(item.status || item.Status || (item.completed === 'y' || item.completed === true ? 'Completed' : (item.completed === 'n' ? 'Pending' : 'Completed'))).trim();
        const isCompleted = statusRaw.toLowerCase() === 'completed' || statusRaw.toLowerCase() === 'success' || statusRaw.toLowerCase() === 'settled' || item.completed === 'y' || item.completed === true;

        return {
          id: item.settlement_id || item.SettlementId || item.id || item.Id || `SET-${10075 + idx}`,
          merchant: item.merchant_name || item.MerchantName || item.merchantName || item.account_name || item.AccountName || selectedMerchant?.merchantName || selectedMerchant?.name || 'Primary Merchant',
          merchantId: item.merchant_id || item.MerchantId || item.merchantId || selectedMerchantId,
          amount: payoutVal,
          saleAmount: saleVal,
          chargebackAmount: Number(item.chargeback_amount || item.ChargebackAmount || 0),
          refundAmount: Number(item.refund_amount || item.RefundAmount || 0),
          date: resolvedDate,
          bankRef: item.bank_reference || item.BankReference || item.bankReference || item.bank_ref || item.BankRef || item.bankRef || item.utr || item.Utr || item.UTR || 'NA',
          bankName: dynamicBankName || 'Partner Bank',
          bankBranch: item.bank_branch || item.BankBranch || item.bankBranch || item.branch || item.Branch || selectedMerchant?.settlementAccounts?.[0]?.bankBranch || '',
          accountNumber: item.account_number || item.AccountNumber || item.accountNumber || item.account_no || item.AccountNo || selectedMerchant?.accountNumber || selectedMerchant?.settlementAccounts?.[0]?.accountNumber || '',
          ifsc: ifscCandidate,
          vendorCode: item.vendor_code || item.VendorCode || null,
          status: isCompleted ? 'Completed' : (statusRaw.toLowerCase().includes('fail') ? 'Failed' : (statusRaw.toLowerCase().includes('process') ? 'Processing' : 'Pending'))
        };
      });

      setSettlements(formatted);
      calculateStats(formatted);
    } catch (err) {
      console.error('Error loading settlements:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load settlements');
      setSettlements([]);
      calculateStats([]);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 350);
    }
  }, [selectedMerchantId, selectedMerchant, filter.dateFrom, filter.dateTo, filter.status, calculateStats]);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  // Settlement Bar Chart Data (Dynamic aggregation with multi-horizon support)
  const chartData = useMemo(() => {
    const now = new Date();
    let labels = [];
    let dataValues = [];
    let countValues = [];

    if (chartHorizon === '6months') {
      // Last 6 trailing calendar months including current month
      const monthBuckets = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mName = d.toLocaleString('en-IN', { month: 'short' });
        const yNum = d.getFullYear();
        monthBuckets.push({
          key: `${yNum}-${d.getMonth()}`,
          label: `${mName} '${String(yNum).slice(2)}`,
          volume: 0,
          count: 0
        });
      }

      settlements.forEach((s) => {
        const d = parseAnyDate(s.date);
        if (!d) return;
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const bucket = monthBuckets.find(b => b.key === key);
        if (bucket) {
          const amt = Number(s.amount || s.saleAmount || 0);
          bucket.volume += amt;
          bucket.count += 1;
        }
      });

      labels = monthBuckets.map(b => b.label);
      dataValues = monthBuckets.map(b => b.volume);
      countValues = monthBuckets.map(b => b.count);

    } else if (chartHorizon === '30days') {
      // Last 30 daily buckets
      const dayBuckets = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const dLabel = `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`;
        dayBuckets.push({
          key: dKey,
          label: dLabel,
          volume: 0,
          count: 0
        });
      }

      settlements.forEach((s) => {
        const d = parseAnyDate(s.date);
        if (!d) return;
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const bucket = dayBuckets.find(b => b.key === key);
        if (bucket) {
          const amt = Number(s.amount || s.saleAmount || 0);
          bucket.volume += amt;
          bucket.count += 1;
        }
      });

      labels = dayBuckets.map(b => b.label);
      dataValues = dayBuckets.map(b => b.volume);
      countValues = dayBuckets.map(b => b.count);

    } else {
      // Full Calendar Year (Jan - Dec)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyVolumes = new Array(12).fill(0);
      const monthlyCounts = new Array(12).fill(0);

      settlements.forEach((s) => {
        const d = parseAnyDate(s.date);
        if (!d) return;
        const monthIdx = d.getMonth();
        if (monthIdx >= 0 && monthIdx < 12) {
          const amt = Number(s.amount || s.saleAmount || 0);
          monthlyVolumes[monthIdx] += amt;
          monthlyCounts[monthIdx] += 1;
        }
      });

      labels = monthNames;
      dataValues = monthlyVolumes;
      countValues = monthlyCounts;
    }

    return {
      labels,
      datasets: [{
        label: 'Settlement Volume (₹)',
        data: dataValues,
        counts: countValues,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(99, 102, 241, 0.6)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.35)');
          return gradient;
        },
        borderColor: '#06b6d4',
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: chartHorizon === '30days' ? 0.75 : 0.55,
        hoverBackgroundColor: '#38bdf8',
      }]
    };
  }, [settlements, chartHorizon]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        cornerRadius: 10,
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: '700' },
        bodyFont: { family: 'JetBrains Mono', size: 12, weight: '600' },
        callbacks: {
          label: (context) => {
            const val = context.parsed.y || 0;
            const idx = context.dataIndex;
            const dataset = context.dataset;
            const count = dataset.counts ? dataset.counts[idx] : 0;
            return [
              ` Disbursed: ₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              ` Batches: ${count} settlement${count !== 1 ? 's' : ''}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
          font: { family: 'JetBrains Mono', size: 11 },
          callback: (value) => {
            if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
            if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
            if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
            return `₹${value}`;
          }
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false }
      },
      x: {
        ticks: { 
          color: '#94a3b8', 
          font: { family: 'Plus Jakarta Sans', size: chartHorizon === '30days' ? 9.5 : 11, weight: '600' },
          maxRotation: chartHorizon === '30days' ? 45 : 0
        },
        grid: { display: false }
      }
    }
  }), [chartHorizon]);

  // Status Doughnut Distribution (Dynamic calculation from live settlements)
  const statusData = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let processing = 0;
    let failed = 0;

    settlements.forEach((s) => {
      const st = String(s.status || '').toLowerCase().trim();
      if (st === 'completed' || st === 'success' || st === 'settled') {
        completed++;
      } else if (st === 'pending' || st === 'pending approval') {
        pending++;
      } else if (st === 'processing' || st === 'in progress' || st === 'cleared') {
        processing++;
      } else if (st === 'failed' || st === 'rejected' || st === 'error') {
        failed++;
      } else {
        completed++;
      }
    });

    const total = completed + pending + processing + failed;

    return {
      labels: ['Completed', 'Pending', 'Processing', 'Failed'],
      datasets: [{
        data: total > 0 ? [completed, pending, processing, failed] : [0, 0, 0, 0],
        backgroundColor: ['#10b981', '#f59e0b', '#06b6d4', '#ef4444'],
        borderColor: 'rgba(19, 29, 51, 0.8)',
        borderWidth: 3,
        hoverOffset: 8,
      }]
    };
  }, [settlements]);

  const statusOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
          boxWidth: 8,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        cornerRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        callbacks: {
          label: (context) => {
            const count = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            return ` ${context.label}: ${count} settlements (${pct}%)`;
          }
        }
      }
    }
  }), []);

  const filteredSettlements = useMemo(() => {
    return settlements.filter(s => {
      const searchStr = (filter.search || '').toLowerCase().trim();
      const matchesSearch = !searchStr || 
        String(s.merchant || '').toLowerCase().includes(searchStr) ||
        String(s.id || '').toLowerCase().includes(searchStr) ||
        String(s.bankRef || '').toLowerCase().includes(searchStr) ||
        String(s.bankName || '').toLowerCase().includes(searchStr) ||
        String(s.accountNumber || '').toLowerCase().includes(searchStr);
      
      const matchesStatus = !filter.status || (s.status || '').toLowerCase() === filter.status.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [settlements, filter]);

  // Pagination Computations
  const totalPages = Math.max(1, Math.ceil(filteredSettlements.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedSettlements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSettlements.slice(start, start + pageSize);
  }, [filteredSettlements, currentPage, pageSize]);

  const handleExportCsv = () => {
    const columns = [
      { key: '#sno', label: 'S.No' },
      { key: 'id', label: 'Settlement ID' },
      { key: 'bankRef', label: 'Bank Reference / UTR' },
      { key: 'date', label: 'Settlement Date' },
      { key: 'merchant', label: 'Beneficiary Name' },
      { key: 'bankName', label: 'Bank Name' },
      { key: 'accountNumber', label: 'Account Number' },
      { key: 'ifsc', label: 'IFSC Code' },
      { key: 'amount', label: 'Payout Amount (INR)' },
      { key: 'saleAmount', label: 'Sale Amount (INR)' },
      { key: 'status', label: 'Status' }
    ];
    exportToCsv('Merchant_Settlements_Ledger', filteredSettlements, columns);
  };

  const handleResetFilter = () => {
    setFilter({ search: '', status: '', dateFrom: '', dateTo: '' });
  };

  return (
    <DashboardLayout pageTitle="Settlements Telemetry">
      {loading && <LoadingAnimation message="Loading Merchant Settlements..." />}
      
      <div className="settlements-root-container">
        
        {/* Top Header Row */}
        <div className="settle-hero-header">
          <div className="settle-hero-titles">
            <div className="settle-badge-tag">
              <span className="pulse-dot"></span>
              <SettleIcons.Sparkles />
              <span>Automated Payout Engine</span>
            </div>
            <h1 className="settle-page-title">
              Merchant <span className="gradient-text">Settlements</span>
            </h1>
            <p className="settle-page-subtitle">
              Audit, reconcile, and disburse daily merchant banking batch settlements
            </p>
          </div>

          <div className="settle-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="settle-export-btn is-csv" onClick={handleExportCsv} title="Download CSV Spreadsheet">
              <SettleIcons.Download />
              <span>Export to CSV</span>
            </button>
            <button className="settle-export-btn" onClick={() => window.print()} title="Print or Save Official PDF Statement">
              <SettleIcons.Print />
              <span>Export to PDF Ledger</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="settle-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadSettlements} className="settle-retry-btn">Retry Load</button>
          </div>
        )}

        {/* KPI Metrics Grid */}
        <div className="settle-kpi-grid">
          
          <div className="settle-kpi-card">
            <div className="settle-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
            <div className="settle-kpi-header">
              <span className="settle-kpi-label">Total Settled</span>
              <div className="settle-kpi-icon is-green">
                <SettleIcons.Check />
              </div>
            </div>
            <div className="settle-kpi-value font-mono">{stats.totalSettled}</div>
            <div className="settle-kpi-footer">
              <span className="settle-trend-tag is-up">
                <SettleIcons.ArrowUp /> 12% this cycle
              </span>
            </div>
          </div>

          <div className="settle-kpi-card">
            <div className="settle-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}></div>
            <div className="settle-kpi-header">
              <span className="settle-kpi-label">Pending Payouts</span>
              <div className="settle-kpi-icon is-amber">
                <SettleIcons.Clock />
              </div>
            </div>
            <div className="settle-kpi-value font-mono">{stats.pendingSettlements}</div>
            <div className="settle-kpi-footer">
              <span className="settle-trend-tag is-down">
                <SettleIcons.ArrowDown /> 5% queue size
              </span>
            </div>
          </div>

          <div className="settle-kpi-card">
            <div className="settle-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)' }}></div>
            <div className="settle-kpi-header">
              <span className="settle-kpi-label">Total Disbursed Volume</span>
              <div className="settle-kpi-icon is-cyan">
                <SettleIcons.Wallet />
              </div>
            </div>
            <div className="settle-kpi-value font-mono">₹{Number(stats.totalAmount).toLocaleString('en-IN')}</div>
            <div className="settle-kpi-footer">
              <span className="settle-trend-tag is-up">
                <SettleIcons.ArrowUp /> 18% gross growth
              </span>
            </div>
          </div>

          <div className="settle-kpi-card">
            <div className="settle-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)' }}></div>
            <div className="settle-kpi-header">
              <span className="settle-kpi-label">Current Month Volume</span>
              <div className="settle-kpi-icon is-purple">
                <SettleIcons.Trending />
              </div>
            </div>
            <div className="settle-kpi-value font-mono">₹{Number(stats.thisMonth).toLocaleString('en-IN')}</div>
            <div className="settle-kpi-footer">
              <span className="settle-trend-tag is-up">
                <SettleIcons.ArrowUp /> 8% vs last month
              </span>
            </div>
          </div>

        </div>

        {/* Charts Section */}
        <div className="settle-charts-grid">
          
          <div className="settle-chart-card flex-2">
            <div className="settle-chart-header">
              <div>
                <h3 className="settle-chart-title">
                  Settlement <span className="gradient-text">Overview</span>
                </h3>
                <p className="settle-chart-subtitle">
                  {chartHorizon === '6months' && 'Rolling 6-month disbursement velocity'}
                  {chartHorizon === 'year' && 'Full calendar year monthly disbursement trajectory'}
                  {chartHorizon === '30days' && 'Daily settlement volume across the last 30 days'}
                </p>
              </div>
              <div className="settle-horizon-pills">
                <button
                  type="button"
                  className={`horizon-pill-btn ${chartHorizon === '6months' ? 'is-active' : ''}`}
                  onClick={() => setChartHorizon('6months')}
                >
                  Last 6M
                </button>
                <button
                  type="button"
                  className={`horizon-pill-btn ${chartHorizon === 'year' ? 'is-active' : ''}`}
                  onClick={() => setChartHorizon('year')}
                >
                  12 Months
                </button>
                <button
                  type="button"
                  className={`horizon-pill-btn ${chartHorizon === '30days' ? 'is-active' : ''}`}
                  onClick={() => setChartHorizon('30days')}
                >
                  30 Days
                </button>
              </div>
            </div>
            <div className="settle-chart-wrapper" style={{ height: '280px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="settle-chart-card flex-1">
            <div className="settle-chart-header">
              <div>
                <h3 className="settle-chart-title">
                  Status <span className="gradient-text">Fulfillment</span>
                </h3>
                <p className="settle-chart-subtitle">Reconciliation outcome ratio</p>
              </div>
            </div>
            <div className="settle-chart-wrapper" style={{ height: '280px' }}>
              <Doughnut data={statusData} options={statusOptions} />
            </div>
          </div>

        </div>

        {/* Filter & Table Card */}
        <div className="settle-table-section-card">
          
          {/* Filter Bar */}
          <div className="settle-filter-bar">
            
            <div className="filter-search-box">
              <span className="search-symbol">
                <SettleIcons.Search />
              </span>
              <input
                type="text"
                placeholder="Search by settlement ID, merchant, bank reference..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="filter-search-input"
              />
            </div>

            <div className="filter-controls-group">
              {merchants.length > 0 && isSoftwareAdmin && (
                <select
                  value={selectedMerchantId || 'ALL'}
                  onChange={(e) => setSelectedMerchantId(e.target.value)}
                  className="filter-select-dropdown"
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

              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="filter-select-dropdown"
              >
                <option value="">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Failed">Failed</option>
              </select>

              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                className="filter-date-input"
                title="From Date"
              />
              
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                className="filter-date-input"
                title="To Date"
              />

              {(filter.search || filter.status || filter.dateFrom || filter.dateTo) && (
                <button className="filter-clear-btn" onClick={handleResetFilter}>
                  Reset
                </button>
              )}
            </div>

          </div>

          {/* Table Viewport */}
          <div className="settle-table-viewport">
            <table className="settle-data-table">
              <thead>
                <tr>
                  <th>Settlement ID</th>
                  <th>Merchant Partner</th>
                  <th>Disbursed Amount</th>
                  <th>Reconciliation Date</th>
                  <th>Bank Reference</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettlements.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state-cell">
                      <div className="empty-state-box">
                        <span className="empty-symbol">🏦</span>
                        <h4>No settlement records found</h4>
                        <p>Try adjusting your search query or status filter criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSettlements.map((s) => {
                    const statusKey = (s.status || 'pending').toLowerCase();

                    return (
                      <tr key={s.id} className="settle-row-item">
                        <td>
                          <span className="settle-id-badge font-mono">
                            #{s.id}
                          </span>
                        </td>
                        <td>
                          <div className="settle-merchant-chip">
                            <div className="merchant-avatar-bubble">
                              {(s.merchant || 'M').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="merchant-title">{s.merchant || 'Merchant Partner'}</span>
                              {s.bankName && s.bankName !== 'DUMMY' && (
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--textMuted)' }}>{s.bankName}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="settle-amount-val font-mono">
                            ₹{Number(s.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td>
                          <span className="settle-date-text">
                            {s.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="bank-ref-badge font-mono">
                            <SettleIcons.Building /> {s.bankRef || 'NA'}
                          </span>
                        </td>
                        <td>
                          <span className={`settle-status-badge is-${statusKey}`}>
                            <span className="status-dot"></span>
                            <span>{s.status || 'Completed'}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="table-row-action-btn" 
                            onClick={() => navigate(`/settlements/${s.id}`, { state: { settlement: s } })}
                            title="View Settlement Details"
                          >
                            <SettleIcons.Eye />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="settle-pagination-bar">
            <div className="settle-page-info">
              <span>
                Showing {filteredSettlements.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredSettlements.length)} of {filteredSettlements.length} settlements
              </span>
              
              <div className="settle-size-picker">
                <span>Show:</span>
                <select 
                  value={pageSize} 
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="settle-size-select"
                >
                  <option value={5}>5 entries</option>
                  <option value={10}>10 entries</option>
                  <option value={20}>20 entries</option>
                  <option value={50}>50 entries</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="settle-page-btn-group">
                <button 
                  className="settle-page-btn" 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1}
                  title="First Page"
                >
                  «
                </button>
                <button 
                  className="settle-page-btn" 
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
                        {prev && page - prev > 1 && <span className="settle-page-ellipsis">…</span>}
                        <button
                          className={`settle-page-num-btn ${currentPage === page ? 'is-active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })
                }

                <button 
                  className="settle-page-btn" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                  disabled={currentPage === totalPages}
                  title="Next Page"
                >
                  ›
                </button>
                <button 
                  className="settle-page-btn" 
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

        {/* Official Printable Statement for PDF Export */}
        <SettlementPrintLedger 
          settlements={filteredSettlements}
          stats={stats}
          merchantName={selectedMerchant?.merchantName || 'Primary Merchant'}
        />

      </div>
    </DashboardLayout>
  );
};

export default Settlements;
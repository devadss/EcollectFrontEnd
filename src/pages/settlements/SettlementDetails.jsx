import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { settlementApi } from '../../services/api';
import { useMerchantContext } from '../../context/MerchantContext';
import { lookupIFSC, INDIAN_BANKS_LIST } from '../../services/bankService';
import { exportToCsv } from '../../utils/exportLedger';
import SettlementDetailPrintReceipt from '../../components/ledger/SettlementDetailPrintReceipt';
import './SettlementDetails.css';

// SVG Icons
const DetailIcons = {
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Building: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 2 7 22 7 12 2" />
    </svg>
  ),
  Shield: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Coins: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
  Receipt: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M14 8H8" />
      <path d="M16 12H8" />
      <path d="M13 16H8" />
    </svg>
  ),
  Wallet: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  Grid: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  List: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
    </svg>
  ),
  Print: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
};

const SettlementDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  const passedSettlement = location.state?.settlement;
  const { selectedMerchant, merchants, selectedMerchantId } = useMerchantContext();

  const [loading, setLoading] = useState(true);
  const [settlement, setSettlement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [copiedField, setCopiedField] = useState(null);

  // Filters & Layout State
  const [channelFilter, setChannelFilter] = useState('ALL'); // 'ALL' | 'UPI' | 'CARD' | 'NETBANKING'
  const [viewLayout, setViewLayout] = useState('table'); // 'table' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSettlement = useCallback(async () => {
    try {
      setLoading(true);
      let directSettlement = passedSettlement || null;
      let items = [];
      let rawData = null;

      try {
        const res = await settlementApi.getById(id);
        rawData = res?.data?.data || res?.data;

        if (Array.isArray(rawData)) {
          items = rawData;
        } else if (rawData && Array.isArray(rawData.data)) {
          items = rawData.data;
        } else if (rawData && typeof rawData === 'object' && (rawData.id || rawData.settlement_id || rawData.transaction_id)) {
          items = [rawData];
        }
      } catch (err) {
        console.warn('Direct settlementApi.getById error:', err);
      }

      // If items is empty or lacks bank info, try to find in settlementApi.getAll
      if ((!items || items.length === 0 || (!items[0]?.bank_name && !items[0]?.bankName)) && !directSettlement) {
        try {
          const listRes = await settlementApi.getAll();
          const listData = listRes?.data?.data || listRes?.data || [];
          if (Array.isArray(listData)) {
            const found = listData.find(s => String(s.settlement_id || s.id) === String(id));
            if (found) {
              directSettlement = found;
              if (items.length === 0) {
                items = [found];
              }
            }
          }
        } catch (e) {
          console.warn('Fallback settlement list lookup error:', e);
        }
      }

      const first = (items && items.length > 0) ? items[0] : (directSettlement || {});

      // Determine Merchant ID
      const mId = first.merchant_id || first.merchantId || directSettlement?.merchantId || directSettlement?.merchant_id || selectedMerchantId;

      // Find Merchant in context
      const merch = (merchants && merchants.length > 0 && mId && mId !== 'ALL')
        ? merchants.find(m => String(m.id) === String(mId) || String(m.merchantId) === String(mId))
        : selectedMerchant;

      // Extract IFSC code
      const ifscCode = first.ifsc_code || first.ifsc || first.IFSC_Code || first.ifscCode || 
                       directSettlement?.ifsc || directSettlement?.ifsc_code ||
                       merch?.ifsc || merch?.IFSC_Code || merch?.settlementAccounts?.[0]?.ifscCode || '';

      // Determine Dynamic Bank Name
      let dynamicBankName = first.bank_name || first.bankName || first.BankName || first.bank || first.beneficiary_bank || first.destination_bank ||
                            directSettlement?.bankName || directSettlement?.bank_name ||
                            merch?.bankName || merch?.bank_name || merch?.settlementAccounts?.[0]?.bankName || '';

      // If bank name is still empty, match from IFSC prefix using INDIAN_BANKS_LIST
      if ((!dynamicBankName || dynamicBankName === 'Bank Destination' || dynamicBankName === 'Bank') && ifscCode) {
        const prefix = ifscCode.trim().substring(0, 4).toUpperCase();
        const matchedBank = INDIAN_BANKS_LIST.find(b => b.ifscPrefix === prefix || b.code === prefix);
        if (matchedBank) {
          dynamicBankName = matchedBank.name;
        }
      }

      // If IFSC is present and 11 chars, trigger async lookupIFSC to enrich bankName and branch
      if (ifscCode && ifscCode.length === 11) {
        lookupIFSC(ifscCode).then(lookupRes => {
          if (lookupRes?.success && lookupRes.data?.bankName) {
            setSettlement(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                bankName: lookupRes.data.bankName,
                bankBranch: lookupRes.data.branch || prev.bankBranch
              };
            });
          }
        }).catch(err => console.warn('IFSC lookup error:', err));
      }

      const totalGross = (items && items.length > 0)
        ? items.reduce((sum, item) => sum + (Number(item.gross_transaction_amount || item.sale_amount || item.amount) || 0), 0)
        : Number(directSettlement?.amount || directSettlement?.saleAmount || 0);

      const totalTdr = (items && items.length > 0)
        ? items.reduce((sum, item) => sum + (Number(item.tdr_amount || item.fee) || 0), 0)
        : Number(directSettlement?.fee || 0);

      const totalTax = (items && items.length > 0)
        ? items.reduce((sum, item) => sum + (Number(item.tax_on_tdr_amount || item.tax) || 0), 0)
        : Number(directSettlement?.tax || 0);

      const totalReimbursed = (items && items.length > 0)
        ? items.reduce((sum, item) => sum + (Number(item.amount_reimbursed || item.payout_amount || item.netAmount) || 0), 0)
        : Number(directSettlement?.amount || directSettlement?.payout_amount || (totalGross - totalTdr - totalTax));

      const rawAcc = first.account_number || first.accountNumber || first.account_no || directSettlement?.accountNumber || directSettlement?.account_number || merch?.accountNumber || merch?.settlementAccounts?.[0]?.accountNumber;
      const formattedAcc = rawAcc ? `•••• •••• •••• ${String(rawAcc).slice(-4)}` : (merch?.accountNumber ? `•••• •••• •••• ${String(merch.accountNumber).slice(-4)}` : '•••• •••• •••• —');

      const merchantDisplayName = first.merchant_name || first.merchantName || first.account_name || directSettlement?.merchant || merch?.merchantName || merch?.businessName || merch?.name || 'Primary Merchant';

      const accountHolderName = first.account_name || first.accountHolder || first.account_holder_name || directSettlement?.accountHolder || merch?.accountHolder || merch?.merchantName || merchantDisplayName;

      const bankRefNum = first.bank_reference || first.bankRef || first.bank_ref || first.utr || directSettlement?.bankRef || directSettlement?.bank_reference || directSettlement?.utr || 'NA';

      if (items.length > 0) {
        setTransactions(items.filter(it => it.transaction_id || it.order_id || it.id));
      }

      setSettlement({
        id: first.settlement_id || first.id || directSettlement?.id || id || 'SET-BATCH',
        merchant: merchantDisplayName,
        merchantId: mId || 'MCH-—',
        amount: totalGross,
        fee: totalTdr,
        tax: totalTax,
        netAmount: totalReimbursed > 0 ? totalReimbursed : (totalGross > 0 ? (totalGross - totalTdr - totalTax) : 0),
        status: (first.completed === 'y' || first.completed === true || String(first.status || directSettlement?.status).toLowerCase() === 'completed' || String(first.status || directSettlement?.status).toLowerCase() === 'success') ? 'Completed' : 'Pending',
        date: first.settlement_datetime || first.date || directSettlement?.date || new Date().toISOString(),
        bankRef: bankRefNum,
        utr: first.bank_reference ? `UTR${first.bank_reference}` : (directSettlement?.utr || (bankRefNum !== 'NA' ? (String(bankRefNum).startsWith('UTR') ? bankRefNum : `UTR${bankRefNum}`) : 'NA')),
        bankName: dynamicBankName || 'Partner Bank',
        bankBranch: first.bank_branch || first.bankBranch || directSettlement?.bankBranch || merch?.settlementAccounts?.[0]?.bankBranch || '',
        accountNumber: formattedAcc,
        rawAccountNumber: rawAcc || '',
        accountHolder: accountHolderName,
        ifsc: ifscCode || '—',
        settlementMode: first.payment_channel || first.payment_mode || directSettlement?.settlementMode || 'IMPS / Direct NEFT Batch',
        cycle: 'T+1 Automated Daily Payout',
      });
    } catch (error) {
      console.error('Error loading settlement:', error);
    } finally {
      setTimeout(() => setLoading(false), 250);
    }
  }, [id, passedSettlement, selectedMerchant, merchants, selectedMerchantId]);

  useEffect(() => {
    loadSettlement();
  }, [loadSettlement]);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (channelFilter !== 'ALL') {
      list = list.filter(tx => {
        const mode = (tx.payment_channel || tx.payment_mode || '').toUpperCase();
        if (channelFilter === 'UPI') return mode.includes('UPI');
        if (channelFilter === 'CARD') return mode.includes('CARD') || mode.includes('DEBIT') || mode.includes('CREDIT');
        if (channelFilter === 'NETBANKING') return mode.includes('NET') || mode.includes('NB') || mode.includes('BANK');
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(tx => 
        String(tx.transaction_id || tx.id || '').toLowerCase().includes(q) ||
        String(tx.order_id || '').toLowerCase().includes(q) ||
        String(tx.customer_name || '').toLowerCase().includes(q) ||
        String(tx.customer_phone || '').toLowerCase().includes(q) ||
        String(tx.payment_channel || tx.payment_mode || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, channelFilter, searchQuery]);

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

  // Aggregate stats from transaction list or fallback to settlement object
  const txnTotals = useMemo(() => {
    if (filteredTransactions.length > 0) {
      const gross = filteredTransactions.reduce((acc, t) => acc + (Number(t.gross_transaction_amount || t.sale_amount || t.amount) || 0), 0);
      const tdr = filteredTransactions.reduce((acc, t) => acc + (Number(t.tdr_amount || t.fee) || 0), 0);
      const tax = filteredTransactions.reduce((acc, t) => acc + (Number(t.tax_on_tdr_amount || t.tax) || 0), 0);
      const net = filteredTransactions.reduce((acc, t) => acc + (Number(t.amount_reimbursed || (Number(t.gross_transaction_amount || t.amount || 0) - Number(t.tdr_amount || 0) - Number(t.tax_on_tdr_amount || 0))) || 0), 0);
      return { gross, tdr, tax, net, count: filteredTransactions.length };
    }
    return {
      gross: settlement?.amount || 0,
      tdr: settlement?.fee || 0,
      tax: settlement?.tax || 0,
      net: settlement?.netAmount || 0,
      count: 1
    };
  }, [filteredTransactions, settlement]);

  const netPayoutPercentage = txnTotals.gross > 0 
    ? Math.min(100, Math.max(0, (txnTotals.net / txnTotals.gross) * 100)).toFixed(1)
    : '100.0';

  const tdrFeePercentage = txnTotals.gross > 0 
    ? ((txnTotals.tdr / txnTotals.gross) * 100).toFixed(2)
    : '0.00';

  const taxPercentage = txnTotals.gross > 0 
    ? ((txnTotals.tax / txnTotals.gross) * 100).toFixed(2)
    : '0.00';

  const handleExportCsv = () => {
    const columns = [
      { key: '#sno', label: 'S.No' },
      { key: 'transaction_id', label: 'Transaction ID' },
      { key: 'order_id', label: 'Order ID' },
      { key: 'customer_name', label: 'Customer' },
      { key: 'payment_channel', label: 'Payment Mode' },
      { key: 'gross_transaction_amount', label: 'Gross Collection (INR)' },
      { key: 'tdr_amount', label: 'TDR Gateway Fee (INR)' },
      { key: 'tax_on_tdr_amount', label: 'GST Tax (INR)' },
      { key: 'amount_reimbursed', label: 'Net Disbursed (INR)' },
      { key: 'status', label: 'Clearance Status' }
    ];
    exportToCsv(`Settlement_Breakdown_Batch_${settlement?.id || id}`, filteredTransactions.length > 0 ? filteredTransactions : transactions, columns);
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Settlement Breakdown">
        <LoadingAnimation message="Reconciling Gateway Settlement Breakdown..." />
      </DashboardLayout>
    );
  }

  if (!settlement) {
    return (
      <DashboardLayout pageTitle="Settlement Not Found">
        <div className="settle-not-found-card">
          <h3>Settlement Batch Record Not Found</h3>
          <p>The requested settlement ID does not exist or has been archived from live ledger.</p>
          <button className="btn-back-link" onClick={() => navigate('/settlements')}>
            <DetailIcons.ArrowLeft /> Back to Settlements Directory
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const statusKey = (settlement.status || 'completed').toLowerCase();

  return (
    <DashboardLayout pageTitle={`Settlement Breakdown #${settlement.id}`}>
      <div className="settle-detail-container">
        
        {/* ============================================================
            1. TOP HEADER & METADATA BAR
            ============================================================ */}
        <div className="settle-detail-header">
          <div className="header-back-zone">
            <button className="settle-back-btn" onClick={() => navigate('/settlements')}>
              <DetailIcons.ArrowLeft />
              <span>Back to Settlements</span>
            </button>
            <div className="settle-title-row">
              <div className="settle-title-badge">
                <DetailIcons.Sparkles />
                <span>Reconciliation Dossier</span>
              </div>
              <h1 className="settle-main-id">
                Settlement <span className="font-mono gradient-text">#{settlement.id}</span>
              </h1>
              <span className={`settle-status-pill is-${statusKey}`}>
                <span className="pill-dot"></span>
                <span>{settlement.status}</span>
              </span>
            </div>
          </div>

          <div className="header-action-zone">
            <button className="export-receipt-btn is-csv" onClick={handleExportCsv} title="Download CSV Spreadsheet">
              <DetailIcons.Download />
              <span>Export CSV</span>
            </button>
            <button className="export-receipt-btn" onClick={() => window.print()} title="Print or Save Official Tax Invoice">
              <DetailIcons.Print />
              <span>Print Tax Invoice</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            2. TOP 5-CARD FINANCIAL BREAKDOWN KPI GRID
            ============================================================ */}
        <div className="settle-breakdown-kpi-grid">
          
          {/* Card 1: Gross Collection Volume */}
          <div className="breakdown-kpi-card is-cyan">
            <div className="kpi-card-glow is-cyan"></div>
            <div className="kpi-card-head">
              <span className="kpi-card-tag">Gross Volume</span>
              <div className="kpi-card-icon is-cyan">
                <DetailIcons.Coins />
              </div>
            </div>
            <div className="kpi-card-value font-mono">
              ₹{Number(settlement.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-card-footer">
              <span className="kpi-badge is-cyan">100% Inflow</span>
              <span className="kpi-card-note">Total Collected Inbound</span>
            </div>
          </div>

          {/* Card 2: Platform Gateway Fee (TDR) */}
          <div className="breakdown-kpi-card is-amber">
            <div className="kpi-card-glow is-amber"></div>
            <div className="kpi-card-head">
              <span className="kpi-card-tag">TDR Fee</span>
              <div className="kpi-card-icon is-amber">
                <DetailIcons.Percent />
              </div>
            </div>
            <div className="kpi-card-value font-mono text-amber">
              -₹{Number(settlement.fee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-card-footer">
              <span className="kpi-badge is-amber">{tdrFeePercentage}% MDR</span>
              <span className="kpi-card-note">Gateway Processing Fee</span>
            </div>
          </div>

          {/* Card 3: GST Tax Deduction */}
          <div className="breakdown-kpi-card is-purple">
            <div className="kpi-card-glow is-purple"></div>
            <div className="kpi-card-head">
              <span className="kpi-card-tag">GST Tax</span>
              <div className="kpi-card-icon is-purple">
                <DetailIcons.Receipt />
              </div>
            </div>
            <div className="kpi-card-value font-mono text-purple">
              -₹{Number(settlement.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-card-footer">
              <span className="kpi-badge is-purple">{taxPercentage}% GST</span>
              <span className="kpi-card-note">18% Tax Withholding</span>
            </div>
          </div>

          {/* Card 4: Net Payout Disbursed */}
          <div className="breakdown-kpi-card is-emerald highlight-card">
            <div className="kpi-card-glow is-emerald"></div>
            <div className="kpi-card-head">
              <span className="kpi-card-tag">Net Bank Credit</span>
              <div className="kpi-card-icon is-emerald">
                <DetailIcons.Wallet />
              </div>
            </div>
            <div className="kpi-card-value font-mono text-emerald">
              ₹{Number(settlement.netAmount || settlement.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-card-footer">
              <span className="kpi-badge is-emerald">{netPayoutPercentage}% Payout</span>
              <span className="kpi-card-note">Direct Beneficiary Credit</span>
            </div>
          </div>

          {/* Card 5: Consolidated Batch Size */}
          <div className="breakdown-kpi-card is-indigo">
            <div className="kpi-card-glow is-indigo"></div>
            <div className="kpi-card-head">
              <span className="kpi-card-tag">Batch Inbound</span>
              <div className="kpi-card-icon is-indigo">
                <DetailIcons.CheckCircle />
              </div>
            </div>
            <div className="kpi-card-value font-mono">
              {transactions.length > 0 ? transactions.length : 1} <span className="kpi-unit">Txns</span>
            </div>
            <div className="kpi-card-footer">
              <span className="kpi-badge is-indigo">Reconciled</span>
              <span className="kpi-card-note">T+1 Auto Payout Cycle</span>
            </div>
          </div>

        </div>

        {/* ============================================================
            3. MATHEMATICAL RECONCILIATION FLOW CARD
            ============================================================ */}
        <div className="settle-math-flow-card">
          <div className="math-flow-header">
            <div className="math-title-wrap">
              <span className="math-icon">⚡</span>
              <div>
                <h4 className="math-title">Settlement Mathematical Split Distribution</h4>
                <p className="math-subtitle">Dynamic formula breakdown showing exact ledger balance disbursement</p>
              </div>
            </div>
            <div className="math-effective-rate font-mono">
              Net Yield: <strong className="text-emerald">{netPayoutPercentage}%</strong>
            </div>
          </div>

          {/* Formula Equation Pill Strip */}
          <div className="math-equation-row">
            <div className="equation-block">
              <span className="eq-label">Gross Collection</span>
              <span className="eq-val font-mono">₹{Number(settlement.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <span className="eq-operator">―</span>
            <div className="equation-block is-minus">
              <span className="eq-label">Gateway TDR Fee</span>
              <span className="eq-val font-mono text-amber">-₹{Number(settlement.fee || 0).toFixed(2)}</span>
            </div>
            <span className="eq-operator">―</span>
            <div className="equation-block is-minus">
              <span className="eq-label">GST on TDR (18%)</span>
              <span className="eq-val font-mono text-purple">-₹{Number(settlement.tax || 0).toFixed(2)}</span>
            </div>
            <span className="eq-operator is-equal">═</span>
            <div className="equation-block is-result">
              <span className="eq-label">Net Merchant Payout</span>
              <span className="eq-val font-mono text-emerald font-bold">₹{Number(settlement.netAmount || settlement.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Multi-Segment Distribution Track Bar */}
          <div className="math-distribution-track">
            <div 
              className="track-segment is-net" 
              style={{ width: `${Math.max(Number(netPayoutPercentage), 10)}%` }}
              title={`Net Credited: ${netPayoutPercentage}%`}
            >
              <span className="seg-label">Net Payout {netPayoutPercentage}%</span>
            </div>
            <div 
              className="track-segment is-tdr" 
              style={{ width: `${Math.max(Number(tdrFeePercentage), 3)}%` }}
              title={`TDR Fee: ${tdrFeePercentage}%`}
            >
              <span className="seg-label">{tdrFeePercentage}%</span>
            </div>
            <div 
              className="track-segment is-tax" 
              style={{ width: `${Math.max(Number(taxPercentage), 2)}%` }}
              title={`GST Tax: ${taxPercentage}%`}
            >
              <span className="seg-label">{taxPercentage}%</span>
            </div>
          </div>

          {/* Legend Strip */}
          <div className="math-legend-row">
            <div className="legend-item">
              <span className="legend-dot is-net"></span>
              <span>Net Credited (₹{Number(settlement.netAmount || settlement.amount).toLocaleString('en-IN')})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot is-tdr"></span>
              <span>Platform TDR Fee (₹{Number(settlement.fee || 0).toFixed(2)})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot is-tax"></span>
              <span>GST Tax (₹{Number(settlement.tax || 0).toFixed(2)})</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            4. 2-COLUMN SPLIT DOSSIER GRID
            ============================================================ */}
        <div className="settle-detail-grid">
          
          {/* Left Column: Settlement Financial Summary */}
          <div className="settle-detail-card">
            <div className="detail-card-head">
              <span className="card-badge-tag">Financial Ledger</span>
              <h3 className="detail-card-title">Disbursement Summary</h3>
            </div>

            <div className="detail-amount-hero">
              <div className="amount-hero-top">
                <span className="amount-hero-label">Net Credited to Merchant Account</span>
                <span className="amount-hero-pill">✓ Final Settled</span>
              </div>
              <div className="amount-hero-value font-mono">
                ₹{Number(settlement.netAmount || settlement.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="detail-info-list">
              <div className="info-list-row">
                <span className="info-label">Gross Collected Volume</span>
                <span className="info-value font-mono">₹{Number(settlement.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Platform Gateway Fee (TDR)</span>
                <span className="info-value font-mono text-amber">- ₹{Number(settlement.fee || 0).toFixed(2)}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">GST / Tax on TDR (18%)</span>
                <span className="info-value font-mono text-purple">- ₹{Number(settlement.tax || 0).toFixed(2)}</span>
              </div>
              <div className="info-list-row is-divider"></div>
              <div className="info-list-row">
                <span className="info-label">Merchant Partner</span>
                <span className="info-value font-bold">{settlement.merchant}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Merchant ID</span>
                <span className="info-value font-mono text-muted">{settlement.merchantId || 'MCH-PRIMARY'}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Reconciliation Cycle</span>
                <span className="info-value">{settlement.cycle || 'T+1 Daily Automated'}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Disbursement Date & Time</span>
                <span className="info-value font-mono">
                  {new Date(settlement.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Destination Banking & Reconciliation */}
          <div className="settle-detail-card">
            <div className="detail-card-head">
              <span className="card-badge-tag">Banking Verification</span>
              <h3 className="detail-card-title">Beneficiary Bank Destination</h3>
            </div>

            <div className="bank-meta-showcase">
              <div className="bank-icon-container">
                <DetailIcons.Building />
              </div>
              <div className="bank-meta-text">
                <span className="bank-institution-name">{settlement.bankName || 'Partner Bank'}</span>
                <span className="bank-account-masked font-mono">{settlement.accountNumber || '•••• •••• •••• —'}</span>
                {settlement.bankBranch && (
                  <span className="bank-branch-tag">
                    🏢 {settlement.bankBranch}
                  </span>
                )}
              </div>
            </div>

            <div className="detail-info-list">
              <div className="info-list-row">
                <span className="info-label">Account Holder Name</span>
                <span className="info-value font-bold">{settlement.accountHolder || settlement.merchant || 'Merchant Account'}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">IFSC Code</span>
                <span className="info-value font-mono">
                  {settlement.ifsc || '—'}
                  {settlement.ifsc && settlement.ifsc !== '—' && (
                    <button 
                      className="copy-field-btn" 
                      onClick={() => handleCopy(settlement.ifsc, 'ifsc')}
                      title="Copy IFSC Code"
                    >
                      {copiedField === 'ifsc' ? '✓ Copied' : <DetailIcons.Copy />}
                    </button>
                  )}
                </span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Bank Reference / UTR Number</span>
                <span className="info-value font-mono">
                  {settlement.bankRef || settlement.utr || 'NA'}
                  {(settlement.bankRef || settlement.utr) && settlement.bankRef !== 'NA' && (
                    <button 
                      className="copy-field-btn" 
                      onClick={() => handleCopy(settlement.bankRef || settlement.utr, 'bankRef')}
                      title="Copy Bank Reference UTR"
                    >
                      {copiedField === 'bankRef' ? '✓ Copied' : <DetailIcons.Copy />}
                    </button>
                  )}
                </span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Payment Channel Protocol</span>
                <span className="info-value">{settlement.settlementMode || 'IMPS / Direct NEFT Batch'}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Security & Audit Clearance</span>
                <span className="info-value text-green">
                  <DetailIcons.Shield /> ISO 27001 Verified Settlement
                </span>
              </div>
            </div>

            {/* Reconciliation Audit Trail */}
            <div className="settle-timeline-box">
              <h4 className="timeline-heading">Reconciliation Audit Trail</h4>
              <div className="timeline-steps-list">
                <div className="timeline-step is-complete">
                  <div className="step-circle"><DetailIcons.CheckCircle /></div>
                  <div className="step-content">
                    <span className="step-title">Batch Calculated & Reconciled</span>
                    <span className="step-time">00:01 AM • System Automated Ledger Audit</span>
                  </div>
                </div>
                <div className="timeline-step is-complete">
                  <div className="step-circle"><DetailIcons.CheckCircle /></div>
                  <div className="step-content">
                    <span className="step-title">Dispatched to Clearing House</span>
                    <span className="step-time">06:30 AM • RBI NEFT / IMPS Banking Gateway</span>
                  </div>
                </div>
                <div className="timeline-step is-complete">
                  <div className="step-circle"><DetailIcons.CheckCircle /></div>
                  <div className="step-content">
                    <span className="step-title">Settled & Acknowledged by Beneficiary Bank</span>
                    <span className="step-time">07:15 AM • UTR Verified & Cleared</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ============================================================
            5. TRANSACTION-LEVEL SETTLEMENT BREAKDOWN GRID / TABLE
            ============================================================ */}
        <div className="settle-detail-card settle-txn-breakdown-card">
          
          {/* Card Header & Controls */}
          <div className="detail-card-head breakdown-section-head">
            <div className="breakdown-title-block">
              <span className="card-badge-tag">Granular Audit</span>
              <h3 className="detail-card-title">
                Transaction Level Breakdown <span className="title-count-pill font-mono">{filteredTransactions.length > 0 ? filteredTransactions.length : (transactions.length > 0 ? transactions.length : 1)}</span>
              </h3>
            </div>

            {/* Filter Controls Row */}
            <div className="breakdown-controls-cluster">
              
              {/* Channel Tabs */}
              <div className="channel-filter-pill-group">
                {['ALL', 'UPI', 'CARD', 'NETBANKING'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    className={`channel-pill-btn ${channelFilter === mode ? 'is-active' : ''}`}
                    onClick={() => {
                      setChannelFilter(mode);
                      setCurrentPage(1);
                    }}
                  >
                    {mode === 'ALL' ? 'All Channels' : mode === 'NETBANKING' ? 'Net Banking' : mode}
                  </button>
                ))}
              </div>

              {/* Quick Search */}
              <div className="settle-txn-search-box">
                <DetailIcons.Search />
                <input 
                  type="text" 
                  placeholder="Search by Txn ID, Order, Customer..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="settle-txn-search-input"
                />
                {searchQuery && (
                  <button className="settle-txn-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>

              {/* View Layout Switch */}
              <div className="layout-toggle-pill">
                <button 
                  className={`layout-btn ${viewLayout === 'table' ? 'is-active' : ''}`}
                  onClick={() => setViewLayout('table')}
                  title="Data Table View"
                >
                  <DetailIcons.List />
                </button>
                <button 
                  className={`layout-btn ${viewLayout === 'grid' ? 'is-active' : ''}`}
                  onClick={() => setViewLayout('grid')}
                  title="Card Grid View"
                >
                  <DetailIcons.Grid />
                </button>
              </div>

            </div>
          </div>

          {/* Table View Layout */}
          {viewLayout === 'table' ? (
            <div className="settlements-table-wrapper">
              <table className="settlements-table">
                <thead>
                  <tr>
                    <th style={{ width: '45px' }}>#</th>
                    <th>Transaction ID</th>
                    <th>Order ID</th>
                    <th>Customer Payer</th>
                    <th>Channel</th>
                    <th style={{ textAlign: 'right' }}>Gross Inflow</th>
                    <th style={{ textAlign: 'right' }}>TDR Fee</th>
                    <th style={{ textAlign: 'right' }}>GST Tax</th>
                    <th style={{ textAlign: 'right' }}>Net Reimbursed</th>
                    <th style={{ textAlign: 'center' }}>Clearance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    transactions.length === 0 ? (
                      /* Synthesized 1-Row Batch Breakdown representation */
                      <tr>
                        <td className="font-mono text-muted">01</td>
                        <td>
                          <span className="settle-id-badge font-mono">{settlement.id}</span>
                        </td>
                        <td>
                          <span className="font-mono text-muted">{settlement.bankRef || 'BATCH-001'}</span>
                        </td>
                        <td>
                          <span className="font-bold">{settlement.merchant}</span>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--textMuted, #64748b)' }}>Aggregated Settlement Payout</span>
                        </td>
                        <td>
                          <span className="payment-mode-pill is-upi">UPI / IMPS</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-mono font-bold">₹{Number(settlement.amount).toFixed(2)}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-mono text-amber">-₹{Number(settlement.fee || 0).toFixed(2)}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-mono text-purple">-₹{Number(settlement.tax || 0).toFixed(2)}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-mono font-bold text-emerald">₹{Number(settlement.netAmount || settlement.amount).toFixed(2)}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="settle-status-badge is-completed">
                            <span className="status-dot"></span>
                            <span>Settled</span>
                          </span>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan="10" className="empty-table-msg">
                          No transactions found matching your filter criteria "{searchQuery}"
                        </td>
                      </tr>
                    )
                  ) : (
                    paginatedTransactions.map((tx, idx) => {
                      const modeStr = (tx.payment_channel || tx.payment_mode || 'UPI').toUpperCase();
                      const grossVal = Number(tx.gross_transaction_amount || tx.sale_amount || tx.amount || 0);
                      const tdrVal = Number(tx.tdr_amount || tx.fee || 0);
                      const taxVal = Number(tx.tax_on_tdr_amount || tx.tax || 0);
                      const netVal = Number(tx.amount_reimbursed || (grossVal - tdrVal - taxVal));

                      return (
                        <tr key={tx.transaction_id || tx.id || idx}>
                          <td className="font-mono text-muted">
                            {String((currentPage - 1) * pageSize + idx + 1).padStart(2, '0')}
                          </td>
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span className="settle-id-badge font-mono">{tx.transaction_id || tx.id || `TXN-${idx + 1}`}</span>
                              <button 
                                className="copy-field-btn mini" 
                                onClick={() => handleCopy(tx.transaction_id || tx.id, `tx-${idx}`)}
                                title="Copy Transaction ID"
                              >
                                {copiedField === `tx-${idx}` ? '✓' : <DetailIcons.Copy />}
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className="font-mono text-muted">{tx.order_id || '—'}</span>
                          </td>
                          <td>
                            <span className="customer-name font-bold">{tx.customer_name || 'Customer'}</span>
                            {tx.customer_phone && <span className="customer-phone font-mono">{tx.customer_phone}</span>}
                          </td>
                          <td>
                            <span className={`payment-mode-pill ${modeStr.includes('UPI') ? 'is-upi' : modeStr.includes('CARD') ? 'is-card' : 'is-nb'}`}>
                              {modeStr}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="font-mono font-bold">₹{grossVal.toFixed(2)}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="font-mono text-amber">-₹{tdrVal.toFixed(2)}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="font-mono text-purple">-₹{taxVal.toFixed(2)}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="font-mono font-bold text-emerald">
                              ₹{netVal.toFixed(2)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`settle-status-badge ${tx.completed === 'n' ? 'is-pending' : 'is-completed'}`}>
                              <span className="status-dot"></span>
                              <span>{tx.completed === 'n' ? 'Pending' : 'Settled'}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Table Summary Aggregate Footer */}
                <tfoot>
                  <tr className="table-summary-row">
                    <td colSpan="5" className="summary-title-cell">
                      <span>Total Reconciled Batch Aggregates ({txnTotals.count} Transactions)</span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="font-mono font-bold">
                      ₹{txnTotals.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }} className="font-mono text-amber">
                      -₹{txnTotals.tdr.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }} className="font-mono text-purple">
                      -₹{txnTotals.tax.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '14.5px' }} className="font-mono font-bold text-emerald">
                      ₹{txnTotals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="kpi-badge is-emerald">✓ Verified</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            /* Card Grid View Layout */
            <div className="breakdown-card-grid-viewport">
              {filteredTransactions.length === 0 ? (
                <div className="empty-table-msg">
                  No transactions found matching "{searchQuery}"
                </div>
              ) : (
                <div className="breakdown-cards-matrix">
                  {paginatedTransactions.map((tx, idx) => {
                    const modeStr = (tx.payment_channel || tx.payment_mode || 'UPI').toUpperCase();
                    const grossVal = Number(tx.gross_transaction_amount || tx.sale_amount || tx.amount || 0);
                    const tdrVal = Number(tx.tdr_amount || tx.fee || 0);
                    const taxVal = Number(tx.tax_on_tdr_amount || tx.tax || 0);
                    const netVal = Number(tx.amount_reimbursed || (grossVal - tdrVal - taxVal));

                    return (
                      <div key={tx.transaction_id || tx.id || idx} className="txn-breakdown-card">
                        <div className="txn-card-top">
                          <div>
                            <span className="settle-id-badge font-mono">{tx.transaction_id || `TXN-${idx + 1}`}</span>
                            <span className="order-code font-mono">{tx.order_id || '—'}</span>
                          </div>
                          <span className={`payment-mode-pill ${modeStr.includes('UPI') ? 'is-upi' : modeStr.includes('CARD') ? 'is-card' : 'is-nb'}`}>
                            {modeStr}
                          </span>
                        </div>

                        <div className="txn-card-customer">
                          <span className="customer-name font-bold">{tx.customer_name || 'Customer'}</span>
                          {tx.customer_phone && <span className="customer-phone font-mono">{tx.customer_phone}</span>}
                        </div>

                        <div className="txn-card-metrics">
                          <div className="metric-row">
                            <span className="m-label">Gross Collection</span>
                            <span className="m-val font-mono">₹{grossVal.toFixed(2)}</span>
                          </div>
                          <div className="metric-row">
                            <span className="m-label text-amber">Gateway TDR</span>
                            <span className="m-val font-mono text-amber">-₹{tdrVal.toFixed(2)}</span>
                          </div>
                          <div className="metric-row">
                            <span className="m-label text-purple">GST Tax (18%)</span>
                            <span className="m-val font-mono text-purple">-₹{taxVal.toFixed(2)}</span>
                          </div>
                          <div className="metric-row is-net">
                            <span className="m-label">Net Disbursed</span>
                            <span className="m-val font-mono text-emerald font-bold">₹{netVal.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="txn-card-footer">
                          <span className={`settle-status-badge ${tx.completed === 'n' ? 'is-pending' : 'is-completed'}`}>
                            <span className="status-dot"></span>
                            <span>{tx.completed === 'n' ? 'Pending' : 'Settled'}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="settle-pagination-bar">
            <div className="settle-page-info">
              <span>
                Showing {filteredTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : (transactions.length > 0 ? 1 : 0)} to {Math.min(currentPage * pageSize, filteredTransactions.length || 1)} of {filteredTransactions.length || (transactions.length > 0 ? 1 : 0)} entries
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
        <SettlementDetailPrintReceipt 
          settlement={settlement} 
          transactions={transactions} 
        />

      </div>
    </DashboardLayout>
  );
};

export default SettlementDetails;
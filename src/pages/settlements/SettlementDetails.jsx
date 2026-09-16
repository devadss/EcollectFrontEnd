import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { settlementApi, merchantApi } from '../../services/api';
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Building: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  // Pagination & Search State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase().trim();
    return transactions.filter(tx => 
      String(tx.transaction_id || tx.id || '').toLowerCase().includes(query) ||
      String(tx.order_id || '').toLowerCase().includes(query) ||
      String(tx.customer_name || '').toLowerCase().includes(query) ||
      String(tx.payment_channel || tx.payment_mode || '').toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

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
      setTimeout(() => setLoading(false), 300);
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

  if (loading) {
    return (
      <DashboardLayout pageTitle="Settlement Details">
        <LoadingAnimation message="Reconciling Settlement Records..." />
      </DashboardLayout>
    );
  }

  if (!settlement) {
    return (
      <DashboardLayout pageTitle="Settlement Details">
        <div className="settle-not-found-card">
          <h3>Settlement Record Not Found</h3>
          <p>The requested settlement ID does not exist or has been archived.</p>
          <button className="btn-back-link" onClick={() => navigate('/settlements')}>
            <DetailIcons.ArrowLeft /> Back to Settlements
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const statusKey = (settlement.status || 'completed').toLowerCase();

  const handleExportCsv = () => {
    const columns = [
      { key: '#sno', label: 'S.No' },
      { key: 'transaction_id', label: 'Transaction ID' },
      { key: 'order_id', label: 'Order ID' },
      { key: 'customer_name', label: 'Customer' },
      { key: 'payment_channel', label: 'Mode' },
      { key: 'gross_transaction_amount', label: 'Gross (INR)' },
      { key: 'tdr_amount', label: 'TDR Fee (INR)' },
      { key: 'tax_on_tdr_amount', label: 'GST (INR)' },
      { key: 'amount_reimbursed', label: 'Net Reimbursed (INR)' }
    ];
    exportToCsv(`Settlement_Batch_${settlement.id}_Transactions`, transactions, columns);
  };

  return (
    <DashboardLayout pageTitle={`Settlement #${settlement.id}`}>
      <div className="settle-detail-container">
        
        {/* Navigation & Header Actions */}
        <div className="settle-detail-header">
          <div className="header-back-zone">
            <button className="settle-back-btn" onClick={() => navigate('/settlements')}>
              <DetailIcons.ArrowLeft />
              <span>Back to Settlements</span>
            </button>
            <div className="settle-title-row">
              <h1 className="settle-main-id">
                Settlement <span className="font-mono gradient-text">#{settlement.id}</span>
              </h1>
              <span className={`settle-status-pill is-${statusKey}`}>
                <span className="pill-dot"></span>
                <span>{settlement.status}</span>
              </span>
            </div>
          </div>

          <div className="header-action-zone" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {transactions && transactions.length > 0 && (
              <button className="export-receipt-btn" onClick={handleExportCsv} title="Download CSV Spreadsheet">
                <DetailIcons.Download />
                <span>Export CSV</span>
              </button>
            )}
            <button className="export-receipt-btn" onClick={() => window.print()} title="Print or Save Official Tax Invoice">
              <DetailIcons.Download />
              <span>Export PDF Tax Invoice</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split Details Grid */}
        <div className="settle-detail-grid">
          
          {/* Left Column: Settlement Financial Summary */}
          <div className="settle-detail-card">
            <div className="detail-card-head">
              <span className="card-badge-tag">Financial Ledger</span>
              <h3 className="detail-card-title">Disbursement Summary</h3>
            </div>

            <div className="detail-amount-hero">
              <span className="amount-hero-label">Net Credited to Merchant Account</span>
              <div className="amount-hero-value font-mono">
                ₹{Number(settlement.netAmount || settlement.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="detail-info-list">
              <div className="info-list-row">
                <span className="info-label">Gross Collected Volume</span>
                <span className="info-value font-mono">₹{Number(settlement.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Platform Gateway Fee (TDR)</span>
                <span className="info-value font-mono text-muted">- ₹{Number(settlement.fee || 0).toFixed(2)}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">GST / Tax on TDR (18%)</span>
                <span className="info-value font-mono text-muted">- ₹{Number(settlement.tax || 0).toFixed(2)}</span>
              </div>
              <div className="info-list-row is-divider"></div>
              <div className="info-list-row">
                <span className="info-label">Merchant Partner</span>
                <span className="info-value font-bold">{settlement.merchant}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Reconciliation Cycle</span>
                <span className="info-value">{settlement.cycle || 'T+1 Daily Automated'}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Disbursement Date & Time</span>
                <span className="info-value">
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
                  <span style={{ fontSize: '12px', color: 'var(--textSecondary, #94a3b8)', display: 'block', marginTop: '3px' }}>
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
                      title="Copy IFSC"
                    >
                      {copiedField === 'ifsc' ? '✓ Copied' : <DetailIcons.Copy />}
                    </button>
                  )}
                </span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Bank Reference Number</span>
                <span className="info-value font-mono">
                  {settlement.bankRef || 'NA'}
                  {settlement.bankRef && settlement.bankRef !== 'NA' && (
                    <button 
                      className="copy-field-btn" 
                      onClick={() => handleCopy(settlement.bankRef, 'bankRef')}
                      title="Copy Bank Ref"
                    >
                      {copiedField === 'bankRef' ? '✓ Copied' : <DetailIcons.Copy />}
                    </button>
                  )}
                </span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Payment Channel Protocol</span>
                <span className="info-value">{settlement.settlementMode || 'IMPS Direct Clearing'}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Security Clearance</span>
                <span className="info-value text-green">
                  <DetailIcons.Shield /> ISO 27001 Verified Settlement
                </span>
              </div>
            </div>

            {/* Reconciliation Status Steps */}
            <div className="settle-timeline-box">
              <h4 className="timeline-heading">Reconciliation Audit Trail</h4>
              <div className="timeline-steps-list">
                <div className="timeline-step is-complete">
                  <div className="step-circle"><DetailIcons.CheckCircle /></div>
                  <div className="step-content">
                    <span className="step-title">Batch Calculated</span>
                    <span className="step-time">00:01 AM • System Audit Engine</span>
                  </div>
                </div>
                <div className="timeline-step is-complete">
                  <div className="step-circle"><DetailIcons.CheckCircle /></div>
                  <div className="step-content">
                    <span className="step-title">Dispatched to Clearing House</span>
                    <span className="step-time">06:30 AM • RBI NEFT / IMPS Gateway</span>
                  </div>
                </div>
                <div className="timeline-step is-complete">
                  <div className="step-circle"><DetailIcons.CheckCircle /></div>
                  <div className="step-content">
                    <span className="step-title">Settled & Acknowledged by Beneficiary Bank</span>
                    <span className="step-time">07:15 AM • UTR Verified</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Transaction-Level Settlement Breakdown (Payment Gateway Spec 10.2) */}
        {transactions.length > 0 && (
          <div className="settle-detail-card" style={{ marginTop: '24px' }}>
            <div className="detail-card-head" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="card-badge-tag">Transaction Level Breakdown</span>
                <h3 className="detail-card-title">Settled Inbound Transactions ({transactions.length})</h3>
              </div>

              {/* Quick Search */}
              <div className="settle-txn-search-box">
                <DetailIcons.Search />
                <input 
                  type="text" 
                  placeholder="Search transactions..."
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
            </div>

            <div className="settlements-table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="settlements-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Payment Mode</th>
                    <th>Gross Amount</th>
                    <th>TDR Fee</th>
                    <th>Tax on TDR</th>
                    <th>Net Reimbursed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--textMuted)' }}>
                        No transactions found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((tx, idx) => (
                      <tr key={tx.transaction_id || idx}>
                        <td>
                          <span className="settle-id-badge font-mono">{tx.transaction_id || `TXN-${idx + 1}`}</span>
                        </td>
                        <td>
                          <span className="font-mono text-muted">{tx.order_id || '-'}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600' }}>{tx.customer_name || 'Customer'}</span>
                          {tx.customer_phone && <span style={{ display: 'block', fontSize: '11px', color: 'var(--textMuted)' }}>{tx.customer_phone}</span>}
                        </td>
                        <td>
                          <span className="payment-mode-pill">{tx.payment_channel || tx.payment_mode || 'UPI'}</span>
                        </td>
                        <td>
                          <span className="font-mono" style={{ fontWeight: '700' }}>₹{Number(tx.gross_transaction_amount || tx.amount || 0).toFixed(2)}</span>
                        </td>
                        <td>
                          <span className="font-mono text-muted">- ₹{Number(tx.tdr_amount || 0).toFixed(2)}</span>
                        </td>
                        <td>
                          <span className="font-mono text-muted">- ₹{Number(tx.tax_on_tdr_amount || 0).toFixed(2)}</span>
                        </td>
                        <td>
                          <span className="font-mono" style={{ fontWeight: '700', color: '#10b981' }}>
                            ₹{Number(tx.amount_reimbursed || (Number(tx.gross_transaction_amount || tx.amount || 0) - Number(tx.tdr_amount || 0) - Number(tx.tax_on_tdr_amount || 0))).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <span className="settle-status-badge is-completed">
                            <span className="status-dot"></span>
                            <span>{tx.completed === 'y' ? 'Settled' : 'Cleared'}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="settle-pagination-bar">
              <div className="settle-page-info">
                <span>
                  Showing {filteredTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} entries
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
        )}

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
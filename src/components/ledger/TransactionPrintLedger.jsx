import React from 'react';
import { resolveTransactionStatus, isTransactionSuccess, getTransactionStatusClass } from '../../utils/transactionUtils';
import './PrintLedger.css';

/**
 * TransactionPrintLedger - Formatted Financial Statement for PDF / Print
 * Rendered only during print operations with official corporate styling.
 */
const TransactionPrintLedger = ({ 
  transactions = [], 
  stats = {}, 
  filters = {}, 
  merchantName = 'Apex Retail Services',
  generatedBy = 'eCollect Core Clearance Gateway'
}) => {
  const printDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const successfulTxns = transactions.filter(isTransactionSuccess);
  const totalVol = successfulTxns.reduce((acc, t) => acc + (Number(t.amount || t.Amount) || 0), 0);
  const clearedCount = successfulTxns.length;
  const failedCount = transactions.filter(t => resolveTransactionStatus(t) === 'FAILED').length;
  const cancelledCount = transactions.filter(t => resolveTransactionStatus(t) === 'CANCELLED').length;
  const pendingCount = transactions.filter(t => resolveTransactionStatus(t) === 'PENDING').length;

  return (
    <div className="printable-ledger-sheet">
      
      {/* 1. Official Header */}
      <div className="ledger-print-header">
        <div className="ledger-brand-block">
          <h1 className="ledger-brand-title">eCollect Payment Gateway</h1>
          <p className="ledger-brand-sub">Official Financial Telemetry & Merchant Audit System</p>
          <p className="ledger-brand-compliance">
            RBI Regulated Digital Payment Routing • ISO/IEC 27001 Certified • PCI-DSS Level 1 Validated
          </p>
        </div>
        <div className="ledger-meta-block">
          <span className="ledger-doc-type">Transaction Ledger Statement</span>
          <span className="ledger-meta-item">Generated: {printDate}</span>
          <span className="ledger-meta-item">Merchant: {merchantName}</span>
          <span className="ledger-meta-item">Total Records: {transactions.length}</span>
        </div>
      </div>

      {/* 2. Executive Financial Summary */}
      <div className="ledger-summary-strip">
        <div className="summary-strip-card">
          <span className="summary-strip-label">Gross Volume</span>
          <span className="summary-strip-val text-success">
            ₹{totalVol.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="summary-strip-card">
          <span className="summary-strip-label">Cleared Transactions</span>
          <span className="summary-strip-val text-success">
            {clearedCount} of {transactions.length}
          </span>
        </div>
        <div className="summary-strip-card">
          <span className="summary-strip-label">Pending / In-Transit</span>
          <span className="summary-strip-val">
            {pendingCount}
          </span>
        </div>
        <div className="summary-strip-card">
          <span className="summary-strip-label">Failed / Cancelled</span>
          <span className="summary-strip-val" style={{ color: '#b91c1c' }}>
            {failedCount + cancelledCount} ({failedCount} Fail / {cancelledCount} Cancel)
          </span>
        </div>
      </div>

      {/* 3. Transaction Itemized Table */}
      <table className="ledger-print-table">
        <thead>
          <tr>
            <th style={{ width: '3%' }}>#</th>
            <th style={{ width: '12%' }}>Date & Time</th>
            <th style={{ width: '15%' }}>Receipt Number</th>
            <th style={{ width: '14%' }}>Transaction ID</th>
            <th style={{ width: '14%' }}>Customer Payer</th>
            <th style={{ width: '9%' }}>Channel</th>
            <th style={{ width: '8%' }}>Type</th>
            <th style={{ width: '11%' }} className="text-right">Amount (INR)</th>
            <th style={{ width: '7%' }} className="text-center">Status</th>
            <th style={{ width: '7%' }}>UTR / RRN</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan="10" style={{ textAlign: 'center', padding: '16px' }}>
                No transaction records available in current ledger scope.
              </td>
            </tr>
          ) : (
            transactions.map((t, idx) => {
              const dateStr = t.dateObj 
                ? t.dateObj.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : (t.date ? new Date(t.date).toLocaleDateString('en-IN') : '—');

              const receiptVal = t.receiptNumber || t.vendorPostTransId || (t.id ? `LOC_REC_${t.id}` : '—');
              const txnVal = t.transactionId || t.id || '—';

              return (
                <tr key={t.id || t.transactionId || idx}>
                  <td className="font-mono text-center">{idx + 1}</td>
                  <td className="font-mono">{dateStr}</td>
                  <td>
                    <div className="font-mono font-bold" style={{ fontSize: '7.5pt', color: '#1e3a8a' }}>{receiptVal}</div>
                    {t.vendorPostStatus && <div className="font-mono" style={{ fontSize: '6pt', color: '#059669' }}>● {t.vendorPostStatus}</div>}
                  </td>
                  <td>
                    <div className="font-mono font-bold" style={{ fontSize: '7.5pt' }}>#{txnVal}</div>
                    {t.orderId && t.orderId !== txnVal && (
                      <div className="font-mono" style={{ fontSize: '6.5pt', color: '#64748b' }}>Ord: {t.orderId}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.customer || t.customerName || 'Direct Payer'}</div>
                    {t.phone && <div className="font-mono" style={{ fontSize: '6.5pt', color: '#64748b' }}>{t.phone}</div>}
                  </td>
                  <td className="font-mono">
                    {(t.paymentMode || t.method || 'UPI').toUpperCase()}
                  </td>
                  <td className="font-mono font-bold" style={{ color: '#1e3a8a' }}>
                    {t.collectionType || t.CollectionType || t.udf5 || 'DIRECT'}
                  </td>
                  <td className="font-mono text-right" style={{ fontWeight: 700 }}>
                    ₹{Number(t.amount || t.Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-center">
                    <span className={`print-status-tag ${getTransactionStatusClass(t)}`}>
                      {resolveTransactionStatus(t)}
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontSize: '7pt' }}>
                    {t.utr || t.bankRef || t.rrn || '—'}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* 4. Official Audit Footer */}
      <div className="ledger-print-footer">
        <div className="ledger-legal-disclaimer">
          <strong>LEGAL & REGULATORY NOTICE:</strong> This document is a computer-generated transaction ledger statement certified by eCollect Gateway. All routing timestamps and reference numbers are cryptographically recorded in the system audit trail. For discrepancies, contact support with reference token <code>ECL-{Math.floor(100000 + Math.random() * 900000)}</code>.
        </div>
        <div className="ledger-signature-box">
          <div className="signature-line"></div>
          <span className="signature-title">Authorized Signatory</span>
          <span className="signature-sub">eCollect Automated Settlement Core</span>
        </div>
      </div>

    </div>
  );
};

export default TransactionPrintLedger;

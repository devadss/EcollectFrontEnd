import React from 'react';
import './PrintLedger.css';

/**
 * SettlementDetailPrintReceipt - Formatted Single Settlement Batch & Tax Invoice for Print
 */
const SettlementDetailPrintReceipt = ({ settlement = {}, transactions = [] }) => {
  const printDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div className="printable-ledger-sheet">
      
      {/* Header */}
      <div className="ledger-print-header">
        <div className="ledger-brand-block">
          <h1 className="ledger-brand-title">eCollect Banking Switch</h1>
          <p className="ledger-brand-sub">Official Settlement Tax Invoice & Batch Clearance Certificate</p>
          <p className="ledger-brand-compliance">
            RBI Automated Payout Settlement System • Tax Compliance Statement (GSTIN: 32AABCF1234F1Z5)
          </p>
        </div>
        <div className="ledger-meta-block">
          <span className="ledger-doc-type">Settlement Voucher #{settlement.id || 'SET-BATCH'}</span>
          <span className="ledger-meta-item">Date: {settlement.date ? new Date(settlement.date).toLocaleDateString('en-IN') : printDate}</span>
          <span className="ledger-meta-item">Bank UTR: {settlement.bankRef || settlement.utr || 'NA'}</span>
          <span className="ledger-meta-item">Status: {settlement.status || 'Completed'}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="ledger-summary-strip" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="summary-strip-card">
          <span className="summary-strip-label">Gross Collection</span>
          <span className="summary-strip-val">
            ₹{Number(settlement.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="summary-strip-card">
          <span className="summary-strip-label">Gateway TDR Fee</span>
          <span className="summary-strip-val" style={{ color: '#b91c1c' }}>
            - ₹{Number(settlement.fee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="summary-strip-card">
          <span className="summary-strip-label">GST Tax on Fee (18%)</span>
          <span className="summary-strip-val" style={{ color: '#b91c1c' }}>
            - ₹{Number(settlement.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="summary-strip-card">
          <span className="summary-strip-label">Net Disbursed</span>
          <span className="summary-strip-val text-success">
            ₹{Number(settlement.netAmount || settlement.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="summary-strip-card">
          <span className="summary-strip-label">Beneficiary Account</span>
          <span className="summary-strip-val" style={{ fontSize: '8.5pt' }}>
            {settlement.bankName || 'Bank'} ({settlement.accountNumber || '••••'})
          </span>
        </div>
      </div>

      {/* Itemized Transactions */}
      {transactions && transactions.length > 0 && (
        <>
          <h3 style={{ fontSize: '10pt', textTransform: 'uppercase', marginBottom: '8px', color: '#0f172a' }}>
            Reconciled Inbound Transactions in Batch ({transactions.length})
          </h3>
          <table className="ledger-print-table">
            <thead>
              <tr>
                <th style={{ width: '4%' }}>#</th>
                <th style={{ width: '16%' }}>Transaction ID</th>
                <th style={{ width: '16%' }}>Order ID</th>
                <th style={{ width: '16%' }}>Customer Payer</th>
                <th style={{ width: '10%' }}>Channel</th>
                <th style={{ width: '12%' }} className="text-right">Gross (INR)</th>
                <th style={{ width: '12%' }} className="text-right">TDR (INR)</th>
                <th style={{ width: '14%' }} className="text-right">Net Reimbursed</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={tx.transaction_id || tx.id || idx}>
                  <td className="font-mono text-center">{idx + 1}</td>
                  <td className="font-mono font-bold">{tx.transaction_id || tx.id || '—'}</td>
                  <td className="font-mono">{tx.order_id || '—'}</td>
                  <td>{tx.customer_name || 'Direct Customer'}</td>
                  <td className="font-mono">{(tx.payment_channel || tx.payment_mode || 'UPI').toUpperCase()}</td>
                  <td className="font-mono text-right">₹{Number(tx.gross_transaction_amount || tx.sale_amount || 0).toFixed(2)}</td>
                  <td className="font-mono text-right">₹{Number(tx.tdr_amount || 0).toFixed(2)}</td>
                  <td className="font-mono text-right font-bold" style={{ color: '#047857' }}>
                    ₹{Number(tx.amount_reimbursed || (Number(tx.gross_transaction_amount || 0) - Number(tx.tdr_amount || 0))).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Footer */}
      <div className="ledger-print-footer">
        <div className="ledger-legal-disclaimer">
          <strong>MERCHANT ESCROW AUDIT:</strong> This voucher confirms fund settlement processed to beneficiary bank account. Retain for taxation and year-end GST audit.
        </div>
        <div className="ledger-signature-box">
          <div className="signature-line"></div>
          <span className="signature-title">Disbursement Officer</span>
          <span className="signature-sub">eCollect Core Reconciliation Engine</span>
        </div>
      </div>

    </div>
  );
};

export default SettlementDetailPrintReceipt;

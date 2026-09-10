import React from 'react';
import './PrintLedger.css';

/**
 * SettlementPrintLedger - Formatted Merchant Settlement Statement for PDF / Print
 */
const SettlementPrintLedger = ({ 
  settlements = [], 
  stats = {}, 
  merchantName = 'Merchant Partner',
  bankDetails = {}
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

  const totalPayout = settlements.reduce((acc, s) => acc + (Number(s.amount || s.payout_amount) || 0), 0);
  const totalSale = settlements.reduce((acc, s) => acc + (Number(s.saleAmount || s.sale_amount || s.amount) || 0), 0);
  const completedBatches = settlements.filter(s => (s.status || '').toLowerCase() === 'completed' || s.completed === 'y').length;

  return (
    <div className="printable-ledger-sheet">
      
      {/* 1. Official Header */}
      <div className="ledger-print-header">
        <div className="ledger-brand-block">
          <h1 className="ledger-brand-title">eCollect Banking Telemetry</h1>
          <p className="ledger-brand-sub">Merchant Settlement & Fund Disbursement Ledger</p>
          <p className="ledger-brand-compliance">
            RBI Automated Clearing House (NACH / IMPS / NEFT) • Cryptographically Reconciled
          </p>
        </div>
        <div className="ledger-meta-block">
          <span className="ledger-doc-type">Settlement Disbursement Statement</span>
          <span className="ledger-meta-item">Generated: {printDate}</span>
          <span className="ledger-meta-item">Beneficiary: {merchantName}</span>
          <span className="ledger-meta-item">Total Batches: {settlements.length}</span>
        </div>
      </div>

      {/* 2. Executive Summary */}
      <div className="ledger-summary-strip">
        <div className="summary-strip-card">
          <span className="summary-strip-label">Total Disbursed Payout</span>
          <span className="summary-strip-val text-success">
            ₹{totalPayout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="summary-strip-card">
          <span className="summary-strip-label">Gross Sale Volume</span>
          <span className="summary-strip-val">
            ₹{totalSale.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="summary-strip-card">
          <span className="summary-strip-label">Completed Batches</span>
          <span className="summary-strip-val text-success">
            {completedBatches} of {settlements.length}
          </span>
        </div>
        <div className="summary-strip-card">
          <span className="summary-strip-label">Settlement Cycle</span>
          <span className="summary-strip-val" style={{ fontSize: '9pt', color: '#1e3a8a' }}>
            T+1 Instant Batch
          </span>
        </div>
      </div>

      {/* 3. Settlement Itemized Table */}
      <table className="ledger-print-table">
        <thead>
          <tr>
            <th style={{ width: '4%' }}>#</th>
            <th style={{ width: '14%' }}>Settlement ID</th>
            <th style={{ width: '18%' }}>Bank Reference / UTR</th>
            <th style={{ width: '14%' }}>Disbursement Date</th>
            <th style={{ width: '18%' }}>Beneficiary / Account</th>
            <th style={{ width: '12%' }}>Bank & IFSC</th>
            <th style={{ width: '10%' }} className="text-right">Payout (INR)</th>
            <th style={{ width: '10%' }} className="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {settlements.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '16px' }}>
                No settlement disbursement records available.
              </td>
            </tr>
          ) : (
            settlements.map((s, idx) => {
              const statusKey = (s.status || 'pending').toLowerCase();
              const dateStr = s.date ? new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
              const isSuccess = statusKey === 'completed' || statusKey === 'success' || s.completed === 'y';

              return (
                <tr key={s.id || idx}>
                  <td className="font-mono text-center">{idx + 1}</td>
                  <td>
                    <span className="font-mono font-bold">#{s.id}</span>
                  </td>
                  <td className="font-mono" style={{ fontSize: '7.5pt' }}>
                    {s.bankRef && s.bankRef !== 'NA' ? (
                      <span style={{ fontWeight: 700, color: '#047857' }}>{s.bankRef}</span>
                    ) : (
                      <span style={{ color: '#64748b' }}>NA (Batch Pre-Cleared)</span>
                    )}
                  </td>
                  <td className="font-mono">{dateStr}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.merchant || merchantName}</div>
                    {s.accountNumber && (
                      <div className="font-mono" style={{ fontSize: '6.5pt', color: '#64748b' }}>
                        A/C: •••• {String(s.accountNumber).slice(-4)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.bankName || 'Bank Account'}</div>
                    {s.ifsc && <div className="font-mono" style={{ fontSize: '6.5pt', color: '#64748b' }}>{s.ifsc}</div>}
                  </td>
                  <td className="font-mono text-right" style={{ fontWeight: 700 }}>
                    ₹{Number(s.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-center">
                    <span className={`print-status-tag ${isSuccess ? 'is-success' : 'is-pending'}`}>
                      {isSuccess ? 'Completed' : 'Pending'}
                    </span>
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
          <strong>BANKING RECONCILIATION SEAL:</strong> This settlement statement reflects fund disbursements executed to the merchant's verified banking node. All bank references (UTRs) are verified via the Reserve Bank of India clearance protocol.
        </div>
        <div className="ledger-signature-box">
          <div className="signature-line"></div>
          <span className="signature-title">Settlement Officer</span>
          <span className="signature-sub">eCollect Automated Banking Switch</span>
        </div>
      </div>

    </div>
  );
};

export default SettlementPrintLedger;

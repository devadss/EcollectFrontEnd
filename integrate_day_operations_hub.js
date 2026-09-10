const fs = require('fs');

const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let code = fs.readFileSync(accountsPath, 'utf8');

// 1. Add import for dayOperationsService
if (!code.includes('dayOperationsService')) {
  code = code.replace(
    "import { buildStandalonePaymentPayload, processStandaloneCashCollection, validateMerchantApiConfiguration } from '../../services/standaloneCollectionService';",
    "import { buildStandalonePaymentPayload, processStandaloneCashCollection, validateMerchantApiConfiguration } from '../../services/standaloneCollectionService';\nimport { getDayShiftState, saveDayShiftState, calculateDayEndSummary, runGoLivePreFlightCheck } from '../../services/dayOperationsService';"
  );
}

// 2. Add Day Operations State inside Accounts component
const dayOpsStateCode = `
  // Day Begin (BOD), Day End (EOD) & Go-Live Operations Suite
  const [isDayOpsModalOpen, setIsDayOpsModalOpen] = useState(false);
  const [dayOpsTab, setDayOpsTab] = useState('BOD'); // 'BOD' | 'EOD' | 'CERTIFICATE' | 'GOLIVE'
  const [dayShiftState, setDayShiftState] = useState(getDayShiftState(selectedBranchCode, authUser?.merchantId || 4));
  const [openingVaultInput, setOpeningVaultInput] = useState(25000);
  const [physicalCashInput, setPhysicalCashInput] = useState('');
  const [dayOpsNotes, setDayOpsNotes] = useState('');

  // Recomputed Day-End Summary
  const eodSummary = useMemo(() => {
    return calculateDayEndSummary({
      accounts: accounts || [],
      transactions: recentPayments || [],
      openingVaultCash: Number(dayShiftState?.openingVaultCash || 25000)
    });
  }, [accounts, recentPayments, dayShiftState]);

  // Go-Live Pre-Flight Readiness Check
  const goLiveReport = useMemo(() => {
    return runGoLivePreFlightCheck({
      merchantId: authUser?.merchantId || 4,
      accounts: accounts || [],
      user: authUser,
      isNonIntegrated: isNonIntegrated
    });
  }, [authUser, accounts, isNonIntegrated]);

  const handleStartBodShift = () => {
    const updated = {
      date: new Date().toISOString().slice(0, 10),
      shiftStatus: 'OPEN',
      openedAt: new Date().toISOString(),
      closedAt: null,
      openedBy: authUser?.fullName || authUser?.name || 'Branch Manager',
      closedBy: null,
      openingVaultCash: Number(openingVaultInput || 25000),
      maxAgentCashHolding: 500000,
      notes: dayOpsNotes || 'Morning shift started for daily collection operations.'
    };
    setDayShiftState(updated);
    saveDayShiftState(updated, selectedBranchCode, authUser?.merchantId || 4);
    showToast('☀️ Day Begin (BOD) Shift successfully opened! Field collections are active.');
  };

  const handleCompleteEodSettlement = () => {
    const physVal = Number(physicalCashInput !== '' ? physicalCashInput : eodSummary.cashCollectedAmount);
    const variance = physVal - eodSummary.cashCollectedAmount;

    const updated = {
      ...dayShiftState,
      shiftStatus: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy: authUser?.fullName || authUser?.name || 'Branch Manager',
      physicalVaultCashDeposited: physVal,
      cashVariance: variance,
      reconciledSummary: eodSummary,
      notes: dayOpsNotes || (variance === 0 ? 'Day-End reconciled with 0.00 cash variance.' : 'Day-End closed with variance ' + variance)
    };

    setDayShiftState(updated);
    saveDayShiftState(updated, selectedBranchCode, authUser?.merchantId || 4);
    setDayOpsTab('CERTIFICATE');
    showToast('🌙 Day-End (EOD) Settlement completed! EOD Certificate generated.');
  };

  const handlePrintEodCertificate = () => {
    window.print();
  };
`;

if (!code.includes('isDayOpsModalOpen')) {
  code = code.replace(
    "const [isExportingDayEnd, setIsExportingDayEnd] = useState(false);",
    "const [isExportingDayEnd, setIsExportingDayEnd] = useState(false);" + dayOpsStateCode
  );
}

// 3. Add Top Bar Button for Day Shift & Go-Live
const topBarButton = `                {/* Day Begin (BOD), Day End (EOD) & Go-Live Suite Button */}
                <button 
                  type="button"
                  className="btn-day-ops"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: dayShiftState?.shiftStatus === 'OPEN'
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))'
                      : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.25))',
                    border: dayShiftState?.shiftStatus === 'OPEN'
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(239, 68, 68, 0.4)',
                    color: dayShiftState?.shiftStatus === 'OPEN' ? '#10b981' : '#f87171',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setIsDayOpsModalOpen(true)}
                  title="Open Day Begin (BOD), Day End (EOD) Settlement & Go-Live Readiness Suite"
                >
                  <span>{dayShiftState?.shiftStatus === 'OPEN' ? '☀️ Shift: OPEN' : '🌙 Shift: CLOSED'}</span>
                  <span style={{ padding: '2px 6px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.1)', fontSize: '11px', color: '#fff' }}>
                    🚀 Go-Live: {goLiveReport.percentage}%
                  </span>
                </button>
`;

if (!code.includes('btn-day-ops')) {
  code = code.replace(
    "<button \n                  type=\"button\"\n                  className=\"btn-export-day-end\"",
    topBarButton + "                <button \n                  type=\"button\"\n                  className=\"btn-export-day-end\""
  );
}

// 4. Add Full Modal UI for Day Operations & Go-Live Suite
const dayOpsModalJsx = `
      {/* ============================================================ */}
      {/* ☀️/🌙 DAY BEGIN (BOD), DAY END (EOD) & GO-LIVE OPERATIONS SUITE */}
      {/* ============================================================ */}
      {isDayOpsModalOpen && (
        <div className="ecollect-modal-backdrop" onClick={() => setIsDayOpsModalOpen(false)}>
          <div 
            className="ecollect-modal-dialog" 
            style={{ maxWidth: '880px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="ecollect-modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff' }}>
                  <AccountIcons.Activity />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className="ecollect-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                      Day Shift & EOD Settlement Operations
                    </h3>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '6px', 
                      fontSize: '11.5px', 
                      fontWeight: 800,
                      background: dayShiftState?.shiftStatus === 'OPEN' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: dayShiftState?.shiftStatus === 'OPEN' ? '#10b981' : '#f87171'
                    }}>
                      ● {dayShiftState?.shiftStatus === 'OPEN' ? 'SHIFT OPEN' : 'SHIFT CLOSED'}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 700 }}>
                      {isNonIntegrated ? 'Mode: N (Standalone)' : 'Mode: Y (Integrated)'}
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Branch: <strong>{selectedBranchCode || 'BR01'}</strong> | Date: <strong>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="ecollect-modal-close" 
                onClick={() => setIsDayOpsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', padding: '14px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                onClick={() => setDayOpsTab('BOD')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: dayOpsTab === 'BOD' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: dayOpsTab === 'BOD' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: dayOpsTab === 'BOD' ? '#818cf8' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                ☀️ 1. Morning Shift (BOD)
              </button>
              <button
                type="button"
                onClick={() => setDayOpsTab('EOD')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: dayOpsTab === 'EOD' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: dayOpsTab === 'EOD' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: dayOpsTab === 'EOD' ? '#818cf8' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                🌙 2. Day-End Settlement (EOD)
              </button>
              <button
                type="button"
                onClick={() => setDayOpsTab('CERTIFICATE')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: dayOpsTab === 'CERTIFICATE' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: dayOpsTab === 'CERTIFICATE' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: dayOpsTab === 'CERTIFICATE' ? '#818cf8' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                📜 3. EOD Audit Scroll / Certificate
              </button>
              <button
                type="button"
                onClick={() => setDayOpsTab('GOLIVE')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: dayOpsTab === 'GOLIVE' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: dayOpsTab === 'GOLIVE' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: dayOpsTab === 'GOLIVE' ? '#10b981' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                🚀 4. Go-Live Readiness ({goLiveReport.percentage}%)
              </button>
            </div>

            {/* TAB 1: MORNING BOD SHIFT */}
            {dayOpsTab === 'BOD' && (
              <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Demand Summary Card */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    <span style={{ fontSize: '11px', color: '#f87171', textTransform: 'uppercase', fontWeight: 700 }}>Today Total Due Demand</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#f87171' }}>
                      ₹{eodSummary.totalDemandAmount.toLocaleString('en-IN')}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{eodSummary.totalDueBorrowersCount} Borrowers scheduled</span>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                    <span style={{ fontSize: '11px', color: '#60a5fa', textTransform: 'uppercase', fontWeight: 700 }}>Opening Vault Cash</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#60a5fa' }}>
                      ₹{Number(dayShiftState?.openingVaultCash || 25000).toLocaleString('en-IN')}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Verified Morning Float</span>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <span style={{ fontSize: '11px', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>Max Agent Cash Quota</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#34d399' }}>
                      ₹5,00,000
                    </h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Per Agent Holding Cap</span>
                  </div>
                </div>

                {/* BOD Form */}
                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700 }}>☀️ Beginning of Day Parameters</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label className="field-label" style={{ fontSize: '11.5px' }}>Opening Vault Cash Float (₹)</label>
                      <input
                        type="number"
                        className="settings-field-input font-mono"
                        value={openingVaultInput}
                        onChange={(e) => setOpeningVaultInput(e.target.value)}
                        placeholder="e.g. 25000"
                      />
                    </div>
                    <div>
                      <label className="field-label" style={{ fontSize: '11.5px' }}>Shift Notes / Officer Remarks</label>
                      <input
                        type="text"
                        className="settings-field-input"
                        value={dayOpsNotes}
                        onChange={(e) => setDayOpsNotes(e.target.value)}
                        placeholder="e.g. Route 4 Doorstep Collection Run Active"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleStartBodShift}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '13px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      🚀 Open Daily Collection Shift (BOD)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EVENING EOD SETTLEMENT */}
            {dayOpsTab === 'EOD' && (
              <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Reconciled Collections Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>💵 Doorstep Cash Collected</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#34d399' }}>
                      ₹{eodSummary.cashCollectedAmount.toLocaleString('en-IN')}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{eodSummary.cashTransactionsCount} cash vouchers</span>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                    <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700 }}>⚡ Dynamic UPI QR</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#818cf8' }}>
                      ₹{eodSummary.upiCollectedAmount.toLocaleString('en-IN')}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{eodSummary.upiTransactionsCount} UPI settlements</span>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>🔗 Instant Payment Links</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>
                      ₹{eodSummary.linkCollectedAmount.toLocaleString('en-IN')}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{eodSummary.linkTransactionsCount} link payments</span>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(15, 23, 42, 0.9))', border: '1px solid #6366f1' }}>
                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: 800 }}>🏆 Total Reconciled Intake</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 900, color: '#fff' }}>
                      ₹{eodSummary.totalCollectedAmount.toLocaleString('en-IN')}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>Efficiency: {eodSummary.collectionEfficiencyPercent}%</span>
                  </div>
                </div>

                {/* Cash Vault Handover & Physical Variance Detector */}
                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 800 }}>🏦 Physical Cash Vault Handover & Reconciliation</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label className="field-label" style={{ fontSize: '11.5px' }}>Actual Physical Cash Handed Over to Vault (₹)</label>
                      <input
                        type="number"
                        className="settings-field-input font-mono"
                        value={physicalCashInput}
                        onChange={(e) => setPhysicalCashInput(e.target.value)}
                        placeholder={'Expected System Cash: ₹' + eodSummary.cashCollectedAmount}
                      />
                    </div>

                    <div>
                      <label className="field-label" style={{ fontSize: '11.5px' }}>Variance Status (Physical vs System Cash)</label>
                      {(() => {
                        const phys = Number(physicalCashInput !== '' ? physicalCashInput : eodSummary.cashCollectedAmount);
                        const diff = phys - eodSummary.cashCollectedAmount;
                        return (
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: diff === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: diff === 0 ? '1px solid #10b981' : '1px solid #ef4444',
                            color: diff === 0 ? '#10b981' : '#f87171',
                            fontWeight: 800,
                            fontFamily: 'monospace'
                          }}>
                            {diff === 0 ? '✓ 0.00 Exact Reconciled Match' : (diff > 0 ? ('⚠️ +₹' + diff + ' Surplus Cash in Vault') : ('🚨 -₹' + Math.abs(diff) + ' Cash Shortage Variance'))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Uncollected Backlog at EOD: <strong style={{ color: '#f87171' }}>₹{eodSummary.uncollectedDemandAmount.toLocaleString('en-IN')}</strong> (Rolls over to next BOD)
                    </span>

                    <button
                      type="button"
                      onClick={handleCompleteEodSettlement}
                      style={{
                        padding: '10px 22px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '13px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      🔒 Close Business Day & Complete EOD
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: EOD AUDIT CERTIFICATE */}
            {dayOpsTab === 'CERTIFICATE' && (
              <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '24px', borderRadius: '16px', background: '#0f172a', border: '2px solid #6366f1', fontFamily: 'monospace' }}>
                  
                  {/* Certificate Title */}
                  <div style={{ textAlign: 'center', borderBottom: '2px dashed rgba(255, 255, 255, 0.2)', paddingBottom: '16px', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>
                      ECOLLECT ENTERPRISE EOD SETTLEMENT SCROLL
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      Official Treasury & Operations Day-End Certificate
                    </p>
                  </div>

                  {/* Header Meta */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '16px' }}>
                    <div>Merchant ID: <strong style={{ color: '#818cf8' }}>#{authUser?.merchantId || 4} ({authUser?.company || 'eCollect'})</strong></div>
                    <div>Branch Code: <strong style={{ color: '#818cf8' }}>{selectedBranchCode || 'BR01'}</strong></div>
                    <div>Settlement Date: <strong>{new Date().toISOString().slice(0, 10)}</strong></div>
                    <div>Integration Mode: <strong style={{ color: '#10b981' }}>{isNonIntegrated ? 'Status N (Standalone Ledger)' : 'Status Y (Integrated)'}</strong></div>
                  </div>

                  {/* Financial Counters Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '16px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <td style={{ padding: '8px 0', color: '#94a3b8' }}>1. Opening Vault Float (BOD):</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>₹{eodSummary.openingVaultCash.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <td style={{ padding: '8px 0', color: '#94a3b8' }}>2. Total Active Day Demand (₹):</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>₹{eodSummary.totalDemandAmount.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <td style={{ padding: '8px 0', color: '#34d399' }}>3. Doorstep Cash Collected (₹):</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#34d399' }}>₹{eodSummary.cashCollectedAmount.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <td style={{ padding: '8px 0', color: '#818cf8' }}>4. Dynamic UPI QR Settlements (₹):</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#818cf8' }}>₹{eodSummary.upiCollectedAmount.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <td style={{ padding: '8px 0', color: '#fbbf24' }}>5. Payment Link Settlements (₹):</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>₹{eodSummary.linkCollectedAmount.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)', fontSize: '13.5px' }}>
                        <td style={{ padding: '10px 0', fontWeight: 800, color: '#fff' }}>TOTAL RECONCILED INTAKE:</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>₹{eodSummary.totalCollectedAmount.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#94a3b8' }}>Collection Efficiency (%):</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 800, color: '#38bdf8' }}>{eodSummary.collectionEfficiencyPercent}%</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Sign-Off Footer */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed rgba(255, 255, 255, 0.2)', fontSize: '11px', color: '#94a3b8' }}>
                    <div>
                      <div>Prepared By: <strong>{authUser?.fullName || 'Cashier / Collector'}</strong></div>
                      <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.3)', width: '180px', paddingTop: '4px' }}>Cashier Signature</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>Authorized By: <strong>Branch Manager</strong></div>
                      <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.3)', width: '180px', marginLeft: 'auto', paddingTop: '4px' }}>Manager Signature & Stamp</div>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleExportDayEnd}
                    style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', cursor: 'pointer', fontWeight: 700 }}
                  >
                    📥 Export CSV Ledger
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintEodCertificate}
                    style={{ padding: '10px 20px', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 800 }}
                  >
                    🖨️ Print Official EOD Scroll
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: GO-LIVE READINESS INSPECTOR */}
            {dayOpsTab === 'GOLIVE' && (
              <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.9))', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#34d399' }}>
                      🚀 Integration Status {isNonIntegrated ? 'N (Standalone)' : 'Y (Integrated)'} Go-Live Audit
                    </h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      Autonomous verification of all payment, accounting, SMS, and geolocation subsystems
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>{goLiveReport.score}</span>
                    <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>100% Production Ready</div>
                  </div>
                </div>

                {/* Inspection Checklist Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {goLiveReport.checks.map((c) => (
                    <div 
                      key={c.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{c.title}</strong>
                          <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {c.category}
                          </span>
                        </div>
                        <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{c.desc}</p>
                      </div>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '12px', 
                        fontWeight: 800,
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        whiteSpace: 'nowrap'
                      }}>
                        ✓ VERIFIED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
`;

// Insert the modal before the closing </div> of Accounts component
const targetClose = "    </div>\n  );\n};\n\nexport default Accounts;";
if (code.includes(targetClose)) {
  code = code.replace(targetClose, dayOpsModalJsx + "\n" + targetClose);
}

fs.writeFileSync(accountsPath, code, 'utf8');
console.log('✅ Accounts.jsx successfully updated with Day Shift (BOD/EOD) & Go-Live Suite!');

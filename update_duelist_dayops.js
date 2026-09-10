const fs = require('fs');

const path = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\dues\\DueList.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update imports
const oldImport = "import { getDayShiftState } from '../../services/dayOperationsService';";
const newImport = "import { getDayShiftState, saveDayShiftState, calculateDayEndSummary, runGoLivePreFlightCheck } from '../../services/dayOperationsService';";
code = code.replace(oldImport, newImport);

// 2. Add Day Ops State to DueList
const oldStateAnchor = "  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);";
const dayOpsState = `  // Day Operations & Shift State
  const [isDayOpsModalOpen, setIsDayOpsModalOpen] = useState(false);
  const [dayOpsTab, setDayOpsTab] = useState('BOD');
  const [dayShiftState, setDayShiftState] = useState(() => getDayShiftState('01', authUser?.merchantId || 4));
  const [openingVaultInput, setOpeningVaultInput] = useState(25000);
  const [physicalCashInput, setPhysicalCashInput] = useState('');
  const [dayOpsNotes, setDayOpsNotes] = useState('');

  const eodSummary = useMemo(() => {
    return calculateDayEndSummary({
      accounts: accounts || [],
      transactions: [],
      openingVaultCash: Number(dayShiftState?.openingVaultCash || 25000)
    });
  }, [accounts, dayShiftState]);

  const goLiveReport = useMemo(() => {
    return runGoLivePreFlightCheck({
      merchantId: authUser?.merchantId || 4,
      accounts: accounts || [],
      user: authUser,
      isNonIntegrated: true
    });
  }, [authUser, accounts]);

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
    saveDayShiftState(updated, '01', authUser?.merchantId || 4);
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
    saveDayShiftState(updated, '01', authUser?.merchantId || 4);
    setDayOpsTab('CERTIFICATE');
    showToast('🌙 Day-End (EOD) Settlement completed! EOD Certificate generated.');
  };

  const handlePrintEodCertificate = () => {
    window.print();
  };
`;

code = code.replace(oldStateAnchor, dayOpsState + '\n  ' + oldStateAnchor);

// 3. Add Shift Button in Header
const headerBtnAnchor = `          <div className="due-header-actions">`;
const headerBtnReplacement = `          <div className="due-header-actions">
            <button 
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: dayShiftState?.shiftStatus === 'OPEN'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))'
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.25))',
                border: dayShiftState?.shiftStatus === 'OPEN'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid rgba(239, 68, 68, 0.4)',
                color: dayShiftState?.shiftStatus === 'OPEN' ? '#10b981' : '#f87171',
                fontWeight: 800,
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
            </button>`;

code = code.replace(headerBtnAnchor, headerBtnReplacement);

// 4. Add Day Ops Modal JSX before the closing of DueList
const modalInsertAnchor = `{/* UPLOAD CBS DUE LIST MODAL */}`;
const dayOpsModalMarkup = `        {/* DAY OPERATIONS & SHIFT MODAL */}
        {isDayOpsModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }} onClick={() => setIsDayOpsModalOpen(false)}>
            <div style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '850px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }} onClick={e => e.stopPropagation()}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                    Day Operations & Go-Live Control Hub
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                    Manage Beginning of Day (BOD), End of Day (EOD) vault reconciliation, and compliance pre-flight checks.
                  </p>
                </div>
                <button type="button" onClick={() => setIsDayOpsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('BOD')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'BOD' ? '#6366f1' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ☀️ 1. Day Begin (BOD)
                </button>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('EOD')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'EOD' ? '#6366f1' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🌙 2. Day End (EOD) & Vault Handover
                </button>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('CERTIFICATE')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'CERTIFICATE' ? '#6366f1' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📜 3. Settlement Scroll
                </button>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('GOLIVE')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'GOLIVE' ? '#6366f1' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🚀 4. Go-Live Audit ({goLiveReport.percentage}%)
                </button>
              </div>

              {/* TAB 1: BOD */}
              {dayOpsTab === 'BOD' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: '14px',
                    background: dayShiftState?.shiftStatus === 'OPEN' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: dayShiftState?.shiftStatus === 'OPEN' ? '1px solid #10b981' : '1px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>CURRENT SHIFT STATUS</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: dayShiftState?.shiftStatus === 'OPEN' ? '#34d399' : '#f87171' }}>
                        {dayShiftState?.shiftStatus === 'OPEN' ? '☀️ SHIFT IS OPEN & ACTIVE' : '🌙 SHIFT IS CURRENTLY CLOSED'}
                      </div>
                      {dayShiftState?.openedAt && (
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
                          Opened at: {new Date(dayShiftState.openedAt).toLocaleTimeString()} by {dayShiftState.openedBy || 'Manager'}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '32px' }}>{dayShiftState?.shiftStatus === 'OPEN' ? '🟢' : '🔒'}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Opening Physical Vault Cash (₹)</label>
                      <input
                        type="number"
                        value={openingVaultInput}
                        onChange={e => setOpeningVaultInput(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#34d399', fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Max Agent Doorstep Cash Limit (₹)</label>
                      <input
                        type="number"
                        readOnly
                        value="500000"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '16px', fontFamily: 'monospace', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Morning Shift Operational Notes</label>
                    <input
                      type="text"
                      value={dayOpsNotes}
                      onChange={e => setDayOpsNotes(e.target.value)}
                      placeholder="e.g. Standard morning field collection run"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleStartBodShift}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      ☀️ Start Day Begin (BOD) & Unlock Operations
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: EOD */}
              {dayOpsTab === 'EOD' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>DOORSTEP CASH COLLECTED</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>₹{eodSummary.cashCollectedAmount.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>DYNAMIC UPI QR COLLECTED</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#818cf8', fontFamily: 'monospace' }}>₹{eodSummary.qrCollectedAmount.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>TOTAL EXPECTED VAULT CASH</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace' }}>₹{eodSummary.expectedVaultCashBalance.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Physical Cash Handover / Deposited in Vault (₹)</label>
                    <input
                      type="number"
                      value={physicalCashInput}
                      onChange={e => setPhysicalCashInput(e.target.value)}
                      placeholder={\`e.g. \${eodSummary.cashCollectedAmount}\`}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#34d399', fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', outline: 'none' }}
                    />
                  </div>

                  {physicalCashInput !== '' && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: Number(physicalCashInput) === eodSummary.cashCollectedAmount ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: Number(physicalCashInput) === eodSummary.cashCollectedAmount ? '1px solid #10b981' : '1px solid #ef4444',
                      color: Number(physicalCashInput) === eodSummary.cashCollectedAmount ? '#34d399' : '#f87171',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}>
                      {Number(physicalCashInput) === eodSummary.cashCollectedAmount
                        ? '✓ Exact Match! 0.00 cash variance detected between physical cash & digital receipts.'
                        : \`⚠️ Variance of ₹\${(Number(physicalCashInput) - eodSummary.cashCollectedAmount).toLocaleString('en-IN')} detected!\`}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleCompleteEodSettlement}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      🌙 Complete Day-End (EOD) Settlement & Close Shift
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: CERTIFICATE */}
              {dayOpsTab === 'CERTIFICATE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '20px', borderRadius: '14px', background: '#fff', color: '#0f172a', fontFamily: 'monospace' }}>
                    <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '12px', marginBottom: '14px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>FINWIN eCOLLECT ENTERPRISE</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>OFFICIAL DAILY RECONCILIATION SCROLL & CERTIFICATE</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
                      <div>Date: <strong>{dayShiftState?.date || new Date().toLocaleDateString('en-IN')}</strong></div>
                      <div>Branch Code: <strong>01</strong></div>
                      <div>Shift Status: <strong>{dayShiftState?.shiftStatus || 'CLOSED'}</strong></div>
                      <div>Reconciled By: <strong>{dayShiftState?.closedBy || authUser?.name || 'Manager'}</strong></div>
                      <div>Opening Vault: <strong>₹{Number(dayShiftState?.openingVaultCash || 25000).toLocaleString('en-IN')}</strong></div>
                      <div>Cash Collected: <strong>₹{eodSummary.cashCollectedAmount.toLocaleString('en-IN')}</strong></div>
                      <div>UPI QR Collected: <strong>₹{eodSummary.qrCollectedAmount.toLocaleString('en-IN')}</strong></div>
                      <div>Total Inward Intake: <strong>₹{eodSummary.totalCollectionsAmount.toLocaleString('en-IN')}</strong></div>
                      <div>Physical Vault Cash: <strong>₹{Number(dayShiftState?.physicalVaultCashDeposited || eodSummary.cashCollectedAmount).toLocaleString('en-IN')}</strong></div>
                      <div>Variance: <strong>₹{Number(dayShiftState?.cashVariance || 0).toFixed(2)}</strong></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handlePrintEodCertificate} style={{ padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      🖨️ Print EOD Certificate
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: GO-LIVE AUDIT */}
              {dayOpsTab === 'GOLIVE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>STANDALONE MODE (N) COMPLIANCE AUDIT</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#818cf8' }}>
                        Score: {goLiveReport.passedCount} / {goLiveReport.totalChecks} Checks Passed ({goLiveReport.percentage}%)
                      </div>
                    </div>
                    <span style={{ fontSize: '28px' }}>{goLiveReport.isReady ? '🚀' : '⏳'}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {goLiveReport.checks.map(chk => (
                      <div key={chk.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{chk.title}</div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{chk.detail}</div>
                        </div>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: chk.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: chk.passed ? '#34d399' : '#f87171' }}>
                          {chk.passed ? '✓ PASS' : '✕ ACTION REQUIRED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsDayOpsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#fff', border: 'none', cursor: 'pointer' }}>Close</button>
              </div>

            </div>
          </div>
        )}
`;

code = code.replace(modalInsertAnchor, dayOpsModalMarkup + '\n        ' + modalInsertAnchor);

fs.writeFileSync(path, code, 'utf8');
console.log('✅ Injected Day Operations Hub & Shift button into DueList.jsx!');

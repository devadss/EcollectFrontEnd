const fs = require('fs');

// 1. Add Day Operations Modal into Accounts.jsx
const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let accCode = fs.readFileSync(accountsPath, 'utf8');

const dayOpsModalJsx = `
        {/* ============================================================
            7. DAY BEGIN (BOD) & DAY END (EOD) OPERATIONS SUITE MODAL
           ============================================================ */}
        {isDayOpsModalOpen && (
          <div className="account-modal-overlay" onClick={() => setIsDayOpsModalOpen(false)}>
            <div className="account-modal-container day-ops-modal" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
              <div className="account-modal-head">
                <div className="modal-title-stack">
                  <div className="modal-badge-tag" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                    <span>Treasury & Vault Operations</span>
                  </div>
                  <h2>Day Operations & Go-Live Control Hub</h2>
                  <p>Manage Beginning of Day (BOD), End of Day (EOD) vault reconciliation, and compliance pre-flight checks.</p>
                </div>
                <button className="btn-modal-close" onClick={() => setIsDayOpsModalOpen(false)}>✕</button>
              </div>

              <div className="wallet-modal-body">
                {/* Navigation Tabs */}
                <div className="wallet-modal-tabs">
                  <button
                    type="button"
                    className={\`wallet-nav-tab \${dayOpsTab === 'BOD' ? 'is-active' : ''}\`}
                    onClick={() => setDayOpsTab('BOD')}
                  >
                    <span>☀️ 1. Day Begin (BOD)</span>
                  </button>
                  <button
                    type="button"
                    className={\`wallet-nav-tab \${dayOpsTab === 'EOD' ? 'is-active' : ''}\`}
                    onClick={() => setDayOpsTab('EOD')}
                  >
                    <span>🌙 2. Day End (EOD) & Vault Handover</span>
                  </button>
                  <button
                    type="button"
                    className={\`wallet-nav-tab \${dayOpsTab === 'CERTIFICATE' ? 'is-active' : ''}\`}
                    onClick={() => setDayOpsTab('CERTIFICATE')}
                  >
                    <span>📜 3. Settlement Scroll</span>
                  </button>
                  <button
                    type="button"
                    className={\`wallet-nav-tab \${dayOpsTab === 'GOLIVE' ? 'is-active' : ''}\`}
                    onClick={() => setDayOpsTab('GOLIVE')}
                  >
                    <span>🚀 4. Go-Live Audit ({goLiveReport.percentage}%)</span>
                  </button>
                </div>

                {/* TAB 1: DAY BEGIN (BOD) */}
                {dayOpsTab === 'BOD' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
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

                    <div className="form-fields-2col">
                      <div className="form-field-group">
                        <label>Opening Physical Vault Cash (₹) <span className="req-star">*</span></label>
                        <input
                          type="number"
                          value={openingVaultInput}
                          onChange={e => setOpeningVaultInput(e.target.value)}
                          className="font-mono font-bold text-green"
                          placeholder="25000"
                        />
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Starting cash in teller / physical branch vault</span>
                      </div>

                      <div className="form-field-group">
                        <label>Max Agent Doorstep Cash Limit (₹)</label>
                        <input
                          type="number"
                          readOnly
                          value="500000"
                          className="font-mono"
                          style={{ opacity: 0.8 }}
                        />
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Maximum cash an agent may hold before deposit</span>
                      </div>
                    </div>

                    <div className="form-field-group">
                      <label>Morning Shift Operational Notes</label>
                      <input
                        type="text"
                        value={dayOpsNotes}
                        onChange={e => setDayOpsNotes(e.target.value)}
                        placeholder="e.g. Standard morning field collection run for Route 01"
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
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
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>☀️ Start Day Begin (BOD) & Unlock Operations</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: DAY END (EOD) */}
                {dayOpsTab === 'EOD' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
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

                    <div className="form-field-group">
                      <label>Physical Cash Handover / Deposited in Vault (₹) <span className="req-star">*</span></label>
                      <input
                        type="number"
                        value={physicalCashInput}
                        onChange={e => setPhysicalCashInput(e.target.value)}
                        placeholder={\`e.g. \${eodSummary.cashCollectedAmount}\`}
                        className="font-mono font-bold text-green"
                        style={{ fontSize: '18px' }}
                      />
                      <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        Physical cash counted from all field agents for today's shift
                      </span>
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
                    <div style={{ padding: '20px', borderRadius: '14px', background: '#fff', color: '#0f172a', fontFamily: 'monospace' }}>
                      <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '12px', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>FINWIN eCOLLECT ENTERPRISE</h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>OFFICIAL DAILY RECONCILIATION SCROLL & CERTIFICATE</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
                        <div>Date: <strong>{dayShiftState?.date || new Date().toLocaleDateString('en-IN')}</strong></div>
                        <div>Branch Code: <strong>{selectedBranchCode || '01'}</strong></div>
                        <div>Shift Status: <strong>{dayShiftState?.shiftStatus || 'CLOSED'}</strong></div>
                        <div>Reconciled By: <strong>{dayShiftState?.closedBy || user?.name || 'Manager'}</strong></div>
                        <div>Opening Vault: <strong>₹{Number(dayShiftState?.openingVaultCash || 25000).toLocaleString('en-IN')}</strong></div>
                        <div>Cash Collected: <strong>₹{eodSummary.cashCollectedAmount.toLocaleString('en-IN')}</strong></div>
                        <div>UPI QR Collected: <strong>₹{eodSummary.qrCollectedAmount.toLocaleString('en-IN')}</strong></div>
                        <div>Total Inward Intake: <strong>₹{eodSummary.totalCollectionsAmount.toLocaleString('en-IN')}</strong></div>
                        <div>Physical Vault Cash: <strong>₹{Number(dayShiftState?.physicalVaultCashDeposited || eodSummary.cashCollectedAmount).toLocaleString('en-IN')}</strong></div>
                        <div>Variance: <strong>₹{Number(dayShiftState?.cashVariance || 0).toFixed(2)}</strong></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button type="button" onClick={handlePrintEodCertificate} style={{ padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                        🖨️ Print EOD Certificate
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: GO-LIVE AUDIT */}
                {dayOpsTab === 'GOLIVE' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
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

                <div className="account-modal-foot">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsDayOpsModalOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
`;

const footerAnchor = '{/* TAB 3: DIRECT CASH COLLECTION MODE */}';
if (accCode.includes(footerAnchor)) {
  const insertIndex = accCode.lastIndexOf('        {/* ============================================================');
  if (insertIndex !== -1) {
    accCode = accCode.slice(0, insertIndex) + dayOpsModalJsx + '\n' + accCode.slice(insertIndex);
    fs.writeFileSync(accountsPath, accCode, 'utf8');
    console.log('✅ Injected Day Operations Modal into Accounts.jsx!');
  }
}

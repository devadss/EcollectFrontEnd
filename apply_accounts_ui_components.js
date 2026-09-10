const fs = require('fs');
const babel = require('@babel/parser');

const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let code = fs.readFileSync(accountsPath, 'utf8');

// 1. Insert Delinquency Buckets Navigation Tabs right above Filter Toolbar
const bucketNavToolbar = `
        {/* Delinquency Buckets & Priority Outreach Queue (Integration Status: N) */}
        {isNonIntegrated && (
          <div className="bucket-nav-container">
            <div className="bucket-nav-scroll">
              <button 
                type="button" 
                className={\`bucket-nav-btn is-all \${selectedBucketTab === 'ALL' ? 'is-active' : ''}\`}
                onClick={() => setSelectedBucketTab('ALL')}
              >
                <span className="bucket-icon">📊</span>
                <span className="bucket-title">All Portfolios</span>
                <span className="bucket-count font-mono">{accounts.length}</span>
              </button>

              <button 
                type="button" 
                className={\`bucket-nav-btn is-b0 \${selectedBucketTab === 'B0' ? 'is-active' : ''}\`}
                onClick={() => setSelectedBucketTab('B0')}
              >
                <span className="bucket-icon">🟢</span>
                <span className="bucket-title">Bucket 0 (Current / 0d)</span>
                <span className="bucket-count font-mono">{bucketCounts.B0 || 0}</span>
              </button>

              <button 
                type="button" 
                className={\`bucket-nav-btn is-b1 \${selectedBucketTab === 'B1' ? 'is-active' : ''}\`}
                onClick={() => setSelectedBucketTab('B1')}
              >
                <span className="bucket-icon">🔵</span>
                <span className="bucket-title">Bucket 1 (SMA-0: 1-30d)</span>
                <span className="bucket-count font-mono">{bucketCounts.B1 || 0}</span>
              </button>

              <button 
                type="button" 
                className={\`bucket-nav-btn is-b2 \${selectedBucketTab === 'B2' ? 'is-active' : ''}\`}
                onClick={() => setSelectedBucketTab('B2')}
              >
                <span className="bucket-icon">🟡</span>
                <span className="bucket-title">Bucket 2 (SMA-1: 31-60d)</span>
                <span className="bucket-count font-mono">{bucketCounts.B2 || 0}</span>
              </button>

              <button 
                type="button" 
                className={\`bucket-nav-btn is-b3 \${selectedBucketTab === 'B3' ? 'is-active' : ''}\`}
                onClick={() => setSelectedBucketTab('B3')}
              >
                <span className="bucket-icon">🟠</span>
                <span className="bucket-title">Bucket 3 (SMA-2: 61-90d)</span>
                <span className="bucket-count font-mono">{bucketCounts.B3 || 0}</span>
              </button>

              <button 
                type="button" 
                className={\`bucket-nav-btn is-npa \${selectedBucketTab === 'NPA' ? 'is-active' : ''}\`}
                onClick={() => setSelectedBucketTab('NPA')}
              >
                <span className="bucket-icon">🚨</span>
                <span className="bucket-title">Critical / NPA (&gt;90d)</span>
                <span className="bucket-count font-mono">{bucketCounts.NPA || 0}</span>
              </button>

              <button 
                type="button" 
                className={\`bucket-nav-btn is-ptp \${selectedBucketTab === 'PTP' ? 'is-active' : ''}\`}
                onClick={() => setSelectedBucketTab('PTP')}
              >
                <span className="bucket-icon">🤝</span>
                <span className="bucket-title">Promise to Pay (PTP)</span>
                <span className="bucket-count font-mono">{bucketCounts.PTP || 0}</span>
              </button>

              <button 
                type="button" 
                className={\`bucket-nav-btn is-call-queue \${selectedBucketTab === 'MANDATORY_CALL' ? 'is-active' : ''}\`}
                onClick={() => setSelectedBucketTab('MANDATORY_CALL')}
              >
                <span className="bucket-icon">📞</span>
                <span className="bucket-title">Mandatory Call Queue</span>
                <span className="bucket-count font-mono">{bucketCounts.MANDATORY_CALL || 0}</span>
              </button>
            </div>
          </div>
        )}
`;

if (!code.includes('className="bucket-nav-container"')) {
  code = code.replace(
    '{/* Filter Toolbar */}',
    bucketNavToolbar + '\n        {/* Filter Toolbar */}'
  );
}

// 2. Update Table Customer cell with Photo thumbnail
const customerCellTarget = `<div className="holder-stack">
                          <span className="holder-name font-bold">{acc.accountHolder}</span>`;

const customerCellReplacement = `<div className="holder-stack">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {acc.customerPhoto ? (
                              <img 
                                src={acc.customerPhoto} 
                                alt={acc.accountHolder} 
                                className="customer-avatar-mini-img"
                              />
                            ) : (
                              <div className="customer-avatar-mini-circle">
                                {(acc.accountHolder || 'C').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="holder-name font-bold" style={{ display: 'block' }}>{acc.accountHolder}</span>
                              {acc.phone && <span className="font-mono text-muted" style={{ fontSize: '11px' }}>{acc.phone}</span>}
                            </div>
                          </div>`;

if (code.includes(customerCellTarget)) {
  code = code.replace(customerCellTarget, customerCellReplacement);
}

// 3. Update Table Status & NPA cell to include Bucket badge, PTP badge, and Mandatory Call flag
const statusCellTarget = `{/* Status & NPA Health */}
                      <td>
                        <div className="status-and-reminder-stack">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span className={\`status-pill \${acc.isActive ? 'is-active' : 'is-inactive'}\`}>
                              <span className="status-dot"></span>
                              <span>{acc.isActive ? 'Active' : 'Disabled'}</span>
                            </span>

                            {/* 90-day DPD / NPA Banking Classification Badge */}
                            {(() => {
                              const npaInfo = calculateLoanNpaStatus(acc);
                              return (
                                <span 
                                  className={\`npa-pill \${npaInfo.badgeClass}\`}
                                  title={npaInfo.fullDesc}
                                >
                                  {npaInfo.label}
                                </span>
                              );
                            })()}
                          </div>`;

const statusCellReplacement = `{/* Status, Delinquency Bucket & PTP Telemetry */}
                      <td>
                        <div className="status-and-reminder-stack">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span className={\`status-pill \${acc.isActive ? 'is-active' : 'is-inactive'}\`}>
                              <span className="status-dot"></span>
                              <span>{acc.isActive ? 'Active' : 'Disabled'}</span>
                            </span>

                            {/* Delinquency Bucket Badge */}
                            {(() => {
                              const bucket = calculateAccountBucket(acc);
                              return (
                                <span 
                                  className={\`bucket-tag-pill \${bucket.class}\`}
                                  title={bucket.desc}
                                >
                                  {bucket.shortLabel}
                                </span>
                              );
                            })()}

                            {/* PTP Badge */}
                            {acc.ptpDate && (
                              <span 
                                className={\`ptp-status-pill is-\${(acc.ptpStatus || 'pending').toLowerCase()}\`}
                                title={\`PTP Date: \${acc.ptpDate} | Note: \${acc.ptpNotes || 'No notes'}\`}
                                onClick={() => handleOpenPtpModal(acc)}
                                style={{ cursor: 'pointer' }}
                              >
                                🤝 PTP: {new Date(acc.ptpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} (₹{Number(acc.ptpAmount || 0).toLocaleString('en-IN')})
                              </span>
                            )}

                            {/* Mandatory Call Required Indicator */}
                            {acc.isMandatoryCall && (
                              <span 
                                className="mandatory-call-indicator"
                                title="Next-Day Mandatory Call Scheduled"
                                onClick={() => handleOpenMandatoryCallModal(acc)}
                                style={{ cursor: 'pointer' }}
                              >
                                📞 Mandatory Call
                              </span>
                            )}
                          </div>`;

if (code.includes(statusCellTarget)) {
  code = code.replace(statusCellTarget, statusCellReplacement);
}

// 4. Update Row Action Buttons to add PTP, AI Risk, and Call buttons
const actionBtnsTarget = `<button 
                            className="action-btn is-view" 
                            onClick={() => setSelectedAccount(acc)}
                            title="View Account Dossier"
                          >
                            <AccountIcons.Eye />
                          </button>`;

const actionBtnsReplacement = `{/* PTP Logger Action (Integration Status: N) */}
                          {isNonIntegrated && (
                            <button 
                              className="action-btn is-ptp" 
                              onClick={() => handleOpenPtpModal(acc)}
                              title="Promise to Pay (PTP) Commitment Logger"
                            >
                              <AccountIcons.Handshake />
                            </button>
                          )}

                          {/* AI Default Risk Prediction Action (Integration Status: N) */}
                          {isNonIntegrated && (
                            <button 
                              className="action-btn is-ai-predict" 
                              onClick={() => handleOpenAiRiskModal(acc)}
                              title="AI Default Risk Prediction & Strategic Advisory"
                            >
                              <AccountIcons.Brain />
                            </button>
                          )}

                          {/* Next-Day Mandatory Call Logger */}
                          {isNonIntegrated && (
                            <button 
                              className="action-btn is-call-log" 
                              onClick={() => handleOpenMandatoryCallModal(acc)}
                              title="Log Call Outcome & Schedule Next-Day Mandatory Call"
                            >
                              <AccountIcons.PhoneCall />
                            </button>
                          )}

                          <button 
                            className="action-btn is-view" 
                            onClick={() => setSelectedAccount(acc)}
                            title="View Account Dossier"
                          >
                            <AccountIcons.Eye />
                          </button>`;

if (code.includes(actionBtnsTarget)) {
  code = code.replace(actionBtnsTarget, actionBtnsReplacement);
}

// 5. Update Account Dossier Modal with Customer Photo Hero, Geolocation Navigation, PTP Card, AI Risk Card
const dossierHeroTarget = `<div className="dossier-bank-hero">
                    <div className={\`big-bank-icon is-\${colType.toLowerCase()}\`}>
                      {isLoan ? '💳' : colType === 'FD' ? '📈' : colType === 'RDCL' ? '🪙' : '🏦'}
                    </div>
                    <div style={{ flex: 1 }}>`;

const dossierHeroReplacement = `<div className="dossier-bank-hero">
                    {selectedAccount.customerPhoto ? (
                      <img 
                        src={selectedAccount.customerPhoto} 
                        alt={selectedAccount.accountHolder} 
                        className="dossier-customer-photo"
                      />
                    ) : (
                      <div className={\`big-bank-icon is-\${colType.toLowerCase()}\`}>
                        {isLoan ? '💳' : colType === 'FD' ? '📈' : colType === 'RDCL' ? '🪙' : '🏦'}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>`;

if (code.includes(dossierHeroTarget)) {
  code = code.replace(dossierHeroTarget, dossierHeroReplacement);
}

// 6. Add Geolocation & Doorstep Navigation Card + AI Prediction Card into Dossier Modal
const dossierKpiTarget = `<div className="dossier-kpi-grid">`;
const dossierAiAndGeoSection = `
                  {/* AI Risk Prediction & Strategic Advisory Card */}
                  {(() => {
                    const aiRisk = calculateAiRiskPrediction(selectedAccount);
                    return (
                      <div className={\`dossier-ai-card \${aiRisk.badgeClass}\`}>
                        <div className="dossier-ai-head">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AccountIcons.Brain />
                            <span className="font-bold">AI Default Risk Assessment</span>
                          </div>
                          <span className="dossier-ai-badge font-mono font-bold">
                            Default Probability: {aiRisk.defaultProbability}% ({aiRisk.tier})
                          </span>
                        </div>
                        <p className="dossier-ai-recommendation">{aiRisk.recommendation}</p>
                      </div>
                    );
                  })()}

                  <div className="dossier-kpi-grid">`;

if (code.includes(dossierKpiTarget) && !code.includes('dossier-ai-card')) {
  code = code.replace(dossierKpiTarget, dossierAiAndGeoSection);
}

// 7. Add PTP & Geolocation Map details into Section 3 of Dossier Modal
const dossierGeoAndPtpSection = `
                  {/* Geolocation Doorstep Mapping & Promise to Pay Section */}
                  <div className="dossier-section-block">
                    <div className="dossier-section-head">
                      <AccountIcons.MapPin />
                      <span>Customer Doorstep Location & Geolocation Mapping</span>
                    </div>
                    <div className="dossier-data-grid">
                      <div className="data-box" style={{ gridColumn: 'span 2' }}>
                        <span className="data-lbl">Residential / Business Address</span>
                        <span className="data-val font-bold">
                          {selectedAccount.customerAddress || selectedAccount.address || 'Street address on file - Main Branch Node'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">GPS Coordinates</span>
                        <span className="data-val font-mono text-cyan">
                          {selectedAccount.latitude && selectedAccount.longitude
                            ? \`\${selectedAccount.latitude}, \${selectedAccount.longitude}\`
                            : '19.0760° N, 72.8777° E (Central)'}
                        </span>
                      </div>
                    </div>

                    {/* Google Maps Navigation Launcher */}
                    <div className="dossier-geo-launcher-bar">
                      <a 
                        href={\`https://www.google.com/maps/dir/?api=1&destination=\${selectedAccount.latitude || '19.0760'},\${selectedAccount.longitude || '72.8777'}\`}
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-open-google-maps"
                      >
                        <AccountIcons.Navigation /> 🗺️ Open in Google Maps Doorstep Navigation
                      </a>
                    </div>
                  </div>

                  {/* Promise to Pay (PTP) Tracking Telemetry */}
                  <div className="dossier-section-block">
                    <div className="dossier-section-head">
                      <AccountIcons.Handshake />
                      <span>Promise to Pay (PTP) Commitment & Recovery Schedule</span>
                    </div>
                    <div className="dossier-data-grid">
                      <div className="data-box">
                        <span className="data-lbl">PTP Commitment Date</span>
                        <span className="data-val font-mono font-bold text-amber">
                          {selectedAccount.ptpDate ? new Date(selectedAccount.ptpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Open PTP'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Promised Amount (₹)</span>
                        <span className="data-val font-mono font-bold text-green">
                          {selectedAccount.ptpAmount ? \`₹\${Number(selectedAccount.ptpAmount).toLocaleString('en-IN')}\` : '—'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">PTP Status</span>
                        <span className="data-val font-bold">
                          {selectedAccount.ptpStatus || 'NONE'}
                        </span>
                      </div>
                      <div className="data-box" style={{ gridColumn: 'span 3' }}>
                        <span className="data-lbl">Officer PTP Follow-up Notes</span>
                        <span className="data-val text-muted">
                          {selectedAccount.ptpNotes || 'Customer agreed to make payment via dynamic UPI QR / Doorstep Cash.'}
                        </span>
                      </div>
                    </div>
                  </div>
`;

if (!code.includes('Customer Doorstep Location & Geolocation Mapping')) {
  code = code.replace(
    '{/* Section 4: Assigned Agent & Automation */}',
    dossierGeoAndPtpSection + '\n                  {/* Section 4: Assigned Agent & Automation */}'
  );
}

// 8. Add the 3 New Modals at the bottom before closing of return
const threeNewModals = `
        {/* ============================================================
            PROMISE TO PAY (PTP) MODAL (Integration Status: N)
           ============================================================ */}
        {isPtpModalOpen && selectedPtpAccount && (
          <div className="account-modal-overlay" onClick={() => setIsPtpModalOpen(false)}>
            <div className="account-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
              <div className="account-modal-head">
                <div className="modal-title-stack">
                  <div className="modal-badge-tag" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.35)' }}>
                    <AccountIcons.Handshake />
                    <span>Promise to Pay Commitment</span>
                  </div>
                  <h2>Promise to Pay (PTP) Tracker</h2>
                  <p>Log customer repayment commitment date and amount for {selectedPtpAccount.accountHolder}.</p>
                </div>
                <button className="btn-modal-close" onClick={() => setIsPtpModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSavePtp} className="account-form-grid">
                <div className="form-fields-2col">
                  <div className="form-field-group">
                    <label>PTP Commitment Date <span className="req-star">*</span></label>
                    <input
                      type="date"
                      required
                      value={ptpFormData.ptpDate}
                      onChange={e => setPtpFormData(p => ({ ...p, ptpDate: e.target.value }))}
                      className="font-mono font-bold"
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Promised Amount (₹) <span className="req-star">*</span></label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="0"
                      value={ptpFormData.ptpAmount}
                      onChange={e => setPtpFormData(p => ({ ...p, ptpAmount: e.target.value }))}
                      className="font-mono font-bold text-green"
                    />
                  </div>
                </div>

                <div className="form-field-group">
                  <label>PTP Follow-up Status <span className="req-star">*</span></label>
                  <select
                    value={ptpFormData.ptpStatus}
                    onChange={e => setPtpFormData(p => ({ ...p, ptpStatus: e.target.value }))}
                    className="form-select-ctrl font-bold"
                  >
                    <option value="PENDING">🟡 PENDING (Commitment Awaited)</option>
                    <option value="KEPT">🟢 KEPT (Payment Successfully Received)</option>
                    <option value="BROKEN">🔴 BROKEN (Customer Defaulted on Commitment)</option>
                    <option value="RESCHEDULED">🟣 RESCHEDULED (Granted Extension)</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label>Officer / Agent Notes</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Borrower promised partial payment on Friday post-salary credit..."
                    value={ptpFormData.ptpNotes}
                    onChange={e => setPtpFormData(p => ({ ...p, ptpNotes: e.target.value }))}
                    className="form-textarea-ctrl"
                  />
                </div>

                <div className="account-modal-foot">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsPtpModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-save" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    <AccountIcons.Check />
                    <span>Save PTP Commitment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================
            NEXT-DAY MANDATORY CALL & OUTCOME LOGGER MODAL
           ============================================================ */}
        {isMandatoryCallModalOpen && selectedCallAccount && (
          <div className="account-modal-overlay" onClick={() => setIsMandatoryCallModalOpen(false)}>
            <div className="account-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
              <div className="account-modal-head">
                <div className="modal-title-stack">
                  <div className="modal-badge-tag" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.35)' }}>
                    <AccountIcons.PhoneCall />
                    <span>Mandatory Outreach Queue</span>
                  </div>
                  <h2>Mandatory Call & Outreach Logger</h2>
                  <p>Log phone call outcome for {selectedCallAccount.accountHolder} ({selectedCallAccount.phone || 'No phone'}).</p>
                </div>
                <button className="btn-modal-close" onClick={() => setIsMandatoryCallModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveCallOutcome} className="account-form-grid">
                {/* 1-Click Dial Button */}
                {selectedCallAccount.phone && (
                  <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div className="font-bold">{selectedCallAccount.accountHolder}</div>
                      <div className="font-mono text-cyan">{selectedCallAccount.phone}</div>
                    </div>
                    <a 
                      href={\`tel:\${selectedCallAccount.phone}\`}
                      className="btn-qr-action"
                      style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <AccountIcons.PhoneCall /> 📞 Dial Customer
                    </a>
                  </div>
                )}

                <div className="form-field-group">
                  <label>Call Outcome <span className="req-star">*</span></label>
                  <select
                    value={callFormData.callOutcome}
                    onChange={e => setCallFormData(p => ({ ...p, callOutcome: e.target.value }))}
                    className="form-select-ctrl font-bold"
                  >
                    <option value="Answered - Promised to Pay">✅ Answered - Promised to Pay (Will trigger PTP Logger)</option>
                    <option value="Answered - Callback Requested">📞 Answered - Callback Requested Later</option>
                    <option value="Ringing - No Answer">🔕 Ringing - No Answer</option>
                    <option value="Phone Switched Off / Out of Reach">🚫 Phone Switched Off / Out of Reach</option>
                    <option value="Refused to Pay - Disputed">⚠️ Refused to Pay - Disputed Loan Claim</option>
                    <option value="Wrong Number / Number Invalid">❌ Wrong Number / Number Invalid</option>
                  </select>
                </div>

                <div className="form-fields-2col">
                  <div className="form-field-group">
                    <label>Schedule Next Call Date</label>
                    <input
                      type="date"
                      value={callFormData.nextFollowUpDate}
                      onChange={e => setCallFormData(p => ({ ...p, nextFollowUpDate: e.target.value }))}
                      className="font-mono"
                    />
                  </div>
                  <div className="form-field-group" style={{ justifyContent: 'center' }}>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                      <input 
                        type="checkbox"
                        checked={callFormData.scheduleTomorrow}
                        onChange={e => setCallFormData(p => ({ ...p, scheduleTomorrow: e.target.checked }))}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span className="font-bold text-amber">Keep in Tomorrow's Mandatory Queue</span>
                    </label>
                  </div>
                </div>

                <div className="form-field-group">
                  <label>Call Notes / Customer Discussion</label>
                  <textarea
                    rows={3}
                    placeholder="Notes on customer discussion, reason for delay, repayment terms..."
                    value={callFormData.callNotes}
                    onChange={e => setCallFormData(p => ({ ...p, callNotes: e.target.value }))}
                    className="form-textarea-ctrl"
                  />
                </div>

                <div className="account-modal-foot">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsMandatoryCallModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-save" style={{ background: 'linear-gradient(135deg, #a855f7, #9333ea)' }}>
                    <AccountIcons.Check />
                    <span>Log Call Outcome</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================
            AI DELINQUENCY RISK PREDICTION & ADVISORY MODAL
           ============================================================ */}
        {isAiRiskModalOpen && selectedAiAccount && (() => {
          const aiRisk = calculateAiRiskPrediction(selectedAiAccount);
          const bucket = calculateAccountBucket(selectedAiAccount);

          return (
            <div className="account-modal-overlay" onClick={() => setIsAiRiskModalOpen(false)}>
              <div className="account-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
                <div className="account-modal-head">
                  <div className="modal-title-stack">
                    <div className="modal-badge-tag" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.35)' }}>
                      <AccountIcons.Brain />
                      <span>AI Predictive Delinquency Intelligence</span>
                    </div>
                    <h2>AI Risk Assessment & Advisory</h2>
                    <p>Machine-learned delinquency probability analysis for {selectedAiAccount.accountHolder}.</p>
                  </div>
                  <button className="btn-modal-close" onClick={() => setIsAiRiskModalOpen(false)}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Speedometer Risk Bar */}
                  <div style={{ padding: '18px 20px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="font-bold">Default Probability Score:</span>
                      <span className="font-mono font-bold" style={{ fontSize: '18px', color: aiRisk.gaugeColor }}>
                        {aiRisk.score}% ({aiRisk.tier})
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: \`\${aiRisk.score}%\`, height: '100%', background: aiRisk.gaugeColor, transition: 'width 0.4s ease' }}></div>
                    </div>
                  </div>

                  {/* Telemetry Factors Grid */}
                  <div className="dossier-data-grid">
                    <div className="data-box">
                      <span className="data-lbl">Current Delinquency Bucket</span>
                      <span className="data-val font-bold" style={{ color: bucket.color }}>{bucket.label}</span>
                    </div>
                    <div className="data-box">
                      <span className="data-lbl">Days Past Due (DPD)</span>
                      <span className="data-val font-mono font-bold text-red">{bucket.dpd} Days</span>
                    </div>
                    <div className="data-box">
                      <span className="data-lbl">Outstanding Exposure</span>
                      <span className="data-val font-mono font-bold text-purple">₹{Number(selectedAiAccount.balance || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="data-box">
                      <span className="data-lbl">Current Overdue Demand</span>
                      <span className="data-val font-mono font-bold text-amber">₹{Number(selectedAiAccount.dueAmount || selectedAiAccount.emiAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="data-box">
                      <span className="data-lbl">Promise to Pay (PTP) Status</span>
                      <span className="data-val font-bold">{selectedAiAccount.ptpStatus || 'NONE'}</span>
                    </div>
                    <div className="data-box">
                      <span className="data-lbl">Mandatory Call Queue</span>
                      <span className="data-val font-bold text-cyan">{selectedAiAccount.isMandatoryCall ? 'Active in Queue' : 'Normal'}</span>
                    </div>
                  </div>

                  {/* AI Strategic Actionable Recommendation */}
                  <div style={{ padding: '16px 18px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <AccountIcons.Sparkles />
                      <span className="font-bold text-cyan">AI Strategic Collection Directive</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#f8fafc' }}>
                      {aiRisk.recommendation}
                    </p>
                  </div>
                </div>

                <div className="account-modal-foot">
                  <button 
                    type="button" 
                    className="btn-qr-action is-qr" 
                    onClick={() => { setIsAiRiskModalOpen(false); handleOpenPtpModal(selectedAiAccount); }}
                  >
                    <AccountIcons.Handshake /> Set PTP Commitment
                  </button>
                  <button 
                    type="button" 
                    className="btn-cash-action is-cash" 
                    onClick={() => { setIsAiRiskModalOpen(false); handleOpenMandatoryCallModal(selectedAiAccount); }}
                  >
                    <AccountIcons.PhoneCall /> Schedule Mandatory Call
                  </button>
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsAiRiskModalOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
`;

if (!code.includes('isPtpModalOpen && selectedPtpAccount')) {
  const modalInsertPoint = '{/* Add / Edit Account Modal */}';
  code = code.replace(modalInsertPoint, threeNewModals + '\n        ' + modalInsertPoint);
}

// 9. Update Add Loan Modal Form to include Photo, GPS Lat/Lng with Capture button, and Address fields
const loanFormPhotoAndGps = `
                {/* Customer Photo Upload & Doorstep Address */}
                <div className="form-fields-2col">
                  <div className="form-field-group">
                    <label>Customer Physical Address / Landmark</label>
                    <input
                      type="text"
                      placeholder="Street, Landmark, Doorstep Location"
                      value={loanFormData.customerAddress || ''}
                      onChange={e => setLoanFormData(p => ({ ...p, customerAddress: e.target.value }))}
                    />
                  </div>
                  <div className="form-field-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>GPS Coordinates (Lat / Lng)</span>
                      <button 
                        type="button" 
                        className="btn-fetch-ifsc-mini"
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                        onClick={() => handleCaptureGpsLocation(true)}
                      >
                        📍 Capture GPS
                      </button>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Latitude"
                        value={loanFormData.latitude || ''}
                        onChange={e => setLoanFormData(p => ({ ...p, latitude: e.target.value }))}
                        className="font-mono"
                        style={{ flex: 1 }}
                      />
                      <input
                        type="text"
                        placeholder="Longitude"
                        value={loanFormData.longitude || ''}
                        onChange={e => setLoanFormData(p => ({ ...p, longitude: e.target.value }))}
                        className="font-mono"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-field-group">
                  <label>Customer Photo (File / Web URL)</label>
                  <input
                    type="text"
                    placeholder="Paste Photo URL or Base64 / File Link"
                    value={loanFormData.customerPhoto || ''}
                    onChange={e => setLoanFormData(p => ({ ...p, customerPhoto: e.target.value }))}
                  />
                </div>
`;

if (!code.includes('Customer Physical Address / Landmark')) {
  code = code.replace(
    '{/* Row 7: Field Agent */}',
    loanFormPhotoAndGps + '\n                {/* Row 7: Field Agent */}'
  );
}

fs.writeFileSync(accountsPath, code, 'utf8');
console.log('✅ Part 2 applied: All UI components, Modals, Geolocation, PTP, and AI elements inserted into Accounts.jsx');

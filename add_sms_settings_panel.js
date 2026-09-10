const fs = require('fs');
const babel = require('@babel/parser');

const settingsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\settings\\Settings.jsx';
let code = fs.readFileSync(settingsPath, 'utf8');

// 1. Add MessageSquare Icon and SMS imports
if (!code.includes('getSmsConfig')) {
  code = code.replace(
    "import { useTheme } from '../../context/ThemeContext';",
    `import { useTheme } from '../../context/ThemeContext';
import { 
  getSmsConfig, 
  saveSmsConfig, 
  getSmsLogs, 
  sendSmsMessage, 
  sendOtpSms, 
  sendPaymentReceiptSms, 
  sendDueReminderSms,
  DLT_TEMPLATES 
} from '../../services/smsService';`
  );

  code = code.replace(
    "Building: () => (",
    `MessageSquare: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Phone: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Building: () => (`
  );
}

// 2. Add SMS state and tabs
if (!code.includes('sms_gateway')) {
  code = code.replace(
    "{ id: 'preferences', label: 'Portal Preferences', icon: <SettingsIcons.Palette /> },",
    `{ id: 'preferences', label: 'Portal Preferences', icon: <SettingsIcons.Palette /> },
    { id: 'sms_gateway', label: 'SMS & DLT Gateway', icon: <SettingsIcons.MessageSquare />, badge: 'Dual Header' },`
  );

  // Add SMS form state
  const smsStateInit = `
  // SMS & DLT Gateway Configuration State
  const [smsConfig, setSmsConfig] = useState(getSmsConfig());
  const [smsLogs, setSmsLogs] = useState([]);
  const [testSmsForm, setTestSmsForm] = useState({
    mobileNumber: '',
    templateKey: 'PAYMENT_RECEIVED',
    customerName: 'Rajesh Sharma',
    amount: '12500',
    accountNumber: 'LN1004891',
    receiptNumber: 'REC-90821',
    remainingBalance: '237500',
    otp: '582910'
  });
  const [testSending, setTestSending] = useState(false);
  const [selectedTemplateTab, setSelectedTemplateTab] = useState('PAYMENT_RECEIVED');

  useEffect(() => {
    setSmsConfig(getSmsConfig(profile.merchantId));
    setSmsLogs(getSmsLogs());
  }, [profile.merchantId]);

  const handleSaveSmsConfig = (e) => {
    e.preventDefault();
    const ok = saveSmsConfig(smsConfig, profile.merchantId);
    if (ok) {
      showSuccess(\`SMS configuration saved! Routing via \${smsConfig.routingMode === 'CUSTOM_MERCHANT' && smsConfig.customHeader ? smsConfig.customHeader.toUpperCase() : 'Default ECOLCT Header'}\`, 'SMS Settings Updated');
    } else {
      showError('Failed to save SMS settings', 'Save Error');
    }
  };

  const handleSendTestSms = async (e) => {
    e.preventDefault();
    if (!testSmsForm.mobileNumber) {
      showError('Please enter a recipient mobile number', 'Mobile Required');
      return;
    }
    setTestSending(true);
    try {
      const res = await sendSmsMessage({
        templateKey: testSmsForm.templateKey,
        recipientMobile: testSmsForm.mobileNumber,
        variables: {
          customerName: testSmsForm.customerName,
          amount: testSmsForm.amount,
          accountNumber: testSmsForm.accountNumber,
          receiptNumber: testSmsForm.receiptNumber,
          remainingBalance: testSmsForm.remainingBalance,
          otp: testSmsForm.otp,
          dueDate: new Date(Date.now() + 86400000 * 5).toLocaleDateString('en-IN'),
          dueAmount: testSmsForm.amount,
          paymentLink: 'https://pay.ecollect.in/p/demo9821',
          paymentUrl: 'https://pay.ecollect.in/p/demo9821'
        },
        merchantId: profile.merchantId,
        merchantName: profile.company || 'eCollect'
      });

      if (res.success) {
        showSuccess(res.message, 'SMS Dispatched');
        setSmsLogs(getSmsLogs());
      } else {
        showError(res.message, 'Dispatch Failed');
      }
    } catch (err) {
      showError('Failed to dispatch test SMS message', 'Error');
    } finally {
      setTestSending(false);
    }
  };
  `;

  code = code.replace(
    "const initials = profile.fullName",
    smsStateInit + "\n  const initials = profile.fullName"
  );
}

// 3. Add Tab Pane JSX for SMS Gateway
const smsTabPaneJsx = `
            {/* TAB 5: SMS & DLT GATEWAY HUB (DUAL HEADER ROUTING) */}
            {activeTab === 'sms_gateway' && (
              <div className="tab-pane-form">
                
                {/* Header Zone */}
                <div className="pane-header-zone">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 className="pane-title">SMS Gateway & TRAI DLT Header Routing</h3>
                      <p className="pane-desc">Configure customer notification headers (eCollect Default vs Entity Custom DLT Header)</p>
                    </div>
                    <span className="user-verified-badge" style={{ fontSize: '11px', padding: '4px 10px' }}>
                      <SettingsIcons.ShieldCheck />
                      <span>TRAI DLT / 100% Telecom Compliant</span>
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSaveSmsConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Routing Mode Selector Card */}
                  <div style={{ padding: '16px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <label className="field-label" style={{ marginBottom: '10px', display: 'block', fontSize: '13px', fontWeight: 700, color: '#818cf8' }}>
                      📡 Select SMS Header & Entity Routing Mode
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      
                      {/* Mode A: Platform Default */}
                      <div 
                        onClick={() => setSmsConfig(p => ({ ...p, routingMode: 'PLATFORM_DEFAULT' }))}
                        style={{ 
                          padding: '14px 16px', 
                          borderRadius: '12px', 
                          cursor: 'pointer',
                          background: smsConfig.routingMode === 'PLATFORM_DEFAULT' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                          border: smsConfig.routingMode === 'PLATFORM_DEFAULT' ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className="font-bold" style={{ color: '#fff', fontSize: '13.5px' }}>🏷️ eCollect Platform Header</span>
                          {smsConfig.routingMode === 'PLATFORM_DEFAULT' && <span style={{ color: '#10b981', fontWeight: 700, fontSize: '12px' }}>✓ Active</span>}
                        </div>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                          For entities without separate DLT registration. Dispatches standard OTP, payment receipts & due reminders via pre-approved <strong>ECOLCT / FINPAY</strong> headers.
                        </p>
                      </div>

                      {/* Mode B: Custom Merchant Header */}
                      <div 
                        onClick={() => setSmsConfig(p => ({ ...p, routingMode: 'CUSTOM_MERCHANT' }))}
                        style={{ 
                          padding: '14px 16px', 
                          borderRadius: '12px', 
                          cursor: 'pointer',
                          background: smsConfig.routingMode === 'CUSTOM_MERCHANT' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                          border: smsConfig.routingMode === 'CUSTOM_MERCHANT' ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className="font-bold" style={{ color: '#fff', fontSize: '13.5px' }}>🏢 Custom Entity DLT Header (BYO)</span>
                          {smsConfig.routingMode === 'CUSTOM_MERCHANT' && <span style={{ color: '#10b981', fontWeight: 700, fontSize: '12px' }}>✓ Active</span>}
                        </div>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                          For banks and corporate merchants with their own registered <strong>6-char DLT Header</strong> (e.g. HDFCBK, FINWIN), Principal Entity ID (PE ID), and custom SMS gateway.
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Gateway Parameters Form */}
                  <div className="settings-fields-grid">
                    
                    {smsConfig.routingMode === 'CUSTOM_MERCHANT' ? (
                      <>
                        <div className="settings-input-group">
                          <label className="field-label">Custom DLT Sender Header (6 Characters) <span className="req-star" style={{ color: '#ef4444' }}>*</span></label>
                          <input 
                            type="text"
                            maxLength={6}
                            placeholder="e.g. FINWIN, HDFCBK, SBINPS"
                            className="settings-field-input font-mono uppercase"
                            value={smsConfig.customHeader || ''}
                            onChange={(e) => setSmsConfig({ ...smsConfig, customHeader: e.target.value.toUpperCase() })}
                          />
                        </div>

                        <div className="settings-input-group">
                          <label className="field-label">DLT Principal Entity ID (PE ID) <span className="req-star" style={{ color: '#ef4444' }}>*</span></label>
                          <input 
                            type="text"
                            placeholder="e.g. 1101552990000012345"
                            className="settings-field-input font-mono"
                            value={smsConfig.principalEntityId || ''}
                            onChange={(e) => setSmsConfig({ ...smsConfig, principalEntityId: e.target.value })}
                          />
                        </div>

                        <div className="settings-input-group">
                          <label className="field-label">SMS Gateway Provider</label>
                          <select 
                            className="settings-field-input font-mono"
                            value={smsConfig.provider}
                            onChange={(e) => setSmsConfig({ ...smsConfig, provider: e.target.value })}
                          >
                            <option value="ECOLLECT_GATEWAY">eCollect Internal Telephony Gateway</option>
                            <option value="GUPSHUP">Gupshup Enterprise SMS</option>
                            <option value="FAST2SMS">Fast2SMS Gateway</option>
                            <option value="MSG91">MSG91 Transactional Hub</option>
                            <option value="TEXTLOCAL">Textlocal India</option>
                            <option value="TWILIO">Twilio Global SMS</option>
                          </select>
                        </div>

                        <div className="settings-input-group">
                          <label className="field-label">Gateway API Key / Token</label>
                          <input 
                            type="password"
                            placeholder="Enter gateway API authorization key"
                            className="settings-field-input font-mono"
                            value={smsConfig.apiKey || ''}
                            onChange={(e) => setSmsConfig({ ...smsConfig, apiKey: e.target.value })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="settings-input-group">
                          <label className="field-label">Platform Sender Header</label>
                          <input 
                            type="text"
                            disabled
                            className="settings-field-input font-mono"
                            value="ECOLCT (Default Managed by Platform)"
                          />
                        </div>

                        <div className="settings-input-group">
                          <label className="field-label">DLT Entity Status</label>
                          <input 
                            type="text"
                            disabled
                            className="settings-field-input font-mono text-green"
                            style={{ color: '#10b981' }}
                            value="✓ Platform Principal Entity Verified & Active"
                          />
                        </div>
                      </>
                    )}

                  </div>

                  {/* SMS Event Dispatch Toggles */}
                  <div className="settings-notification-stack">
                    <span className="stack-title">⚡ Automated SMS Dispatch Events</span>

                    <div className="toggle-item-row">
                      <div className="toggle-info">
                        <span className="toggle-label font-bold">🔐 Authentication OTP Dispatch</span>
                        <span className="toggle-desc">Automatically send 6-digit OTP via SMS on login, 2FA, and password reset requests</span>
                      </div>
                      <label className="switch-wrapper">
                        <input
                          type="checkbox"
                          checked={smsConfig.enableOtpSms !== false}
                          onChange={(e) => setSmsConfig({ ...smsConfig, enableOtpSms: e.target.checked })}
                        />
                        <span className="slider-round"></span>
                      </label>
                    </div>

                    <div className="toggle-item-row">
                      <div className="toggle-info">
                        <span className="toggle-label font-bold">🧾 Payment Received Receipt SMS</span>
                        <span className="toggle-desc">Automatically send instant receipt SMS to customer when Cash, QR, or Link payment succeeds</span>
                      </div>
                      <label className="switch-wrapper">
                        <input
                          type="checkbox"
                          checked={smsConfig.enablePaymentReceiptSms !== false}
                          onChange={(e) => setSmsConfig({ ...smsConfig, enablePaymentReceiptSms: e.target.checked })}
                        />
                        <span className="slider-round"></span>
                      </label>
                    </div>

                    <div className="toggle-item-row">
                      <div className="toggle-info">
                        <span className="toggle-label font-bold">⏰ Daily Due Demand & Installment Reminders</span>
                        <span className="toggle-desc">Trigger SMS notifications for upcoming and overdue loan/deposit installments</span>
                      </div>
                      <label className="switch-wrapper">
                        <input
                          type="checkbox"
                          checked={smsConfig.enableDueReminderSms !== false}
                          onChange={(e) => setSmsConfig({ ...smsConfig, enableDueReminderSms: e.target.checked })}
                        />
                        <span className="slider-round"></span>
                      </label>
                    </div>

                    <div className="toggle-item-row">
                      <div className="toggle-info">
                        <span className="toggle-label font-bold">🤝 Promise to Pay (PTP) Acknowledgement</span>
                        <span className="toggle-desc">Send customer confirmation SMS when field officer records a PTP commitment date</span>
                      </div>
                      <label className="switch-wrapper">
                        <input
                          type="checkbox"
                          checked={smsConfig.enablePtpSms !== false}
                          onChange={(e) => setSmsConfig({ ...smsConfig, enablePtpSms: e.target.checked })}
                        />
                        <span className="slider-round"></span>
                      </label>
                    </div>

                  </div>

                  <div className="form-action-bar">
                    <button type="submit" className="settings-action-btn">
                      <SettingsIcons.Save />
                      <span>Save SMS Gateway Configuration</span>
                    </button>
                  </div>
                </form>

                {/* DLT Approved Templates Explorer */}
                <div style={{ marginTop: '28px', padding: '20px', borderRadius: '16px', background: 'var(--bgCard, #111827)', border: '1px solid var(--borderColor, rgba(255, 255, 255, 0.12))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>📋 Approved DLT Message Templates</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>TRAI registered templates with dynamic placeholders</p>
                    </div>
                  </div>

                  {/* Template Navigation Pills */}
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
                    {Object.keys(DLT_TEMPLATES).map((key) => {
                      const t = DLT_TEMPLATES[key];
                      const isSel = selectedTemplateTab === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedTemplateTab(key);
                            setTestSmsForm(p => ({ ...p, templateKey: key }));
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: isSel ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            border: isSel ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: isSel ? '#818cf8' : '#94a3b8',
                            fontSize: '12px',
                            fontWeight: isSel ? 700 : 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Template Card */}
                  {(() => {
                    const currentTmpl = DLT_TEMPLATES[selectedTemplateTab] || DLT_TEMPLATES.PAYMENT_RECEIVED;
                    const sampleSender = smsConfig.routingMode === 'CUSTOM_MERCHANT' && smsConfig.customHeader ? smsConfig.customHeader.toUpperCase() : 'ECOLCT';
                    let samplePreview = currentTmpl.templateText
                      .replace('{#var1#}', testSmsForm.customerName || 'Rajesh Sharma')
                      .replace('{#var2#}', 'Rs.' + Number(testSmsForm.amount || 12500).toLocaleString('en-IN'))
                      .replace('{#var3#}', testSmsForm.accountNumber || 'LN1004891')
                      .replace('{#var4#}', testSmsForm.receiptNumber || 'REC-90821')
                      .replace('{#var5#}', 'Rs.' + Number(testSmsForm.remainingBalance || 237500).toLocaleString('en-IN'))
                      .replace('{#sender#}', sampleSender);

                    return (
                      <div style={{ padding: '16px', borderRadius: '12px', background: '#0f172a', border: '1px dashed rgba(99, 102, 241, 0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8' }}>
                          <span className="font-mono">Template ID: <strong style={{ color: '#818cf8' }}>{currentTmpl.id}</strong></span>
                          <span className="font-mono">Category: <strong style={{ color: '#10b981' }}>{currentTmpl.category}</strong></span>
                          <span>Sender: <strong style={{ color: '#38bdf8' }}>{sampleSender}</strong></span>
                        </div>
                        <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', fontSize: '13px', lineHeight: 1.5, color: '#f8fafc', fontFamily: 'monospace' }}>
                          💬 {samplePreview}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                          Character Count: {samplePreview.length} / 160 GSM Chars (1 SMS Credit)
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Interactive Test SMS Dispatcher */}
                <div style={{ marginTop: '24px', padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 800, color: '#10b981' }}>📱 Live Test SMS Dispatcher</h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94a3b8' }}>Verify real-time message delivery and DLT header formatting to any mobile number.</p>

                  <form onSubmit={handleSendTestSms} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <label className="field-label" style={{ fontSize: '11.5px', marginBottom: '4px' }}>Recipient Mobile Number</label>
                      <input 
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit number (e.g. 9876543210)"
                        className="settings-field-input font-mono"
                        value={testSmsForm.mobileNumber}
                        onChange={(e) => setTestSmsForm({ ...testSmsForm, mobileNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ flex: '1 1 180px' }}>
                      <label className="field-label" style={{ fontSize: '11.5px', marginBottom: '4px' }}>Message Template</label>
                      <select
                        className="settings-field-input font-mono"
                        value={testSmsForm.templateKey}
                        onChange={(e) => {
                          setTestSmsForm({ ...testSmsForm, templateKey: e.target.value });
                          setSelectedTemplateTab(e.target.value);
                        }}
                      >
                        {Object.keys(DLT_TEMPLATES).map((k) => (
                          <option key={k} value={k}>{DLT_TEMPLATES[k].name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      disabled={testSending}
                      className="settings-action-btn"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', padding: '10px 18px', height: '42px' }}
                    >
                      <SettingsIcons.Send />
                      <span>{testSending ? 'Sending...' : 'Send Live Test SMS'}</span>
                    </button>
                  </form>
                </div>

                {/* SMS Delivery Telemetry Log Table */}
                <div style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>📜 Live SMS Telemetry & Delivery Ledger</h4>
                    <span className="font-mono text-muted" style={{ fontSize: '11.5px' }}>Showing {smsLogs.length} recent messages</span>
                  </div>

                  {smsLogs.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '12.5px' }}>
                      No SMS dispatches recorded in this session yet. Test sending above to verify delivery.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'monospace' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255, 255, 255, 0.04)', textAlign: 'left', color: '#94a3b8' }}>
                            <th style={{ padding: '10px 14px' }}>Time</th>
                            <th style={{ padding: '10px 14px' }}>Recipient</th>
                            <th style={{ padding: '10px 14px' }}>Header / Sender</th>
                            <th style={{ padding: '10px 14px' }}>Template</th>
                            <th style={{ padding: '10px 14px' }}>Status</th>
                            <th style={{ padding: '10px 14px' }}>Message Preview</th>
                          </tr>
                        </thead>
                        <tbody>
                          {smsLogs.map((log) => (
                            <tr key={log.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                                {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </td>
                              <td style={{ padding: '10px 14px', fontWeight: 700, color: '#38bdf8' }}>{log.recipientMobile}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 700 }}>
                                  {log.headerUsed}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{log.templateName}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>● {log.status}</span>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#94a3b8', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.messageBody}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}
`;

if (!code.includes('TAB 5: SMS & DLT GATEWAY HUB')) {
  code = code.replace(
    "{/* TAB 4: PORTAL PREFERENCES */}",
    smsTabPaneJsx + "\n            {/* TAB 4: PORTAL PREFERENCES */}"
  );
}

fs.writeFileSync(settingsPath, code, 'utf8');
console.log('✅ Settings.jsx updated with complete SMS & DLT Gateway Hub');

import React, { useState, useEffect } from 'react';
import { whatsAppApi } from '../../services/api';
import './Settings.css';

const DEFAULT_TEMPLATES = [
  {
    templateName: 'paymentlink',
    displayName: 'Payment Link Notification',
    category: 'Transactional',
    costPerMessage: 0.85,
    description: 'Send direct payment collection links to customers for fast digital collection.',
    parameterKeys: ['PaymentLinkUrl'],
    sampleValues: ['https://mydop.in/adss/balance/report/filter']
  },
  {
    templateName: 'payment_confirmation',
    displayName: 'Payment Receipt Confirmation',
    category: 'Transactional',
    costPerMessage: 0.85,
    description: 'Instant receipt confirmation notice when customer payment is successfully processed.',
    parameterKeys: ['CustomerName', 'Amount', 'ReceiptNo'],
    sampleValues: ['Noyal Johnson', '₹ 1,500.00', 'RCP-882190']
  },
  {
    templateName: 'account_adding',
    displayName: 'Account Welcome & Creation Alert',
    category: 'Transactional',
    costPerMessage: 0.85,
    description: 'Welcome notice dispatched when a new RD / Loan account is assigned to customer.',
    parameterKeys: ['CustomerName', 'AccountNumber', 'AccountType'],
    sampleValues: ['Noyal Johnson', 'RD-2026-9941', 'Recurrent Deposit']
  },
  {
    templateName: 'due_reminder',
    displayName: 'Daily Collection Due Reminder',
    category: 'Utility',
    costPerMessage: 0.85,
    description: 'Automated due payment notice sent to customers with direct payment link.',
    parameterKeys: ['CustomerName', 'DueAmount', 'DueDate', 'PayLink'],
    sampleValues: ['Noyal Johnson', '₹ 500.00', '08-Sep-2026', 'https://mydop.in/pay/due-991']
  }
];

const WhatsAppConfig = () => {
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('whatsapp_api_key') || 'de593981-a601-11f1-af5a-a8a159c17b9a'
  );
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Selected template for tester
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATES[0]);
  const [testPhoneNumber, setTestPhoneNumber] = useState('9496438167');
  const [paramsInput, setParamsInput] = useState({
    PaymentLinkUrl: 'https://mydop.in/adss/balance/report/filter'
  });

  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Merchant ID from localStorage
  const merchantId = localStorage.getItem('merchantId') || 22;

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await whatsAppApi.getTemplates();
      if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setTemplates(res.data.data);
      }
    } catch (err) {
      console.warn('Using default template schema');
    }
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('whatsapp_api_key', apiKey.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSelectTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    setTestResult(null);
    setErrorMessage('');

    // Pre-fill default params
    const initialParams = {};
    tmpl.parameterKeys.forEach((key, idx) => {
      initialParams[key] = tmpl.sampleValues?.[idx] || '';
    });
    setParamsInput(initialParams);
  };

  const handleParamChange = (key, val) => {
    setParamsInput((prev) => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTestResult(null);
    setErrorMessage('');

    const formattedParams = selectedTemplate.parameterKeys.map(
      (k) => paramsInput[k] || ''
    );

    const payload = {
      merchantId: Number(merchantId),
      phoneNumber: testPhoneNumber.trim(),
      templateName: selectedTemplate.templateName,
      parameters: formattedParams,
      customApiKey: apiKey.trim()
    };

    try {
      const res = await whatsAppApi.sendTestMessage(payload);
      if (res.data && res.data.isSuccess) {
        setTestResult(res.data);
      } else {
        setErrorMessage(res.data?.message || 'Failed to send WhatsApp message.');
      }
    } catch (err) {
      console.error('WhatsApp Test error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Error connecting to WhatsApp Gateway API'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="whatsapp-config-wrapper">
      {/* Header Banner */}
      <div className="wa-header-banner">
        <div className="wa-header-info">
          <div className="wa-icon-badge">
            <i className="bi bi-whatsapp"></i>
          </div>
          <div>
            <h3>Telinfy WhatsApp Business API</h3>
            <p>Direct WhatsApp messaging engine for automated collection alerts, payment links & receipts.</p>
          </div>
        </div>
        <div className="wa-cost-pill">
          <span className="wa-cost-label">Message Rate:</span>
          <span className="wa-cost-val">₹0.85 / msg</span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="wa-content-grid">
        {/* Left Column: API Credentials & Available Templates */}
        <div className="wa-col-left">
          {/* API Key Configuration Card */}
          <div className="settings-card glass-card mb-4">
            <div className="settings-card-header">
              <h4>
                <i className="bi bi-key-fill me-2 text-warning"></i>
                Telinfy API Credentials
              </h4>
            </div>
            <div className="settings-card-body">
              <div className="form-group mb-3">
                <label className="form-label">Telinfy API Key Header (x-api-key)</label>
                <div className="input-group">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="form-control font-monospace"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter Telinfy x-api-key"
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                  >
                    <i className={`bi ${showKey ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
                <small className="form-text text-muted">
                  Default API Key: <code className="text-info">de593981-a601-11f1-af5a-a8a159c17b9a</code>
                </small>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <button
                  className="btn btn-primary px-4"
                  onClick={handleSaveApiKey}
                >
                  <i className="bi bi-check-circle me-1"></i> Save API Key
                </button>
                {isSaved && (
                  <span className="badge bg-success p-2 fade-in">
                    <i className="bi bi-check2 me-1"></i> API Key Saved!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Approved Templates List */}
          <div className="settings-card glass-card">
            <div className="settings-card-header d-flex justify-content-between align-items-center">
              <h4>
                <i className="bi bi-chat-quote-fill me-2 text-info"></i>
                Approved WhatsApp Templates
              </h4>
              <span className="badge bg-primary rounded-pill">{templates.length} Templates</span>
            </div>
            <div className="settings-card-body p-0">
              <div className="wa-template-list">
                {templates.map((tmpl) => {
                  const isSelected = selectedTemplate.templateName === tmpl.templateName;
                  return (
                    <div
                      key={tmpl.templateName}
                      className={`wa-template-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectTemplate(tmpl)}
                    >
                      <div className="wa-tmpl-top">
                        <span className="wa-tmpl-name">{tmpl.displayName}</span>
                        <span className="wa-tmpl-badge">{tmpl.category}</span>
                      </div>
                      <div className="wa-tmpl-code">
                        <code>{tmpl.templateName}</code>
                      </div>
                      <p className="wa-tmpl-desc">{tmpl.description}</p>
                      <div className="wa-tmpl-params">
                        <small className="text-muted">Params: </small>
                        {tmpl.parameterKeys.map((k) => (
                          <span key={k} className="wa-param-chip">
                            {`{{${k}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Message Tester */}
        <div className="wa-col-right">
          <div className="settings-card glass-card">
            <div className="settings-card-header">
              <h4>
                <i className="bi bi-send-fill me-2 text-success"></i>
                Live WhatsApp Message Tester
              </h4>
            </div>
            <div className="settings-card-body">
              <form onSubmit={handleSendTestMessage}>
                <div className="form-group mb-3">
                  <label className="form-label font-weight-bold">Selected Template</label>
                  <div className="p-2 border rounded bg-dark-subtle d-flex align-items-center justify-content-between">
                    <div>
                      <strong>{selectedTemplate.displayName}</strong>
                      <div className="small text-muted font-monospace">{selectedTemplate.templateName}</div>
                    </div>
                    <span className="badge bg-success">₹0.85 / msg</span>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label font-weight-bold">Recipient Mobile Number</label>
                  <div className="input-group">
                    <span className="input-group-text">+91</span>
                    <input
                      type="text"
                      className="form-control"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                      placeholder="e.g. 9496438167"
                      required
                    />
                  </div>
                  <small className="form-text text-muted">Must be 10 digits without leading 0 or +91.</small>
                </div>

                {/* Template Parameters Form */}
                <div className="mb-4">
                  <label className="form-label font-weight-bold mb-2">
                    Template Parameter Values:
                  </label>
                  {selectedTemplate.parameterKeys.map((paramKey, idx) => (
                    <div className="form-group mb-2" key={paramKey}>
                      <label className="form-label small text-info">
                        Parameter {idx + 1}: <code>{`{{${paramKey}}}`}</code>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={paramsInput[paramKey] || ''}
                        onChange={(e) => handleParamChange(paramKey, e.target.value)}
                        placeholder={`Enter ${paramKey}`}
                        required
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 py-2 font-weight-bold shadow-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Dispatching via Telinfy...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-whatsapp me-2"></i> Send Live WhatsApp Message
                    </>
                  )}
                </button>
              </form>

              {/* Error Display */}
              {errorMessage && (
                <div className="alert alert-danger mt-3 p-3 rounded fade-in mb-0">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <strong>Sending Failed:</strong> {errorMessage}
                </div>
              )}

              {/* Success Result Display */}
              {testResult && (
                <div className="wa-result-card mt-3 p-3 bg-dark border border-success rounded fade-in">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-success">
                      <i className="bi bi-check-circle-fill me-1"></i> Dispatched Successfully
                    </span>
                    <small className="text-muted font-monospace">Record ID: {testResult.recordId}</small>
                  </div>

                  <div className="wa-result-body small text-light">
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <span className="text-muted">Recipient:</span> <strong>+{testResult.phoneNumber}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Template:</span> <code>{testResult.templateName}</code>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Debited Amount:</span> <strong className="text-warning">₹{testResult.debitedAmount?.toFixed(2)}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Wallet Balance:</span> <strong className="text-success">₹{testResult.remainingWalletBalance?.toFixed(2)}</strong>
                      </div>
                    </div>
                    <div className="p-2 bg-black rounded text-success font-monospace small">
                      {testResult.message}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfig;

import React, { useState, useEffect } from 'react';
import autoPayService, { MANDATE_TYPES, EMI_FREQUENCIES } from '../../services/autoPayService';
import './AutoPaySetupModal.css';

const AutoPaySetupModal = ({ 
  isOpen, 
  onClose, 
  account = null, 
  bulkAccounts = [], 
  onSuccess 
}) => {
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'bulk'
  const isBulkMode = Array.isArray(bulkAccounts) && bulkAccounts.length > 0;

  // Single Account Form State
  const [mandateType, setMandateType] = useState('UPI_AUTOPAY');
  const [mandateLimit, setMandateLimit] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [customPhone, setCustomPhone] = useState('');
  const [generatedLinkInfo, setGeneratedLinkInfo] = useState(null);

  // Bulk Dispatch State
  const [bulkLinks, setBulkLinks] = useState([]);

  useEffect(() => {
    if (account) {
      const existing = autoPayService.getMandateForAccount(account.accountNumber || account.id);
      setMandateType(existing.mandateType || 'UPI_AUTOPAY');
      setMandateLimit(existing.mandateLimit || account.dueAmount || account.demand || 5000);
      setFrequency(existing.frequency || 'MONTHLY');
      setCustomPhone(account.phone || account.mobileNumber || account.mobile || '');

      const link = autoPayService.buildWhatsAppMessageLink({
        customerName: account.accountHolder || account.name || 'Customer',
        accountNumber: account.accountNumber || account.id,
        phone: account.phone || account.mobileNumber || account.mobile || '',
        emiAmount: account.dueAmount || account.demand || 0
      });
      setGeneratedLinkInfo(link);
    }

    if (isBulkMode) {
      setActiveTab('bulk');
      const generated = autoPayService.batchGenerateWhatsAppLinks(bulkAccounts);
      setBulkLinks(generated);
    }
  }, [account, bulkAccounts, isBulkMode]);

  if (!isOpen) return null;

  const handleSaveSingleMandate = (e) => {
    e.preventDefault();
    if (!account) return;

    const accNum = account.accountNumber || account.id;
    const custName = account.accountHolder || account.name || 'Customer';

    autoPayService.saveMandate({
      accountNumber: accNum,
      customerName: custName,
      phone: customPhone,
      emiAmount: account.dueAmount || account.demand || 0,
      mandateType,
      mandateLimit,
      frequency,
      status: 'PENDING_CUSTOMER_APPROVAL'
    });

    const link = autoPayService.buildWhatsAppMessageLink({
      customerName: custName,
      accountNumber: accNum,
      phone: customPhone,
      emiAmount: account.dueAmount || account.demand || 0
    });
    setGeneratedLinkInfo(link);

    if (onSuccess) onSuccess();
  };

  const handleOpenWhatsApp = (waUrl) => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = (text) => {
    navigator.clipboard.writeText(text);
    alert('📋 WhatsApp Portal Link copied to clipboard!');
  };

  return (
    <div className="autopay-modal-overlay" role="dialog" aria-modal="true">
      <div className="autopay-modal-card">
        
        {/* Modal Header */}
        <div className="autopay-modal-header">
          <div className="header-left-title">
            <span className="autopay-badge-icon">⚡</span>
            <div>
              <h3>AutoPay Setup & WhatsApp EMI Link</h3>
              <span className="subtitle-mode font-mono">Standalone Mode (Integration Status: N)</span>
            </div>
          </div>
          <button type="button" className="autopay-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tab Toggle */}
        {isBulkMode && (
          <div className="autopay-tab-toggle">
            <button 
              className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
              onClick={() => setActiveTab('bulk')}
            >
              🚀 Bulk WhatsApp Dispatches ({bulkAccounts.length} Accounts)
            </button>
            {account && (
              <button 
                className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
                onClick={() => setActiveTab('single')}
              >
                👤 Single Mandate Config
              </button>
            )}
          </div>
        )}

        {/* SINGLE ACCOUNT MODE */}
        {activeTab === 'single' && account && (
          <form onSubmit={handleSaveSingleMandate} className="autopay-form-body">
            <div className="account-meta-summary-bar">
              <div className="meta-item">
                <span className="label">Customer Name</span>
                <strong className="val">{account.accountHolder || account.name || 'Customer'}</strong>
              </div>
              <div className="meta-item">
                <span className="label">Account Number</span>
                <strong className="val font-mono">#{account.accountNumber || account.id}</strong>
              </div>
              <div className="meta-item">
                <span className="label">EMI / Due Demand</span>
                <strong className="val amount">₹{Number(account.dueAmount || account.demand || 0).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="form-grid-fields">
              {/* Mandate Type */}
              <div className="form-field-group">
                <label className="field-label">Preferred AutoPay Mandate Type</label>
                <select 
                  className="field-select"
                  value={mandateType}
                  onChange={(e) => setMandateType(e.target.value)}
                >
                  {MANDATE_TYPES.map(m => (
                    <option key={m.code} value={m.code}>
                      {m.icon} {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mandate Max Limit */}
              <div className="form-field-group">
                <label className="field-label">AutoPay Mandate Max Cap Limit (₹)</label>
                <input 
                  type="number"
                  className="field-input"
                  placeholder="e.g. 5000"
                  value={mandateLimit}
                  onChange={(e) => setMandateLimit(e.target.value)}
                  required
                />
              </div>

              {/* Recommended Frequency */}
              <div className="form-field-group">
                <label className="field-label">Default EMI Payment Frequency</label>
                <select 
                  className="field-select"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  {EMI_FREQUENCIES.map(f => (
                    <option key={f.code} value={f.code}>
                      {f.name} ({f.desc})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Phone for WhatsApp */}
              <div className="form-field-group">
                <label className="field-label">WhatsApp Mobile Number</label>
                <input 
                  type="tel"
                  className="field-input"
                  placeholder="e.g. 9845011223"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Generated WhatsApp Message Preview */}
            {generatedLinkInfo && (
              <div className="whatsapp-preview-card">
                <div className="wa-card-header">
                  <span>💬 WhatsApp Mandate & EMI Decision Message Preview</span>
                  <button 
                    type="button" 
                    className="copy-btn"
                    onClick={() => handleCopyLink(generatedLinkInfo.portalUrl)}
                  >
                    📋 Copy Link
                  </button>
                </div>
                <pre className="wa-message-text">{generatedLinkInfo.messageText}</pre>
                
                <div className="wa-actions-row">
                  <button 
                    type="button"
                    className="wa-send-btn"
                    onClick={() => handleOpenWhatsApp(generatedLinkInfo.waUrl)}
                  >
                    <span>💬 Open & Send on WhatsApp</span>
                  </button>
                </div>
              </div>
            )}

            <div className="modal-footer-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Close</button>
              <button type="submit" className="btn-save">
                <span>Save Mandate & Update Link</span>
              </button>
            </div>
          </form>
        )}

        {/* BULK DISPATCH MODE */}
        {activeTab === 'bulk' && isBulkMode && (
          <div className="autopay-bulk-body">
            <div className="bulk-banner">
              <span className="b-icon">🎉</span>
              <div>
                <strong>{bulkAccounts.length} Customer Accounts Uploaded / Selected</strong>
                <p>WhatsApp AutoPay Mandate & EMI Selection links have been generated for all imported customers.</p>
              </div>
            </div>

            <div className="bulk-table-container">
              <table className="bulk-links-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Account #</th>
                    <th>Mobile #</th>
                    <th>EMI Amount</th>
                    <th>WhatsApp Link & Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkLinks.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.customerName}</strong></td>
                      <td className="font-mono">#{item.accountNumber}</td>
                      <td>{item.phone || 'N/A'}</td>
                      <td className="amount">₹{Number(item.emi).toLocaleString('en-IN')}</td>
                      <td>
                        <div className="table-wa-actions">
                          <button 
                            type="button"
                            className="btn-wa-icon"
                            onClick={() => handleOpenWhatsApp(item.waUrl)}
                            title="Send WhatsApp notice to customer"
                          >
                            💬 Send WhatsApp
                          </button>
                          <button 
                            type="button"
                            className="btn-copy-small"
                            onClick={() => handleCopyLink(item.portalUrl)}
                            title="Copy Link"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Done</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AutoPaySetupModal;

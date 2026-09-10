import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import autoPayService, { EMI_FREQUENCIES, MANDATE_TYPES } from '../../services/autoPayService';
import './CustomerPayDecision.css';

const CustomerPayDecision = () => {
  const [searchParams] = useSearchParams();
  const accountNumber = searchParams.get('acc') || 'ACC-982341';
  const phone = searchParams.get('phone') || '';

  const [mandateInfo, setMandateInfo] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState('MONTHLY');
  const [approveAutoPay, setApproveAutoPay] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = autoPayService.getMandateForAccount(accountNumber);
    setMandateInfo(existing);
    setSelectedFrequency(existing.frequency || 'MONTHLY');
    setLoading(false);
  }, [accountNumber]);

  const emiAmount = Number(mandateInfo?.emiAmount || 2400);

  // Compute payment schedules based on frequency selection
  const getEmiScheduleDetails = () => {
    switch (selectedFrequency) {
      case 'WEEKLY':
        return {
          installment: Math.ceil(emiAmount / 4),
          frequencyText: '4 Weekly Installments',
          dueDatesText: 'Every Monday of the month'
        };
      case 'DAILY':
        return {
          installment: Math.ceil(emiAmount / 24),
          frequencyText: '24 Daily Micro-Deductions',
          dueDatesText: 'Daily Mon-Sat'
        };
      case 'MONTHLY':
      default:
        return {
          installment: emiAmount,
          frequencyText: '1 Single Monthly Installment',
          dueDatesText: '5th of every month'
        };
    }
  };

  const schedule = getEmiScheduleDetails();

  const handleSubmitDecision = (e) => {
    e.preventDefault();
    autoPayService.saveCustomerEmiDecision({
      accountNumber,
      selectedFrequency,
      emiAmount,
      approveMandate: approveAutoPay
    });
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="customer-portal-loading">
        <div className="spinner"></div>
        <p>Loading Loan Account Info...</p>
      </div>
    );
  }

  const selectedMandateMeta = MANDATE_TYPES.find(m => m.code === (mandateInfo?.mandateType || 'UPI_AUTOPAY')) || MANDATE_TYPES[0];

  return (
    <div className="customer-portal-viewport">
      <div className="customer-portal-card">
        
        {/* Header Branding */}
        <header className="portal-header">
          <div className="brand-badge">
            <span>⚡ eCollect Payment Portal</span>
          </div>
          <h2>Loan Account #{accountNumber}</h2>
          <p className="sub-text">Choose your preferred EMI schedule & approve your AutoPay mandate</p>
        </header>

        {submitted ? (
          <div className="success-confirmation-screen">
            <div className="success-icon-animated">✅</div>
            <h3>Payment Preference Confirmed!</h3>
            <p>
              Your choice for <strong>{schedule.frequencyText}</strong> (₹{schedule.installment.toLocaleString('en-IN')}) has been recorded.
            </p>
            {approveAutoPay ? (
              <div className="status-pill active">
                <span>🟢 AutoPay Mandate Authorized ({selectedMandateMeta.name})</span>
              </div>
            ) : (
              <div className="status-pill manual">
                <span>ℹ️ Manual Direct Payment Mode Selected</span>
              </div>
            )}
            <p className="thank-you-note">Thank you for submitting your payment preferences!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitDecision} className="portal-form">
            
            {/* Account Summary Banner */}
            <div className="loan-summary-box">
              <div className="sum-item">
                <span className="lbl">Total EMI Amount</span>
                <span className="val amount">₹{emiAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="sum-item">
                <span className="lbl">Mandate Max Cap</span>
                <span className="val font-mono">₹{Number(mandateInfo?.mandateLimit || emiAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Step 1: Choose EMI Frequency */}
            <div className="step-section">
              <h4 className="step-title">Step 1: How would you like to pay your EMI?</h4>
              
              <div className="frequency-options-grid">
                {EMI_FREQUENCIES.map(freq => (
                  <div 
                    key={freq.code}
                    className={`freq-card ${selectedFrequency === freq.code ? 'selected' : ''}`}
                    onClick={() => setSelectedFrequency(freq.code)}
                  >
                    <div className="radio-dot">
                      {selectedFrequency === freq.code && <div className="inner-dot"></div>}
                    </div>
                    <div className="card-info">
                      <strong className="f-name">{freq.name}</strong>
                      <span className="f-desc">{freq.desc}</span>
                      <span className="f-calc">
                        {freq.code === 'MONTHLY' ? `₹${emiAmount.toLocaleString('en-IN')} / month` : 
                         freq.code === 'WEEKLY' ? `₹${Math.ceil(emiAmount / 4).toLocaleString('en-IN')} / week` : 
                         `₹${Math.ceil(emiAmount / 24).toLocaleString('en-IN')} / day`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Schedule Summary Box */}
              <div className="schedule-summary-callout">
                <div className="callout-header">
                  <span>📅 Selected Schedule Summary</span>
                </div>
                <div className="callout-row">
                  <span>Installment Amount:</span>
                  <strong>₹{schedule.installment.toLocaleString('en-IN')} per installment</strong>
                </div>
                <div className="callout-row">
                  <span>Payment Schedule:</span>
                  <strong>{schedule.frequencyText} ({schedule.dueDatesText})</strong>
                </div>
              </div>
            </div>

            {/* Step 2: AutoPay Mandate Authorization Choice */}
            <div className="step-section">
              <h4 className="step-title">Step 2: AutoPay Mandate Authorization</h4>

              <label className="checkbox-mandate-card">
                <input 
                  type="checkbox"
                  checked={approveAutoPay}
                  onChange={(e) => setApproveAutoPay(e.target.checked)}
                />
                <div className="chk-label-box">
                  <strong>Authorize AutoPay ({selectedMandateMeta.name})</strong>
                  <p>Enable automatic deduction on due dates so you never miss an installment or incur late charges.</p>
                </div>
              </label>
            </div>

            {/* CTA Button */}
            <div className="portal-footer">
              <button type="submit" className="confirm-btn">
                <span>Confirm Payment Choice & Authorize →</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

export default CustomerPayDecision;

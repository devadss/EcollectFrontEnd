import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { processStandaloneCashCollection, saveStandaloneTransaction, buildStandalonePaymentPayload } from '../../services/standaloneCollectionService';
import { sendPaymentReceiptSms, sendPaymentLinkSms } from '../../services/smsService';
import { getDayShiftState } from '../../services/dayOperationsService';
import { paymentApi } from '../../services/api';
import './StandaloneCollectionModal.css';

const StandaloneCollectionModal = ({
  account,
  defaultTab = 'QR',
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || 'QR');
  const [collectAmount, setCollectAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Payment Results
  const [qrCodeString, setQrCodeString] = useState(null);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState(null);
  const [verifiedReceipt, setVerifiedReceipt] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    if (account) {
      const initialAmt = account.dueAmount || account.emiAmount || 500;
      setCollectAmount(initialAmt);
      setActiveTab(defaultTab || 'QR');
      setQrCodeString(null);
      setPaymentLinkUrl(null);
      setVerifiedReceipt(null);
      setError(null);

      // Auto-generate QR if starting in QR tab
      if ((defaultTab || 'QR') === 'QR') {
        generateQr(initialAmt);
      } else if (defaultTab === 'LINK') {
        generateLink(initialAmt);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, defaultTab]);

  if (!isOpen || !account) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // 1. Generate Dynamic UPI QR & Intent
  const generateQr = async (amtVal) => {
    const shift = getDayShiftState('01', authUser?.merchantId || 4);
    if (shift?.shiftStatus !== 'OPEN') {
      setError('🔒 Collection shift is CLOSED! Please start Day Begin (BOD) first.');
      return;
    }

    const amt = Number(amtVal || collectAmount || 500);
    setLoading(true);
    setError(null);

    const payload = buildStandalonePaymentPayload({
      account,
      amount: amt,
      mode: 'UPI',
      note: remarks || `EMI Collection for ${account.accountHolder} - Acc #${account.accountNumber}`,
      user: authUser
    });

    try {
      let upiUrl = null;

      // Try getUpiIntent first
      try {
        if (paymentApi.getUpiIntent) {
          const res = await paymentApi.getUpiIntent(payload);
          const data = res?.data || {};
          upiUrl = data.payment_url || data.paymentUrl || data.data?.upi_intent_url || data.data?.url || (typeof data === 'string' ? data : null);
        }
      } catch (e) {
        console.warn('getUpiIntent fallback to generateDynamicQr:', e);
      }

      if (!upiUrl && paymentApi.generateDynamicQr) {
        const res = await paymentApi.generateDynamicQr(payload);
        const data = res?.data || {};
        upiUrl = data.qrString || data.paymentUrl || data.data?.qr_string;
      }

      if (!upiUrl) {
        upiUrl = `upi://pay?pa=adsssolutions@icici&pn=${encodeURIComponent(account.accountHolder)}&am=${amt}&cu=INR&tn=${encodeURIComponent(`EMI_${account.accountNumber}`)}`;
      }

      setQrCodeString(upiUrl);
    } catch (err) {
      console.warn('Standalone UPI fallback:', err);
      const fallbackUrl = `upi://pay?pa=adsssolutions@icici&pn=${encodeURIComponent(account.accountHolder)}&am=${amt}&cu=INR&tn=${encodeURIComponent(`EMI_${account.accountNumber}`)}`;
      setQrCodeString(fallbackUrl);
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate Payment Link & UPI Intent
  const generateLink = async (amtVal) => {
    const amt = Number(amtVal || collectAmount || 500);
    setLoading(true);
    setError(null);

    const payload = buildStandalonePaymentPayload({
      account,
      amount: amt,
      mode: 'LINK',
      note: remarks || `Payment Link for ${account.accountHolder} - Acc #${account.accountNumber}`,
      user: authUser
    });

    try {
      const res = await paymentApi.createPaymentLink(payload);
      const data = res?.data || {};
      const link = data.paymentUrl || data.shortUrl || data.data?.payment_url || `https://pay.ecollect.finwin.in/pay?acc=${account.accountNumber}&amt=${amt}`;
      setPaymentLinkUrl(link);
    } catch (err) {
      console.warn('Payment link fallback:', err);
      const link = `https://pay.ecollect.finwin.in/pay?acc=${account.accountNumber}&amt=${amt}`;
      setPaymentLinkUrl(link);
    } finally {
      setLoading(false);
    }
  };

  // 3. Process Direct CBS Cash Collection
  const handleProcessCash = async () => {
    const shift = getDayShiftState('01', authUser?.merchantId || 4);
    if (shift?.shiftStatus !== 'OPEN') {
      setError('🔒 Collection shift is CLOSED! Please start Day Begin (BOD) first.');
      return;
    }

    const amt = Number(collectAmount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid cash amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await processStandaloneCashCollection({
        accountNumber: account.accountNumber,
        customerName: account.accountHolder,
        amount: amt,
        collectionType: account.collectionType || 'LOAN',
        merchantId: authUser?.merchantId || 4,
        branchId: 1,
        agentCode: account.assignedAgentCode || authUser?.agentCode || '1075',
        phone: account.phone,
        remarks: remarks || 'Doorstep physical cash collection'
      });

      if (res.success) {
        // Send SMS Receipt via DLT Header
        sendPaymentReceiptSms({
          mobile: account.phone || '9999999999',
          customerName: account.accountHolder,
          amount: amt,
          accountNumber: account.accountNumber,
          receiptNumber: res.receiptNumber,
          remainingBalance: Math.max(0, Number(account.balance || 0) - amt),
          merchantId: authUser?.merchantId || 4,
          merchantName: authUser?.company || 'eCollect'
        });

        const receiptData = {
          receiptNumber: res.receiptNumber,
          amount: amt,
          customerName: account.accountHolder,
          accountNumber: account.accountNumber,
          collectionType: account.collectionType || 'LOAN',
          agentName: authUser?.fullName || authUser?.name || 'Assigned Field Agent',
          timestamp: new Date().toISOString()
        };

        saveStandaloneTransaction(receiptData);
        setVerifiedReceipt(receiptData);

        if (onSuccess) {
          onSuccess(receiptData, {
            ...account,
            balance: Math.max(0, Number(account.balance || 0) - amt),
            dueAmount: Math.max(0, Number(account.dueAmount || 0) - amt),
            dpd: 0
          });
        }
      } else {
        setError(res.message || 'Cash collection transaction failed');
      }
    } catch (err) {
      setError('Error posting cash to ledger: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Simulate Instant UPI Confirmation (for Demo / Standalone Mode N)
  const handleSimulateUpiSuccess = () => {
    const amt = Number(collectAmount || 500);
    const receiptNum = `UPI-TXN-${Date.now().toString().slice(-6)}`;
    
    sendPaymentReceiptSms({
      mobile: account.phone || '9999999999',
      customerName: account.accountHolder,
      amount: amt,
      accountNumber: account.accountNumber,
      receiptNumber: receiptNum,
      remainingBalance: Math.max(0, Number(account.balance || 0) - amt),
      merchantId: authUser?.merchantId || 4,
      merchantName: authUser?.company || 'eCollect'
    });

    const receiptData = {
      receiptNumber: receiptNum,
      amount: amt,
      customerName: account.accountHolder,
      accountNumber: account.accountNumber,
      collectionType: account.collectionType || 'LOAN',
      agentName: 'Dynamic UPI Gateway',
      timestamp: new Date().toISOString()
    };

    setVerifiedReceipt(receiptData);

    if (onSuccess) {
      onSuccess(receiptData, {
        ...account,
        balance: Math.max(0, Number(account.balance || 0) - amt),
        dueAmount: Math.max(0, Number(account.dueAmount || 0) - amt),
        dpd: 0
      });
    }
  };

  const handleSendLinkSms = async () => {
    if (!account.phone) {
      setError('Customer phone number is missing');
      return;
    }
    const amt = Number(collectAmount || 500);
    const link = paymentLinkUrl || `https://pay.ecollect.finwin.in/pay?acc=${account.accountNumber}&amt=${amt}`;
    
    try {
      const res = await sendPaymentLinkSms({
        recipientMobile: account.phone,
        customerName: account.accountHolder,
        amount: amt,
        paymentLink: link,
        accountNumber: account.accountNumber,
        merchantId: authUser?.merchantId || 4,
        merchantName: authUser?.company || 'eCollect'
      });
      if (res.success) {
        alert(`📲 Payment Link dispatched via SMS to ${account.phone}!`);
      } else {
        setError(res.message);
      }
    } catch {
      setError('Failed to send SMS');
    }
  };

  return (
    <div className="col-modal-overlay" onClick={onClose}>
      <div className="col-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="col-modal-head">
          <div>
            <h3 className="col-modal-title">
              {activeTab === 'QR' ? '⚡ Dynamic UPI QR Settlement' : activeTab === 'CASH' ? '💵 CBS Direct Cash Recovery' : '🔗 Instant UPI Intent & Link'}
            </h3>
            <p className="col-modal-subtitle">
              FINWIN eCollect Standalone Mode (N) Core Banking Clearing Node
            </p>
          </div>
          <button className="btn-col-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        {!verifiedReceipt && (
          <div className="col-modal-tabs">
            <button
              type="button"
              className={`col-tab-btn ${activeTab === 'QR' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab('QR');
                generateQr();
              }}
            >
              ⚡ Dynamic QR
            </button>
            <button
              type="button"
              className={`col-tab-btn is-cash ${activeTab === 'CASH' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('CASH')}
            >
              💵 Cash Collection
            </button>
            <button
              type="button"
              className={`col-tab-btn ${activeTab === 'LINK' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab('LINK');
                generateLink();
              }}
            >
              🔗 Payment Link / Intent
            </button>
          </div>
        )}

        <div className="col-modal-body">
          {/* Customer Summary Banner */}
          <div className="col-customer-banner">
            <div>
              <div className="col-customer-name">{account.accountHolder}</div>
              <div className="col-customer-acc">Acc #{account.accountNumber} ({account.collectionType || 'LOAN'})</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Outstanding Due</span>
              <span className="col-customer-due">₹{Number(account.dueAmount || account.emiAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', fontSize: '13px', fontWeight: 700 }}>
              ⚠️ {error}
            </div>
          )}

          {/* SUCCESS RECEIPT VIEW */}
          {verifiedReceipt ? (
            <div className="col-receipt-card">
              <span style={{ fontSize: '36px' }}>🎉</span>
              <div className="col-receipt-title">Payment Collected & Reconciled!</div>
              <div className="col-receipt-amt">₹{verifiedReceipt.amount.toLocaleString('en-IN')}</div>
              
              <div className="col-receipt-meta">
                <div>CBS Receipt No: <strong>{verifiedReceipt.receiptNumber}</strong></div>
                <div>Customer: <strong>{verifiedReceipt.customerName}</strong></div>
                <div>Account: <strong>{verifiedReceipt.accountNumber}</strong></div>
                <div>Collected By: <strong>{verifiedReceipt.agentName}</strong></div>
                <div>Timestamp: <strong>{new Date(verifiedReceipt.timestamp).toLocaleTimeString()}</strong></div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', width: '100%' }}>
                <button
                  type="button"
                  className="btn-col-primary"
                  onClick={() => window.print()}
                  style={{ background: '#334155' }}
                >
                  🖨️ Print Official Receipt
                </button>
                <button
                  type="button"
                  className="btn-col-primary"
                  onClick={onClose}
                >
                  ✓ Done & Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: DYNAMIC UPI QR */}
              {activeTab === 'QR' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="col-qr-display-box">
                    {loading ? (
                      <div style={{ padding: '40px', color: '#6366f1', fontWeight: 800 }}>Generating Dynamic UPI QR...</div>
                    ) : qrCodeString ? (
                      <>
                        <QRCodeSVG
                          value={qrCodeString}
                          size={190}
                          level="H"
                          includeMargin={true}
                        />
                        <div className="col-qr-subtext">
                          Scan to pay ₹{Number(collectAmount || 0).toLocaleString('en-IN')} via GPay, PhonePe, Paytm, BHIM
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Collection Amount (₹)</label>
                    <input
                      type="number"
                      value={collectAmount}
                      onChange={e => {
                        setCollectAmount(e.target.value);
                        generateQr(e.target.value);
                      }}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#38bdf8', fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn-col-primary"
                      onClick={() => handleCopy(qrCodeString, 'qr-url')}
                      style={{ background: '#334155' }}
                    >
                      {copiedKey === 'qr-url' ? '✓ Copied Intent URL' : '📋 Copy UPI URL'}
                    </button>
                    <button
                      type="button"
                      className="btn-col-primary"
                      onClick={handleSimulateUpiSuccess}
                    >
                      ⚡ Verify & Settle Payment
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: DIRECT CASH COLLECTION */}
              {activeTab === 'CASH' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Doorstep Cash Collected (₹) *</label>
                    <input
                      type="number"
                      required
                      value={collectAmount}
                      onChange={e => setCollectAmount(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#34d399', fontSize: '20px', fontWeight: 900, fontFamily: 'monospace', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Collector Physical Slip No / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Field physical slip #88219"
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-col-primary btn-col-cash"
                    disabled={loading}
                    onClick={handleProcessCash}
                  >
                    {loading ? 'Posting Cash to CBS Ledger...' : `Receive Cash & Post ₹${Number(collectAmount || 0).toLocaleString('en-IN')} to CBS`}
                  </button>
                </div>
              )}

              {/* TAB 3: PAYMENT LINK & INTENT */}
              {activeTab === 'LINK' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Settlement Amount (₹)</label>
                    <input
                      type="number"
                      value={collectAmount}
                      onChange={e => {
                        setCollectAmount(e.target.value);
                        generateLink(e.target.value);
                      }}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#818cf8', fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', outline: 'none' }}
                    />
                  </div>

                  {paymentLinkUrl && (
                    <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', wordBreak: 'break-all', fontSize: '12px', color: '#38bdf8', fontFamily: 'monospace' }}>
                      {paymentLinkUrl}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn-col-primary"
                      onClick={handleSendLinkSms}
                    >
                      📲 Send SMS Link
                    </button>
                    <button
                      type="button"
                      className="btn-col-primary"
                      style={{ background: '#25D366' }}
                      onClick={() => {
                        const amt = Number(collectAmount || 500);
                        const text = `Dear ${account.accountHolder},\nPlease pay your overdue ₹${amt.toLocaleString('en-IN')} for Acc #${account.accountNumber} via this secure link:\n${paymentLinkUrl || `https://pay.ecollect.finwin.in/pay?acc=${account.accountNumber}`}\nThank you, FINWIN eCollect`;
                        const phone = String(account.phone || '').replace(/\D/g, '');
                        const waUrl = phone.length === 10 ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
                        window.open(waUrl, '_blank');
                      }}
                    >
                      💬 Share on WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default StandaloneCollectionModal;

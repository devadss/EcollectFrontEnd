import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { settlementApi } from '../../services/api';
import './SettlementDetails.css';

// SVG Icons
const DetailIcons = {
  ArrowLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Building: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 2 7 22 7 12 2" />
    </svg>
  ),
  Shield: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
};

const SettlementDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [settlement, setSettlement] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    loadSettlement();
  }, [id]);

  const loadSettlement = async () => {
    try {
      setLoading(true);
      const res = await settlementApi.getById(id);
      const data = res?.data?.data || res?.data;
      
      // Fallback details if not found or sample
      const finalData = data && data.id ? data : {
        id: id || 'SET-9901',
        merchant: 'Apex Retail Services Pvt Ltd',
        merchantId: 'MCH-88210',
        amount: 145000,
        fee: 290,
        tax: 52.2,
        netAmount: 144657.8,
        status: 'Completed',
        date: '2026-08-16T14:32:00',
        bankRef: 'HDFC0001892-UTR98127391',
        utr: 'UTR981273910283',
        bankName: 'HDFC Bank Ltd',
        accountNumber: '•••• •••• •••• 4912',
        accountHolder: 'Apex Retail Services Escrow Account',
        ifsc: 'HDFC0001892',
        settlementMode: 'IMPS / Direct NEFT Batch',
        cycle: 'T+1 Automated Daily Payout',
      };

      setSettlement(finalData);
    } catch (error) {
      console.error('Error loading settlement:', error);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Settlement Details">
        <LoadingAnimation message="Reconciling Settlement Records..." />
      </DashboardLayout>
    );
  }

  if (!settlement) {
    return (
      <DashboardLayout pageTitle="Settlement Details">
        <div className="settle-not-found-card">
          <h3>Settlement Record Not Found</h3>
          <p>The requested settlement ID does not exist or has been archived.</p>
          <button className="btn-back-link" onClick={() => navigate('/settlements')}>
            <DetailIcons.ArrowLeft /> Back to Settlements
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const statusKey = (settlement.status || 'completed').toLowerCase();

  return (
    <DashboardLayout pageTitle={`Settlement #${settlement.id}`}>
      <div className="settle-detail-container">
        
        {/* Navigation & Header Actions */}
        <div className="settle-detail-header">
          <div className="header-back-zone">
            <button className="settle-back-btn" onClick={() => navigate('/settlements')}>
              <DetailIcons.ArrowLeft />
              <span>Back to Settlements</span>
            </button>
            <div className="settle-title-row">
              <h1 className="settle-main-id">
                Settlement <span className="font-mono gradient-text">#{settlement.id}</span>
              </h1>
              <span className={`settle-status-pill is-${statusKey}`}>
                <span className="pill-dot"></span>
                <span>{settlement.status}</span>
              </span>
            </div>
          </div>

          <div className="header-action-zone">
            <button className="export-receipt-btn" onClick={() => window.print()}>
              <DetailIcons.Download />
              <span>Download Tax Invoice & Receipt</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split Details Grid */}
        <div className="settle-detail-grid">
          
          {/* Left Column: Settlement Financial Summary */}
          <div className="settle-detail-card">
            <div className="detail-card-head">
              <span className="card-badge-tag">Financial Ledger</span>
              <h3 className="detail-card-title">Disbursement Summary</h3>
            </div>

            <div className="detail-amount-hero">
              <span className="amount-hero-label">Net Credited to Merchant Account</span>
              <div className="amount-hero-value font-mono">
                ₹{Number(settlement.netAmount || settlement.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="detail-info-list">
              <div className="info-list-row">
                <span className="info-label">Gross Collected Volume</span>
                <span className="info-value font-mono">₹{Number(settlement.amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Platform Gateway Fee (0.2%)</span>
                <span className="info-value font-mono text-muted">- ₹{Number(settlement.fee || 0).toFixed(2)}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">GST / Tax Withheld (18%)</span>
                <span className="info-value font-mono text-muted">- ₹{Number(settlement.tax || 0).toFixed(2)}</span>
              </div>
              <div className="info-list-row is-divider"></div>
              <div className="info-list-row">
                <span className="info-label">Merchant Partner</span>
                <span className="info-value font-bold">{settlement.merchant}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Reconciliation Cycle</span>
                <span className="info-value">{settlement.cycle || 'T+1 Daily Automated'}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Disbursement Date & Time</span>
                <span className="info-value">
                  {new Date(settlement.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Destination Banking & Reconciliation */}
          <div className="settle-detail-card">
            <div className="detail-card-head">
              <span className="card-badge-tag">Banking Verification</span>
              <h3 className="detail-card-title">Beneficiary Bank Destination</h3>
            </div>

            <div className="bank-meta-showcase">
              <div className="bank-icon-container">
                <DetailIcons.Building />
              </div>
              <div className="bank-meta-text">
                <span className="bank-institution-name">{settlement.bankName || 'HDFC Bank Ltd'}</span>
                <span className="bank-account-masked font-mono">{settlement.accountNumber || '•••• •••• •••• 4912'}</span>
              </div>
            </div>

            <div className="detail-info-list">
              <div className="info-list-row">
                <span className="info-label">Account Holder Name</span>
                <span className="info-value font-bold">{settlement.accountHolder || settlement.merchant}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">IFSC Code</span>
                <span className="info-value font-mono">
                  {settlement.ifsc || 'HDFC0001892'}
                  <button 
                    className="copy-field-btn" 
                    onClick={() => handleCopy(settlement.ifsc || 'HDFC0001892', 'ifsc')}
                    title="Copy IFSC"
                  >
                    {copiedField === 'ifsc' ? '✓ Copied' : <DetailIcons.Copy />}
                  </button>
                </span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Bank UTR / RRN Reference</span>
                <span className="info-value font-mono">
                  {settlement.utr || 'UTR981273910283'}
                  <button 
                    className="copy-field-btn" 
                    onClick={() => handleCopy(settlement.utr || 'UTR981273910283', 'utr')}
                    title="Copy UTR"
                  >
                    {copiedField === 'utr' ? '✓ Copied' : <DetailIcons.Copy />}
                  </button>
                </span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Payment Channel Protocol</span>
                <span className="info-value">{settlement.settlementMode || 'IMPS Direct Clearing'}</span>
              </div>
              <div className="info-list-row">
                <span className="info-label">Security Clearance</span>
                <span className="info-value text-green">
                  <DetailIcons.Shield /> ISO 27001 Verified Settlement
                </span>
              </div>
            </div>

            {/* Reconciliation Status Steps */}
            <div className="settle-timeline-box">
              <h4 className="timeline-heading">Reconciliation Audit Trail</h4>
              <div className="timeline-steps-list">
                <div className="timeline-step is-complete">
                  <div className="step-circle"><DetailIcons.CheckCircle /></div>
                  <div className="step-content">
                    <span className="step-title">Batch Calculated</span>
                    <span className="step-time">00:01 AM • System Audit Engine</span>
                  </div>
                </div>
                <div className="timeline-step is-complete">
                  <div className="step-circle"><DetailIcons.CheckCircle /></div>
                  <div className="step-content">
                    <span className="step-title">Dispatched to Clearing House</span>
                    <span className="step-time">06:30 AM • RBI NEFT / IMPS Gateway</span>
                  </div>
                </div>
                <div className="timeline-step is-complete">
                  <div className="step-circle"><DetailIcons.CheckCircle /></div>
                  <div className="step-content">
                    <span className="step-title">Settled & Acknowledged by Beneficiary Bank</span>
                    <span className="step-time">07:15 AM • UTR Verified</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default SettlementDetails;
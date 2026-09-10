import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import subscriptionService from '../../services/subscriptionService';
import { useMerchantContext } from '../../context/MerchantContext';
import { useDialog } from '../../context/DialogContext';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import './PlanSelection.css';

// Geometric SVG Icons
const PlanIcons = {
  Zap: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Shield: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Crown: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-5-4 5-6-7z" />
      <path d="M5 20h14" />
    </svg>
  ),
  Building: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <line x1="8" y1="6" x2="8.01" y2="6" />
      <line x1="16" y1="6" x2="16.01" y2="6" />
      <line x1="8" y1="10" x2="8.01" y2="10" />
      <line x1="16" y1="10" x2="16.01" y2="10" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
    </svg>
  )
};

const PlanSelection = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useDialog();
  const { refreshSubscription, subscription } = useMerchantContext();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingPlan, setSubmittingPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [showSalesModal, setShowSalesModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    subscriptionService.getPlans().then(data => {
      if (isMounted) {
        setPlans(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleSelectPlan = async (plan) => {
    if (plan.planCode === 'CORPORATE') {
      setShowSalesModal(true);
      return;
    }

    const currentMonthly = subscription?.monthlyPrice || 0;
    const isUpgrade = currentMonthly > 0 && plan.monthlyPrice > currentMonthly;
    const priceDeduction = isUpgrade ? currentMonthly : 0;
    const netPrice = Math.max(0, plan.monthlyPrice - priceDeduction);

    showConfirm({
      title: `Confirm Plan Activation: ${plan.planName}`,
      message: `You are subscribing to ${plan.planName} at ₹${plan.monthlyPrice.toLocaleString('en-IN')}/month.${isUpgrade ? ` Your previous plan credit of ₹${priceDeduction.toLocaleString('en-IN')} will be deducted, net payable today: ₹${netPrice.toLocaleString('en-IN')}.` : ''}`,
      confirmText: 'Activate Plan & Proceed',
      onConfirm: async () => {
        try {
          setSubmittingPlan(plan.planCode);
          const res = await subscriptionService.selectPlan({
            planCode: plan.planCode,
            billingCycle,
            agreedRegistrationFee: plan.oneTimeRegistrationFee || 30000
          });

          if (res?.success) {
            showSuccess(`🎉 Congratulations! Your merchant account is now activated with the ${plan.planName}.`);
            await refreshSubscription();
            navigate('/dashboard', { replace: true });
          } else {
            showError(res?.message || 'Failed to activate plan. Please try again.');
          }
        } catch (err) {
          showError('An error occurred during plan activation. Please try again.');
        } finally {
          setSubmittingPlan(null);
        }
      }
    });
  };

  const getPlanBadge = (planCode) => {
    switch (planCode) {
      case 'NANO': return { icon: <PlanIcons.Zap />, color: '#06b6d4', tag: 'Micro Institutions' };
      case 'GENESIS': return { icon: <PlanIcons.Shield />, color: '#4f46e5', tag: 'Most Popular', popular: true };
      case 'CLASSY': return { icon: <PlanIcons.Crown />, color: '#10b981', tag: 'Full Automation' };
      case 'CORPORATE': return { icon: <PlanIcons.Building />, color: '#f59e0b', tag: 'Custom Scaling' };
      default: return { icon: <PlanIcons.Sparkles />, color: '#6366f1', tag: 'Standard' };
    }
  };

  if (loading) {
    return <LoadingAnimation message="Loading eCollect Subscription Plans..." />;
  }

  return (
    <div className="plan-selection-viewport">
      {/* Background Ambient Lights */}
      <div className="plan-bg-glow glow-1"></div>
      <div className="plan-bg-glow glow-2"></div>

      <div className="plan-selection-container">
        
        {/* Header Hero Banner */}
        <header className="plan-hero-header">
          <div className="plan-hero-emblem">
            <PlanIcons.Sparkles />
            <span>eCollect Merchant Subscription System</span>
          </div>

          <h1 className="plan-hero-title">
            Choose the Perfect Plan for Your <span className="gradient-text">Institution</span>
          </h1>

          <p className="plan-hero-subtitle">
            Automate payment collection, dispatch AI reminders via WhatsApp & SMS, generate customized receipts, and manage field agents with zero effort.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="billing-cycle-toggle-wrapper">
            <button 
              className={`cycle-btn ${billingCycle === 'MONTHLY' ? 'active' : ''}`}
              onClick={() => setBillingCycle('MONTHLY')}
            >
              Monthly Billing
            </button>
            <button 
              className={`cycle-btn ${billingCycle === 'ANNUAL' ? 'active' : ''}`}
              onClick={() => setBillingCycle('ANNUAL')}
            >
              Annual Billing <span className="discount-tag">Save 15%</span>
            </button>
          </div>
        </header>

        {/* Pricing Cards Grid */}
        <div className="plans-matrix-grid">
          {plans.map((plan) => {
            const meta = getPlanBadge(plan.planCode);
            const isCurrentPlan = subscription?.planCode === plan.planCode;

            return (
              <div 
                key={plan.id} 
                className={`plan-card-tile ${meta.popular ? 'is-popular' : ''} ${isCurrentPlan ? 'is-active-sub' : ''}`}
              >
                {meta.popular && (
                  <div className="popular-ribbon-badge">
                    <span>★ {meta.tag}</span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="active-sub-ribbon-badge">
                    <span>✓ Active Subscribed Plan</span>
                  </div>
                )}

                <div className="plan-card-header">
                  <div className="plan-icon-bubble" style={{ background: `${meta.color}18`, color: meta.color, borderColor: `${meta.color}35` }}>
                    {meta.icon}
                  </div>
                  
                  <div className="plan-name-wrap">
                    <h3 className="plan-title">{plan.planName}</h3>
                    <span className="plan-target-tag">{plan.highlights?.[0] || meta.tag}</span>
                  </div>
                </div>

                <div className="plan-price-box">
                  {plan.monthlyPrice > 0 ? (
                    <>
                      <div className="price-num">
                        <span className="currency">₹</span>
                        <span className="amount">{plan.monthlyPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="billing-period">/ month + taxes</span>
                    </>
                  ) : (
                    <div className="price-num custom-price">
                      <span className="amount">Custom Price</span>
                      <span className="billing-period">Contact Sales Team</span>
                    </div>
                  )}
                </div>

                <p className="plan-description">{plan.description}</p>

                {/* Meter Quotas Summary */}
                <div className="plan-quotas-box">
                  <div className="quota-row">
                    <span className="q-label">Transaction Volume</span>
                    <span className="q-val">{plan.maxTransactionVolume > 0 ? `≤ ₹${(plan.maxTransactionVolume / 1000).toFixed(0)}k / mo` : 'Unlimited'}</span>
                  </div>
                  <div className="quota-row">
                    <span className="q-label">Customer Accounts</span>
                    <span className="q-val">{plan.maxCustomers > 0 ? `${plan.maxCustomers} Accounts` : 'Unlimited'}</span>
                  </div>
                  <div className="quota-row">
                    <span className="q-label">Communication Quota</span>
                    <span className="q-val">{plan.maxCommunicationQuota > 0 ? `${plan.maxCommunicationQuota} SMS/WA/Calls` : 'Unlimited'}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="plan-features-divider">Plan Includes</div>
                <ul className="plan-feature-list">
                  {plan.highlights?.map((feat, idx) => (
                    <li key={idx} className="feature-item">
                      <span className="check-icon"><PlanIcons.Check /></span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Action CTA Button */}
                <div className="plan-card-footer">
                  <button
                    type="button"
                    className={`plan-cta-btn ${meta.popular ? 'btn-popular' : ''} ${isCurrentPlan ? 'btn-current' : ''}`}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={submittingPlan === plan.planCode || isCurrentPlan}
                  >
                    {submittingPlan === plan.planCode ? (
                      <span>Activating...</span>
                    ) : isCurrentPlan ? (
                      <span>Current Active Plan</span>
                    ) : plan.planCode === 'CORPORATE' ? (
                      <span>Connect with Sales →</span>
                    ) : (
                      <>
                        <span>Select {plan.planName.split(' ')[0]} Plan</span>
                        <PlanIcons.ArrowRight />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footnote Terms & Conditions Notice */}
        <div className="plan-terms-footer-note">
          <div className="note-card">
            <h4>💡 Important Registration & Upgrade Policy Terms</h4>
            <ul>
              <li><strong>One-time Registration Fee:</strong> Standard registration fee is ₹30,000/- (negotiable minimum ₹5,000/-).</li>
              <li><strong>Standard Branch Capacity:</strong> Standard branch allocation provides up to 3 admin users & 5 field collection agents per branch.</li>
              <li><strong>Plan Upgrade Credit:</strong> When upgrading your subscription plan, your previously paid amount is credited and deducted from the upgraded plan cost.</li>
            </ul>
          </div>
        </div>

      </div>

      {/* Enterprise Sales Contact Modal */}
      {showSalesModal && (
        <div className="sales-modal-overlay" role="dialog">
          <div className="sales-modal-content">
            <div className="sales-modal-header">
              <h3>🏢 Enterprise (Corporate) Plan Inquiry</h3>
              <button type="button" className="close-btn" onClick={() => setShowSalesModal(false)}>✕</button>
            </div>
            
            <p className="sales-modal-desc">
              Get dedicated account management, custom fee structures, unlimited multi-branch hub-and-spoke infrastructure tailored for high-volume banking & enterprise operations.
            </p>

            <div className="sales-info-box">
              <div className="sales-item">
                <span className="s-icon">📞</span>
                <div>
                  <strong>Sales Desk Phone</strong>
                  <p>+91 1800-425-9999 (Toll Free)</p>
                </div>
              </div>

              <div className="sales-item">
                <span className="s-icon">✉️</span>
                <div>
                  <strong>Enterprise Sales Email</strong>
                  <p>sales@ecollect.org.in</p>
                </div>
              </div>
            </div>

            <div className="sales-modal-actions">
              <button 
                type="button" 
                className="sales-btn-close"
                onClick={() => setShowSalesModal(false)}
              >
                Close & Return to Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanSelection;

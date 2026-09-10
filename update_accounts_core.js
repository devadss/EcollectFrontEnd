const fs = require('fs');
const path = require('path');
const babel = require('@babel/parser');

const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let content = fs.readFileSync(accountsPath, 'utf8');

// 1. Add Helper functions after calculateLoanNpaStatus
const bucketAndAiHelpers = `
// ============================================================
// 1. INDUSTRY STANDARD DELINQUENCY BUCKETS (0 to 90+ DPD)
// ============================================================
export const calculateAccountBucket = (acc) => {
  const npa = calculateLoanNpaStatus(acc);
  const dpd = npa.dpd || 0;
  
  if (dpd === 0) return { key: 'B0', label: 'Bucket 0 (Current)', shortLabel: 'B0 (0d)', dpd, class: 'is-b0', color: '#10b981', desc: 'Current Regular - 0 Days Past Due' };
  if (dpd <= 30) return { key: 'B1', label: 'Bucket 1 (SMA-0)', shortLabel: 'B1 (1-30d)', dpd, class: 'is-b1', color: '#38bdf8', desc: 'Early Delinquency (SMA-0) - 1 to 30 Days' };
  if (dpd <= 60) return { key: 'B2', label: 'Bucket 2 (SMA-1)', shortLabel: 'B2 (31-60d)', dpd, class: 'is-b2', color: '#f59e0b', desc: 'Moderate Delinquency (SMA-1) - 31 to 60 Days' };
  if (dpd <= 90) return { key: 'B3', label: 'Bucket 3 (SMA-2)', shortLabel: 'B3 (61-90d)', dpd, class: 'is-b3', color: '#f97316', desc: 'High Risk (SMA-2) - 61 to 90 Days' };
  return { key: 'NPA', label: 'Critical / NPA (>90d)', shortLabel: '🚨 NPA (>90d)', dpd, class: 'is-npa', color: '#ef4444', desc: 'Substandard Non-Performing Asset - 90+ Days Default' };
};

// ============================================================
// 2. AI DELINQUENCY PREDICTION & DEFAULT PROBABILITY ENGINE
// ============================================================
export const calculateAiRiskPrediction = (acc) => {
  const npa = calculateLoanNpaStatus(acc);
  const dpd = npa.dpd || 0;
  const balance = Number(acc.balance || 0);
  const due = Number(acc.dueAmount || acc.emiAmount || 0);
  const ptpStatus = (acc.ptpStatus || '').toUpperCase();
  
  let score = 12; // Base score
  
  // Factor A: DPD Progression (0 to 50 pts)
  if (dpd > 90) score += 52;
  else if (dpd > 60) score += 38;
  else if (dpd > 30) score += 24;
  else if (dpd > 0) score += 10;

  // Factor B: Debt Overdue Ratio (0 to 18 pts)
  if (balance > 0 && due / balance > 0.4) score += 16;
  else if (due > 25000) score += 10;

  // Factor C: Promise to Pay History (±18 pts)
  if (ptpStatus === 'BROKEN') score += 18;
  else if (ptpStatus === 'KEPT') score -= 12;
  else if (ptpStatus === 'PENDING') score -= 4;

  // Factor D: Frequency Velocity
  if (acc.emiFrequency === 'Daily' && dpd > 5) score += 12;
  if (acc.isMandatoryCall) score += 6;

  score = Math.max(5, Math.min(99, score));

  let tier = 'LOW';
  let tierLabel = 'Low Risk (0 - 25%)';
  let badgeClass = 'is-low-risk';
  let gaugeColor = '#10b981';
  let recommendation = 'Account is in good standing. Standard automated WhatsApp reminder is recommended.';

  if (score >= 80) {
    tier = 'CRITICAL';
    tierLabel = 'Critical Default Risk (>80%)';
    badgeClass = 'is-critical-risk';
    gaugeColor = '#ef4444';
    recommendation = '🚨 Severe Delinquency: Issue Mandatory Demand Notice, schedule immediate Next-Day Doorstep Officer Visit, and freeze additional credit lines.';
  } else if (score >= 55) {
    tier = 'HIGH';
    tierLabel = 'High Risk (56 - 80%)';
    badgeClass = 'is-high-risk';
    gaugeColor = '#f97316';
    recommendation = '⚠️ High Delinquency Probability: Place on Mandatory Next-Day Calling Queue & enforce partial PTP commitment within 48 hours.';
  } else if (score >= 26) {
    tier = 'MEDIUM';
    tierLabel = 'Moderate Risk (26 - 55%)';
    badgeClass = 'is-medium-risk';
    gaugeColor = '#f59e0b';
    recommendation = '⚡ Early Delinquency: Send dynamic UPI payment link via WhatsApp and follow up via field agent.';
  }

  return {
    score,
    tier,
    tierLabel,
    badgeClass,
    gaugeColor,
    recommendation,
    defaultProbability: score
  };
};
`;

if (!content.includes('calculateAccountBucket')) {
  const insertPos = content.indexOf('const BaseAccountIcons = {');
  content = content.slice(0, insertPos) + bucketAndAiHelpers + '\n\n' + content.slice(insertPos);
}

// 2. Add Icons: Handshake, MapPin, Navigation, Camera, Brain, Sparkles, AlertTriangle
const newIcons = `
  Handshake: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2-2a1 1 0 0 0-1.4 0l-1.3 1.3" />
      <path d="m18 10 3.3-3.3a1 1 0 0 0 0-1.4l-2-2a1 1 0 0 0-1.4 0L14 7" />
      <path d="m14 14-1-1a1 1 0 0 0-1.4 0l-4.3 4.3a1 1 0 0 0 0 1.4l2 2a1 1 0 0 0 1.4 0L12 19" />
      <path d="M7 11 3.7 7.7a1 1 0 0 1 0-1.4l2-2a1 1 0 0 1 1.4 0L11 8" />
    </svg>
  ),
  MapPin: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Navigation: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  ),
  Camera: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  Brain: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
`;

if (!content.includes('Handshake: () =>')) {
  const iconInsertPos = content.indexOf('const BaseAccountIcons = {') + 'const BaseAccountIcons = {'.length;
  content = content.slice(0, iconInsertPos) + newIcons + content.slice(iconInsertPos);
}

fs.writeFileSync(accountsPath, content, 'utf8');
console.log('✅ Base helpers and icons added to Accounts.jsx');

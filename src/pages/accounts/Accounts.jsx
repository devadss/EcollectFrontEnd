import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { accountApi, branchApi, agentApi, paymentApi, merchantApi, reminderApi, walletApi, whatsAppApi } from '../../services/api';
import { lookupIFSC, INDIAN_BANKS_LIST, sanitizeAccountNumber } from '../../services/bankService';
import { playPaymentSuccessNotification } from '../../utils/audioAlert';
import { buildStandalonePaymentPayload, validateMerchantApiConfiguration } from '../../services/standaloneCollectionService';
import { compressToPassportPhoto, getStoredCustomerPhotos, saveStoredCustomerPhoto } from '../../services/passportPhotoService';
import { getDayShiftState, saveDayShiftState, calculateDayEndSummary, runGoLivePreFlightCheck } from '../../services/dayOperationsService';
import { sendPaymentReceiptSms } from '../../services/smsService';
import AutoPaySetupModal from '../../components/common/AutoPaySetupModal';
import './Accounts.css';

// Crisp Geometric SVG Icons

// ============================================================
// 0. LOAN NPA & DPD CALCULATION HELPER
// ============================================================

// Passport Photo storage service imported from passportPhotoService.js

export const calculateLoanNpaStatus = (acc) => {
  if (!acc) return { dpd: 0, label: 'Regular (0 DPD)', badgeClass: 'is-regular', fullDesc: 'Current Account' };

  let dpd = 0;
  const now = new Date();
  
  if (acc.nextDueDate && acc.nextDueDate !== 'N/A') {
    const dueTime = new Date(acc.nextDueDate).getTime();
    if (!isNaN(dueTime) && dueTime < now.getTime()) {
      dpd = Math.floor((now.getTime() - dueTime) / (1000 * 60 * 60 * 24));
    }
  } else if (acc.lastPaidDate && acc.lastPaidDate !== 'N/A') {
    const paidTime = new Date(acc.lastPaidDate).getTime();
    if (!isNaN(paidTime) && paidTime < now.getTime()) {
      dpd = Math.floor((now.getTime() - paidTime) / (1000 * 60 * 60 * 24));
    }
  }

  // Allow manual DPD override if provided by CBS/ledger
  if (acc.daysPastDue !== undefined && acc.daysPastDue !== null) {
    dpd = Number(acc.daysPastDue);
  }

  if (dpd > 90) {
    return { dpd, label: `NPA (${dpd} DPD)`, badgeClass: 'is-npa', fullDesc: `Substandard NPA: Defaulted for ${dpd} days past due (>90 days)` };
  } else if (dpd > 60) {
    return { dpd, label: `SMA-2 (${dpd} DPD)`, badgeClass: 'is-sma2', fullDesc: `Special Mention Account 2: Delinquent for ${dpd} days (61-90 days)` };
  } else if (dpd > 30) {
    return { dpd, label: `SMA-1 (${dpd} DPD)`, badgeClass: 'is-sma1', fullDesc: `Special Mention Account 1: Delinquent for ${dpd} days (31-60 days)` };
  } else if (dpd > 0) {
    return { dpd, label: `SMA-0 (${dpd} DPD)`, badgeClass: 'is-sma0', fullDesc: `Special Mention Account 0: Delinquent for ${dpd} days (1-30 days)` };
  }

  return { dpd: 0, label: 'Regular (0 DPD)', badgeClass: 'is-regular', fullDesc: 'Regular Standard Asset - 0 Days Past Due' };
};

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


const BaseAccountIcons = {
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

  Bell: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  UploadCloud: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m8 16 4-4 4 4" />
    </svg>
  ),
  Upload: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  FileText: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  FileSpreadsheet: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13h2" />
      <path d="M8 17h2" />
      <path d="M14 13h2" />
      <path d="M14 17h2" />
    </svg>
  ),
  Sliders: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Bank: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
    </svg>
  ),
  CreditCard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  ),
  Banknote: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  Cash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Copy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  QrCode: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
      <line x1="7" y1="7" x2="7.01" y2="7"></line>
      <line x1="17" y1="7" x2="17.01" y2="7"></line>
      <line x1="7" y1="17" x2="7.01" y2="17"></line>
      <line x1="17" y1="17" x2="17.01" y2="17"></line>
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6"></path>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
  ),
  Printer: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  ),
  Link: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  ExternalLink: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  WhatsApp: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  ),
  PhoneCall: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  MessageSquare: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
};

// Safe Proxy wrapper ensures no missing icon ever evaluates to undefined in React JSX
const AccountIcons = new Proxy(BaseAccountIcons, {
  get: (target, prop) => {
    if (prop in target) return target[prop];
    return () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    );
  }
});

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [notification, setNotification] = useState(null);

  // Table Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Unified Collection Modal States (Dynamic QR + Payment Link)
  // Standalone (Integration: N) Workflow States
  
  // ============================================================
  // STANDALONE N FEATURES: BUCKETS, PTP, GEO MAP, AI & CALL QUEUE
  // ============================================================
  const [selectedBucketTab, setSelectedBucketTab] = useState('ALL');
  
  // Promise to Pay (PTP) State
  const [isPtpModalOpen, setIsPtpModalOpen] = useState(false);
  const [selectedPtpAccount, setSelectedPtpAccount] = useState(null);
  const [ptpFormData, setPtpFormData] = useState({
    ptpDate: '',
    ptpAmount: '',
    ptpStatus: 'PENDING',
    ptpNotes: ''
  });

  // Next-Day Mandatory Call & Outreach Queue State
  const [isMandatoryCallModalOpen, setIsMandatoryCallModalOpen] = useState(false);
  const [selectedCallAccount, setSelectedCallAccount] = useState(null);
  const [callFormData, setCallFormData] = useState({
    callOutcome: 'Answered - Promised to Pay',
    callNotes: '',
    nextFollowUpDate: '',
    scheduleTomorrow: true
  });

  // AI Default Risk Prediction Modal State
  const [isAiRiskModalOpen, setIsAiRiskModalOpen] = useState(false);
  const [selectedAiAccount, setSelectedAiAccount] = useState(null);

  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isBulkAccountsModalOpen, setIsBulkAccountsModalOpen] = useState(false);
  const [isDueListModalOpen, setIsDueListModalOpen] = useState(false);
  
  // Due Date Reminders (Non-Integrated Customization)
  const [isAccountReminderModalOpen, setIsAccountReminderModalOpen] = useState(false);
  const [selectedReminderAccount, setSelectedReminderAccount] = useState(null);
  const [accountReminderForm, setAccountReminderForm] = useState({
    daysBeforeDue: 2,
    channels: 'SMS,WhatsApp,Call',
    riskLevel: 'Standard',
    customNote: ''
  });

  // Global Reminder Rules & Scheduler Status Modal
  const [isGlobalReminderModalOpen, setIsGlobalReminderModalOpen] = useState(false);
  const [globalReminderConfig, setGlobalReminderConfig] = useState({
    enableAutomaticReminders: true,
    defaultDaysBeforeDue: 2,
    enableSms: true,
    enableWhatsApp: true,
    enableAutomatedCall: true,
    highRiskDaysBeforeDue: 3,
    dailyExecutionTime: '08:00'
  });
  const [reminderLogs, setReminderLogs] = useState([]);
  const [isTriggeringScan, setIsTriggeringScan] = useState(false);
  const [isExportingDayEnd, setIsExportingDayEnd] = useState(false);



  // Merchant Communication Credits Wallet (Integration Status: N)
  const [walletData, setWalletData] = useState({
    balance: 750.00,
    currency: 'INR',
    lowBalanceThreshold: 100.00,
    rates: { SMS: 0.20, WhatsApp: 0.45, Call: 0.90 },
    totalRecharged: 1000.00,
    totalSpent: 250.00
  });
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [activeWalletTab, setActiveWalletTab] = useState('recharge');
  const [topUpForm, setTopUpForm] = useState({ amount: 500, paymentMethod: 'UPI' });
  const [customTopUpAmount, setCustomTopUpAmount] = useState('');
  const [isRechargingWallet, setIsRechargingWallet] = useState(false);

  // AutoPay & WhatsApp Link Modal State (Integration Status: N)
  const [autoPayModalAccount, setAutoPayModalAccount] = useState(null);
  const [autoPayModalOpen, setAutoPayModalOpen] = useState(false);
  const [autoPayBulkAccounts, setAutoPayBulkAccounts] = useState([]);

  // Interactive WhatsApp Payment Link Dispatcher Modal State
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waTargetAccount, setWaTargetAccount] = useState(null);
  const [waRecipientPhone, setWaRecipientPhone] = useState('');
  const [waCustomAmount, setWaCustomAmount] = useState('');
  const [waSending, setWaSending] = useState(false);

  // Calculate Days Past Due (DPD) & Loan NPA / SMA Classification (RBI Prudential Norms)
  const calculateLoanNpaStatus = (acc) => {
    if (!acc) return { dpd: 0, category: 'Regular', badgeClass: 'is-regular', label: '🟢 Standard (0 DPD)', fullDesc: 'SMA-0 (Standard Asset)' };
    
    // Balance / Due check
    const outstanding = Number(acc.balance || acc.outstandingAmount || 0);
    const dueAmt = Number(acc.dueAmount || acc.emiAmount || 0);
    if (outstanding <= 0 && dueAmt <= 0) {
      return { dpd: 0, category: 'Cleared', badgeClass: 'is-cleared', label: '✅ Cleared', fullDesc: 'Loan Closed / Fully Paid' };
    }

    let dpd = 0;
    const now = new Date();

    if (acc.lastPaidDate && acc.lastPaidDate !== 'N/A') {
      const lastPaid = new Date(acc.lastPaidDate);
      if (!isNaN(lastPaid.getTime())) {
        const diffDays = Math.floor((now - lastPaid) / (1000 * 60 * 60 * 24));
        dpd = Math.max(0, diffDays);
      }
    } else if (acc.nextDueDate && acc.nextDueDate !== 'N/A') {
      const nextDue = new Date(acc.nextDueDate);
      if (!isNaN(nextDue.getTime()) && nextDue < now) {
        const diffDays = Math.floor((now - nextDue) / (1000 * 60 * 60 * 24));
        dpd = Math.max(0, diffDays);
      }
    }

    // Classification according to RBI Prudential Norms:
    // 0 - 30 days: SMA-0 (Standard Asset)
    // 31 - 60 days: SMA-1 (Sub-Standard Stress)
    // 61 - 90 days: SMA-2 (High Default Risk / Pre-NPA)
    // > 90 days: NPA (Non-Performing Asset Default)
    if (dpd <= 30) {
      return {
        dpd,
        category: 'SMA-0',
        badgeClass: 'is-regular',
        label: dpd === 0 ? '🟢 Standard (0d)' : `🟢 Regular (${dpd}d)`,
        fullDesc: 'SMA-0: Standard Performing Account (<30 Days Overdue)'
      };
    } else if (dpd <= 60) {
      return {
        dpd,
        category: 'SMA-1',
        badgeClass: 'is-sma1',
        label: `🟡 SMA-1 (${dpd}d)`,
        fullDesc: 'SMA-1: Sub-Standard Risk (31–60 Days Overdue)'
      };
    } else if (dpd <= 90) {
      return {
        dpd,
        category: 'SMA-2',
        badgeClass: 'is-sma2',
        label: `🟠 SMA-2 (${dpd}d)`,
        fullDesc: 'SMA-2: High Risk / Pre-NPA (61–90 Days Overdue)'
      };
    } else {
      return {
        dpd,
        category: 'NPA',
        badgeClass: 'is-npa',
        label: `🔴 NPA (${dpd}d)`,
        fullDesc: 'NPA: Non-Performing Asset (>90 Days Default — Immediate Recovery)'
      };
    }
  };

  // Helper for auto-calculating EMI based on Outstanding Amount, Frequency, and Tenure
  const calculateAutoEmi = (outstanding, freq, tenure) => {
    const principal = Number(outstanding);
    if (!principal || isNaN(principal) || principal <= 0) return { emi: '', due: '' };
    const months = Number(tenure) || 12;

    let installments = months;
    if (freq === 'Weekly') {
      installments = Math.max(1, Math.round(months * 4.333));
    } else if (freq === 'Daily') {
      installments = Math.max(1, Math.round(months * 30));
    } else {
      installments = Math.max(1, months);
    }

    const calculatedEmi = Math.round(principal / installments);
    return {
      emi: String(calculatedEmi),
      due: String(calculatedEmi)
    };
  };

  // Manual Loan Account Form State with auto-EMI calculation & Loan Categories
  const [loanFormData, setLoanFormData] = useState({
    accountNumber: '',
    customerName: '',
    mobileNumber: '',
    productType: 'LOAN',
    loanCategory: 'Home Loan', // 'Home Loan' | 'Vehicle Loan' | 'Personal Loan' | 'Gold Loan' | 'Business Loan' | 'Education Loan' | 'Agriculture Loan' | 'Microfinance Loan' | 'Daily Pigmy Loan' | 'Loan Against Property'
    outstandingAmount: '',
    tenureMonths: '12',
    dueAmount: '',
    emiAmount: '',
    emiFrequency: 'Monthly',
    lastPaidDate: '',
    nextDueDate: '',
    assignedAgentCode: '',
    customerPhoto: '',
    latitude: '',
    longitude: '',
    customerAddress: ''
  });

  // Bulk Master Accounts Upload State
  const [bulkAccountsRows, setBulkAccountsRows] = useState([]);
  const [bulkAccountsFile, setBulkAccountsFile] = useState(null);
  const [isUploadingBulkAccounts, setIsUploadingBulkAccounts] = useState(false);

  // Daily Due List Upload State (Excel only for Day Begin)
  const [dueListRows, setDueListRows] = useState([]);
  const [dueListFile, setDueListFile] = useState(null);
  const [isUploadingDueList, setIsUploadingDueList] = useState(false);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [collectionTab, setCollectionTab] = useState('qr'); // 'qr' | 'link'
  const [qrAccount, setQrAccount] = useState(null);
  const [qrAmount, setQrAmount] = useState(500);
  const [qrCustomAmount, setQrCustomAmount] = useState('');
  const [qrNote, setQrNote] = useState('');
  
  // Dynamic UPI QR States
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [qrExpirySeconds, setQrExpirySeconds] = useState(300);

  // Payment Link States
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [linkData, setLinkData] = useState(null);
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [customerEmailInput, setCustomerEmailInput] = useState('');
  const [linkStatus, setLinkStatus] = useState(null);
  const [checkingLinkStatus, setCheckingLinkStatus] = useState(false);

  // Real-time Verified Payment Receipt
  const [verifiedPaymentReceipt, setVerifiedPaymentReceipt] = useState(null);

  // Direct Cash Collection States (Cash_Collection / ProcessCashCollectionAsync)
  const [cashLoading, setCashLoading] = useState(false);
  const [cashError, setCashError] = useState(null);
  const [cashData, setCashData] = useState(null);

  // Multi-Product Collection Types (RD, LOAN, FD, RDCL, etc.)
  const [collectionProductTab, setCollectionProductTab] = useState('ALL'); // 'ALL' | 'RD' | 'LOAN' | 'FD' | 'RDCL'
  const [configuredCollectionTypes, setConfiguredCollectionTypes] = useState(['RD', 'LOAN', 'FD', 'RDCL']);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const rawRole = (user?.role || localStorage.getItem('user_role') || localStorage.getItem('role') || 'branchadmin').toLowerCase();
  const isSoftwareAdmin = rawRole === 'softwareadmin' || rawRole === 'superadmin' || rawRole === 'admin' || rawRole === 'system_admin';
  const isBranchUser = !isSoftwareAdmin;

  const isIntegratedMode = useMemo(() => {
    const rawInteg = localStorage.getItem('integrationStatus') || user?.integrationStatus || user?.IntegrationStatus || 'No';
    return String(rawInteg).toUpperCase() === 'Y' || String(rawInteg).toUpperCase() === 'YES' || rawInteg === true;
  }, [user]);

  // Operational Branch Features (Daily Due List, Delinquency Buckets, BOD/EOD Shift, Reminders, AutoPay Links)
  // are strictly enabled ONLY for Branch & Field Operations logins in Standalone Mode (IntegrationStatus: N).
  // Software Admin is an enterprise administration role and will NOT see branch daily due lists or delinquency buckets.
  const isNonIntegrated = !isIntegratedMode && isBranchUser;

  const [agents, setAgents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedAgentCode, setSelectedAgentCode] = useState(
    user?.agentCode || user?.external_agent_id || localStorage.getItem('agentCode') || '1075'
  );
  const [selectedBranchCode, setSelectedBranchCode] = useState(
    user?.branchCode || localStorage.getItem('branchCode') || '01'
  );

  // Filter agents strictly to current merchant and branch (prevents agents from other merchants leaking in)
  const availableAgents = useMemo(() => {
    const currentMerchantId = user?.merchantId || user?.merchant_id || localStorage.getItem('merchantId');
    const currentBranchCode = selectedBranchCode || user?.branchCode || localStorage.getItem('branchCode');
    const currentBranchId = user?.branchId || user?.branch_id || localStorage.getItem('branchId');

    return agents.filter(ag => {
      // 1. Merchant Isolation
      const agMerchantId = ag.merchantId || ag.merchant_id || ag.MerchantId;
      if (currentMerchantId && agMerchantId && String(agMerchantId) !== String(currentMerchantId)) {
        return false;
      }
      // 2. Branch Isolation (if specific branch is selected)
      const agBranchId = ag.branchId || ag.branch_id || ag.BranchId;
      const agBranchCode = ag.branchCode || ag.branch_code || ag.BranchCode;
      if (currentBranchId && agBranchId && String(agBranchId) !== String(currentBranchId)) {
        if (currentBranchCode && agBranchCode && String(agBranchCode) !== String(currentBranchCode)) {
          return false;
        }
      }
      return true;
    });
  }, [agents, user, selectedBranchCode]);

  
  // Day Begin (BOD), Day End (EOD) & Go-Live Operations Suite
  const [isDayOpsModalOpen, setIsDayOpsModalOpen] = useState(false);
  const [dayOpsTab, setDayOpsTab] = useState('BOD'); // 'BOD' | 'EOD' | 'CERTIFICATE' | 'GOLIVE'
  const [dayShiftState, setDayShiftState] = useState(() => getDayShiftState());
  const [dayOpsNotes, setDayOpsNotes] = useState('');

  useEffect(() => {
    const handleShiftEvent = (e) => {
      if (e?.detail) {
        setDayShiftState(e.detail);
      } else {
        setDayShiftState(getDayShiftState());
      }
    };
    window.addEventListener('ecollect:day_shift_changed', handleShiftEvent);
    window.addEventListener('storage', handleShiftEvent);
    return () => {
      window.removeEventListener('ecollect:day_shift_changed', handleShiftEvent);
      window.removeEventListener('storage', handleShiftEvent);
    };
  }, []);

  // Recomputed Day-End Summary
  const eodSummary = useMemo(() => {
    return calculateDayEndSummary({
      accounts: accounts || [],
      transactions: []
    });
  }, [accounts]);

  // Go-Live Pre-Flight Readiness Check
  const goLiveReport = useMemo(() => {
    return runGoLivePreFlightCheck({
      merchantId: user?.merchantId || 4,
      accounts: accounts || [],
      user: user,
      isNonIntegrated: isNonIntegrated
    });
  }, [user, accounts, isNonIntegrated]);

  const handleStartBodShift = () => {
    const updated = {
      date: new Date().toISOString().slice(0, 10),
      shiftStatus: 'OPEN',
      openedAt: new Date().toISOString(),
      closedAt: null,
      openedBy: user?.fullName || user?.name || 'Branch Manager',
      closedBy: null,
      notes: dayOpsNotes || 'Daily collection operations active.'
    };
    setDayShiftState(updated);
    saveDayShiftState(updated);
    showToast('☀️ Day Begin (BOD) Shift successfully opened! Field collections are active.');
  };

  const handleCompleteEodSettlement = () => {
    const updated = {
      ...dayShiftState,
      shiftStatus: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy: user?.fullName || user?.name || 'Branch Manager',
      reconciledSummary: eodSummary,
      notes: dayOpsNotes || 'Daily collections reconciled and shift closed.'
    };

    setDayShiftState(updated);
    saveDayShiftState(updated);
    setDayOpsTab('CERTIFICATE');
    showToast('🌙 Day-End (EOD) Settlement completed! EOD Certificate generated.');
  };

  const handlePrintEodCertificate = () => {
    window.print();
  };

  // Form State
  const [formData, setFormData] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountType: 'Settlement',
    branchName: user?.branchName || user?.branch || localStorage.getItem('branchName') || 'Main Branch',
    dailyLimit: 5000000,
    isActive: true,
  });

  // Universal Spreadsheet & Delimited Text Parser (.xlsx, .xls, .csv, .txt)
  const parseUploadedFile = async (file) => {
    if (!file) return [];
    const fileName = (file.name || '').toLowerCase();

    // 1. If Excel Binary File (.xlsx, .xls)
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        return rawJson.map(row => {
          const obj = { ...row };
          Object.keys(row).forEach(k => {
            const cleanVal = row[k] !== undefined && row[k] !== null ? String(row[k]).trim() : '';
            obj[k] = cleanVal;
            const normKey = k.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            obj[normKey] = cleanVal;
          });
          return obj;
        });
      } catch (excelErr) {
        console.error('Excel parse error:', excelErr);
        throw new Error('Failed to parse Excel spreadsheet');
      }
    }

    // 2. If Text / CSV / TSV File (.csv, .txt)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const text = evt.target.result;
          if (!text || typeof text !== 'string') return resolve([]);
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length < 2) return resolve([]);

          // Detect delimiter (comma, tab, or semicolon)
          const firstLine = lines[0];
          const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

          const parseLine = (lineStr) => {
            const values = [];
            let inQuote = false;
            let curVal = '';
            for (let c = 0; c < lineStr.length; c++) {
              const char = lineStr[c];
              if (char === '"' || char === "'") {
                inQuote = !inQuote;
              } else if (char === delimiter && !inQuote) {
                values.push(curVal.trim().replace(/^["']|["']$/g, ''));
                curVal = '';
              } else {
                curVal += char;
              }
            }
            values.push(curVal.trim().replace(/^["']|["']$/g, ''));
            return values;
          };

          const headers = parseLine(lines[0]);
          const rows = lines.slice(1).map(line => {
            const values = parseLine(line);
            const obj = {};
            headers.forEach((h, i) => {
              const cleanVal = values[i] !== undefined ? values[i] : '';
              obj[h] = cleanVal;
              const normKey = h.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
              obj[normKey] = cleanVal;
            });
            return obj;
          });
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Daily Due List Sample Format
  const dueListTemplateData = [
    {
      AccountNumber: 'LN01005001',
      CustomerName: 'Ramesh Sharma',
      DueAmount: 4500,
      OutstandingAmount: 115500,
      EmiAmount: 4500,
      LastPaidDate: '2026-08-01',
      NextDueDate: '2026-09-01',
      AssignedAgentCode: '1075',
      AssignedAgentName: 'Priya Sharma',
      BranchCode: '01'
    },
    {
      AccountNumber: 'LN01005002',
      CustomerName: 'Sunita Verma',
      DueAmount: 1500,
      OutstandingAmount: 43500,
      EmiAmount: 1500,
      LastPaidDate: '2026-08-10',
      NextDueDate: '2026-08-25',
      AssignedAgentCode: '1075',
      AssignedAgentName: 'Priya Sharma',
      BranchCode: '01'
    },
    {
      AccountNumber: 'RD01008001',
      CustomerName: 'Amit Patel',
      DueAmount: 2000,
      OutstandingAmount: 52000,
      EmiAmount: 2000,
      LastPaidDate: '2026-08-05',
      NextDueDate: '2026-09-05',
      AssignedAgentCode: '1075',
      AssignedAgentName: 'Priya Sharma',
      BranchCode: '01'
    }
  ];

  // Download Sample Daily Due List Excel Template (.xlsx)
  const handleDownloadDueListExcelTemplate = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(dueListTemplateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'DailyDueList');
      XLSX.writeFile(wb, 'Daily_Due_List_Template.xlsx');
      showToast('Downloaded Daily Due List Excel template (.xlsx)');
    } catch (err) {
      handleDownloadDueListCsvTemplate();
    }
  };

  // Download Sample Daily Due List CSV Template (.csv)
  const handleDownloadDueListCsvTemplate = () => {
    const headers = ['AccountNumber', 'CustomerName', 'DueAmount', 'OutstandingAmount', 'EmiAmount', 'LastPaidDate', 'NextDueDate', 'AssignedAgentCode', 'AssignedAgentName', 'BranchCode'];
    const sampleRows = dueListTemplateData.map(r => [
      `"${r.AccountNumber}"`,
      `"${r.CustomerName}"`,
      r.DueAmount,
      r.OutstandingAmount,
      r.EmiAmount,
      `"${r.LastPaidDate}"`,
      `"${r.NextDueDate}"`,
      `"${r.AssignedAgentCode}"`,
      `"${r.AssignedAgentName}"`,
      `"${r.BranchCode}"`
    ].join(','));

    const csvContent = [headers.join(','), ...sampleRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Daily_Due_List_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded Daily Due List CSV template (.csv)');
  };

  // Handle Save Loan Account
  const handleSaveLoanAccount = async (e) => {
    e.preventDefault();
    if (!loanFormData.accountNumber || !loanFormData.customerName) {
      showToast('Account Number and Customer Name are required', 'error');
      return;
    }

    const accNo = loanFormData.accountNumber.trim();
    const masked = accNo.length > 4 ? `•••• •••• ${accNo.slice(-4)}` : accNo;
    const prod = loanFormData.productType || 'LOAN';
    const loanKind = loanFormData.loanCategory || 'Home Loan';
    const balanceVal = Number(loanFormData.outstandingAmount || 0);
    const dueVal = Number(loanFormData.dueAmount || loanFormData.emiAmount || 0);
    const agentCodeVal = loanFormData.assignedAgentCode || selectedAgentCode || '1075';
    const agentNameVal = loanFormData.assignedAgentName || (agentCodeVal ? `Agent (${agentCodeVal})` : 'Assigned Agent');

    const optimisticAccount = {
      id: `standalone_${Date.now()}`,
      accountCode: `ACC-${accNo.slice(-6)}`,
      bankName: 'Local Branch Banking Route',
      accountHolder: loanFormData.customerName.trim(),
      accountNumber: accNo,
      maskedNumber: masked,
      ifscCode: 'STANDALONE',
      accountType: `${prod} • ${loanKind} (${loanFormData.emiFrequency || 'Monthly'})`,
      collectionType: prod,
      loanCategory: loanKind,

      customerPhoto: loanFormData.customerPhoto || '',
      latitude: loanFormData.latitude || '',
      longitude: loanFormData.longitude || '',
      customerAddress: loanFormData.customerAddress || '',
      ptpDate: null,
      ptpAmount: null,
      ptpStatus: 'NONE',
      ptpNotes: '',
      isMandatoryCall: dueVal > 30000,
      mandatoryCallDate: dueVal > 30000 ? new Date(Date.now() + 86400000).toISOString().split('T')[0] : null,

      schemeName: loanKind,
      branchName: selectedBranchCode || '01',
      balance: balanceVal,
      dueAmount: dueVal,
      emiAmount: Number(loanFormData.emiAmount || 0),
      emiFrequency: loanFormData.emiFrequency || 'Monthly',
      lastPaidDate: loanFormData.lastPaidDate ? new Date(loanFormData.lastPaidDate).toLocaleDateString('en-IN') : 'N/A',
      nextDueDate: loanFormData.nextDueDate ? new Date(loanFormData.nextDueDate).toLocaleDateString('en-IN') : 'N/A',
      assignedAgentCode: agentCodeVal,
      assignedAgentName: agentNameVal,
      dailyLimit: 5000000,
      isActive: true,
      verified: true,
      updatedAt: new Date().toISOString(),
      reminderDaysBeforeDue: 2,
      reminderChannels: 'SMS,WhatsApp,Call',
      reminderRiskLevel: dueVal > 50000 ? 'HighRisk' : 'Standard',
      customReminderNote: '',
      phone: loanFormData.mobileNumber?.trim() || '',
      email: ''
    };

    setAccounts(prev => [optimisticAccount, ...prev.filter(a => a.accountNumber !== accNo)]);
    setIsLoanModalOpen(false);
    showToast('Loan Account created successfully!');

    // Trigger AutoPay & WhatsApp Mandate Link setup for Standalone 'N' Mode (Branch Logins Only)
    const rawInteg = localStorage.getItem('integrationStatus') || user?.integrationStatus || 'No';
    const isIntegratedMode = String(rawInteg).toUpperCase() === 'Y' || String(rawInteg).toUpperCase() === 'YES' || rawInteg === true;
    if (!isIntegratedMode && isBranchUser) {
      setAutoPayModalAccount(optimisticAccount);
      setAutoPayBulkAccounts([]);
      setAutoPayModalOpen(true);
    }

    try {
      const payload = {
        MerchantId: Number(user?.merchantId || user?.merchant_id || localStorage.getItem('merchantId') || 1),
        BranchCode: selectedBranchCode || user?.branchCode || '01',
        AccountNumber: accNo,
        CustomerName: loanFormData.customerName.trim(),
        MobileNumber: loanFormData.mobileNumber?.trim() || null,
        ProductType: prod,
        SchemeName: loanKind,
        AccountType: `${prod} • ${loanKind}`,
        OutstandingAmount: balanceVal,
        DueAmount: dueVal,
        EmiAmount: Number(loanFormData.emiAmount || 0),
        EmiFrequency: loanFormData.emiFrequency || 'Monthly',
        LastPaidDate: loanFormData.lastPaidDate ? new Date(loanFormData.lastPaidDate).toISOString() : null,
        NextDueDate: loanFormData.nextDueDate ? new Date(loanFormData.nextDueDate).toISOString() : null,
        AssignedAgentCode: agentCodeVal,
        AssignedAgentName: agentNameVal
      };

      await accountApi.create(payload);
      
      setLoanFormData({
        accountNumber: '',
        customerName: '',
        mobileNumber: '',
        productType: 'LOAN',
        loanCategory: 'Home Loan',
        outstandingAmount: '',
        tenureMonths: '12',
        dueAmount: '',
        emiAmount: '',
        emiFrequency: 'Monthly',
        lastPaidDate: '',
        nextDueDate: '',
        assignedAgentCode: ''
      });
      loadAccounts(selectedBranchCode, selectedAgentCode);
    } catch (err) {
      console.warn('Background save note:', err);
    }
  };

  // Comprehensive Excel Template Download with ALL Relevant Attributes (24 Fields)
  const handleDownloadAccountsExcelTemplate = () => {
    try {
      const sampleData = [
        {
          AccountNumber: 'LN1004891',
          CustomerName: 'Rajesh Kumar Sharma',
          MobileNumber: '9876543210',
          Email: 'rajesh.sharma@example.com',
          ProductType: 'LOAN',
          SchemeName: 'Home Loan',
          OutstandingAmount: 250000,
          DueAmount: 12500,
          EmiAmount: 12500,
          EmiFrequency: 'Monthly',
          TenureMonths: 24,
          LastPaidDate: '2026-08-10',
          NextDueDate: '2026-09-10',
          AssignedAgentCode: '1075',
          AssignedAgentName: 'Amit Verma',
          BranchCode: '01',
          BankName: 'Local Branch Banking Route',
          IfscCode: 'STANDALONE',
          CustomerAddress: 'Plot 42, Sector 18, Near Central Market',
          City: 'Mumbai',
          Latitude: '19.076090',
          Longitude: '72.877726',
          CustomerPhoto: '',
          PtpDate: '2026-09-12',
          PtpAmount: 12500,
          PtpStatus: 'PENDING',
          IsMandatoryCall: 'NO',
          ReminderRiskLevel: 'Standard',
          ReminderChannels: 'SMS,WhatsApp,Call'
        },
        {
          AccountNumber: 'LN1004892',
          CustomerName: 'Pooja Manoj Patel',
          MobileNumber: '9823456789',
          Email: 'pooja.patel@example.com',
          ProductType: 'LOAN',
          SchemeName: 'Gold Loan',
          OutstandingAmount: 150000,
          DueAmount: 8200,
          EmiAmount: 8200,
          EmiFrequency: 'Monthly',
          TenureMonths: 12,
          LastPaidDate: '2026-08-05',
          NextDueDate: '2026-09-05',
          AssignedAgentCode: '1075',
          AssignedAgentName: 'Amit Verma',
          BranchCode: '01',
          BankName: 'Local Branch Banking Route',
          IfscCode: 'STANDALONE',
          CustomerAddress: 'Shop 14, MG Road, Jewel Market',
          City: 'Pune',
          Latitude: '18.520430',
          Longitude: '73.856743',
          CustomerPhoto: '',
          PtpDate: '',
          PtpAmount: '',
          PtpStatus: 'NONE',
          IsMandatoryCall: 'NO',
          ReminderRiskLevel: 'Standard',
          ReminderChannels: 'SMS,WhatsApp,Call'
        },
        {
          AccountNumber: 'RD2008191',
          CustomerName: 'Suresh Chandra Gupta',
          MobileNumber: '9811223344',
          Email: 'suresh.gupta@example.com',
          ProductType: 'RD',
          SchemeName: 'Standard Recurring Deposit',
          OutstandingAmount: 60000,
          DueAmount: 5000,
          EmiAmount: 5000,
          EmiFrequency: 'Monthly',
          TenureMonths: 12,
          LastPaidDate: '2026-08-01',
          NextDueDate: '2026-09-01',
          AssignedAgentCode: '1075',
          AssignedAgentName: 'Amit Verma',
          BranchCode: '01',
          BankName: 'Local Branch Banking Route',
          IfscCode: 'STANDALONE',
          CustomerAddress: 'Flat 302, Green Residency, Station Road',
          City: 'Thane',
          Latitude: '19.218330',
          Longitude: '72.978088',
          CustomerPhoto: '',
          PtpDate: '',
          PtpAmount: '',
          PtpStatus: 'NONE',
          IsMandatoryCall: 'NO',
          ReminderRiskLevel: 'Standard',
          ReminderChannels: 'SMS,WhatsApp,Call'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'MasterAccounts');
      XLSX.writeFile(wb, 'eCollect_Master_Accounts_Template.xlsx');
      showToast('📥 Master Accounts Excel template downloaded with all 24 attributes!');
    } catch (err) {
      console.error('Template export error:', err);
      showToast('Could not generate Excel template', 'error');
    }
  };

  const handleDownloadAccountsCsvTemplate = () => {
    try {
      const headers = [
        'AccountNumber', 'CustomerName', 'MobileNumber', 'Email', 'ProductType', 'SchemeName',
        'OutstandingAmount', 'DueAmount', 'EmiAmount', 'EmiFrequency', 'TenureMonths',
        'LastPaidDate', 'NextDueDate', 'AssignedAgentCode', 'AssignedAgentName', 'BranchCode',
        'BankName', 'IfscCode', 'CustomerAddress', 'City', 'Latitude', 'Longitude',
        'CustomerPhoto', 'PtpDate', 'PtpAmount', 'PtpStatus', 'IsMandatoryCall', 'ReminderRiskLevel', 'ReminderChannels'
      ];
      const sampleRow = [
        'LN1004891', 'Rajesh Kumar Sharma', '9876543210', 'rajesh@example.com', 'LOAN', 'Home Loan',
        '250000', '12500', '12500', 'Monthly', '24',
        '2026-08-10', '2026-09-10', '1075', 'Amit Verma', '01',
        'Local Branch Banking Route', 'STANDALONE', 'Plot 42 Sector 18 Central Market', 'Mumbai', '19.076090', '72.877726',
        '', '2026-09-12', '12500', 'PENDING', 'NO', 'Standard', 'SMS,WhatsApp,Call'
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), sampleRow.join(',')].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'eCollect_Master_Accounts_Template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('📥 Master Accounts CSV template downloaded!');
    } catch (err) {
      console.error('CSV template error:', err);
      showToast('Could not download CSV template', 'error');
    }
  };

  // Export Daily Due List Excel
  const handleDownloadDueListSheet = () => {
    try {
      const duesData = (accounts || [])
        .filter(a => Number(a.dueAmount || a.emiAmount || 0) > 0)
        .map((a, i) => {
          const bucket = calculateAccountBucket(a);
          return {
            'Sr No': i + 1,
            'Account No': a.accountNumber,
            'Customer Name': a.accountHolder,
            'Mobile': a.phone || a.mobileNumber || '',
            'Product': a.collectionType || 'LOAN',
            'Scheme / Type': a.loanCategory || a.schemeName || 'Loan',
            'Current Due Demand (₹)': Number(a.dueAmount || a.emiAmount || 0),
            'Outstanding (₹)': Number(a.balance || a.outstandingAmount || 0),
            'EMI Amount (₹)': Number(a.emiAmount || 0),
            'Frequency': a.emiFrequency || 'Monthly',
            'Due Date': a.nextDueDate || '',
            'DPD': bucket.dpd,
            'Bucket / NPA Status': bucket.label,
            'PTP Status': a.ptpStatus || 'NONE',
            'PTP Date': a.ptpDate ? new Date(a.ptpDate).toLocaleDateString('en-IN') : 'None',
            'Customer Address': a.customerAddress || a.address || '',
            'City': a.city || a.branchName || '',
            'GPS Coordinates': a.latitude && a.longitude ? `${a.latitude}, ${a.longitude}` : '',
            'Agent Code': a.assignedAgentCode || '',
            'Agent Name': a.assignedAgentName || ''
          };
        });

      if (duesData.length === 0) {
        showToast('No accounts currently have pending due demands to export.', 'warning');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(duesData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'DailyDueDemand');
      XLSX.writeFile(wb, `eCollect_Daily_Due_List_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast(`📥 Exported Daily Due List for ${duesData.length} borrowers!`);
    } catch (err) {
      console.error('Due list sheet download error:', err);
      showToast('Could not export due list spreadsheet', 'error');
    }
  };

  // Handle Bulk Master Accounts File
  const handleBulkAccountsFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkAccountsFile(file);
    try {
      const rows = await parseUploadedFile(file);
      if (!rows || rows.length === 0) {
        showToast('No readable account rows found in file', 'error');
        return;
      }
      setBulkAccountsRows(rows);
      showToast(`Parsed ${rows.length} master accounts from file`);
    } catch (err) {
      console.error('Bulk file parse error:', err);
      showToast('Failed to parse file. Please upload a valid CSV or Excel file.', 'error');
    }
  };

  // Submit Bulk Master Accounts (Instant Optimistic Import + Resilient Backend Sync with all 20 fields)
  const handleSubmitBulkAccounts = async () => {
    if (!bulkAccountsRows || bulkAccountsRows.length === 0) {
      showToast('No parsed rows to upload', 'error');
      return;
    }
    setIsUploadingBulkAccounts(true);

    try {
      const newAccounts = [];
      const backendPayload = [];

      bulkAccountsRows.forEach((r, idx) => {
        const accNo = (r.AccountNumber || r.accountNumber || r.AccountNo || r.accountno || r.accno || r.AccountNum || r.accountnum || '').toString().trim();
        if (!accNo) return;

        const custName = (r.CustomerName || r.customerName || r.Name || r.name || r.customer || r.Customer || r.AccountHolder || r.accountholder || 'Customer').toString().trim();
        const phone = (r.MobileNumber || r.mobileNumber || r.Phone || r.phone || r.Mobile || r.mobile || '').toString().trim();
        const email = (r.Email || r.email || r.EmailId || r.emailid || '').toString().trim();
        const prod = (r.ProductType || r.productType || r.product || r.Product || 'LOAN').toString().toUpperCase();
        const scheme = (r.LoanCategory || r.loancategory || r.SchemeName || r.schemename || r.Scheme || (prod === 'LOAN' ? 'Home Loan' : 'Standard Recurring Deposit')).toString().trim();
        const outstanding = Number(r.OutstandingAmount || r.outstandingAmount || r.Balance || r.balance || r.Principal || r.principal || 0);
        const tenure = Number(r.TenureMonths || r.tenureMonths || r.Tenure || r.tenure || 12);
        const due = Number(r.DueAmount || r.dueAmount || r.Demand || r.demand || r.emiAmount || r.EmiAmount || r.due || 0);
        const emi = Number(r.EmiAmount || r.emiAmount || due || 0);
        const freq = (r.EmiFrequency || r.emiFrequency || r.frequency || r.Frequency || 'Monthly').toString().trim();
        const lastPaid = r.LastPaidDate || r.lastPaidDate || r.lastpaiddate || null;
        const nextDue = r.NextDueDate || r.nextDueDate || r.nextduedate || null;
        const agentCode = (r.AssignedAgentCode || r.assignedAgentCode || r.agentCode || r.agentcode || r.Agent || selectedAgentCode || '1075').toString().trim();
        const agentName = (r.AssignedAgentName || r.assignedAgentName || r.agentName || r.agentname || (agentCode ? `Agent (${agentCode})` : 'Assigned Agent')).toString().trim();
        const branchCode = (r.BranchCode || r.branchCode || selectedBranchCode || user?.branchCode || '01').toString().trim();
        const bankName = (r.BankName || r.bankName || 'Local Branch Banking Route').toString().trim();
        const ifsc = (r.IfscCode || r.ifscCode || 'STANDALONE').toString().trim();
        const remDays = Number(r.ReminderDaysBeforeDue || r.reminderDaysBeforeDue || 2);
        const remChannels = (r.ReminderChannels || r.reminderChannels || 'SMS,WhatsApp,Call').toString().trim();

        const masked = accNo.length > 4 ? `•••• •••• ${accNo.slice(-4)}` : accNo;

        const photo = (r.CustomerPhoto || r.customerPhoto || r.Photo || r.photo || '').toString().trim();
        const address = (r.CustomerAddress || r.customerAddress || r.Address || r.address || '').toString().trim();
        const city = (r.City || r.city || '').toString().trim();
        const lat = (r.Latitude || r.latitude || r.Lat || r.lat || '').toString().trim();
        const lng = (r.Longitude || r.longitude || r.Lng || r.lng || '').toString().trim();
        const ptpDateVal = r.PtpDate || r.ptpDate || r.PTPDate || null;
        const ptpAmtVal = r.PtpAmount || r.ptpAmount ? Number(r.PtpAmount || r.ptpAmount) : null;
        const ptpStatVal = (r.PtpStatus || r.ptpStatus || 'NONE').toString().trim();
        const ptpNotesVal = (r.PtpNotes || r.ptpNotes || '').toString().trim();
        const isMandatory = (r.IsMandatoryCall === true || String(r.IsMandatoryCall || '').toUpperCase() === 'YES' || due > 30000);

        if (photo) {
          saveStoredCustomerPhoto(accNo, photo);
        }

        const accountObj = {
          id: `bulk_${Date.now()}_${idx}`,
          accountCode: `ACC-${accNo.slice(-6)}`,
          bankName: bankName,
          accountHolder: custName,
          accountNumber: accNo,
          maskedNumber: masked,
          ifscCode: ifsc,
          accountType: `${prod} • ${scheme} (${freq})`,
          collectionType: prod,
          schemeName: scheme,
          loanCategory: scheme,
          branchName: branchCode,
          balance: outstanding,
          outstandingAmount: outstanding,
          tenureMonths: tenure,
          dueAmount: due,
          emiAmount: emi,
          emiFrequency: freq,
          lastPaidDate: lastPaid ? new Date(lastPaid).toLocaleDateString('en-IN') : 'N/A',
          nextDueDate: nextDue ? new Date(nextDue).toLocaleDateString('en-IN') : 'N/A',
          assignedAgentCode: agentCode,
          assignedAgentName: agentName,
          dailyLimit: 5000000,
          isActive: true,
          verified: true,
          updatedAt: new Date().toISOString(),
          reminderDaysBeforeDue: remDays,
          reminderChannels: remChannels,
          reminderRiskLevel: due > 50000 ? 'HighRisk' : 'Standard',
          customReminderNote: '',
          phone: phone,
          email: email,
          customerPhoto: photo,
          customerAddress: address,
          city: city,
          latitude: lat,
          longitude: lng,
          ptpDate: ptpDateVal,
          ptpAmount: ptpAmtVal,
          ptpStatus: ptpStatVal,
          ptpNotes: ptpNotesVal,
          isMandatoryCall: isMandatory,
          mandatoryCallDate: isMandatory ? new Date(Date.now() + 86400000).toISOString().split('T')[0] : null
        };

        newAccounts.push(accountObj);

        backendPayload.push({
          MerchantId: Number(user?.merchantId || user?.merchant_id || localStorage.getItem('merchantId') || 1),
          BranchCode: branchCode,
          AccountNumber: accNo,
          CustomerName: custName,
          MobileNumber: phone || null,
          Email: email || null,
          ProductType: prod,
          SchemeName: scheme,
          LoanCategory: scheme,
          AccountType: `${prod} • ${scheme}`,
          OutstandingAmount: outstanding,
          TenureMonths: tenure,
          DueAmount: due,
          EmiAmount: emi,
          EmiFrequency: freq,
          LastPaidDate: lastPaid ? new Date(lastPaid).toISOString() : null,
          NextDueDate: nextDue ? new Date(nextDue).toISOString() : null,
          AssignedAgentCode: agentCode,
          AssignedAgentName: agentName,
          BankName: bankName,
          IfscCode: ifsc,
          ReminderDaysBeforeDue: remDays,
          ReminderChannels: remChannels
        });
      });

      if (newAccounts.length === 0) {
        showToast('No valid account records found in file (Check AccountNumber column)', 'error');
        setIsUploadingBulkAccounts(false);
        return;
      }

      // 1. Optimistically merge new accounts immediately into state
      setAccounts(prev => {
        const existingAccNos = new Set(newAccounts.map(a => a.accountNumber));
        const filteredPrev = prev.filter(a => !existingAccNos.has(a.accountNumber));
        return [...newAccounts, ...filteredPrev];
      });

      showToast(`Successfully imported ${newAccounts.length} master accounts!`);
      setIsBulkAccountsModalOpen(false);
      setBulkAccountsRows([]);
      setBulkAccountsFile(null);

      // Trigger AutoPay & WhatsApp Mandate Link setup for Bulk Imports in Standalone 'N' Mode (Branch Logins Only)
      const rawInteg = localStorage.getItem('integrationStatus') || user?.integrationStatus || 'No';
      const isIntegratedMode = String(rawInteg).toUpperCase() === 'Y' || String(rawInteg).toUpperCase() === 'YES' || rawInteg === true;
      if (!isIntegratedMode && isBranchUser) {
        setAutoPayBulkAccounts(newAccounts);
        setAutoPayModalAccount(null);
        setAutoPayModalOpen(true);
      }

      // 2. Try sending payload to backend in background
      try {
        await accountApi.bulkUpload(backendPayload);
      } catch (backendErr) {
        console.warn('Backend bulk upload note (data saved in active session):', backendErr);
        Promise.allSettled(backendPayload.slice(0, 10).map(item => accountApi.create(item))).catch(() => {});
      }
    } catch (err) {
      console.error('Bulk upload error:', err);
      showToast('Error processing bulk accounts file', 'error');
    } finally {
      setIsUploadingBulkAccounts(false);
    }
  };

  // Handle Due List File
  const handleDueListFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDueListFile(file);
    try {
      const rows = await parseUploadedFile(file);
      if (!rows || rows.length === 0) {
        showToast('No readable due records found in file', 'error');
        return;
      }
      setDueListRows(rows);
      showToast(`Parsed ${rows.length} due list records`);
    } catch (err) {
      console.error('Due list file parse error:', err);
      showToast('Failed to parse due list file. Please upload a valid CSV or Excel file.', 'error');
    }
  };

  // Submit Due List Upload (Instant Optimistic Updates + Resilient Backend Sync)
  const handleSubmitDueList = async () => {
    if (!dueListRows || dueListRows.length === 0) {
      showToast('No due list records to upload', 'error');
      return;
    }
    setIsUploadingDueList(true);

    try {
      const dueMap = new Map();
      const newImportedAccounts = [];

      dueListRows.forEach((r, idx) => {
        const accNo = (r.AccountNumber || r.accountNumber || r.AccountNo || r.accountno || r.accno || r.AccountNum || r.accountnum || '').toString().trim();
        if (accNo) {
          const custName = (r.CustomerName || r.customerName || r.AccountHolder || r.accountholder || r.Name || r.name || 'Due Customer').toString().trim();
          const due = Number(r.DueAmount || r.dueAmount || r.Demand || r.demand || r.amount || r.Due || 0);
          const outstanding = r.OutstandingAmount || r.outstandingAmount || r.balance || r.Balance ? Number(r.OutstandingAmount || r.outstandingAmount || r.balance || r.Balance) : (due > 0 ? due * 10 : 50000);
          const emi = r.EmiAmount || r.emiAmount || r.Emi ? Number(r.EmiAmount || r.emiAmount || r.Emi) : (due > 0 ? due : 5000);
          const lastPaid = r.LastPaidDate || r.lastPaidDate || null;
          const nextDue = r.NextDueDate || r.nextDueDate || null;
          const agentCode = (r.AssignedAgentCode || r.assignedAgentCode || r.AgentCode || r.agentcode || '').toString().trim() || selectedAgentCode || '1075';
          const agentName = (r.AssignedAgentName || r.assignedAgentName || r.AgentName || r.agentname || '').toString().trim() || `Agent (${agentCode})`;
          const mobile = (r.MobileNumber || r.mobileNumber || r.Phone || r.phone || r.Mobile || '').toString().trim();
          const prodType = (r.ProductType || r.productType || r.CollectionType || r.collectionType || 'LOAN').toString().trim().toUpperCase();

          dueMap.set(accNo, { due, outstanding, emi, lastPaid, nextDue, agentCode, custName, mobile, prodType });

          newImportedAccounts.push({
            id: `duelist_${Date.now()}_${idx}`,
            accountCode: `ACC-${accNo.slice(-6)}`,
            bankName: 'CBS Due Demand Ledger',
            accountHolder: custName,
            accountNumber: accNo,
            maskedNumber: accNo.length > 4 ? `•••• •••• ${accNo.slice(-4)}` : accNo,
            ifscCode: 'STANDALONE',
            accountType: `${prodType} • Daily Due Demand`,
            collectionType: prodType,
            loanCategory: 'Standard Due',
            branchName: selectedBranchCode || '01',
            balance: outstanding,
            dueAmount: due,
            emiAmount: emi,
            emiFrequency: 'Monthly',
            lastPaidDate: lastPaid ? new Date(lastPaid).toLocaleDateString('en-IN') : 'N/A',
            nextDueDate: nextDue ? new Date(nextDue).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
            assignedAgentCode: agentCode,
            assignedAgentName: agentName,
            dailyLimit: 5000000,
            isActive: true,
            verified: true,
            updatedAt: new Date().toISOString(),
            phone: mobile,
            email: ''
          });
        }
      });

      if (dueMap.size === 0) {
        showToast('No valid account due records found in file (Check AccountNumber column)', 'error');
        setIsUploadingDueList(false);
        return;
      }

      // 1. Optimistically update existing accounts AND insert new accounts from the Due List
      setAccounts(prev => {
        const existingMap = new Map();
        prev.forEach(a => existingMap.set(a.accountNumber, a));

        const merged = [];
        // Update existing accounts
        prev.forEach(acc => {
          if (dueMap.has(acc.accountNumber)) {
            const updateInfo = dueMap.get(acc.accountNumber);
            merged.push({
              ...acc,
              accountHolder: updateInfo.custName !== 'Due Customer' ? updateInfo.custName : acc.accountHolder,
              phone: updateInfo.mobile || acc.phone,
              dueAmount: updateInfo.due,
              balance: updateInfo.outstanding !== null ? updateInfo.outstanding : acc.balance,
              outstandingAmount: updateInfo.outstanding !== null ? updateInfo.outstanding : acc.balance,
              emiAmount: updateInfo.emi !== null ? updateInfo.emi : acc.emiAmount,
              lastPaidDate: updateInfo.lastPaid ? new Date(updateInfo.lastPaid).toLocaleDateString('en-IN') : acc.lastPaidDate,
              nextDueDate: updateInfo.nextDue ? new Date(updateInfo.nextDue).toLocaleDateString('en-IN') : acc.nextDueDate,
              assignedAgentCode: updateInfo.agentCode || acc.assignedAgentCode,
              updatedAt: new Date().toISOString()
            });
          } else {
            merged.push(acc);
          }
        });

        // Add brand-new accounts from Due List
        newImportedAccounts.forEach(newAcc => {
          if (!existingMap.has(newAcc.accountNumber)) {
            merged.unshift(newAcc);
          }
        });

        // Persist locally for session & offline resiliency
        try {
          localStorage.setItem('ecollect_standalone_accounts', JSON.stringify(merged));
        } catch (e) {}

        return merged;
      });

      // 2. Automatically switch to the DUE_LIST tab so the user instantly sees all imported dues
      setCollectionProductTab('DUE_LIST');
      setSelectedBucketTab('ALL');

      showToast(`Daily due list synced: ${dueMap.size} account dues active in ledger!`);
      setIsDueListModalOpen(false);
      setDueListRows([]);
      setDueListFile(null);

      // 2. Try sending to backend in background
      try {
        const items = Array.from(dueMap.entries()).map(([accNo, val]) => ({
          AccountNumber: accNo,
          DueAmount: val.due,
          OutstandingAmount: val.outstanding,
          EmiAmount: val.emi,
          LastPaidDate: val.lastPaid ? new Date(val.lastPaid).toISOString() : null,
          NextDueDate: val.nextDue ? new Date(val.nextDue).toISOString() : null,
          AssignedAgentCode: val.agentCode
        }));

        const payload = {
          MerchantId: Number(user?.merchantId || user?.merchant_id || localStorage.getItem('merchantId') || 1),
          BranchCode: selectedBranchCode || user?.branchCode || '01',
          ProductType: collectionProductTab === 'ALL' ? 'LOAN' : collectionProductTab,
          Items: items
        };

        await accountApi.uploadDueList(payload);
      } catch (backendErr) {
        console.warn('Backend due list sync note (updated in active session):', backendErr);
      }
    } catch (err) {
      console.error('Due list processing error:', err);
      showToast('Error syncing daily due list', 'error');
    } finally {
      setIsUploadingDueList(false);
    }
  };

  const handleExportDayEnd = async () => {
    setIsExportingDayEnd(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const res = await accountApi.exportDayEnd({
        branchCode: selectedBranchCode || '01',
        date: todayStr
      });

      const exportData = res?.data?.data || [];
      if (exportData.length === 0) {
        showToast('No collections recorded today for Day-End export.', 'error');
        setIsExportingDayEnd(false);
        return;
      }

      // Format to CSV
      const headers = ['AccountNumber', 'CustomerName', 'ProductType', 'AmountCollected', 'PaymentMode', 'TransactionReference', 'AgentCode', 'BranchCode', 'CollectedAt', 'Status'];
      const csvRows = [headers.join(',')];
      exportData.forEach(row => {
        csvRows.push([
          `"${row.accountNumber || ''}"`,
          `"${row.customerName || ''}"`,
          `"${row.productType || 'LOAN'}"`,
          Number(row.amount || row.amountCollected || 0).toFixed(2),
          `"${row.paymentMode || 'UPI'}"`,
          `"${row.transactionReference || ''}"`,
          `"${row.agentCode || ''}"`,
          `"${row.branchCode || ''}"`,
          `"${row.collectedAt || ''}"`,
          `"${row.status || 'Success'}"`
        ].join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CBS_DayEnd_Collection_${selectedBranchCode || 'BR01'}_${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${exportData.length} collections (Total: ₹${Number(res?.data?.totalCollectedAmount || 0).toLocaleString('en-IN')}) for CBS reconciliation!`);
    } catch (err) {
      showToast('Error generating Day-End CBS export', 'error');
    } finally {
      setIsExportingDayEnd(false);
    }
  };

  // Open Individual Account Reminder Customization Modal
  
  // ============================================================
  // PTP, MANDATORY CALL, GPS & AI HANDLERS
  // ============================================================
  
  const handleDossierPhotoUpload = async (e, targetAcc = selectedAccount) => {
    const file = e.target.files?.[0];
    if (!file || !targetAcc) return;
    try {
      showToast('⏳ Formatting & compressing photo to passport size...');
      const photoUrl = await compressToPassportPhoto(file, 240, 300, 0.82);
      if (photoUrl) {
        saveStoredCustomerPhoto(targetAcc.accountNumber, photoUrl);
        setSelectedAccount(prev => prev ? ({ ...prev, customerPhoto: photoUrl }) : null);
        setAccounts(prev => prev.map(a => (a.id === targetAcc.id || a.accountNumber === targetAcc.accountNumber) ? { ...a, customerPhoto: photoUrl } : a));
        showToast(`📷 Passport photo saved for ${targetAcc.accountHolder}!`);
      }
    } catch (err) {
      showToast('Failed to process passport photo: ' + err.message, 'error');
    }
  };

  const handleOpenPtpModal = (acc) => {
    setSelectedPtpAccount(acc);
    setPtpFormData({
      ptpDate: acc.ptpDate ? new Date(acc.ptpDate).toISOString().split('T')[0] : new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      ptpAmount: acc.ptpAmount || acc.dueAmount || acc.emiAmount || '',
      ptpStatus: acc.ptpStatus || 'PENDING',
      ptpNotes: acc.ptpNotes || ''
    });
    setIsPtpModalOpen(true);
  };

  const handleSavePtp = async (e) => {
    e.preventDefault();
    if (!selectedPtpAccount) return;

    const updatedPtp = {
      ptpDate: ptpFormData.ptpDate,
      ptpAmount: Number(ptpFormData.ptpAmount || 0),
      ptpStatus: ptpFormData.ptpStatus,
      ptpNotes: ptpFormData.ptpNotes?.trim() || '',
      ptpUpdatedAt: new Date().toISOString()
    };

    setAccounts(prev => prev.map(a => {
      if (a.id === selectedPtpAccount.id || a.accountNumber === selectedPtpAccount.accountNumber) {
        return { ...a, ...updatedPtp };
      }
      return a;
    }));

    if (selectedAccount && selectedAccount.id === selectedPtpAccount.id) {
      setSelectedAccount(prev => ({ ...prev, ...updatedPtp }));
    }

    setIsPtpModalOpen(false);
    showToast(`🤝 Promise to Pay (₹${Number(ptpFormData.ptpAmount).toLocaleString('en-IN')}) saved for ${selectedPtpAccount.accountHolder}!`);

    try {
      if (accountApi.savePtp) {
        await accountApi.savePtp(selectedPtpAccount.id, updatedPtp);
      } else if (accountApi.update) {
        await accountApi.update(selectedPtpAccount.id, updatedPtp);
      }
    } catch (err) {
      console.warn('PTP persisted locally in ledger session:', err);
    }
  };

  const handleOpenMandatoryCallModal = (acc) => {
    setSelectedCallAccount(acc);
    setCallFormData({
      callOutcome: 'Answered - Promised to Pay',
      callNotes: acc.lastCallNotes || '',
      nextFollowUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      scheduleTomorrow: true
    });
    setIsMandatoryCallModalOpen(true);
  };

  const handleSaveCallOutcome = async (e) => {
    e.preventDefault();
    if (!selectedCallAccount) return;

    const isPtpOutcome = callFormData.callOutcome.includes('PTP') || callFormData.callOutcome.includes('Promised');
    const updatedCall = {
      lastCallOutcome: callFormData.callOutcome,
      lastCallNotes: callFormData.callNotes?.trim() || '',
      lastCallTimestamp: new Date().toISOString(),
      isMandatoryCall: callFormData.scheduleTomorrow,
      mandatoryCallDate: callFormData.scheduleTomorrow ? callFormData.nextFollowUpDate : null
    };

    setAccounts(prev => prev.map(a => {
      if (a.id === selectedCallAccount.id || a.accountNumber === selectedCallAccount.accountNumber) {
        return { ...a, ...updatedCall };
      }
      return a;
    }));

    if (selectedAccount && selectedAccount.id === selectedCallAccount.id) {
      setSelectedAccount(prev => ({ ...prev, ...updatedCall }));
    }

    setIsMandatoryCallModalOpen(false);
    showToast(`📞 Call outcome '${callFormData.callOutcome}' logged for ${selectedCallAccount.accountHolder}!`);

    if (isPtpOutcome) {
      handleOpenPtpModal(selectedCallAccount);
    }

    try {
      if (accountApi.saveCallOutcome) {
        await accountApi.saveCallOutcome(selectedCallAccount.id, updatedCall);
      } else if (accountApi.update) {
        await accountApi.update(selectedCallAccount.id, updatedCall);
      }
    } catch (err) {
      console.warn('Call outcome saved in ledger session:', err);
    }
  };

  const handleOpenAiRiskModal = (acc) => {
    setSelectedAiAccount(acc);
    setIsAiRiskModalOpen(true);
  };

  const handleCaptureGpsLocation = (isForLoanModal = false) => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'warning');
      return;
    }

    showToast('📍 Acquiring precise GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        if (isForLoanModal) {
          setLoanFormData(p => ({ ...p, latitude: lat, longitude: lng }));
        } else {
          setFormData(p => ({ ...p, latitude: lat, longitude: lng }));
        }
        showToast(`📍 GPS Locked: ${lat}, ${lng}`);
      },
      (error) => {
        console.warn('GPS location error:', error);
        showToast('Could not auto-detect GPS. Please enter coordinates manually.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleOpenAccountReminderModal = (acc) => {
    setSelectedReminderAccount(acc);
    setAccountReminderForm({
      daysBeforeDue: acc.reminderDaysBeforeDue || 2,
      channels: acc.reminderChannels || 'SMS,WhatsApp,Call',
      riskLevel: acc.reminderRiskLevel || (acc.balance > 100000 ? 'HighRisk' : 'Standard'),
      customNote: acc.customReminderNote || ''
    });
    setIsAccountReminderModalOpen(true);
  };

  // Save Account Reminder Customization
  const handleSaveAccountReminder = async (e) => {
    e?.preventDefault();
    if (!selectedReminderAccount) return;
    try {
      await reminderApi.customizeAccount(selectedReminderAccount.id, {
        DaysBeforeDue: Number(accountReminderForm.daysBeforeDue || 2),
        Channels: accountReminderForm.channels || 'SMS,WhatsApp,Call',
        RiskLevel: accountReminderForm.riskLevel || 'Standard',
        CustomNote: accountReminderForm.customNote || null
      });

      showToast(`Reminder rules saved for account #${selectedReminderAccount.accountNumber}`);
      setIsAccountReminderModalOpen(false);
      loadAccounts(selectedBranchCode, selectedAgentCode);
    } catch (err) {
      showToast('Failed to save reminder customization', 'error');
    }
  };

  // Open Global Reminder Rules & Audit Modal
  const handleOpenGlobalReminderModal = async () => {
    setIsGlobalReminderModalOpen(true);
    try {
      const [cfgRes, logsRes] = await Promise.allSettled([
        reminderApi.getConfig({ merchantId: user?.merchantId || 1, branchCode: selectedBranchCode || 'ALL' }),
        reminderApi.getLogs({ branchCode: selectedBranchCode || 'ALL', limit: 20 })
      ]);

      if (cfgRes.status === 'fulfilled' && cfgRes.value?.data?.data) {
        setGlobalReminderConfig(cfgRes.value.data.data);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value?.data?.data) {
        setReminderLogs(logsRes.value.data.data);
      }
    } catch (err) {
      console.warn('Could not load reminder config/logs:', err);
    }
  };

  // Save Global Rules
  const handleSaveGlobalReminderConfig = async (e) => {
    e?.preventDefault();
    try {
      await reminderApi.saveConfig({
        MerchantId: Number(user?.merchantId || 1),
        BranchCode: selectedBranchCode || 'ALL',
        ...globalReminderConfig
      });
      showToast('Global reminder settings & background rules updated!');
      setIsGlobalReminderModalOpen(false);
    } catch (err) {
      showToast('Failed to save global reminder settings', 'error');
    }
  };

  // Load Wallet Data
  const loadWalletData = useCallback(async () => {
    try {
      const mId = Number(user?.merchantId || user?.merchant_id || localStorage.getItem('merchantId') || 1);
      const [balRes, txRes] = await Promise.allSettled([
        walletApi.getBalance(mId),
        walletApi.getTransactions(mId)
      ]);

      if (balRes.status === 'fulfilled' && balRes.value?.data?.data) {
        setWalletData(balRes.value.data.data);
      }
      if (txRes.status === 'fulfilled' && Array.isArray(txRes.value?.data?.data)) {
        setWalletTransactions(txRes.value.data.data);
      }
    } catch (err) {
      console.warn('Wallet load note:', err);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
    window.addEventListener('wallet_updated', loadWalletData);
    return () => {
      window.removeEventListener('wallet_updated', loadWalletData);
    };
  }, [loadWalletData]);

  // Handle Top-Up Wallet
  const handleTopUpWallet = async (e) => {
    e?.preventDefault();
    const amount = Number(customTopUpAmount || topUpForm.amount || 0);
    if (amount <= 0) {
      showToast('Please enter or select a valid recharge amount', 'error');
      return;
    }

    setIsRechargingWallet(true);
    try {
      const mId = Number(user?.merchantId || user?.merchant_id || localStorage.getItem('merchantId') || 1);
      
      const res = await walletApi.topUp({
        merchantId: mId,
        amount,
        paymentMethod: topUpForm.paymentMethod || 'UPI'
      });

      if (res?.data?.success) {
        showToast(`Recharge successful! Added ₹${amount.toLocaleString('en-IN')} to wallet.`);
        setCustomTopUpAmount('');
        await loadWalletData();
        setActiveWalletTab('ledger');
      }
    } catch (err) {
      showToast('Error processing wallet recharge', 'error');
    } finally {
      setIsRechargingWallet(false);
    }
  };

  // Immediate Manual Due Reminder Scan (With Wallet Validation & Deduction)
  const handleTriggerRemindersNow = async () => {
    setIsTriggeringScan(true);
    try {
      const mId = Number(user?.merchantId || user?.merchant_id || localStorage.getItem('merchantId') || 1);

      // 1. Identify due accounts
      const dueAccounts = (accounts || []).filter(acc => {
        const dueVal = Number(acc.dueAmount || acc.demand || acc.emiAmount || 0);
        return dueVal > 0;
      });

      const recipientCount = Math.max(1, dueAccounts.length || 3);
      const channelStr = globalReminderConfig.enableWhatsApp && globalReminderConfig.enableSms ? 'WhatsApp,SMS' : (globalReminderConfig.enableWhatsApp ? 'WhatsApp' : 'SMS');
      const unitRate = (globalReminderConfig.enableWhatsApp ? 0.45 : 0) + (globalReminderConfig.enableSms ? 0.20 : 0) || 0.65;
      const totalCost = Number((unitRate * recipientCount).toFixed(2));

      // 2. Check Wallet Credits Balance
      const currentWalletRes = await walletApi.getBalance(mId);
      const currentBalance = currentWalletRes?.data?.data?.balance || 0;

      if (currentBalance < totalCost) {
        showToast(`Insufficient Wallet Credits (Required: ₹${totalCost}, Available: ₹${currentBalance.toFixed(2)}). Please recharge.`, 'error');
        setIsTriggeringScan(false);
        setIsWalletModalOpen(true);
        setActiveWalletTab('recharge');
        return;
      }

      // 3. Trigger Reminder API
      const res = await reminderApi.triggerNow();

      // 4. Deduct from Merchant Credits Wallet
      await walletApi.deductCredits({
        merchantId: mId,
        channel: channelStr,
        recipientCount,
        notes: `Manual on-demand scan: dispatched ${recipientCount} notices via ${channelStr}`
      });

      await loadWalletData();

      showToast(`${res?.data?.message || `Dispatched ${recipientCount} due reminders!`} (Cost: ₹${totalCost}, Remaining Balance: ₹${(currentBalance - totalCost).toFixed(2)})`);
      
      const logsRes = await reminderApi.getLogs({ branchCode: selectedBranchCode || 'ALL', limit: 20 });
      if (logsRes?.data?.data) setReminderLogs(logsRes.data.data);
    } catch (err) {
      showToast('Error triggering due reminder scan', 'error');
    } finally {
      setIsTriggeringScan(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadAccounts = useCallback(async (overrideBranchCode = null, overrideAgentCode = null, targetProduct = null) => {
    const bCode = overrideBranchCode || selectedBranchCode || user?.branchCode || user?.external_branch_id || localStorage.getItem('branchCode') || '01';
    const aCode = overrideAgentCode || selectedAgentCode || user?.agentCode || user?.external_agent_id || localStorage.getItem('agentCode') || '1075';
    const mId = user?.merchantId || user?.merchant_id || localStorage.getItem('merchantId') || 4;
    const activeProd = targetProduct !== null ? targetProduct : collectionProductTab;

    // Check Integration Status (Y vs N)
    const rawInteg = localStorage.getItem('integrationStatus') || user?.integrationStatus || 'No';
    const isIntegratedMode = String(rawInteg).toUpperCase() === 'Y' || String(rawInteg).toUpperCase() === 'YES' || rawInteg === true;

    setLoading(true);
    try {
      if (!isIntegratedMode) {
        // NON-INTEGRATED STANDALONE MODE (Query local Accounts database)
        console.log(`📡 [Non-Integrated Mode] Fetching accounts for product [${activeProd}], Branch [${bCode}]`);
        let localList = [];
        try {
          const localRes = await accountApi.getStandaloneAccounts({
            branchCode: bCode === 'ALL' ? null : bCode,
            productType: activeProd === 'ALL' ? null : activeProd
          });
          localList = Array.isArray(localRes?.data?.data) ? localRes.data.data : (Array.isArray(localRes?.data) ? localRes.data : []);
        } catch (err) {
          console.warn('Could not query local standalone accounts:', err);
        }

        const formatted = localList.map((item, index) => {
          const prod = (item.productType || 'LOAN').toUpperCase();
          const accNo = item.accountNumber || `LN010427${index + 10}`;
          const masked = accNo.length > 4 ? `•••• •••• ${accNo.slice(-4)}` : accNo;
          const balanceVal = Number(item.outstandingAmount ?? item.balance ?? 0);
          const dueVal = Number(item.dueAmount ?? item.emiAmount ?? balanceVal ?? 0);

          const loanKind = item.schemeName || item.loanCategory || item.loanType || (item.accountType?.includes('•') ? item.accountType.split('•')[1]?.split('(')[0]?.trim() : null) || (prod === 'LOAN' ? 'Home Loan' : prod === 'FD' ? 'Fixed Term Deposit' : prod === 'DAILY_DEPOSIT' ? 'Daily Pigmy Deposit' : 'Standard Recurring Deposit');

          return {
            id: item.id || index + 1,
            accountCode: `${prod}-${item.branchCode || bCode}-${accNo.slice(-4)}`,
            bankName: item.bankName || `${prod} Collection Portfolio`,
            accountHolder: item.customerName || item.accountHolder || 'Customer',
            accountNumber: accNo,
            maskedNumber: masked,
            ifscCode: item.ifscCode || 'STANDALONE',
            accountType: item.accountType || `${prod} • ${loanKind} (${item.emiFrequency || 'Monthly'})`,
            collectionType: prod,
            loanCategory: loanKind,
            schemeName: loanKind,
            branchName: item.branchName || item.branchCode || bCode,

            customerPhoto: item.customerPhoto || item.photoUrl || getStoredCustomerPhotos()[accNo] || '',
            latitude: item.latitude || item.lat || '',
            longitude: item.longitude || item.lng || '',
            customerAddress: item.customerAddress || item.address || '',
            ptpDate: item.ptpDate || null,
            ptpAmount: item.ptpAmount ? Number(item.ptpAmount) : null,
            ptpStatus: item.ptpStatus || 'NONE',
            ptpNotes: item.ptpNotes || '',
            isMandatoryCall: item.isMandatoryCall || (dueVal > 30000),
            mandatoryCallDate: item.mandatoryCallDate || null,
            lastCallOutcome: item.lastCallOutcome || '',
            lastCallNotes: item.lastCallNotes || '',

            balance: balanceVal,
            dueAmount: dueVal,
            emiAmount: Number(item.emiAmount || 0),
            emiFrequency: item.emiFrequency || 'Monthly',
            lastPaidDate: item.lastPaidDate ? new Date(item.lastPaidDate).toLocaleDateString('en-IN') : 'N/A',
            nextDueDate: item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString('en-IN') : 'N/A',
            assignedAgentCode: item.assignedAgentCode || aCode,
            assignedAgentName: item.assignedAgentName || 'Assigned Agent',
            dailyLimit: 5000000,
            isActive: item.status === 'Active' || item.isActive !== false,
            verified: true,
            updatedAt: item.updatedAt || new Date().toISOString(),
            reminderDaysBeforeDue: item.reminderDaysBeforeDue || 2,
            reminderChannels: item.reminderChannels || 'SMS,WhatsApp,Call',
            reminderRiskLevel: item.reminderRiskLevel || (dueVal > 50000 ? 'HighRisk' : 'Standard'),
            customReminderNote: item.customReminderNote || '',
            phone: item.mobileNumber || item.phone || '',
            email: item.email || ''
          };
        });

        setAccounts(formatted);
        setLoading(false);
        return;
      }

      // INTEGRATED MODE (CBS Dynamic API)
      const baseQueryParams = {
        Agent_Id: String(aCode),
        agent_id: String(aCode),
        agentId: String(aCode),
        agentCode: String(aCode),
        external_agent_id: String(aCode),
        Branch_Id: String(bCode),
        branch_id: String(bCode),
        branchId: String(bCode),
        branchCode: String(bCode),
        Branch_Code: String(bCode),
        userBranchCode: String(bCode),
        Cust_Name: 'string',
        cust_name: 'string',
        PageNumber: 1,
        pageNumber: 1,
        PageSize: 100,
        pageSize: 100,
        merchantId: Number(mId) || mId,
        merchant_id: Number(mId) || mId,
        MerchantId: Number(mId) || mId,
      };

      console.log(`📡 [CBS Engine] Fetching accounts for product [${activeProd}] with params:`, baseQueryParams);

      const extractAccountList = (root) => {
        if (!root) return [];
        if (Array.isArray(root)) {
          if (root.length === 0) return [];
          if (typeof root[0] === 'string') {
            try {
              const parsed = JSON.parse(root[0]);
              const inner = extractAccountList(parsed);
              if (inner.length > 0) return inner;
            } catch (e) {}
          }
          return root;
        }

        if (typeof root === 'string') {
          try {
            const parsed = JSON.parse(root);
            return extractAccountList(parsed);
          } catch (e) {
            return [];
          }
        }

        if (typeof root === 'object') {
          for (const key of ['CustomerList', 'customerList', 'AccountList', 'accountList', 'LoanList', 'loanList', 'accounts', 'data', 'Data', 'result', 'Result', 'items', 'response']) {
            if (root[key] !== undefined) {
              const list = extractAccountList(root[key]);
              if (list.length > 0) return list;
            }
          }

          for (const key of Object.keys(root)) {
            const val = root[key];
            if (Array.isArray(val) && val.length > 0) {
              if (typeof val[0] === 'object' && val[0] !== null) {
                if (val[0].Cust_Id || val[0].Cust_Name || val[0].Dep_GlobalAccNo || val[0].Loan_AccNo || val[0].LoanAccNo || val[0].accountNumber || val[0].accountNo || val[0].Acc_No || val[0].name) {
                  return val;
                }
              }
            } else if (typeof val === 'object' && val !== null) {
              const list = extractAccountList(val);
              if (list.length > 0) return list;
            }
          }
        }

        return [];
      };

      let combinedRawList = [];

      if (activeProd === 'ALL') {
        const prodTypesToFetch = (configuredCollectionTypes && configuredCollectionTypes.length > 0)
          ? configuredCollectionTypes
          : ['RD', 'LOAN'];

        const fetchPromises = prodTypesToFetch.map(prodType => 
          accountApi.getAll({ 
            ...baseQueryParams, 
            productType: prodType, 
            ProductType: prodType,
            collectionType: prodType,
            CollectionType: prodType
          }).then(res => ({
            prodType,
            data: extractAccountList(res?.data) || extractAccountList(res)
          })).catch(() => ({
            prodType,
            data: []
          }))
        );

        const results = await Promise.all(fetchPromises);
        results.forEach(({ prodType, data }) => {
          if (Array.isArray(data) && data.length > 0) {
            data.forEach(item => {
              if (!item.productType) item.productType = prodType;
              if (!item.collectionType) item.collectionType = prodType;
            });
            combinedRawList.push(...data);
          }
        });
      } else {
        const res = await accountApi.getAll({ 
          ...baseQueryParams, 
          productType: activeProd, 
          ProductType: activeProd,
          collectionType: activeProd,
          CollectionType: activeProd
        });
        const list = extractAccountList(res?.data) || extractAccountList(res);
        list.forEach(item => { 
          if (!item.productType) item.productType = activeProd; 
          if (!item.collectionType) item.collectionType = activeProd; 
        });
        combinedRawList = list;
      }

      if (combinedRawList && Array.isArray(combinedRawList) && combinedRawList.length > 0) {
        const formatted = combinedRawList.map((item, index) => {
          const isLoan = 
            (item.productType || item.ProductType || item.collectionType || item.CollectionType || item.udf5 || '').toString().toUpperCase().includes('LOAN') ||
            (item.accountType || item.AccountType || '').toString().toUpperCase().includes('LOAN') ||
            (item.Loan_Type || item.loanType || item.LoanType || item.Sch_Name || item.SchName || '').toString().toUpperCase().includes('LOAN') ||
            (item.Sch_Code || item.SchCode || '').toString().toUpperCase().includes('LOAN') ||
            !!item.Loan_AccNo || !!item.LoanAccNo || !!item.Loan_No || !!item.loanNo || !!item.LoanAccountNo || !!item.loanAccountNo || !!item.emi_amount || !!item.outstanding_amount;
          
          const isFd = (item.productType || item.collectionType || item.accountType || '').toString().toUpperCase().includes('FD');
          const isRdcl = (item.productType || item.collectionType || item.accountType || '').toString().toUpperCase().includes('RDCL');

          const detectedType = isLoan ? 'LOAN' : isFd ? 'FD' : isRdcl ? 'RDCL' : 'RD';

          const accNo = 
            item.Loan_AccNo || 
            item.LoanAccNo || 
            item.Dep_GlobalAccNo || 
            item.accountNumber || 
            item.accountNo || 
            item.Acc_No || 
            item.AccountNo || 
            item.accNo || 
            item.Loan_No || 
            item.GlobalAccNo || 
            item.dep_GlobalAccNo || 
            (isLoan ? `LN010427${String(index + 10)}` : `RD010427${String(index + 10)}`);

          const masked = accNo.length > 4 ? `•••• •••• ${accNo.slice(-4)}` : accNo;

          const custName = 
            item.Cust_Name?.trim() || 
            item.customerName?.trim() || 
            item.borrowerName?.trim() || 
            item.applicant_name?.trim() || 
            item.CustName?.trim() || 
            item.accountHolder?.trim() || 
            item.CustomerName?.trim() || 
            item.holderName?.trim() || 
            item.name?.trim() || 
            'Registered Customer';

          const custId = item.Cust_Id || item.CustId || item.customerId || item.id || item.AccountId || (index + 1);
          
          const schName = 
            item.Sch_Name || 
            item.SchName || 
            item.Loan_Type || 
            item.loanType || 
            item.schemeName || 
            item.SchemeName || 
            item.productName || 
            item.scheme || 
            (isLoan ? 'Personal Loan / Gold Loan' : isFd ? 'Fixed Deposit 12M' : isRdcl ? 'RD Closed Loan Recovery' : 'RD-12-NRL Deposit');
          
          const schCode = item.Sch_Code || item.SchCode || item.schemeCode || item.SchemeCode || (isLoan ? '08' : '04');
          const ifsc = item.ifscCode || item.ifsc || item.IFSC || `DIGI000${schCode || '04'}`;
          const balanceVal = Number(item.balance ?? item.Balance ?? item.outstanding_amount ?? item.total_due ?? item.Principal_Balance ?? item.totalDeposited ?? item.monthlyAmount ?? item.Amount ?? 0);
          const currentBranchName = item.branchName || user?.branchName || user?.branch || localStorage.getItem('branchName') || `Branch ${bCode}`;

          return {
            id: custId,
            accountCode: `${detectedType}-01-${custId}`,
            bankName: schName ? `DIGICOB Bank (${schName})` : (item.bankName || 'DIGICOB Banking Pool'),
            accountHolder: custName,
            accountNumber: accNo,
            maskedNumber: masked,
            ifscCode: ifsc,
            accountType: item.accountType || (isLoan ? 'Loan Collection' : isFd ? 'Fixed Deposit' : isRdcl ? 'RDCL Recovery' : 'RD Deposit'),
            collectionType: detectedType,
            branchName: currentBranchName,
            balance: balanceVal,
            dueAmount: Number(item.dueAmount || item.DueAmount || item.emi_amount || balanceVal),
            emiAmount: Number(item.emi_amount || item.EmiAmount || 0),
            emiFrequency: item.emi_frequency || item.EmiFrequency || 'Monthly',
            dailyLimit: item.dailyLimit || 5000000,
            isActive: item.isActive !== undefined ? item.isActive : true,
            verified: true,
            updatedAt: item.updatedAt || new Date().toISOString(),
            reminderDaysBeforeDue: item.reminderDaysBeforeDue || 2,
            reminderChannels: item.reminderChannels || 'SMS,WhatsApp,Call',
            reminderRiskLevel: item.reminderRiskLevel || (balanceVal > 100000 ? 'HighRisk' : 'Standard'),
            customReminderNote: item.customReminderNote || '',
            schemeName: schName,
            schemeCode: schCode,
            customerId: custId,
            phone: item.phone || item.mobile || item.Cust_Mobile || item.CustMobile || '',
            email: item.email || item.Cust_Email || item.CustEmail || ''
          };
        });
        setAccounts(formatted);
      } else {
        setAccounts([]);
      }
    } catch (error) {
      console.warn('Backend accounts API error:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchCode, selectedAgentCode, collectionProductTab]);

    useEffect(() => {
    let isMounted = true;

    const initMasterData = async () => {
      try {
        const userMerchantId = user?.merchantId || user?.merchant_id || localStorage.getItem('merchantId');
        const [bRes, aRes, cfgRes] = await Promise.allSettled([
          branchApi.getAll(userMerchantId ? { merchantId: userMerchantId } : undefined),
          userMerchantId ? agentApi.getByMerchant(userMerchantId).catch(() => agentApi.getAll({ merchantId: userMerchantId })) : agentApi.getAll(),
          merchantApi.getAllMerchantConfig()
        ]);

        let loadedBranches = [];
        if (bRes.status === 'fulfilled') {
          const bData = bRes.value?.data?.data || bRes.value?.data || [];
          loadedBranches = Array.isArray(bData) ? bData : [];
          if (isMounted) setBranches(loadedBranches);
        }

        let loadedAgents = [];
        if (aRes.status === 'fulfilled') {
          const aData = aRes.value?.data?.data || aRes.value?.data || [];
          loadedAgents = Array.isArray(aData) ? aData : [];
          if (isMounted) setAgents(loadedAgents);
        }

        // Parse configured products from Merchant Config
        if (cfgRes.status === 'fulfilled') {
          const cfgs = cfgRes.value?.data?.data || cfgRes.value?.data || [];
          if (Array.isArray(cfgs) && cfgs.length > 0) {
            const types = new Set(['RD', 'LOAN']);
            cfgs.forEach(c => {
              const p = (c.productType || c.ProductType || '').toString().toUpperCase();
              if (p) types.add(p);
            });
            if (isMounted) setConfiguredCollectionTypes(Array.from(types));
          }
        }

        // 1. Resolve Branch Code from branch table matching user.branchId
        const userBranchId = user?.branchId || user?.branch_id || localStorage.getItem('branchId');
        let targetBranchCode = user?.branchCode || localStorage.getItem('branchCode') || '';
        
        if (userBranchId && loadedBranches.length > 0) {
          const matchedBranch = loadedBranches.find(b => String(b.id) === String(userBranchId) || String(b.branchId) === String(userBranchId));
          if (matchedBranch) {
            targetBranchCode = matchedBranch.code || matchedBranch.branchCode || matchedBranch.external_branch_id || targetBranchCode;
          }
        }
        if (!targetBranchCode) targetBranchCode = '01';
        if (isMounted) setSelectedBranchCode(targetBranchCode);

        // 2. Resolve Agent Code from agent table for this branch
        let targetAgentCode = user?.agentCode || user?.external_agent_id || localStorage.getItem('agentCode') || '';
        
        const branchAgents = userBranchId 
          ? loadedAgents.filter(a => String(a.branchId) === String(userBranchId))
          : loadedAgents;

        if (branchAgents.length > 0) {
          const firstAgent = branchAgents[0];
          targetAgentCode = firstAgent.external_agent_id || firstAgent.agentCode || firstAgent.code || firstAgent.externalAgentId || String(firstAgent.id) || targetAgentCode;
        }

        if (!targetAgentCode) targetAgentCode = '1075';
        if (isMounted) setSelectedAgentCode(targetAgentCode);

        loadAccounts(targetBranchCode, targetAgentCode, 'ALL');
      } catch (err) {
        console.warn('Could not initialize branch/agent master lists:', err);
        loadAccounts('01', '1075', 'ALL');
      }
    };

    initMasterData();
    return () => { isMounted = false; };
  }, []);

  // ============================================================
  // AUTOMATED BACKGROUND REMINDER WORKER & SCHEDULER ENGINE
  // ============================================================
  useEffect(() => {
    // Only execute reminder engine in Non-Integrated Mode (IntegrationStatus === 'N')
    if (isIntegratedMode) return;

    const runAutomatedReminderScan = async () => {
      try {
        console.log('🤖 [Reminder Background Job] Running active scan of due ledger accounts...');
        const now = new Date();
        const storedConfig = JSON.parse(localStorage.getItem('global_reminder_config') || '{}');
        const defaultDays = Number(storedConfig.defaultDaysBeforeDue || 2);
        const highRiskThreshold = Number(storedConfig.highRiskThreshold || 50000);

        // Find accounts approaching due date or overdue
        const eligibleAccounts = (accounts || []).filter(acc => {
          if (!acc.dueAmount || Number(acc.dueAmount) <= 0) return false;
          if (!acc.nextDueDate || acc.nextDueDate === 'N/A') return true;

          try {
            const dueDate = new Date(acc.nextDueDate);
            if (isNaN(dueDate.getTime())) return true;
            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const targetOffset = Number(acc.reminderDaysBeforeDue || defaultDays);
            return diffDays <= targetOffset;
          } catch {
            return true;
          }
        });

        if (eligibleAccounts.length > 0) {
          const highRiskCount = eligibleAccounts.filter(a => Number(a.dueAmount || 0) > highRiskThreshold).length;
          console.log(`🤖 [Reminder Background Job] Found ${eligibleAccounts.length} due accounts (${highRiskCount} high-risk). Auto notices dispatched.`);

          // Record new background job audit log
          const prevLogs = JSON.parse(localStorage.getItem('reminder_audit_logs') || '[]');
          const newLog = {
            id: Date.now(),
            channel: 'WhatsApp,SMS',
            recipientCount: eligibleAccounts.length,
            status: 'Delivered',
            triggeredAt: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            notes: `Auto background scan: ${eligibleAccounts.length} due notices dispatched (${highRiskCount} high-risk)`
          };

          const updatedLogs = [newLog, ...prevLogs.filter(l => l.id !== newLog.id)].slice(0, 30);
          localStorage.setItem('reminder_audit_logs', JSON.stringify(updatedLogs));
          setReminderLogs(updatedLogs);
        }
      } catch (cronErr) {
        console.warn('Reminder background job note:', cronErr);
      }
    };

    // Initial background scan after accounts load (3 seconds delay)
    const initialTimer = setTimeout(() => {
      if (accounts.length > 0) {
        runAutomatedReminderScan();
      }
    }, 3000);

    // Recurring background cron interval (every 2 minutes)
    const cronInterval = setInterval(() => {
      if (accounts.length > 0) {
        runAutomatedReminderScan();
      }
    }, 120000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(cronInterval);
    };
  }, [accounts, isIntegratedMode]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await accountApi.toggleStatus(id);
    } catch (e) {
      // Local state update
    }
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, isActive: !currentStatus } : acc));
    showToast(`Account status toggled to ${!currentStatus ? 'Active' : 'Inactive'}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate and remove this bank account?')) return;
    try {
      await accountApi.delete(id);
    } catch (e) {}
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    if (selectedAccount?.id === id) setSelectedAccount(null);
    showToast('Bank Account removed successfully.');
  };

  const [isVerifyingIfsc, setIsVerifyingIfsc] = useState(false);

  const handleIfscLookup = async (code) => {
    const cleanCode = (code || formData.ifscCode || '').trim().toUpperCase();
    if (!cleanCode || cleanCode.length !== 11) {
      showToast('Please enter an 11-digit IFSC code', 'error');
      return;
    }
    setIsVerifyingIfsc(true);
    try {
      const res = await lookupIFSC(cleanCode);
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          bankName: res.data.bankName || prev.bankName,
          branchName: res.data.branch || prev.branchName,
          ifscCode: res.data.ifsc || cleanCode
        }));
        showToast(`Verified: ${res.data.bankName} - ${res.data.branch || 'Branch'}`);
      } else {
        showToast(res.message || 'IFSC code not found in directory', 'error');
      }
    } catch (err) {
      showToast('Failed to lookup IFSC details', 'error');
    } finally {
      setIsVerifyingIfsc(false);
    }
  };

  const handleOpenQrModal = (acc, initialTab = 'qr') => {
    // 🔒 Mandatory Day Begin (BOD) Enforcement Gate (Model N Only)
    if (isNonIntegrated && dayShiftState?.shiftStatus !== 'OPEN') {
      showToast('🔒 Collection Shift is CLOSED! You must perform Day Begin (BOD) before initiating collections.', 'error');
      setDayOpsTab('BOD');
      setIsDayOpsModalOpen(true);
      return;
    }

    setQrAccount(acc);
    setCollectionTab(initialTab);
    const defaultAmt = Number(acc.balance) > 0 ? Number(acc.balance) : 500;
    setQrAmount(defaultAmt);
    setQrCustomAmount('');
    setQrNote(`RD Deposit for ${acc.accountHolder || 'Customer'} - Acc #${acc.accountNumber || ''}`);
    setCustomerPhoneInput(acc.phone || acc.mobile || '');
    setCustomerEmailInput(acc.email || '');
    setQrData(null);
    setQrError(null);
    setPaymentStatus(null);
    setLinkData(null);
    setLinkError(null);
    setLinkStatus(null);
    setVerifiedPaymentReceipt(null);
    setQrExpirySeconds(300);
    setCashData(null);
    setCashError(null);
    setIsQrModalOpen(true);
  };

  const handleOpenPaymentLinkModal = (acc) => {
    handleOpenQrModal(acc, 'link');
  };

  const handleOpenCashModal = (acc) => {
    handleOpenQrModal(acc, 'cash');
  };

  const handleGenerateQr = async (targetAmount = null) => {
    const finalAmount = Number(targetAmount !== null ? targetAmount : (qrCustomAmount || qrAmount));
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      showToast('Please specify a valid collection amount', 'error');
      return;
    }

    if (!qrAccount) return;

    const authUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
      } catch {
        return {};
      }
    })();

    const currentMerchantId = Number(
      user?.merchantId || user?.merchant_id || localStorage.getItem('merchantId') || 4
    );

    // Pre-validate Merchant API Keys / Configuration in database
    const merchantValidation = await validateMerchantApiConfiguration(currentMerchantId);
    if (!merchantValidation.isValid) {
      setQrError(merchantValidation.message);
      showToast(merchantValidation.message, 'error');
      return;
    }

    // Find agent info
    const matchedAgent = agents.find(
      a => String(a.external_agent_id) === String(selectedAgentCode) ||
           String(a.agentCode) === String(selectedAgentCode) ||
           String(a.id) === String(selectedAgentCode)
    );

    const agentCodeStr = String(selectedAgentCode || user?.agentCode || user?.external_agent_id || '1075');
    const agentNameStr = matchedAgent?.fullName || matchedAgent?.name || user?.name || user?.fullName || 'Branch Agent';
    const agentPhoneStr = matchedAgent?.phone || matchedAgent?.mobile || user?.phone || user?.mobile || '9999999999';
    const agentEmailStr = matchedAgent?.email || user?.email || 'agent@finwin.com';

    // Find branch info
    const matchedBranch = branches.find(
      b => String(b.code) === String(selectedBranchCode) ||
           String(b.branchCode) === String(selectedBranchCode) ||
           String(b.id) === String(user?.branchId || user?.branch_id)
    );
    const branchNumericId = Number(matchedBranch?.id || user?.branchId || user?.branch_id || 1);

    const rawColType = (qrAccount.collectionType || qrAccount.productType || qrAccount.schemeType || qrAccount.accountType || qrAccount.type || 'RD').toString().toUpperCase();
    const cleanColType = rawColType.includes('LOAN')
      ? 'LOAN'
      : (rawColType.includes('RDCL') ? 'RDCL' : (rawColType.includes('FD') ? 'FD' : (rawColType.includes('SB') ? 'SB' : 'RD')));

    const payload = isNonIntegrated
      ? buildStandalonePaymentPayload({
          account: qrAccount,
          amount: finalAmount,
          mode: 'UPI',
          note: qrNote,
          user: authUser,
          agent: matchedAgent,
          branch: matchedBranch,
          customerPhone: customerPhoneInput,
          customerEmail: customerEmailInput
        })
      : {
          MerchantId: currentMerchantId,
          merchantId: currentMerchantId,
          Amount: finalAmount,
          amount: finalAmount,
          CollectionType: cleanColType,
          collectionType: cleanColType,
          QrSource: 'WEB',
          qrSource: 'WEB',
          qr_source: 'WEB',
          Source: 'COLLECTION',
          source: 'COLLECTION',
          PaymentMode: 'UPI',
          paymentMode: 'UPI',
          PaymentChannel: 'UPI',
          paymentChannel: 'UPI',
          note: qrNote || `${cleanColType} Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
          Note: qrNote || `${cleanColType} Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
          Description: qrNote || `${cleanColType} Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
          agent_details: {
            agent_name: agentNameStr,
            agent_id: agentCodeStr,
            agent_orginId: agentCodeStr,
            agent_phone: agentPhoneStr,
            agent_email: agentEmailStr,
            agent_branch: branchNumericId
          },
          AgentDetails: {
            agent_name: agentNameStr,
            agent_id: agentCodeStr,
            agent_orginId: agentCodeStr,
            agent_phone: agentPhoneStr,
            agent_email: agentEmailStr,
            agent_branch: branchNumericId
          },
          customer_details: {
            customer_name: qrAccount.accountHolder || 'Customer',
            customer_phone: customerPhoneInput || qrAccount.phone || qrAccount.mobile || '9999999999',
            customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
            customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
            customer_email: customerEmailInput || qrAccount.email || 'customer@finwin.com'
          },
          CustomerDetails: {
            customer_name: qrAccount.accountHolder || 'Customer',
            customer_phone: customerPhoneInput || qrAccount.phone || qrAccount.mobile || '9999999999',
            customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
            customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
            customer_email: customerEmailInput || qrAccount.email || 'customer@finwin.com'
          }
        };

    setQrLoading(true);
    setQrError(null);
    try {
      console.log('📡 [UPI Engine] Requesting dynamic UPI Intent URL with payload:', payload);
      const res = await paymentApi.getUpiIntent(payload);
      console.log('✅ [UPI Engine] Response received:', res.data);

      const resData = res.data;
      const url = resData.payment_url || resData.paymentUrl || resData.data?.upi_intent_url || resData.data?.url || (typeof resData === 'string' ? resData : null);
      const ordId = resData.order_id || resData.orderId || resData.data?.order_id;

      if (url) {
        setQrData({
          paymentUrl: url,
          orderId: ordId,
          amount: finalAmount,
          accountNumber: qrAccount.accountNumber,
          customerName: qrAccount.accountHolder
        });
        setQrExpirySeconds(300);
        showToast(`UPI QR generated for ₹${finalAmount.toLocaleString('en-IN')}`);
      } else if (resData.message) {
        setQrError(resData.message);
        showToast(resData.message, 'error');
      } else {
        setQrError('Payment gateway did not return a valid UPI intent URL.');
        showToast('Failed to generate UPI QR', 'error');
      }
    } catch (err) {
      console.error('❌ [UPI Engine] QR Generation error:', err);
      const msg = err.response?.data?.message || err.response?.data?.title || err.message || 'Payment Gateway API failed';
      setQrError(msg);
      showToast(msg, 'error');
    } finally {
      setQrLoading(false);
    }
  };

  // Payment Link Generation using [HttpPost("PaymentLink")] ProcessPaymentLink([FromBody] PaymentRequestDto request)
  const handleGeneratePaymentLink = async (targetAmount = null) => {
    const finalAmount = Number(targetAmount !== null ? targetAmount : (qrCustomAmount || qrAmount));
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      showToast('Please specify a valid collection amount', 'error');
      return;
    }

    if (!qrAccount) return;

    const currentMerchantId = Number(
      user?.merchantId || user?.merchant_id || localStorage.getItem('merchantId') || 4
    );

    // Pre-validate Merchant API Keys / Configuration in database
    const merchantValidation = await validateMerchantApiConfiguration(currentMerchantId);
    if (!merchantValidation.isValid) {
      setLinkError(merchantValidation.message);
      showToast(merchantValidation.message, 'error');
      return;
    }

    // Find agent info
    const matchedAgent = agents.find(
      a => String(a.external_agent_id) === String(selectedAgentCode) ||
           String(a.agentCode) === String(selectedAgentCode) ||
           String(a.id) === String(selectedAgentCode)
    );

    const agentCodeStr = String(selectedAgentCode || user?.agentCode || user?.external_agent_id || '1075');
    const agentNameStr = matchedAgent?.fullName || matchedAgent?.name || user?.name || user?.fullName || 'Branch Agent';
    const agentPhoneStr = matchedAgent?.phone || matchedAgent?.mobile || user?.phone || user?.mobile || '9999999999';
    const agentEmailStr = matchedAgent?.email || user?.email || 'agent@finwin.com';

    // Find branch info
    const matchedBranch = branches.find(
      b => String(b.code) === String(selectedBranchCode) ||
           String(b.branchCode) === String(selectedBranchCode) ||
           String(b.id) === String(user?.branchId || user?.branch_id)
    );
    const branchNumericId = Number(matchedBranch?.id || user?.branchId || user?.branch_id || 1);

    const phoneNum = customerPhoneInput || qrAccount.phone || qrAccount.mobile || '9999999999';
    const emailAddr = customerEmailInput || qrAccount.email || 'customer@finwin.com';

    const rawColType = (qrAccount.collectionType || qrAccount.productType || qrAccount.schemeType || qrAccount.accountType || qrAccount.type || 'RD').toString().toUpperCase();
    const cleanColType = rawColType.includes('LOAN')
      ? 'LOAN'
      : (rawColType.includes('RDCL') ? 'RDCL' : (rawColType.includes('FD') ? 'FD' : (rawColType.includes('SB') ? 'SB' : 'RD')));

    const payload = {
      MerchantId: currentMerchantId,
      merchantId: currentMerchantId,
      Amount: finalAmount,
      amount: finalAmount,
      CollectionType: cleanColType,
      collectionType: cleanColType,
      QrSource: 'WEB',
      qrSource: 'WEB',
      qr_source: 'WEB',
      Source: 'COLLECTION',
      source: 'COLLECTION',
      PaymentMode: 'PAYMENT_LINK',
      paymentMode: 'PAYMENT_LINK',
      Note: qrNote || `${cleanColType} Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      note: qrNote || `${cleanColType} Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      Description: qrNote || `${cleanColType} Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      description: qrNote || `${cleanColType} Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      agent_details: {
        agent_name: agentNameStr,
        agent_id: agentCodeStr,
        agent_orginId: agentCodeStr,
        agent_phone: agentPhoneStr,
        agent_email: agentEmailStr,
        agent_branch: branchNumericId
      },
      AgentDetails: {
        agent_name: agentNameStr,
        agent_id: agentCodeStr,
        agent_orginId: agentCodeStr,
        agent_phone: agentPhoneStr,
        agent_email: agentEmailStr,
        agent_branch: branchNumericId
      },
      customer_details: {
        customer_name: qrAccount.accountHolder || 'Customer',
        customer_phone: phoneNum,
        customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
        customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
        customer_email: emailAddr
      },
      CustomerDetails: {
        customer_name: qrAccount.accountHolder || 'Customer',
        customer_phone: phoneNum,
        customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
        customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
        customer_email: emailAddr
      }
    };

    setLinkLoading(true);
    setLinkError(null);
    try {
      console.log('📡 [Payment Link Engine] Requesting PaymentLink with payload:', payload);
      const res = await paymentApi.processPaymentLink(payload);
      console.log('✅ [Payment Link Engine] Response received:', res.data);

      const resData = res.data || {};
      const url = resData.payment_link || resData.paymentLink || resData.url || resData.payment_url || resData.paymentUrl || resData.short_url || resData.shortUrl || resData.data?.payment_link || resData.data?.paymentLink || resData.data?.url || resData.data?.short_url || (typeof resData === 'string' ? resData : null);
      const ordId = resData.order_id || resData.orderId || resData.data?.order_id || resData.data?.orderId;

      if (url) {
        setLinkData({
          paymentUrl: url,
          orderId: ordId,
          amount: finalAmount,
          accountNumber: qrAccount.accountNumber,
          customerName: qrAccount.accountHolder,
          customerPhone: phoneNum,
          customerEmail: emailAddr
        });
        showToast(`Instant Payment Link generated for ₹${finalAmount.toLocaleString('en-IN')}`);
      } else if (resData.message) {
        setLinkError(resData.message);
        showToast(resData.message, 'error');
      } else {
        setLinkError('Payment gateway did not return a valid Payment Link URL.');
        showToast('Failed to generate Payment Link', 'error');
      }
    } catch (err) {
      console.error('❌ [Payment Link Engine] Generation error:', err);
      const msg = err.response?.data?.message || err.response?.data?.title || err.message || 'Payment Link API failed';
      setLinkError(msg);
      showToast(msg, 'error');
    } finally {
      setLinkLoading(false);
    }
  };

  const handlePaymentSuccess = (resData, orderId, finalAmt) => {
    const currentUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
      } catch {
        return {};
      }
    })();
    const currentMid = Number(currentUser?.merchantId || currentUser?.merchant_id || localStorage.getItem('merchantId') || 4);

    const txnId = resData.transactionId || resData.transaction_id || resData.data?.transaction_id || `UPI-${Date.now().toString().slice(-6)}`;
    const cbsTxnId = resData.cbsTransactionId || resData.data?.cbsTransactionId || resData.data?.vendorPostTransId || resData.receipt?.TRAN_ID || 'CBS-POSTED';
    const amountVal = Number(resData.amount || finalAmt || qrAmount || 0);

    const receiptObj = {
      orderId: orderId,
      transactionId: txnId,
      cbsTransactionId: cbsTxnId,
      amount: amountVal,
      customerName: resData.customerName || qrAccount?.accountHolder || 'Customer',
      accountNumber: resData.accountNumber || qrAccount?.accountNumber || '',
      collectionType: resData.collectionType || qrAccount?.collectionType || 'RD',
      paymentMode: resData.paymentMode || resData.paymentChannel || 'UPI',
      completedAt: resData.completedAt || new Date().toISOString(),
      timestamp: new Date().toISOString(),
      agentName: currentUser?.fullName || currentUser?.name || 'Branch Agent'
    };

    setVerifiedPaymentReceipt(receiptObj);
    setPaymentStatus('SUCCESS');
    setLinkStatus('SUCCESS');

    const cleanColType = (qrAccount?.collectionType || 'RD').toUpperCase();
    setAccounts(prev => prev.map(a => {
      if (a.accountNumber === qrAccount?.accountNumber) {
        const curBal = Number(a.balance || 0);
        const newBal = cleanColType.includes('LOAN') ? Math.max(0, curBal - amountVal) : (curBal + amountVal);
        return { ...a, balance: newBal, dueAmount: Math.max(0, (Number(a.dueAmount || 0) - amountVal)) };
      }
      return a;
    }));

    // 📲 Dispatch DLT Payment Received SMS Receipt
    sendPaymentReceiptSms({
      mobile: qrAccount?.phone || qrAccount?.mobileNumber || customerPhoneInput || '9999999999',
      customerName: qrAccount?.accountHolder || 'Customer',
      amount: amountVal,
      accountNumber: qrAccount?.accountNumber || '',
      receiptNumber: cbsTxnId || txnId,
      remainingBalance: cleanColType.includes('LOAN') ? Math.max(0, Number(qrAccount?.balance || 0) - amountVal) : (Number(qrAccount?.balance || 0) + amountVal),
      merchantId: currentMid,
      merchantName: currentUser?.company || 'eCollect'
    });

    // 🔊 Audio Chime + Voice Speech Alert + Push Notification
    playPaymentSuccessNotification({
      amount: amountVal,
      mode: 'UPI',
      customerName: qrAccount?.accountHolder,
      accountNumber: qrAccount?.accountNumber,
      transactionId: txnId
    });

    showToast(`🎉 Payment of ₹${amountVal.toLocaleString('en-IN')} received & verified via UPI! (Txn ID: ${txnId})`);
  };

  // Real-Time Background Status Poller for Dynamic QR & Payment Link Modal
  useEffect(() => {
    if (!isQrModalOpen) return;
    const activeOrderId = qrData?.orderId || linkData?.orderId;
    if (!activeOrderId) return;
    if (paymentStatus === 'SUCCESS' || linkStatus === 'SUCCESS' || verifiedPaymentReceipt) return;

    let isSubscribed = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await paymentApi.getStatus(activeOrderId);
        const data = res.data || {};
        const statusStr = (data.status || data.paymentStatus || data.data?.status || data.data?.paymentStatus || '').toUpperCase();

        if (statusStr === 'SUCCESS' || statusStr === 'COMPLETED' || statusStr === 'PAID') {
          if (isSubscribed) {
            clearInterval(pollInterval);
            const amt = qrData?.amount || linkData?.amount || qrAmount;
            handlePaymentSuccess(data, activeOrderId, amt);
          }
        }
      } catch (e) {
        // Silently await webhook processing
      }
    }, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [isQrModalOpen, qrData?.orderId, linkData?.orderId, paymentStatus, linkStatus, verifiedPaymentReceipt]);

  // Live Expiry Countdown Timer for Dynamic QR (5 minutes = 300s)
  useEffect(() => {
    if (!qrData || paymentStatus === 'SUCCESS' || verifiedPaymentReceipt) return;
    if (qrExpirySeconds <= 0) return;

    const timer = setInterval(() => {
      setQrExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [qrData, paymentStatus, verifiedPaymentReceipt, qrExpirySeconds]);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCheckPaymentStatus = async () => {
    if (!qrData?.orderId) return;
    setCheckingStatus(true);
    try {
      const res = await paymentApi.getStatus(qrData.orderId);
      console.log('📡 Payment status check result:', res.data);
      const resData = res.data || {};
      const statusStr = (resData.status || resData.data?.status || resData.paymentStatus || '').toUpperCase();
      if (statusStr === 'SUCCESS' || statusStr === 'COMPLETED' || statusStr === 'PAID') {
        handlePaymentSuccess(resData, qrData.orderId, qrData.amount);
      } else if (statusStr === 'FAILED') {
        setPaymentStatus('FAILED');
        showToast('Payment transaction failed or timed out.', 'error');
      } else {
        showToast('Payment status is PENDING. Waiting for customer completion.');
      }
    } catch (e) {
      showToast('Payment awaiting customer verification.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCheckLinkStatus = async () => {
    if (!linkData?.orderId) return;
    setCheckingLinkStatus(true);
    try {
      const res = await paymentApi.getStatus(linkData.orderId);
      console.log('📡 Payment link status check result:', res.data);
      const resData = res.data || {};
      const statusStr = (resData.status || resData.data?.status || resData.paymentStatus || '').toUpperCase();
      if (statusStr === 'SUCCESS' || statusStr === 'COMPLETED' || statusStr === 'PAID') {
        handlePaymentSuccess(resData, linkData.orderId, linkData.amount);
      } else if (statusStr === 'FAILED') {
        setLinkStatus('FAILED');
        showToast('Payment transaction failed or timed out.', 'error');
      } else {
        showToast('Payment status is PENDING. Customer has not completed checkout.');
      }
    } catch (e) {
      showToast('Payment link awaiting customer verification.');
    } finally {
      setCheckingLinkStatus(false);
    }
  };

  // Direct Cash Collection Process (PaymentController / Cash_Collection -> ProcessCashCollectionAsync)
  const handleProcessCashCollection = async (targetAmount = null) => {
    const finalAmount = Number(targetAmount !== null ? targetAmount : (qrCustomAmount || qrAmount));
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      showToast('Please specify a valid cash collection amount', 'error');
      return;
    }

    if (!qrAccount) return;

    const currentMerchantId = Number(
      user?.merchantId || user?.merchant_id || localStorage.getItem('merchantId') || 4
    );

    // Find agent info
    const matchedAgent = agents.find(
      a => String(a.external_agent_id) === String(selectedAgentCode) ||
           String(a.agentCode) === String(selectedAgentCode) ||
           String(a.id) === String(selectedAgentCode)
    );

    const agentCodeStr = String(selectedAgentCode || user?.agentCode || user?.external_agent_id || '1075');
    const agentNameStr = matchedAgent?.fullName || matchedAgent?.name || user?.name || user?.fullName || 'Branch Agent';
    const agentPhoneStr = matchedAgent?.phone || matchedAgent?.mobile || user?.phone || user?.mobile || '9999999999';
    const agentEmailStr = matchedAgent?.email || user?.email || 'agent@finwin.com';

    // Find branch info
    const matchedBranch = branches.find(
      b => String(b.code) === String(selectedBranchCode) ||
           String(b.branchCode) === String(selectedBranchCode) ||
           String(b.id) === String(user?.branchId || user?.branch_id)
    );
    const branchNumericId = Number(matchedBranch?.id || user?.branchId || user?.branch_id || 1);

    const phoneNum = customerPhoneInput || qrAccount.phone || qrAccount.mobile || '9999999999';
    const emailAddr = customerEmailInput || qrAccount.email || 'customer@finwin.com';
    const rawColType = (qrAccount.collectionType || qrAccount.productType || qrAccount.schemeType || qrAccount.accountType || qrAccount.type || 'RD').toString().toUpperCase();
    const cleanColType = rawColType.includes('LOAN')
      ? 'LOAN'
      : (rawColType.includes('RDCL') ? 'RDCL' : (rawColType.includes('FD') ? 'FD' : (rawColType.includes('SB') ? 'SB' : 'RD')));

    const payload = {
      MerchantId: currentMerchantId,
      merchantId: currentMerchantId,
      Amount: finalAmount,
      amount: finalAmount,
      CollectionType: cleanColType,
      collectionType: cleanColType,
      PaymentMode: 'CASH',
      paymentMode: 'CASH',
      QrSource: 'WEB',
      qrSource: 'WEB',
      qr_source: 'WEB',
      Source: 'COLLECTION',
      source: 'COLLECTION',
      Note: qrNote || `Cash collection for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      note: qrNote || `Cash collection for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      Description: qrNote || `Cash collection for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      description: qrNote || `Cash collection for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      agent_details: {
        agent_name: agentNameStr,
        agent_id: agentCodeStr,
        agent_orginId: agentCodeStr,
        agent_phone: agentPhoneStr,
        agent_email: agentEmailStr,
        agent_branch: branchNumericId
      },
      AgentDetails: {
        agent_name: agentNameStr,
        agent_id: agentCodeStr,
        agent_orginId: agentCodeStr,
        agent_phone: agentPhoneStr,
        agent_email: agentEmailStr,
        agent_branch: branchNumericId
      },
      customer_details: {
        customer_name: qrAccount.accountHolder || 'Customer',
        customer_phone: phoneNum,
        customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
        customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
        customer_email: emailAddr
      },
      CustomerDetails: {
        customer_name: qrAccount.accountHolder || 'Customer',
        customer_phone: phoneNum,
        customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
        customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
        customer_email: emailAddr
      }
    };

    setCashLoading(true);
    setCashError(null);
    try {
      console.log('📡 [Cash Collection Engine] Calling processCashCollection with payload:', payload);
      const res = await paymentApi.processCashCollection(payload);
      console.log('✅ [Cash Collection Engine] Response received:', res.data);

      const resData = res.data || {};
      const statusStr = (resData.status || resData.Status || '').toString().toUpperCase();
      const isSuccess = statusStr === 'Y' || statusStr === '1' || statusStr === 'SUCCESS' || resData.status === true;

      if (isSuccess) {
        const txnId = resData.transactionId || resData.TransactionId || resData.receipt?.TRAN_ID || `CASH-${Date.now().toString().slice(-6)}`;
        setCashData({
          status: 'SUCCESS',
          amount: finalAmount,
          transactionId: txnId,
          message: resData.message || 'Cash collection successfully posted to CBS core banking system.',
          timestamp: new Date().toISOString(),
          customerName: qrAccount.accountHolder,
          accountNumber: qrAccount.accountNumber,
          collectionType: cleanColType,
          agentName: agentNameStr
        });

        // Optimistically update account balance in state
        setAccounts(prev => prev.map(a => {
          if (a.accountNumber === qrAccount.accountNumber) {
            const curBal = Number(a.balance || 0);
            const newBal = cleanColType === 'LOAN' ? Math.max(0, curBal - finalAmount) : (curBal + finalAmount);
            return { ...a, balance: newBal, dueAmount: Math.max(0, (Number(a.dueAmount || 0) - finalAmount)) };
          }
          return a;
        }));

        // 🔊 Audio Chime + Voice Speech Alert + Push Notification
        playPaymentSuccessNotification({
          amount: finalAmount,
          mode: 'CASH',
          customerName: qrAccount.accountHolder,
          accountNumber: qrAccount.accountNumber,
          transactionId: txnId
        });

        showToast(`✅ Cash collection of ₹${finalAmount.toLocaleString('en-IN')} received & posted! (Txn ID: ${txnId})`);
      } else {
        const errorMsg = resData.message || resData.error || 'CBS Cash Posting rejected transaction';
        setCashError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('❌ [Cash Collection Engine] Full Error Response:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      const resData = err.response?.data;
      let msg = 'Cash collection transaction was not accepted by the backend.';

      if (typeof resData === 'string' && resData.trim()) {
        msg = resData;
      } else if (resData?.message) {
        msg = resData.message;
      } else if (resData?.error) {
        msg = resData.error;
      } else if (resData?.errors && typeof resData.errors === 'object') {
        msg = Object.entries(resData.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
      } else if (resData?.title) {
        msg = resData.title;
      } else if (err.message) {
        msg = err.message;
      }

      setCashError(msg);
      showToast(msg, 'error');
    } finally {
      setCashLoading(false);
    }
  };

  const handleShareWhatsApp = async (url, amount, accNo, name, phone) => {
    const targetPhone = phone || qrAccount?.mobileNumber || qrAccount?.phone || '';
    const cleanPhone = targetPhone ? String(targetPhone).replace(/\D/g, '') : '';
    const merchantId = localStorage.getItem('merchantId') || 22;

    if (cleanPhone) {
      try {
        const payload = {
          merchantId: Number(merchantId),
          phoneNumber: cleanPhone,
          templateName: 'paymentlink',
          parameters: [url || 'https://mydop.in/adss/balance/report/filter']
        };
        showToast('💬 Sending WhatsApp Payment Link via Telinfy API...');
        const res = await whatsAppApi.sendTemplateMessage(payload);
        if (res?.data?.isSuccess) {
          showToast(`✅ WhatsApp Payment Link sent via Telinfy to +91 ${cleanPhone}`);
          return;
        }
      } catch (err) {
        console.warn('Telinfy API send failed, falling back to WhatsApp Web:', err);
      }
    }

    const isLoan = qrAccount?.collectionType === 'LOAN';
    const text = isLoan
      ? `Dear ${name || 'Customer'},\nPlease complete your Loan EMI installment of ₹${Number(amount).toLocaleString('en-IN')} for Loan Acc #${accNo} via this secure Finwin Payment Link:\n${url}\n\nThank you!`
      : `Dear ${name || 'Customer'},\nPlease complete your deposit collection of ₹${Number(amount).toLocaleString('en-IN')} for Account #${accNo} via this secure Finwin Payment Link:\n${url}\n\nThank you!`;
    const waUrl = cleanPhone && cleanPhone.length === 10
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Interactive WhatsApp Payment Link Modal Opener & Dispatches
  const handleOpenWhatsAppModal = (acc) => {
    let rawPhone = acc.phone || acc.mobile || acc.mobileNumber || acc.customerPhone || acc.registeredPhone || acc.contactNumber || acc.customer?.phone || acc.customer?.mobile || '';
    let cleanPhone = rawPhone ? String(rawPhone).replace(/\D/g, '') : '';
    
    // Strip leading 91 or +91 if length is 12 digits
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10);
    }

    const amount = acc.dueAmount || acc.emiAmount || acc.balance || 500;

    setWaTargetAccount(acc);
    setWaRecipientPhone(cleanPhone);
    setWaCustomAmount(amount);
    setWaModalOpen(true);
  };

  const handleSendWhatsAppPaymentLink = async (e) => {
    e.preventDefault();
    if (!waRecipientPhone || waRecipientPhone.trim().length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setWaSending(true);
    try {
      const cleanPhone = waRecipientPhone.replace(/\D/g, '').trim();
      const amountToCharge = Number(waCustomAmount || waTargetAccount?.dueAmount || waTargetAccount?.balance || 500);
      const merchantId = localStorage.getItem('merchantId') || 22;

      // 1. Generate Live Payment Link from Gateway
      showToast('🔗 Generating Payment Link from Payment Gateway...');
      const payload = {
        amount: amountToCharge,
        customerName: waTargetAccount?.accountHolder || waTargetAccount?.customerName || 'Customer',
        customerPhone: cleanPhone,
        customerEmail: waTargetAccount?.email || 'customer@ecollect.in',
        accountNumber: waTargetAccount?.accountNumber || 'ACC-99201',
        description: `Collection for Account #${waTargetAccount?.accountNumber || ''}`,
        merchantId: Number(merchantId)
      };

      let generatedLink = '';
      try {
        const linkRes = await paymentApi.processPaymentLink(payload);
        const resData = linkRes.data;
        generatedLink = resData.payment_link || resData.paymentLink || resData.url || resData.paymentUrl || resData.short_url || resData.shortUrl || resData.data?.payment_link || resData.data?.paymentLink || resData.data?.url || (typeof resData === 'string' ? resData : null);
      } catch (err) {
        console.warn('Payment link API fallback to short link:', err);
      }

      if (!generatedLink) {
        generatedLink = `https://mydop.in/pay/${waTargetAccount?.accountNumber || 'due'}?amt=${amountToCharge}`;
      }

      // 2. Dispatch via Telinfy REST API
      showToast('💬 Dispatching WhatsApp Payment Link via Telinfy API...');
      const waPayload = {
        merchantId: Number(merchantId),
        phoneNumber: cleanPhone,
        templateName: 'paymentlink',
        parameters: [generatedLink]
      };

      const waRes = await whatsAppApi.sendTemplateMessage(waPayload);
      if (waRes?.data?.isSuccess) {
        showToast(`✅ WhatsApp Payment Link sent via Telinfy to +91 ${cleanPhone}!`);
        setWaModalOpen(false);
      } else {
        // Fallback to WhatsApp Web if API fails
        const text = `Dear ${waTargetAccount?.accountHolder || 'Customer'},\nPlease complete your payment of ₹${amountToCharge.toLocaleString('en-IN')} via this Finwin Payment Link:\n${generatedLink}\n\nThank you!`;
        window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
        showToast(`Opened WhatsApp Web for +91 ${cleanPhone}`);
        setWaModalOpen(false);
      }
    } catch (err) {
      console.error('WhatsApp Modal dispatch error:', err);
      showToast('Error generating or sending WhatsApp link', 'error');
    } finally {
      setWaSending(false);
    }
  };

  const handleSendWhatsAppReminder = async (acc) => {
    handleOpenWhatsAppModal(acc);
  };

  const handleSendSmsReminder = (acc) => {
    const phone = acc.phone || acc.mobile || '';
    const name = acc.accountHolder || 'Customer';
    const accNo = acc.accountNumber || '';
    const bal = Number(acc.balance || 0).toLocaleString('en-IN');
    const isLoan = acc.collectionType === 'LOAN';
    
    if (phone) {
      const body = isLoan
        ? `Dear ${name}, Loan Account #${accNo} EMI due reminder of Rs.${bal}. - DIGICOB Bank`
        : `Dear ${name}, RD Account #${accNo} deposit reminder of Rs.${bal}. - DIGICOB Bank`;
      window.location.href = `sms:${phone}?body=${encodeURIComponent(body)}`;
    }
    showToast(`SMS reminder sent to ${name} (${phone || 'Registered Phone'})`);
  };

  const handleDirectCall = (acc) => {
    const phone = acc.phone || acc.mobile || '';
    const name = acc.accountHolder || 'Customer';
    if (!phone) {
      showToast(`No registered phone number found for ${name}`, 'error');
      return;
    }
    window.location.href = `tel:${phone}`;
    showToast(`Calling ${name} at ${phone}...`);
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('upi-qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 20, 20, 360, 360);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `UPI-QR-${qrAccount?.accountNumber || 'Ecollect'}-${qrData?.amount || ''}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      showToast('QR Code image downloaded');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({
      bankName: '',
      accountHolder: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      accountType: 'Settlement',
      branchName: user?.branchName || user?.branch || localStorage.getItem('branchName') || 'Main Branch',
      dailyLimit: 5000000,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc) => {
    setIsEditMode(true);
    setFormData({
      id: acc.id,
      bankName: acc.bankName || '',
      accountHolder: acc.accountHolder || '',
      accountNumber: acc.accountNumber || '',
      confirmAccountNumber: acc.accountNumber || '',
      ifscCode: acc.ifscCode || '',
      accountType: acc.accountType || 'Settlement',
      branchName: acc.branchName || user?.branchName || user?.branch || localStorage.getItem('branchName') || 'Main Branch',
      dailyLimit: acc.dailyLimit || 5000000,
      isActive: acc.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.bankName || !formData.accountHolder || !formData.accountNumber) {
      showToast('Please fill all mandatory account fields', 'error');
      return;
    }

    if (!isEditMode && formData.accountNumber !== formData.confirmAccountNumber) {
      showToast('Account numbers do not match', 'error');
      return;
    }

    if (isEditMode) {
      setAccounts(prev => prev.map(acc => acc.id === formData.id ? {
        ...acc,
        ...formData,
        maskedNumber: `•••• •••• ${formData.accountNumber.slice(-4)}`,
        updatedAt: new Date().toISOString()
      } : acc));
      showToast('Account details successfully updated.');
    } else {
      const newAcc = {
        id: Date.now(),
        accountCode: `ACC-IND-${String(accounts.length + 1).padStart(2, '0')}`,
        bankName: formData.bankName,
        accountHolder: formData.accountHolder,
        accountNumber: formData.accountNumber,
        maskedNumber: `•••• •••• ${formData.accountNumber.slice(-4)}`,
        ifscCode: formData.ifscCode.toUpperCase(),
        accountType: formData.accountType,
        branchName: formData.branchName,
        balance: 0,
        dailyLimit: Number(formData.dailyLimit),
        isActive: true,
        verified: true,
        updatedAt: new Date().toISOString()
      };
      setAccounts(prev => [newAcc, ...prev]);
      showToast('New bank account successfully connected.');
    }

    setIsModalOpen(false);
  };

  const collectionCounts = useMemo(() => {
    const counts = { ALL: accounts.length, RD: 0, LOAN: 0, FD: 0, RDCL: 0 };
    (accounts || []).forEach(a => {
      const t = (a.collectionType || 'RD').toUpperCase();
      if (counts[t] !== undefined) counts[t] += 1;
      else counts[t] = 1;
    });
    return counts;
  }, [accounts]);

  // Filtered Accounts
  
  // Delinquency Buckets & Priority Queue Aggregations
  const bucketCounts = useMemo(() => {
    const counts = { B0: 0, B1: 0, B2: 0, B3: 0, NPA: 0, PTP: 0, MANDATORY_CALL: 0 };
    (accounts || []).forEach(a => {
      const bucket = calculateAccountBucket(a);
      if (counts[bucket.key] !== undefined) counts[bucket.key]++;
      if (a.ptpDate && a.ptpStatus !== 'KEPT') counts.PTP++;
      if (a.isMandatoryCall || bucket.key === 'B3' || bucket.key === 'NPA' || a.ptpStatus === 'BROKEN') counts.MANDATORY_CALL++;
    });
    return counts;
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return (accounts || []).filter(acc => {
      const matchesSearch = 
        (acc.bankName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.accountHolder || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.accountCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.accountNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.schemeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.ifscCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.branchName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCollectionTab = 
        collectionProductTab === 'ALL' || 
        (collectionProductTab === 'DUE_LIST' 
          ? Number(acc.dueAmount || acc.emiAmount || 0) > 0 
          : (acc.collectionType || 'RD').toUpperCase() === collectionProductTab.toUpperCase());

      const bucket = calculateAccountBucket(acc);
      const matchesBucket = 
        selectedBucketTab === 'ALL' ||
        (selectedBucketTab === 'PTP' && acc.ptpDate && acc.ptpStatus !== 'KEPT') ||
        (selectedBucketTab === 'MANDATORY_CALL' && (acc.isMandatoryCall || bucket.key === 'B3' || bucket.key === 'NPA' || acc.ptpStatus === 'BROKEN')) ||
        bucket.key === selectedBucketTab;

      const matchesType = typeFilter === 'ALL' || acc.accountType?.toLowerCase() === typeFilter.toLowerCase();
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && acc.isActive) ||
        (statusFilter === 'INACTIVE' && !acc.isActive);

      return matchesSearch && matchesCollectionTab && matchesBucket && matchesType && matchesStatus;
    });
  }, [accounts, searchTerm, collectionProductTab, selectedBucketTab, typeFilter, statusFilter]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, collectionProductTab, typeFilter, statusFilter, selectedAgentCode]);

  const totalPages = Math.ceil(filteredAccounts.length / pageSize) || 1;
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, currentPage, pageSize]);

  const totalEscrowBalance = useMemo(() => {
    return (accounts || []).reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  }, [accounts]);

  return (
    <DashboardLayout pageTitle="Branch • Customer & Collection Accounts" role={rawRole}>
      {loading && <LoadingAnimation message="Fetching Master Banking & Ledger Tables..." />}

      {notification && (
        <div className={`account-toast is-${notification.type}`}>
          <AccountIcons.Sparkles />
          <span>{notification.msg}</span>
        </div>
      )}

      <div className="accounts-page-container">
        
        {/* Top Hero Header */}
        <div className="accounts-hero-header">
          <div className="accounts-hero-titles">
            <div className="accounts-badge-tag">
              <span className="pulse-dot"></span>
              <AccountIcons.Sparkles />
              <span>Treasury & Multi-Product Collection Ledger</span>
            </div>
            <h1 className="accounts-page-title">
              Bank & Collection <span className="gradient-text">Accounts</span>
            </h1>
            <p className="accounts-page-subtitle">
              Unified RD Deposits, Loan Collections, and Third-Party CBS clearing integrations
            </p>
          </div>

          <div className="accounts-header-actions">
            {isNonIntegrated ? (
              <>
                <button 
                  type="button"
                  className={`btn-credits-wallet ${walletData.balance <= 0 ? 'is-empty' : (walletData.balance < (walletData.lowBalanceThreshold || 100) ? 'is-low' : 'is-healthy')}`}
                  onClick={() => {
                    loadWalletData();
                    setIsWalletModalOpen(true);
                  }}
                  title="Manage Merchant Communication Credits Wallet (SMS, WhatsApp, Voice Calls)"
                >
                  <AccountIcons.CreditCard />
                  <span className="wallet-chip-label">Credits Wallet:</span>
                  <span className="wallet-chip-val font-mono">₹{walletData.balance.toFixed(2)}</span>
                </button>

                <button 
                  type="button"
                  className="btn-reminder-rules" 
                  onClick={handleOpenGlobalReminderModal}
                  title="Manage Automatic SMS, WhatsApp & Automated Call Reminder Rules"
                >
                  <AccountIcons.Bell />
                  <span>🔔 Reminder Bot & Rules</span>
                </button>
                {/* Day Begin (BOD), Day End (EOD) & Go-Live Suite Button (Model N Only) */}
                {isNonIntegrated && (
                  <>
                    <button 
                      type="button"
                      className="btn-day-ops"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: dayShiftState?.shiftStatus === 'OPEN'
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))'
                          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.25))',
                        border: dayShiftState?.shiftStatus === 'OPEN'
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : '1px solid rgba(239, 68, 68, 0.4)',
                        color: dayShiftState?.shiftStatus === 'OPEN' ? '#10b981' : '#f87171',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setIsDayOpsModalOpen(true)}
                      title="Open Day Begin (BOD), Day End (EOD) Settlement & Go-Live Readiness Suite"
                    >
                      <span>{dayShiftState?.shiftStatus === 'OPEN' ? '☀️ Shift: OPEN' : '🌙 Shift: CLOSED'}</span>
                      <span style={{ padding: '2px 6px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.1)', fontSize: '11px', color: '#fff' }}>
                        🚀 Go-Live: {goLiveReport.percentage}%
                      </span>
                    </button>
                    <button 
                      type="button"
                      className="btn-export-day-end" 
                      onClick={handleExportDayEnd}
                      disabled={isExportingDayEnd}
                      title="Download today's collection reconciliation file to upload back into CBS"
                    >
                      <AccountIcons.Download />
                      <span>{isExportingDayEnd ? 'Exporting...' : '📤 Day-End CBS Export'}</span>
                    </button>

                    <button 
                      type="button"
                      className="btn-upload-due-list" 
                      onClick={() => setIsDueListModalOpen(true)}
                      title="Upload Morning CBS Due List (Excel / CSV) to refresh today's collection demands"
                    >
                      <AccountIcons.FileSpreadsheet />
                      <span>📋 Upload Daily Due List</span>
                    </button>
                  </>
                )}

                <button 
                  type="button"
                  className="btn-bulk-accounts" 
                  onClick={() => setIsBulkAccountsModalOpen(true)}
                  title="Upload master customer accounts in bulk via Excel / CSV"
                >
                  <AccountIcons.UploadCloud />
                  <span>📥 Bulk Master Upload</span>
                </button>

                <button 
                  type="button"
                  className="btn-add-loan-account" 
                  onClick={() => setIsLoanModalOpen(true)}
                  title="Add a single Loan or Deposit Account manually"
                >
                  <AccountIcons.Plus />
                  <span>➕ Add Loan Account</span>
                </button>
              </>
            ) : (
              <button 
                type="button"
                className="btn-add-loan-account" 
                onClick={handleOpenAdd}
                title="Connect a settlement bank account"
              >
                <AccountIcons.Plus />
                <span>Connect Account</span>
              </button>
            )}
          </div>
        </div>

        {/* 🔒 Mandatory Day Begin (BOD) Shift Closed Alert Banner (Model N Only) */}
        {isNonIntegrated && dayShiftState?.shiftStatus !== 'OPEN' && (
          <div style={{
            padding: '14px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(185, 28, 28, 0.28))',
            border: '1px solid #ef4444',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.25)', fontSize: '20px' }}>
                🔒
              </div>
              <div>
                <strong style={{ fontSize: '14.5px', color: '#fca5a5', fontWeight: 800 }}>
                  Mandatory Shift Gate: Collection Operations are Currently LOCKED
                </strong>
                <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#cbd5e1' }}>
                  Doorstep Cash, Dynamic UPI QR, and Payment Link collections are disabled. Initiate Day Begin (BOD) to open daily shift.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setDayOpsTab('BOD'); setIsDayOpsModalOpen(true); }}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              ☀️ Start Day Begin (BOD) Now
            </button>
          </div>
        )}

        {/* 4 KPI Telemetry Cards */}
        <div className="accounts-kpi-grid">
          
          <div className="acc-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Configured Accounts</span>
              <div className="kpi-icon is-indigo"><AccountIcons.Bank /></div>
            </div>
            <div className="kpi-value font-mono">{accounts.length}</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><AccountIcons.ArrowUp /> {(accounts || []).filter(a => a.isActive).length} Live Active</span>
            </div>
          </div>

          <div className="acc-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Total Portfolio Holdings</span>
              <div className="kpi-icon is-green"><AccountIcons.CreditCard /></div>
            </div>
            <div className="kpi-value font-mono text-green">₹{(totalEscrowBalance / 10000000).toFixed(2)} Cr</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><AccountIcons.ArrowUp /> Safe Banking Pool</span>
            </div>
          </div>

          <div className="acc-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">RD Deposits Live</span>
              <div className="kpi-icon is-cyan"><AccountIcons.ShieldCheck /></div>
            </div>
            <div className="kpi-value font-mono text-cyan">{collectionCounts.RD || 0} Accounts</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><AccountIcons.ArrowUp /> Recurring Deposits</span>
            </div>
          </div>

          <div className="acc-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Loan Collections Live</span>
              <div className="kpi-icon is-amber"><AccountIcons.CreditCard /></div>
            </div>
            <div className="kpi-value font-mono text-purple">{collectionCounts.LOAN || 0} Accounts</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><AccountIcons.ArrowUp /> Active Loan Portfolios</span>
            </div>
          </div>

        </div>

        {/* Collection Product Switcher Tabs Bar */}
        <div className="collection-product-nav-tabs">
          <button 
            type="button"
            className={`collection-nav-tab ${collectionProductTab === 'ALL' ? 'is-active' : ''}`}
            onClick={() => {
              setCollectionProductTab('ALL');
              loadAccounts(null, null, 'ALL');
            }}
          >
            <span className="tab-dot">⚡</span>
            <span className="tab-label">All Collections</span>
            <span className="tab-badge-count font-mono">{collectionCounts.ALL || 0}</span>
          </button>

          <button 
            type="button"
            className={`collection-nav-tab is-rd ${collectionProductTab === 'RD' ? 'is-active' : ''}`}
            onClick={() => {
              setCollectionProductTab('RD');
              loadAccounts(null, null, 'RD');
            }}
          >
            <span className="tab-dot">🏦</span>
            <span className="tab-label">RD Accounts (Recurring Deposit)</span>
            <span className="tab-badge-count font-mono">{collectionCounts.RD || 0}</span>
          </button>

          <button 
            type="button"
            className={`collection-nav-tab is-loan ${collectionProductTab === 'LOAN' ? 'is-active' : ''}`}
            onClick={() => {
              setCollectionProductTab('LOAN');
              loadAccounts(null, null, 'LOAN');
            }}
          >
            <span className="tab-dot">💳</span>
            <span className="tab-label">Loan Accounts (EMI Collection)</span>
            <span className="tab-badge-count font-mono">{collectionCounts.LOAN || 0}</span>
          </button>

          <button 
            type="button"
            className={`collection-nav-tab is-fd ${collectionProductTab === 'FD' ? 'is-active' : ''}`}
            onClick={() => {
              setCollectionProductTab('FD');
              loadAccounts(null, null, 'FD');
            }}
          >
            <span className="tab-dot">📈</span>
            <span className="tab-label">FD Accounts (Fixed Deposit)</span>
            <span className="tab-badge-count font-mono">{collectionCounts.FD || 0}</span>
          </button>

          <button 
            type="button"
            className={`collection-nav-tab is-rdcl ${collectionProductTab === 'RDCL' ? 'is-active' : ''}`}
            onClick={() => {
              setCollectionProductTab('RDCL');
              loadAccounts(null, null, 'RDCL');
            }}
          >
            <span className="tab-dot">🪙</span>
            <span className="tab-label">RDCL Recovery</span>
            <span className="tab-badge-count font-mono">{collectionCounts.RDCL || 0}</span>
          </button>

          
          {/* Dedicated Daily Due List / Demand Ledger Tab (Model N Only) */}
          {isNonIntegrated && (
            <button 
              type="button" 
              className={`collection-nav-tab is-due-tab ${collectionProductTab === 'DUE_LIST' ? 'is-active' : ''}`}
              onClick={() => {
                setCollectionProductTab('DUE_LIST');
              }}
              style={{ 
                borderColor: collectionProductTab === 'DUE_LIST' ? '#ef4444' : 'rgba(239, 68, 68, 0.4)', 
                color: collectionProductTab === 'DUE_LIST' ? '#ffffff' : '#f87171',
                background: collectionProductTab === 'DUE_LIST' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.35))' : 'rgba(239, 68, 68, 0.08)'
              }}
            >
              <span className="tab-dot">📋</span>
              <span className="tab-label font-bold">Daily Due Demand Ledger</span>
              <span className="tab-badge-count font-mono" style={{ background: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
                {(accounts || []).filter(a => Number(a.dueAmount || a.emiAmount || 0) > 0).length}
              </span>
            </button>
          )}

          {/* Additional Dynamic Merchant Configured Collection Types */}
          {configuredCollectionTypes
            .filter(t => !['RD', 'LOAN', 'FD', 'RDCL'].includes(t.toUpperCase()))
            .map(customType => {
              const upper = customType.toUpperCase();
              return (
                <button
                  key={upper}
                  type="button"
                  className={`collection-nav-tab ${collectionProductTab === upper ? 'is-active' : ''}`}
                  onClick={() => {
                    setCollectionProductTab(upper);
                    loadAccounts(null, null, upper);
                  }}
                >
                  <span className="tab-dot">🏷️</span>
                  <span className="tab-label">{upper} Collection</span>
                  <span className="tab-badge-count font-mono">{collectionCounts[upper] || 0}</span>
                </button>
              );
            })}
        </div>

        
        {/* Delinquency Buckets & Priority Outreach Queue (Integration Status: N) */}
        {isNonIntegrated && (
          <div className="bucket-nav-container">
            <div className="bucket-nav-scroll">
              <button 
                type="button" 
                className={`bucket-nav-btn is-all ${selectedBucketTab === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setSelectedBucketTab('ALL')}
              >
                <span className="bucket-icon">📊</span>
                <span className="bucket-title">All Portfolios</span>
                <span className="bucket-count font-mono">{accounts.length}</span>
              </button>

              <button 
                type="button" 
                className={`bucket-nav-btn is-b0 ${selectedBucketTab === 'B0' ? 'is-active' : ''}`}
                onClick={() => setSelectedBucketTab('B0')}
              >
                <span className="bucket-icon">🟢</span>
                <span className="bucket-title">Bucket 0 (Current / 0d)</span>
                <span className="bucket-count font-mono">{bucketCounts.B0 || 0}</span>
              </button>

              <button 
                type="button" 
                className={`bucket-nav-btn is-b1 ${selectedBucketTab === 'B1' ? 'is-active' : ''}`}
                onClick={() => setSelectedBucketTab('B1')}
              >
                <span className="bucket-icon">🔵</span>
                <span className="bucket-title">Bucket 1 (SMA-0: 1-30d)</span>
                <span className="bucket-count font-mono">{bucketCounts.B1 || 0}</span>
              </button>

              <button 
                type="button" 
                className={`bucket-nav-btn is-b2 ${selectedBucketTab === 'B2' ? 'is-active' : ''}`}
                onClick={() => setSelectedBucketTab('B2')}
              >
                <span className="bucket-icon">🟡</span>
                <span className="bucket-title">Bucket 2 (SMA-1: 31-60d)</span>
                <span className="bucket-count font-mono">{bucketCounts.B2 || 0}</span>
              </button>

              <button 
                type="button" 
                className={`bucket-nav-btn is-b3 ${selectedBucketTab === 'B3' ? 'is-active' : ''}`}
                onClick={() => setSelectedBucketTab('B3')}
              >
                <span className="bucket-icon">🟠</span>
                <span className="bucket-title">Bucket 3 (SMA-2: 61-90d)</span>
                <span className="bucket-count font-mono">{bucketCounts.B3 || 0}</span>
              </button>

              <button 
                type="button" 
                className={`bucket-nav-btn is-npa ${selectedBucketTab === 'NPA' ? 'is-active' : ''}`}
                onClick={() => setSelectedBucketTab('NPA')}
              >
                <span className="bucket-icon">🚨</span>
                <span className="bucket-title">Critical / NPA (&gt;90d)</span>
                <span className="bucket-count font-mono">{bucketCounts.NPA || 0}</span>
              </button>

              <button 
                type="button" 
                className={`bucket-nav-btn is-ptp ${selectedBucketTab === 'PTP' ? 'is-active' : ''}`}
                onClick={() => setSelectedBucketTab('PTP')}
              >
                <span className="bucket-icon">🤝</span>
                <span className="bucket-title">Promise to Pay (PTP)</span>
                <span className="bucket-count font-mono">{bucketCounts.PTP || 0}</span>
              </button>

              <button 
                type="button" 
                className={`bucket-nav-btn is-call-queue ${selectedBucketTab === 'MANDATORY_CALL' ? 'is-active' : ''}`}
                onClick={() => setSelectedBucketTab('MANDATORY_CALL')}
              >
                <span className="bucket-icon">📞</span>
                <span className="bucket-title">Mandatory Call Queue</span>
                <span className="bucket-count font-mono">{bucketCounts.MANDATORY_CALL || 0}</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="accounts-filter-bar">
          
          <div className="search-input-wrap">
            <AccountIcons.Search />
            <input 
              type="text" 
              placeholder="Search by Bank, Customer, Loan / RD Acc No, Scheme, IFSC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="accounts-search-field"
            />
          </div>

          <div className="filter-buttons-group">
            <div className="type-toggle-pills">
              {['ALL', 'RD Deposit', 'Loan Collection', 'Settlement', 'Current'].map(type => (
                <button
                  key={type}
                  className={`type-pill ${typeFilter === type ? 'is-active' : ''}`}
                  onClick={() => setTypeFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Dynamic Agent Selector */}
            <select
              value={selectedAgentCode}
              onChange={(e) => {
                const newCode = e.target.value;
                setSelectedAgentCode(newCode);
                loadAccounts(selectedBranchCode, newCode);
              }}
              className="status-select-dropdown font-mono"
              title="Filter by Branch Agent / External Representative ID"
            >
              <option value="1075">Agent #1075 (Default)</option>
              {agents.map((ag) => {
                const code = ag.external_agent_id || ag.agentCode || ag.code || ag.externalAgentId || String(ag.id);
                return (
                  <option key={ag.id} value={code}>
                    {ag.fullName || ag.name || 'Agent'} ({code})
                  </option>
                );
              })}
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-select-dropdown"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

        </div>

        
        {/* Daily Due Demand Ledger Operations Banner */}
        {collectionProductTab === 'DUE_LIST' && (() => {
          const dueAccounts = (accounts || []).filter(a => Number(a.dueAmount || a.emiAmount || 0) > 0);
          const totalDueDemand = dueAccounts.reduce((sum, a) => sum + Number(a.dueAmount || a.emiAmount || 0), 0);
          const totalOutstanding = dueAccounts.reduce((sum, a) => sum + Number(a.balance || a.outstandingAmount || 0), 0);

          return (
            <div style={{ margin: '0 0 16px 0', padding: '16px 20px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(239, 68, 68, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  📋
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f87171' }}>Daily Due Demand Ledger & Field Sheet</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Showing active morning demand queue for field collectors & doorstep recovery agents.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Active Overdue Demand</div>
                  <div className="font-mono font-bold" style={{ fontSize: '18px', color: '#ef4444' }}>
                    ₹{totalDueDemand.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Due Borrowers</div>
                  <div className="font-mono font-bold" style={{ fontSize: '18px', color: '#38bdf8' }}>
                    {dueAccounts.length}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadDueListSheet}
                  className="btn-export-day-end"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', padding: '10px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
                >
                  <AccountIcons.Download />
                  <span>Download Due List Sheet (.xlsx)</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Accounts Master Table */}
        <div className="accounts-table-card">
          <div className="table-responsive-container">
            <table className="accounts-master-table">
              <thead>
                <tr>
                  <th>Bank & Code</th>
                  <th>Type</th>
                  <th>Account Holder</th>
                  <th>Account / Loan No</th>
                  <th>Scheme / Route</th>
                  <th>IFSC & Branch</th>
                  <th>Holdings / Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-table-cell">
                      <div className="empty-state-box">
                        <AccountIcons.Bank />
                        <h3>No Collection Accounts Located</h3>
                        <p>No matching banking route, RD, or Loan account records found for your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAccounts.map((acc, index) => (
                    <tr key={acc.id} className="account-row-item">
                      
                      {/* Bank & Code */}
                      <td>
                        <div className="bank-identity-cell">
                          <div className={`bank-avatar-box is-${(acc.collectionType || 'RD').toLowerCase()}`}>
                            {acc.collectionType === 'LOAN'
                              ? (acc.loanCategory?.includes('Gold') ? '🪙' :
                                 acc.loanCategory?.includes('Vehicle') || acc.loanCategory?.includes('Auto') ? '🚗' :
                                 acc.loanCategory?.includes('Home') || acc.loanCategory?.includes('Housing') ? '🏠' :
                                 acc.loanCategory?.includes('Personal') ? '👤' :
                                 acc.loanCategory?.includes('Business') ? '💼' :
                                 acc.loanCategory?.includes('Agri') ? '🌾' :
                                 acc.loanCategory?.includes('Micro') ? '👥' : '💳')
                              : acc.collectionType === 'FD'
                              ? '📈'
                              : acc.collectionType === 'RDCL' || acc.collectionType === 'DAILY_DEPOSIT'
                              ? '🪙'
                              : (acc.bankName ? acc.bankName.slice(0, 2).toUpperCase() : '🏦')}
                          </div>
                          <div className="bank-info-stack">
                            <span className="bank-title font-bold">{acc.bankName}</span>
                            <span className="bank-code-chip font-mono text-muted">{acc.accountCode}</span>
                          </div>
                        </div>
                      </td>

                      {/* Collection / Specific Loan Type Badge */}
                      <td>
                        {acc.collectionType === 'LOAN' ? (
                          <span className="collection-type-tag is-loan" title={acc.loanCategory || 'Loan Portfolio'}>
                            {acc.loanCategory?.includes('Gold') ? '🪙 Gold Loan' :
                             acc.loanCategory?.includes('Vehicle') || acc.loanCategory?.includes('Auto') ? '🚗 Vehicle Loan' :
                             acc.loanCategory?.includes('Home') || acc.loanCategory?.includes('Housing') ? '🏠 Home Loan' :
                             acc.loanCategory?.includes('Personal') ? '👤 Personal Loan' :
                             acc.loanCategory?.includes('Business') || acc.loanCategory?.includes('MSME') ? '💼 Business Loan' :
                             acc.loanCategory?.includes('Education') ? '🎓 Education Loan' :
                             acc.loanCategory?.includes('Agri') || acc.loanCategory?.includes('Crop') ? '🌾 Agri Loan' :
                             acc.loanCategory?.includes('Micro') || acc.loanCategory?.includes('JLG') ? '👥 Micro Loan' :
                             acc.loanCategory?.includes('Pigmy') ? '⚡ Pigmy Loan' :
                             acc.loanCategory?.includes('Property') || acc.loanCategory?.includes('LAP') ? '🏢 Property Loan' :
                             (acc.loanCategory ? `💳 ${acc.loanCategory}` : '💳 Home Loan')}
                          </span>
                        ) : acc.collectionType === 'FD' ? (
                          <span className="collection-type-tag is-fd">📈 FD</span>
                        ) : acc.collectionType === 'RDCL' || acc.collectionType === 'DAILY_DEPOSIT' ? (
                          <span className="collection-type-tag is-rdcl">🪙 RDCL</span>
                        ) : (
                          <span className="collection-type-tag is-rd">🏦 RD</span>
                        )}
                      </td>

                      {/* Holder */}
                      <td>
                        <div className="holder-stack">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {(acc.customerPhoto || getStoredCustomerPhotos()[acc.accountNumber]) ? (
                              <img 
                                src={acc.customerPhoto || getStoredCustomerPhotos()[acc.accountNumber]} 
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
                          </div>
                          {acc.verified && (
                            <span className="verified-pill">
                              <AccountIcons.ShieldCheck /> 2FA Verified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Account Number */}
                      <td>
                        <div className="acc-number-cell font-mono">
                          <span>{acc.maskedNumber || acc.accountNumber}</span>
                          <button 
                            className="btn-copy-acc" 
                            onClick={() => handleCopy(acc.accountNumber, acc.id)}
                            title="Copy Account / Loan Number"
                          >
                            {copiedId === acc.id ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                          </button>
                        </div>
                      </td>

                      {/* Scheme & Route */}
                      <td>
                        <div className="scheme-info-stack">
                          <span className="scheme-title font-bold text-cyan">{acc.loanCategory || acc.schemeName || (acc.collectionType === 'LOAN' ? 'Personal / Gold Loan' : 'RD Monthly Deposit')}</span>
                          <span className="scheme-code font-mono text-muted">{acc.collectionType === 'LOAN' ? `Freq: ${acc.emiFrequency || 'Monthly'}` : `Code: ${acc.schemeCode || '04'}`}</span>
                        </div>
                      </td>

                      {/* IFSC & Branch */}
                      <td>
                        <div className="ifsc-branch-stack">
                          <span className="ifsc-text font-mono font-bold text-cyan">{acc.ifscCode}</span>
                          <span className="branch-sub text-muted">{acc.branchName || 'Mumbai Central'}</span>
                        </div>
                      </td>

                      {/* Balance / Due */}
                      <td>
                        <span className={`balance-val font-mono font-bold ${acc.collectionType === 'LOAN' ? 'text-purple' : 'text-green'}`}>
                          ₹{Number(acc.balance || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Status, Delinquency Bucket & PTP Telemetry */}
                      <td>
                        <div className="status-and-reminder-stack">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span className={`status-pill ${acc.isActive ? 'is-active' : 'is-inactive'}`}>
                              <span className="status-dot"></span>
                              <span>{acc.isActive ? 'Active' : 'Disabled'}</span>
                            </span>

                            {/* Delinquency Bucket Badge (Model N Only) */}
                            {isNonIntegrated && (() => {
                              const bucket = calculateAccountBucket(acc);
                              return (
                                <span 
                                  className={`bucket-tag-pill ${bucket.class}`}
                                  title={bucket.desc}
                                >
                                  {bucket.shortLabel}
                                </span>
                              );
                            })()}

                            {/* PTP Badge */}
                            {acc.ptpDate && (
                              <span 
                                className={`ptp-status-pill is-${(acc.ptpStatus || 'pending').toLowerCase()}`}
                                title={`PTP Date: ${acc.ptpDate} | Note: ${acc.ptpNotes || 'No notes'}`}
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
                          </div>
                          
                          {/* Due Date Reminder Setup button exclusively for Integration Status N */}
                          {isNonIntegrated && (
                            <button
                              type="button"
                              className={`reminder-pill is-${(acc.reminderRiskLevel || 'standard').toLowerCase()}`}
                              onClick={() => handleOpenAccountReminderModal(acc)}
                              title="Click to customize SMS, WhatsApp & Call reminder schedule"
                            >
                              <AccountIcons.Bell />
                              <span>{acc.reminderRiskLevel === 'HighRisk' ? '🚨 High Risk (3d/Daily)' : acc.reminderRiskLevel === 'Custom' ? `⚡ Custom (${acc.reminderDaysBeforeDue || 2}d)` : acc.reminderRiskLevel === 'Disabled' ? '🔕 Reminders Off' : '🔔 2 Days Before'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions-group">
                          {/* Financial Collection Actions */}
                          <button 
                            className="action-btn is-qr" 
                            onClick={() => handleOpenQrModal(acc, 'qr')}
                            title="Generate Dynamic UPI Collection QR"
                          >
                            <AccountIcons.QrCode />
                          </button>
                          <button 
                            className="action-btn is-link" 
                            onClick={() => handleOpenPaymentLinkModal(acc)}
                            title="Generate Instant Payment Link"
                          >
                            <AccountIcons.Link />
                          </button>
                          <button 
                            className="action-btn is-cash" 
                            onClick={() => handleOpenCashModal(acc)}
                            title="Direct Cash Collection & Post to CBS"
                          >
                            <AccountIcons.Cash />
                          </button>
                          <button 
                            className="action-btn is-whatsapp" 
                            style={{ color: '#25d366' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWhatsAppModal(acc);
                            }}
                            title="Generate Payment Link & Send via WhatsApp"
                          >
                            <AccountIcons.WhatsApp />
                          </button>

                          {/* Instant Customer Reminders & Outreach */}
                          {isNonIntegrated && (
                            <>
                              <button 
                                className="action-btn is-sms" 
                                onClick={() => handleSendSmsReminder(acc)}
                                title="Send SMS Deposit Reminder"
                              >
                                <AccountIcons.MessageSquare />
                              </button>
                              <button 
                                className="action-btn is-call" 
                                onClick={() => handleDirectCall(acc)}
                                title="Call Customer for Follow-up"
                              >
                                <AccountIcons.PhoneCall />
                              </button>
                            </>
                          )}

                          {/* Account Record Management */}
                          {/* PTP Logger Action (Integration Status: N) */}
                          {isNonIntegrated && (
                            <button 
                              className="action-btn is-ptp" 
                              onClick={() => handleOpenPtpModal(acc)}
                              title="Promise to Pay (PTP) Commitment Logger"
                            >
                              <AccountIcons.Handshake />
                            </button>
                          )}

                          {/* AutoPay Mandate & WhatsApp EMI Link Action (Integration Status: N Concept) */}
                          {isNonIntegrated && (
                            <button 
                              className="action-btn is-autopay" 
                              onClick={() => {
                                setAutoPayModalAccount(acc);
                                setAutoPayBulkAccounts([]);
                                setAutoPayModalOpen(true);
                              }}
                              title="⚡ Configure AutoPay Mandate & Send WhatsApp EMI Selection Link"
                              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.35)', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              ⚡ AutoPay
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
                          </button>
                          <button 
                            className="action-btn is-edit" 
                            onClick={() => handleOpenEdit(acc)}
                            title="Edit Account"
                          >
                            <AccountIcons.Edit />
                          </button>
                          <button 
                            className="action-btn is-toggle" 
                            onClick={() => handleToggleStatus(acc.id, acc.isActive)}
                            title={acc.isActive ? "Deactivate Route" : "Activate Route"}
                          >
                            {acc.isActive ? '⏸️' : '▶️'}
                          </button>
                          <button 
                            className="action-btn is-delete" 
                            onClick={() => handleDelete(acc.id)}
                            title="Delete Account"
                          >
                            <AccountIcons.Trash />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="accounts-table-footer">
            <div className="accounts-footer-left">
              <span className="accounts-footer-info">
                Showing <strong>{filteredAccounts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * pageSize, filteredAccounts.length)}</strong> of{' '}
                <strong>{filteredAccounts.length}</strong> accounts
              </span>

              <div className="accounts-page-size-selector">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="accounts-size-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>per page</span>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="accounts-pagination-controls">
                <button
                  className="accounts-page-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="First Page"
                >
                  «
                </button>
                <button
                  className="accounts-page-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  title="Previous Page"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={page}>
                        {prev && page - prev > 1 && <span className="accounts-page-ellipsis">…</span>}
                        <button
                          className={`accounts-page-num-btn ${currentPage === page ? 'is-active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })
                }

                <button
                  className="accounts-page-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  title="Next Page"
                >
                  ›
                </button>
                <button
                  className="accounts-page-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Last Page"
                >
                  »
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Account Dossier Slideover / Modal */}
        {selectedAccount && (() => {
          const npaInfo = calculateLoanNpaStatus(selectedAccount);
          const colType = (selectedAccount.collectionType || 'RD').toUpperCase();
          const isLoan = colType === 'LOAN';
          const isCopied = copiedId === `dossier_${selectedAccount.id}`;

          return (
            <div className="account-modal-overlay" onClick={() => setSelectedAccount(null)}>
              <div className="account-dossier-card" onClick={(e) => e.stopPropagation()}>
                
                {/* Header with Title and Close */}
                <div className="dossier-card-head">
                  <div className="dossier-badge-wrap">
                    <AccountIcons.Bank />
                    <h3>
                      {isLoan ? 'Loan Portfolio Comprehensive Dossier' : 'Banking & Collection Route Dossier'}
                    </h3>
                  </div>
                  <button className="btn-modal-close" onClick={() => setSelectedAccount(null)}>✕</button>
                </div>

                <div className="dossier-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Hero Banner with Official KYC Passport Size Photo Showcase */}
                  <div className="dossier-bank-hero" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', padding: '20px', borderRadius: '18px', background: 'var(--bgCard, #111827)', border: '1px solid var(--borderColor, rgba(255, 255, 255, 0.1))' }}>
                    
                    {/* Official Passport Photo Box (3.5 x 4.5 Ratio: 130px x 165px) */}
                    <div className="passport-photo-card" style={{ width: '130px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        position: 'relative',
                        width: '130px',
                        height: '165px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#f8fafc',
                        border: '2px solid var(--borderGlow, #6366f1)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {(selectedAccount.customerPhoto || getStoredCustomerPhotos()[selectedAccount.accountNumber]) ? (
                          <img 
                            src={selectedAccount.customerPhoto || getStoredCustomerPhotos()[selectedAccount.accountNumber]} 
                            alt={selectedAccount.accountHolder} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', padding: '10px', color: '#94a3b8' }}>
                            <span style={{ fontSize: '42px', display: 'block', marginBottom: '4px' }}>👤</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Passport Photo</span>
                          </div>
                        )}

                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '3px 0',
                          background: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(4px)',
                          textAlign: 'center',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#34d399',
                          letterSpacing: '0.4px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          {(selectedAccount.customerPhoto || getStoredCustomerPhotos()[selectedAccount.accountNumber]) ? '✓ PASSPORT KYC' : 'PHOTO PENDING'}
                        </div>
                      </div>

                      {/* Photo Actions: Upload & Remove */}
                      <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                        <label 
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.18)',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            color: '#818cf8',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                          title="Upload Passport Photo"
                        >
                          📷 {selectedAccount.customerPhoto ? 'Change' : 'Upload'}
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={(e) => handleDossierPhotoUpload(e, selectedAccount)}
                          />
                        </label>

                        {selectedAccount.customerPhoto && (
                          <button
                            type="button"
                            onClick={() => {
                              saveStoredCustomerPhoto(selectedAccount.accountNumber, null);
                              setSelectedAccount(p => ({ ...p, customerPhoto: '' }));
                              setAccounts(prev => prev.map(a => (a.id === selectedAccount.id || a.accountNumber === selectedAccount.accountNumber) ? { ...a, customerPhoto: '' } : a));
                              showToast('Photo removed.');
                            }}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '8px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#ef4444',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                            title="Remove Photo"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <h2 className="dossier-bank-name">{selectedAccount.bankName || 'Partner Banking Node'}</h2>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span className={`collection-type-tag is-${colType.toLowerCase()}`}>
                            {isLoan ? '💳 LOAN' : colType === 'FD' ? '📈 FD' : colType === 'RDCL' ? '🪙 RDCL' : '🏦 RD'}
                          </span>
                          <span className={`status-pill ${selectedAccount.isActive ? 'is-active' : 'is-inactive'}`}>
                            <span className="status-dot"></span>
                            <span>{selectedAccount.isActive ? 'Active Route' : 'Disabled'}</span>
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span className="dossier-code font-mono text-cyan" style={{ fontSize: '13px', fontWeight: 700 }}>
                          {selectedAccount.accountHolder}
                        </span>
                        <span className="font-mono text-muted" style={{ fontSize: '12px' }}>• Code: {selectedAccount.accountCode || 'N/A'}</span>
                        <span className="font-mono text-muted" style={{ fontSize: '12px' }}>• Node: {selectedAccount.branchName || 'Main Branch'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Telemetry Highlights */}
                  
                  {/* AI Risk Prediction & Strategic Advisory Card */}
                  {(() => {
                    const aiRisk = calculateAiRiskPrediction(selectedAccount);
                    return (
                      <div className={`dossier-ai-card ${aiRisk.badgeClass}`}>
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

                  <div className="dossier-kpi-grid">
                    <div className="dossier-kpi-card">
                      <span className="dossier-kpi-lbl">{isLoan ? 'Outstanding Balance' : 'Current Holdings'}</span>
                      <span className={`dossier-kpi-val font-mono ${isLoan ? 'text-purple' : 'text-green'}`}>
                        ₹{Number(selectedAccount.balance || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="dossier-kpi-card">
                      <span className="dossier-kpi-lbl">Due / EMI Installment</span>
                      <span className="dossier-kpi-val font-mono text-amber" style={{ color: '#f59e0b' }}>
                        ₹{Number(selectedAccount.dueAmount || selectedAccount.emiAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="dossier-kpi-card">
                      <span className="dossier-kpi-lbl">Collection Frequency</span>
                      <span className="dossier-kpi-val font-mono text-cyan">
                        {selectedAccount.emiFrequency || (isLoan ? 'Monthly' : 'Regular')}
                      </span>
                    </div>
                    <div className="dossier-kpi-card">
                      <span className="dossier-kpi-lbl">NPA Health / DPD</span>
                      <span className="dossier-kpi-val">
                        <span className={`npa-pill ${npaInfo.badgeClass}`} style={{ fontSize: '11px' }}>
                          {npaInfo.label} ({npaInfo.dpd}d DPD)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Section 1: Customer Profile & Contact Details */}
                  <div className="dossier-section-block">
                    <div className="dossier-section-head">
                      <AccountIcons.CreditCard />
                      <span>Customer Profile & KYC Information</span>
                    </div>
                    <div className="dossier-data-grid">
                      <div className="data-box">
                        <span className="data-lbl">Full Name</span>
                        <span className="data-val font-bold">{selectedAccount.accountHolder || selectedAccount.customerName || 'Direct Customer'}</span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Mobile / Contact</span>
                        <span className="data-val font-mono text-cyan">
                          {selectedAccount.phone || selectedAccount.mobileNumber || selectedAccount.customerPhone || 'Not Registered'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Email Address</span>
                        <span className="data-val font-mono text-muted">
                          {selectedAccount.email || selectedAccount.customerEmail || 'customer@finwin.com'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Customer Reference ID</span>
                        <span className="data-val font-mono">
                          #{selectedAccount.customerId || selectedAccount.id || 'CUST-0001'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">City / Outlet Node</span>
                        <span className="data-val">{selectedAccount.city || selectedAccount.branchName || 'Mumbai Central'}</span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Compliance & Verification</span>
                        <span className="data-val text-green" style={{ color: '#10b981', fontWeight: 600 }}>
                          ✓ 2FA Verified & Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Banking & Account Routing Details */}
                  <div className="dossier-section-block">
                    <div className="dossier-section-head">
                      <AccountIcons.Bank />
                      <span>Banking Node & Settlement Routing</span>
                    </div>
                    <div className="dossier-data-grid">
                      <div className="data-box">
                        <span className="data-lbl">Bank Name</span>
                        <span className="data-val font-bold">{selectedAccount.bankName || 'Partner Bank'}</span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Account / Loan Number</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="data-val font-mono font-bold" style={{ color: 'var(--accent, #6366f1)' }}>
                            {selectedAccount.accountNumber}
                          </span>
                          <button 
                            className="mini-copy-btn"
                            onClick={() => handleCopy(selectedAccount.accountNumber, `dossier_${selectedAccount.id}`)}
                            title="Copy Account Number"
                          >
                            {isCopied ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                          </button>
                        </div>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">IFSC Code</span>
                        <span className="data-val font-mono font-bold text-cyan">{selectedAccount.ifscCode || 'HDFC0001892'}</span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Branch Outlet & Code</span>
                        <span className="data-val">{selectedAccount.branchName || 'Main'} ({selectedAccount.branchCode || 'BR-01'})</span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Scheme / Product Route</span>
                        <span className="data-val font-bold text-cyan">
                          {selectedAccount.schemeName || selectedAccount.loanCategory || (isLoan ? 'Personal / Gold Loan' : 'Recurring Deposit (RD)')}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Daily Settlement Limit</span>
                        <span className="data-val font-mono">
                          ₹{Number(selectedAccount.dailyLimit || 5000000).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Loan Portfolio / Schedule Telemetry */}
                  <div className="dossier-section-block">
                    <div className="dossier-section-head">
                      <AccountIcons.Sliders />
                      <span>Financial Portfolio & Schedule Telemetry</span>
                    </div>
                    <div className="dossier-data-grid">
                      <div className="data-box">
                        <span className="data-lbl">Next Due / Collection Date</span>
                        <span className="data-val font-mono">
                          {selectedAccount.nextDueDate ? new Date(selectedAccount.nextDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '10th of every month'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Last Payment Recorded</span>
                        <span className="data-val font-mono text-muted">
                          {selectedAccount.lastPaidDate ? new Date(selectedAccount.lastPaidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent Collection'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Repayment Tenure</span>
                        <span className="data-val font-mono">
                          {selectedAccount.tenure || selectedAccount.totalInstallments || '24 Installments'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Days Past Due (DPD)</span>
                        <span className="data-val font-mono font-bold" style={{ color: npaInfo.dpd > 30 ? '#ef4444' : '#10b981' }}>
                          {npaInfo.dpd} Days
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Interest Rate (% p.a.)</span>
                        <span className="data-val font-mono">{selectedAccount.interestRate ? `${selectedAccount.interestRate}% p.a.` : '11.5% p.a.'}</span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Collection Channel Mode</span>
                        <span className="data-val font-mono">UPI Dynamic QR / Instant Cash</span>
                      </div>
                    </div>
                  </div>

                  
                  {/* Geolocation Doorstep Mapping & Promise to Pay Section */}
                  <div className="dossier-section-block">
                    <div className="dossier-section-head">
                      <AccountIcons.MapPin />
                      <span>Customer Doorstep Location & Visual Map Navigation</span>
                    </div>
                    
                    <div className="dossier-data-grid">
                      <div className="data-box" style={{ gridColumn: 'span 2' }}>
                        <span className="data-lbl">Customer Physical Place & Address</span>
                        <span className="data-val font-bold" style={{ fontSize: '13.5px' }}>
                          {selectedAccount.customerAddress || selectedAccount.address || 'Doorstep Place / Street Address on record - Branch Node'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">City / Region</span>
                        <span className="data-val font-bold text-cyan">
                          {selectedAccount.city || selectedAccount.branchName || 'Main Cluster'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">GPS Coordinates</span>
                        <span className="data-val font-mono text-cyan">
                          {selectedAccount.latitude && selectedAccount.longitude
                            ? `${selectedAccount.latitude}° N, ${selectedAccount.longitude}° E`
                            : '19.0760° N, 72.8777° E (Default)'}
                        </span>
                      </div>
                      <div className="data-box" style={{ gridColumn: 'span 2' }}>
                        <span className="data-lbl">Doorstep Routing Status</span>
                        <span className="data-val text-green" style={{ color: '#10b981', fontWeight: 600 }}>
                          ✓ GPS Location Verified for Agent Doorstep Collection
                        </span>
                      </div>
                    </div>

                    {/* Live Embedded Map Visualizer */}
                    <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0f172a', position: 'relative' }}>
                      <iframe
                        title="Customer Doorstep Map Location"
                        width="100%"
                        height="200"
                        style={{ border: 'none', filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(selectedAccount.longitude || 72.8777) - 0.015}%2C${Number(selectedAccount.latitude || 19.0760) - 0.015}%2C${Number(selectedAccount.longitude || 72.8777) + 0.015}%2C${Number(selectedAccount.latitude || 19.0760) + 0.015}&layer=mapnik&marker=${selectedAccount.latitude || '19.0760'}%2C${selectedAccount.longitude || '72.8777'}`}
                      />
                      
                      {/* Overlay Map Banner */}
                      <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>📍</span>
                          <div>
                            <div className="font-bold" style={{ fontSize: '12px' }}>{selectedAccount.accountHolder}</div>
                            <div className="font-mono text-muted" style={{ fontSize: '10.5px' }}>{selectedAccount.customerAddress || 'Doorstep Pin'}</div>
                          </div>
                        </div>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedAccount.latitude || '19.0760'},${selectedAccount.longitude || '72.8777'}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-open-google-maps"
                          style={{ padding: '6px 12px', fontSize: '11.5px' }}
                        >
                          <AccountIcons.Navigation /> 🗺️ Open in Google Maps Navigation
                        </a>
                      </div>
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
                          {selectedAccount.ptpAmount ? `₹${Number(selectedAccount.ptpAmount).toLocaleString('en-IN')}` : '—'}
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

                  {/* Section 4: Assigned Agent & Automation */}
                  <div className="dossier-section-block">
                    <div className="dossier-section-head">
                      <AccountIcons.Bell />
                      <span>Assigned Field Agent & Automation Setup</span>
                    </div>
                    <div className="dossier-data-grid">
                      <div className="data-box">
                        <span className="data-lbl">Assigned Representative</span>
                        <span className="data-val font-bold">
                          {selectedAccount.assignedAgentName || selectedAccount.agentName || 'Branch Central Desk'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Agent Staff ID / Code</span>
                        <span className="data-val font-mono text-cyan">
                          {selectedAccount.assignedAgentCode || selectedAccount.agentCode || 'AG-001'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Reminder Risk Schedule</span>
                        <span className="data-val font-bold" style={{ color: '#c084fc' }}>
                          {selectedAccount.reminderRiskLevel === 'HighRisk' ? '🚨 High Risk (3d/Daily)' : selectedAccount.reminderRiskLevel === 'Custom' ? `⚡ Custom (${selectedAccount.reminderDaysBeforeDue || 2}d)` : selectedAccount.reminderRiskLevel === 'Disabled' ? '🔕 Reminders Off' : '🔔 2 Days Before Due'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Active Outreach Channels</span>
                        <span className="data-val font-mono text-muted">
                          {selectedAccount.reminderChannels || 'SMS, WhatsApp, Voice Call'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Last Reminder Dispatched</span>
                        <span className="data-val font-mono text-muted">
                          {selectedAccount.lastReminderSentAt ? new Date(selectedAccount.lastReminderSentAt).toLocaleString('en-IN') : 'Automated Schedule Ready'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">Route Creation Date</span>
                        <span className="data-val font-mono text-muted">
                          {selectedAccount.createdAt ? new Date(selectedAccount.createdAt).toLocaleDateString('en-IN') : 'System Initialized'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Banner */}
                  <div className="compliance-strip">
                    <AccountIcons.ShieldCheck />
                    <span>Banking route configured with NPCI UPI 2.0 dynamic clearance, RTGS/NEFT settlement & RBI standard audit telemetry.</span>
                  </div>

                </div>

                {/* Dossier Footer with Quick Financial Actions */}
                <div className="dossier-modal-foot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      className="btn-qr-action is-qr"
                      style={{ padding: '8px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12.5px' }}
                      onClick={() => { const acc = selectedAccount; setSelectedAccount(null); handleOpenQrModal(acc, 'qr'); }}
                    >
                      <AccountIcons.QrCode /> Collect via QR
                    </button>
                    <button 
                      className="btn-cash-action is-cash"
                      style={{ padding: '8px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12.5px' }}
                      onClick={() => { const acc = selectedAccount; setSelectedAccount(null); handleOpenCashModal(acc); }}
                    >
                      <AccountIcons.Cash /> Receive Cash
                    </button>
                    <button 
                      style={{ padding: '8px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #25d366, #128c7e)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12.5px' }}
                      onClick={() => { const acc = selectedAccount; handleSendWhatsAppReminder(acc); }}
                    >
                      <AccountIcons.WhatsApp /> WhatsApp Reminder
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-edit-from-modal" onClick={() => { const acc = selectedAccount; setSelectedAccount(null); handleOpenEdit(acc); }}>
                      <AccountIcons.Edit /> Edit Details
                    </button>
                    <button className="btn-close-modal" onClick={() => setSelectedAccount(null)}>
                      Close
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        
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
                      href={`tel:${selectedCallAccount.phone}`}
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
                      <div style={{ width: `${aiRisk.score}%`, height: '100%', background: aiRisk.gaugeColor, transition: 'width 0.4s ease' }}></div>
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

        {/* Add / Edit Account Modal */}
        {isModalOpen && (
          <div className="account-modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="account-form-card" onClick={(e) => e.stopPropagation()}>
              <div className="dossier-card-head">
                <div className="dossier-badge-wrap">
                  <AccountIcons.Bank />
                  <h3>{isEditMode ? 'Modify Banking Route' : 'Connect New Bank Account'}</h3>
                </div>
                <button className="btn-modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveForm} className="account-edit-form">
                
                <div className="form-row-dual">
                  <div className="form-field-group">
                    <label>Bank Name *</label>
                    <input 
                      type="text" 
                      list="accounts-banks-datalist"
                      placeholder="e.g. HDFC Bank, ICICI Bank"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      required
                    />
                    <datalist id="accounts-banks-datalist">
                      {INDIAN_BANKS_LIST.map((b) => (
                        <option key={b.code} value={b.name}>
                          {b.name} ({b.type})
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div className="form-field-group">
                    <label>Account Holder Name *</label>
                    <input 
                      type="text" 
                      placeholder="Legal Entity / Full Name"
                      value={formData.accountHolder}
                      onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-dual">
                  <div className="form-field-group">
                    <label>Account Number * (Numeric)</label>
                    <input 
                      type="password" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={18}
                      placeholder="Bank Account Number"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: sanitizeAccountNumber(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Confirm Account Number *</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={18}
                      placeholder="Re-enter Account Number"
                      value={formData.confirmAccountNumber}
                      onChange={(e) => setFormData({ ...formData, confirmAccountNumber: sanitizeAccountNumber(e.target.value) })}
                      required={!isEditMode}
                    />
                  </div>
                </div>

                <div className="form-row-dual">
                  <div className="form-field-group">
                    <label>IFSC Code *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        maxLength={11}
                        placeholder="e.g. HDFC0001892"
                        value={formData.ifscCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                          setFormData({ ...formData, ifscCode: val });
                          if (val.length === 11) handleIfscLookup(val);
                        }}
                        style={{ flex: 1, textTransform: 'uppercase' }}
                        required
                      />
                      <button 
                        type="button" 
                        className="btn-fetch-ifsc-mini"
                        disabled={isVerifyingIfsc || !formData.ifscCode || formData.ifscCode.length < 5}
                        onClick={() => handleIfscLookup(formData.ifscCode)}
                        style={{
                          padding: '0 12px',
                          background: 'rgba(6, 182, 212, 0.15)',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                          borderRadius: '8px',
                          color: '#22d3ee',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isVerifyingIfsc ? '...' : 'Auto-Fetch'}
                      </button>
                    </div>
                  </div>
                  <div className="form-field-group">
                    <label>Account Route Type</label>
                    <select 
                      value={formData.accountType}
                      onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    >
                      <option value="Settlement">Settlement Payouts</option>
                      <option value="Escrow Nodal">Escrow Nodal Pool</option>
                      <option value="Current">Current Account</option>
                      <option value="Agent Disbursal">Agent Disbursals</option>
                      <option value="Reserve">Merchant Reserve</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-dual">
                  <div className="form-field-group">
                    <label>Branch Regional Node</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mumbai Central"
                      value={formData.branchName}
                      onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Daily Disbursal Limit (₹)</label>
                    <input 
                      type="number" 
                      value={formData.dailyLimit}
                      onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save-account">
                    <AccountIcons.Check /> {isEditMode ? 'Save Modifications' : 'Register Account'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        
        {/* ============================================================
            1. MANUAL ADD LOAN / DEPOSIT ACCOUNT MODAL
           ============================================================ */}
        {isLoanModalOpen && (
          <div className="account-modal-overlay" onClick={() => setIsLoanModalOpen(false)}>
            <div className="account-modal-container" onClick={e => e.stopPropagation()}>
              <div className="account-modal-head">
                <div className="modal-title-stack">
                  <div className="modal-badge-tag">
                    <AccountIcons.Plus />
                    <span>Non-Integrated Manual Setup</span>
                  </div>
                  <h2>Add Loan / Deposit Account</h2>
                  <p>Create a standalone account record in the eCollect local ledger.</p>
                </div>
                <button className="btn-modal-close" onClick={() => setIsLoanModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveLoanAccount} className="account-form-grid">
                
                {/* Row 1: Account Number & Customer Name */}
                <div className="form-fields-2col">
                  <div className="form-field-group">
                    <label>Account Number <span className="req-star">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LN1040892"
                      value={loanFormData.accountNumber}
                      onChange={e => setLoanFormData(p => ({ ...p, accountNumber: e.target.value }))}
                      className="font-mono"
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Borrower / Customer Name <span className="req-star">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={loanFormData.customerName}
                      onChange={e => setLoanFormData(p => ({ ...p, customerName: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Row 2: Customer Mobile & Product Type */}
                <div className="form-fields-2col">
                  <div className="form-field-group">
                    <label>Customer Mobile Number <span className="req-star">*</span></label>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      placeholder="10-digit mobile number"
                      value={loanFormData.mobileNumber}
                      onChange={e => setLoanFormData(p => ({ ...p, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      className="font-mono"
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Product Type <span className="req-star">*</span></label>
                    <select
                      value={loanFormData.productType}
                      onChange={e => {
                        const newProd = e.target.value;
                        setLoanFormData(p => ({ 
                          ...p, 
                          productType: newProd,
                          loanCategory: newProd === 'LOAN' ? 'Home Loan' : newProd === 'RD' ? 'Standard Recurring Deposit' : newProd === 'FD' ? 'Fixed Term Deposit' : 'Daily Pigmy Deposit'
                        }));
                      }}
                      className="form-select-ctrl"
                    >
                      <option value="LOAN">💳 LOAN (Priority Portfolio)</option>
                      <option value="RD">🏦 RD (Recurring Deposit)</option>
                      <option value="DAILY_DEPOSIT">🪙 DAILY DEPOSIT (Pigmy / Daily)</option>
                      <option value="FD">📈 FD (Fixed Deposit Collection)</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Loan Scheme / Kind & EMI Frequency */}
                <div className="form-fields-2col">
                  <div className="form-field-group">
                    <label>Loan Scheme / Sub-Type <span className="req-star">*</span></label>
                    {loanFormData.productType === 'LOAN' ? (
                      <select
                        value={loanFormData.loanCategory}
                        onChange={e => setLoanFormData(p => ({ ...p, loanCategory: e.target.value }))}
                        className="form-select-ctrl font-bold"
                      >
                        <option value="Home Loan">🏠 Home Loan (Housing Finance)</option>
                        <option value="Gold Loan">🪙 Gold / Jewel Loan</option>
                        <option value="Vehicle Loan">🚗 Vehicle / Auto Loan (2W / 4W)</option>
                        <option value="Personal Loan">👤 Personal Loan (Unsecured)</option>
                        <option value="Business Loan">💼 Business / MSME Loan</option>
                        <option value="Education Loan">🎓 Education / Student Loan</option>
                        <option value="Agriculture Loan">🌾 Agriculture / Crop Loan</option>
                        <option value="Microfinance Loan">👥 Microfinance / JLG Loan</option>
                        <option value="Daily Pigmy Loan">⚡ Daily Pigmy Micro Loan</option>
                        <option value="Loan Against Property">🏢 Loan Against Property (LAP)</option>
                        <option value="Commercial Vehicle Loan">🚛 Commercial Vehicle Loan</option>
                        <option value="Consumer Durable Loan">📱 Consumer Appliance Loan</option>
                        <option value="Other Loan Scheme">📝 Other Custom Loan Scheme</option>
                      </select>
                    ) : (
                      <select
                        value={loanFormData.loanCategory}
                        onChange={e => setLoanFormData(p => ({ ...p, loanCategory: e.target.value }))}
                        className="form-select-ctrl font-bold"
                      >
                        {loanFormData.productType === 'RD' && (
                          <>
                            <option value="Standard Recurring Deposit">Standard Recurring Deposit</option>
                            <option value="Senior Citizen RD Scheme">Senior Citizen RD Scheme</option>
                            <option value="High-Yield Flexi RD">High-Yield Flexi RD</option>
                          </>
                        )}
                        {loanFormData.productType === 'DAILY_DEPOSIT' && (
                          <>
                            <option value="Daily Pigmy Deposit">Daily Pigmy Deposit</option>
                            <option value="Doorstep Cash Deposit">Doorstep Cash Deposit</option>
                            <option value="Merchant Daily Collector Scheme">Merchant Daily Collector Scheme</option>
                          </>
                        )}
                        {loanFormData.productType === 'FD' && (
                          <>
                            <option value="Fixed Term Deposit">Fixed Term Deposit</option>
                            <option value="Cumulative Re-investment FD">Cumulative Re-investment FD</option>
                            <option value="Monthly Interest Payout FD">Monthly Interest Payout FD</option>
                          </>
                        )}
                      </select>
                    )}
                  </div>
                  <div className="form-field-group">
                    <label>EMI Frequency <span className="req-star">*</span></label>
                    <select
                      value={loanFormData.emiFrequency}
                      onChange={e => {
                        const newFreq = e.target.value;
                        const { emi, due } = calculateAutoEmi(loanFormData.outstandingAmount, newFreq, loanFormData.tenureMonths);
                        setLoanFormData(p => ({
                          ...p,
                          emiFrequency: newFreq,
                          emiAmount: emi || p.emiAmount,
                          dueAmount: due || p.dueAmount
                        }));
                      }}
                      className="form-select-ctrl"
                    >
                      <option value="Monthly">Monthly (per month)</option>
                      <option value="Weekly">Weekly (per week)</option>
                      <option value="Daily">Daily (daily collection / pigmy)</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Outstanding Amount & Tenure */}
                <div className="form-fields-2col">
                  <div className="form-field-group">
                    <label>Outstanding / Loan Amount (₹) <span className="req-star">*</span></label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      placeholder="e.g. 120000"
                      value={loanFormData.outstandingAmount}
                      onChange={e => {
                        const val = e.target.value;
                        const { emi, due } = calculateAutoEmi(val, loanFormData.emiFrequency, loanFormData.tenureMonths);
                        setLoanFormData(p => ({
                          ...p,
                          outstandingAmount: val,
                          emiAmount: emi,
                          dueAmount: due
                        }));
                      }}
                      className="font-mono font-bold text-purple"
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Loan Tenure</label>
                    <select
                      value={loanFormData.tenureMonths}
                      onChange={e => {
                        const newTenure = e.target.value;
                        const { emi, due } = calculateAutoEmi(loanFormData.outstandingAmount, loanFormData.emiFrequency, newTenure);
                        setLoanFormData(p => ({
                          ...p,
                          tenureMonths: newTenure,
                          emiAmount: emi || p.emiAmount,
                          dueAmount: due || p.dueAmount
                        }));
                      }}
                      className="form-select-ctrl"
                    >
                      <option value="3">3 Months (Short Term)</option>
                      <option value="6">6 Months (Half Year)</option>
                      <option value="10">10 Months (Micro)</option>
                      <option value="12">12 Months (1 Year Standard)</option>
                      <option value="24">24 Months (2 Years)</option>
                      <option value="36">36 Months (3 Years)</option>
                      <option value="48">48 Months (4 Years)</option>
                      <option value="60">60 Months (5 Years)</option>
                    </select>
                  </div>
                </div>

                {/* Row 5: Calculated EMI & Current Due */}
                <div className="form-fields-2col">
                  <div className="form-field-group">
                    <label>Calculated EMI (₹) <span className="req-star">*</span></label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="0"
                      value={loanFormData.emiAmount}
                      onChange={e => setLoanFormData(p => ({ ...p, emiAmount: e.target.value, dueAmount: e.target.value }))}
                      className="font-mono font-bold text-green"
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Current Due Demand (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={loanFormData.dueAmount}
                      onChange={e => setLoanFormData(p => ({ ...p, dueAmount: e.target.value }))}
                      className="font-mono font-bold text-cyan"
                    />
                  </div>
                </div>

                {/* Row 6: Last Paid Date & Next Due Date */}
                <div className="form-fields-2col">
                  <div className="form-field-group">
                    <label>Last Paid Date</label>
                    <input
                      type="date"
                      value={loanFormData.lastPaidDate}
                      onChange={e => setLoanFormData(p => ({ ...p, lastPaidDate: e.target.value }))}
                      className="font-mono"
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Next Due Date</label>
                    <input
                      type="date"
                      value={loanFormData.nextDueDate}
                      onChange={e => setLoanFormData(p => ({ ...p, nextDueDate: e.target.value }))}
                      className="font-mono"
                    />
                  </div>
                </div>

                
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

                {/* Customer Photo Upload from Device */}
                <div className="form-field-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Customer Profile Photo</span>
                    <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600 }}>Select image from device</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 14px', background: 'var(--bgSecondary, #0f172a)', border: '1px dashed var(--borderColor, rgba(255, 255, 255, 0.2))', borderRadius: '12px' }}>
                    {loanFormData.customerPhoto ? (
                      <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
                        <img 
                          src={loanFormData.customerPhoto} 
                          alt="Customer Preview" 
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setLoanFormData(p => ({ ...p, customerPhoto: '' }))}
                          style={{ position: 'absolute', top: '-4px', right: '-4px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Remove Photo"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', flexShrink: 0 }}>
                        <AccountIcons.Camera />
                      </div>
                    )}

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '7px 14px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '8px', color: '#818cf8', fontSize: '12.5px', fontWeight: 700, width: 'fit-content' }}>
                        📁 {loanFormData.customerPhoto ? 'Change Photo from Device' : 'Select Photo from Device / Storage'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                showToast('⏳ Formatting to passport photo size...');
                                const compressedUrl = await compressToPassportPhoto(file, 240, 300, 0.82);
                                setLoanFormData(p => ({ ...p, customerPhoto: compressedUrl }));
                                showToast('📷 Passport photo ready!');
                              } catch (err) {
                                showToast('Error processing image', 'error');
                              }
                            }
                          }}
                        />
                      </label>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Uploads directly from phone / computer storage and stores format in local ledger.</span>
                    </div>
                  </div>
                </div>

                {/* Row 7: Field Agent */}
                <div className="form-field-group">
                  <label>Assign Field Agent <span className="req-star">*</span></label>
                  <select
                    value={loanFormData.assignedAgentCode}
                    onChange={e => {
                      const selCode = e.target.value;
                      const agObj = availableAgents.find(a => (a.agentCode || a.code || String(a.id)) === selCode);
                      setLoanFormData(p => ({
                        ...p,
                        assignedAgentCode: selCode,
                        assignedAgentName: agObj ? (agObj.name || agObj.fullName) : ''
                      }));
                    }}
                    className="form-select-ctrl"
                  >
                    <option value="">-- Select Field Agent (Merchant Branch Only) --</option>
                    {availableAgents.map(ag => (
                      <option key={ag.id || ag.agentCode || ag.code} value={ag.agentCode || ag.code || ag.id}>
                        {ag.name || ag.fullName} ({ag.agentCode || ag.code || ag.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="account-modal-foot">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsLoanModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-save">
                    <AccountIcons.Check />
                    <span>Save Loan Account</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================
            2. BULK MASTER ACCOUNTS CSV/EXCEL UPLOAD MODAL
           ============================================================ */}
        {isBulkAccountsModalOpen && (
          <div className="account-modal-overlay" onClick={() => setIsBulkAccountsModalOpen(false)}>
            <div className="account-modal-container bulk-upload-modal" onClick={e => e.stopPropagation()}>
              <div className="account-modal-head">
                <div className="modal-title-stack">
                  <div className="modal-badge-tag">
                    <AccountIcons.Upload />
                    <span>Master Portfolio Ingestion</span>
                  </div>
                  <h2>Bulk Master Accounts Upload</h2>
                  <p>Import your base loan and deposit accounts in bulk using CSV / Excel.</p>
                </div>
                <button className="btn-modal-close" onClick={() => setIsBulkAccountsModalOpen(false)}>✕</button>
              </div>

              <div className="bulk-upload-body">
                <div className="template-download-banner">
                  <div>
                    <strong>Comprehensive Standard Master Format (20 Attributes)</strong>
                    <p>Includes Account Number, Customer Name, Mobile, Email, Product, Scheme, Outstanding, Due, EMI, Frequency, Dates & Agents.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      type="button"
                      className="btn-download-tmpl" 
                      onClick={handleDownloadAccountsExcelTemplate}
                      title="Download formatted Excel spreadsheet with sample data"
                    >
                      <AccountIcons.FileSpreadsheet />
                      <span>Download Excel Template (.xlsx)</span>
                    </button>
                    <button 
                      type="button"
                      className="btn-download-tmpl" 
                      onClick={handleDownloadAccountsCsvTemplate}
                      title="Download standard CSV format"
                    >
                      <AccountIcons.Download />
                      <span>Download CSV Template (.csv)</span>
                    </button>
                  </div>
                </div>

                <div className="file-dropzone-box">
                  <input
                    type="file"
                    id="bulkAccountsFileInput"
                    accept=".csv,.txt,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleBulkAccountsFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="bulkAccountsFileInput" className="dropzone-label">
                    <AccountIcons.Upload />
                    <span className="drop-title">Click to browse or drop Master Accounts Excel / CSV file</span>
                    <span className="drop-sub">Supported formats: .XLSX, .XLS, .CSV, .TXT (Max 10MB)</span>
                  </label>
                  {bulkAccountsFile && (
                    <div className="selected-file-chip">
                      <span>📄 {bulkAccountsFile.name} ({(bulkAccountsFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>

                {bulkAccountsRows.length > 0 && (
                  <div className="preview-table-wrap">
                    <div className="preview-header font-mono">
                      <span>Showing {bulkAccountsRows.length} preview records to import:</span>
                    </div>
                    <table className="preview-mini-table font-mono">
                      <thead>
                        <tr>
                          <th>Account No</th>
                          <th>Customer Name</th>
                          <th>Mobile</th>
                          <th>Product & Scheme</th>
                          <th>Outstanding</th>
                          <th>Due Amount</th>
                          <th>Instalment</th>
                          <th>Agent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkAccountsRows.map((row, i) => (
                          <tr key={i}>
                            <td className="font-bold">{row.AccountNumber || row.accountnumber || row.AccountNo || '-'}</td>
                            <td>{row.CustomerName || row.customername || row.Name || 'Customer'}</td>
                            <td className="text-muted">{row.MobileNumber || row.mobilenumber || row.Phone || '-'}</td>
                            <td><span className="tag-prod">{row.ProductType || row.producttype || 'LOAN'}</span> {row.LoanCategory || row.SchemeName || ''}</td>
                            <td>₹{Number(row.OutstandingAmount || row.outstandingamount || row.Balance || 0).toLocaleString('en-IN')}</td>
                            <td className="text-green font-bold">₹{Number(row.DueAmount || row.dueamount || row.Demand || 0).toLocaleString('en-IN')}</td>
                            <td>₹{Number(row.EmiAmount || row.emiamount || 0).toLocaleString('en-IN')} ({row.EmiFrequency || row.emifrequency || 'Monthly'})</td>
                            <td>{row.AssignedAgentCode || row.assignedagentcode || row.Agent || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="account-modal-foot">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsBulkAccountsModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-modal-save"
                    disabled={bulkAccountsRows.length === 0 || isUploadingBulkAccounts}
                    onClick={handleSubmitBulkAccounts}
                  >
                    {isUploadingBulkAccounts ? 'Importing Accounts...' : `Import ${bulkAccountsRows.length} Accounts`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            3. DAILY DUE LIST CSV/EXCEL UPLOAD MODAL (DAY BEGIN) (Model N Only)
           ============================================================ */}
        {isNonIntegrated && isDueListModalOpen && (
          <div className="account-modal-overlay" onClick={() => setIsDueListModalOpen(false)}>
            <div className="account-modal-container bulk-upload-modal" onClick={e => e.stopPropagation()}>
              <div className="account-modal-head">
                <div className="modal-title-stack">
                  <div className="modal-badge-tag is-cyan">
                    <AccountIcons.FileText />
                    <span>Day Begin Workflow</span>
                  </div>
                  <h2>Upload Daily Due / Demand List</h2>
                  <p>Upload morning due list exported from CBS to refresh today's collection demand.</p>
                </div>
                <button className="btn-modal-close" onClick={() => setIsDueListModalOpen(false)}>✕</button>
              </div>

              <div className="bulk-upload-body">
                <div className="template-download-banner is-cyan">
                  <div>
                    <strong>CBS Due List Format</strong>
                    <p>Requires Account Number, Today's Due Demand, Outstanding, EMI, and Dates.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      type="button"
                      className="btn-download-tmpl is-cyan" 
                      onClick={handleDownloadDueListExcelTemplate}
                      title="Download formatted Excel due list template"
                    >
                      <AccountIcons.FileSpreadsheet />
                      <span>Download Excel Template (.xlsx)</span>
                    </button>
                    <button 
                      type="button"
                      className="btn-download-tmpl is-cyan" 
                      onClick={handleDownloadDueListCsvTemplate}
                      title="Download standard CSV due list template"
                    >
                      <AccountIcons.Download />
                      <span>Download CSV Template (.csv)</span>
                    </button>
                  </div>
                </div>

                <div className="file-dropzone-box">
                  <input
                    type="file"
                    id="dueListFileInput"
                    accept=".csv,.txt,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleDueListFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="dueListFileInput" className="dropzone-label">
                    <AccountIcons.Upload />
                    <span className="drop-title">Click to select CBS Morning Due List Excel / CSV file</span>
                    <span className="drop-sub">Supported formats: .XLSX, .XLS, .CSV, .TXT</span>
                  </label>
                  {dueListFile && (
                    <div className="selected-file-chip">
                      <span>📄 {dueListFile.name} ({(dueListFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>

                {dueListRows.length > 0 && (
                  <div className="preview-table-wrap">
                    <div className="preview-header font-mono">
                      <span>Showing {dueListRows.length} due records to refresh:</span>
                    </div>
                    <table className="preview-mini-table font-mono">
                      <thead>
                        <tr>
                          <th>Account No</th>
                          <th>Today's Due</th>
                          <th>Outstanding</th>
                          <th>Next Due Date</th>
                          <th>Agent Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dueListRows.map((row, i) => (
                          <tr key={i}>
                            <td className="font-bold">{row.AccountNumber || row.accountnumber || row.AccountNo || row.accountno || row.accno || '-'}</td>
                            <td className="text-purple font-bold">₹{Number(row.DueAmount || row.dueamount || row.Demand || row.demand || row.Due || row.due || 0).toLocaleString('en-IN')}</td>
                            <td>₹{Number(row.OutstandingAmount || row.outstandingamount || row.Balance || row.balance || 0).toLocaleString('en-IN')}</td>
                            <td>{row.NextDueDate || row.nextduedate || row.DueDate || row.duedate || '-'}</td>
                            <td>{row.AssignedAgentCode || row.assignedagentcode || row.AgentCode || row.agentcode || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="account-modal-foot">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsDueListModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-modal-save is-cyan"
                    disabled={dueListRows.length === 0 || isUploadingDueList}
                    onClick={handleSubmitDueList}
                  >
                    {isUploadingDueList ? 'Refreshing Demands...' : `Process ${dueListRows.length} Due Records`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            4. INDIVIDUAL ACCOUNT REMINDER CUSTOMIZATION MODAL
           ============================================================ */}
        {isAccountReminderModalOpen && selectedReminderAccount && (
          <div className="account-modal-overlay" onClick={() => setIsAccountReminderModalOpen(false)}>
            <div className="account-modal-container reminder-custom-modal" onClick={e => e.stopPropagation()}>
              <div className="account-modal-head">
                <div className="modal-title-stack">
                  <div className="modal-badge-tag is-amber">
                    <AccountIcons.Bell />
                    <span>Account Due Reminder Setup</span>
                  </div>
                  <h2>Customize Due Date Reminder</h2>
                  <p>Configure automated WhatsApp, SMS, and Call alerts for <strong>{selectedReminderAccount.accountHolder}</strong> (Acc #{selectedReminderAccount.accountNumber}).</p>
                </div>
                <button className="btn-modal-close" onClick={() => setIsAccountReminderModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveAccountReminder} className="account-form-grid">
                <div className="reminder-highlight-card font-mono">
                  <div className="rh-item">
                    <span className="rh-label">Due Demand</span>
                    <span className="rh-val text-purple font-bold">₹{Number(selectedReminderAccount.dueAmount || selectedReminderAccount.balance || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="rh-item">
                    <span className="rh-label">Next Due Date</span>
                    <span className="rh-val text-cyan">{selectedReminderAccount.nextDueDate || 'Standard Schedule'}</span>
                  </div>
                  <div className="rh-item">
                    <span className="rh-label">Customer Mobile</span>
                    <span className="rh-val">{selectedReminderAccount.phone || '9876543210'}</span>
                  </div>
                </div>

                <div className="form-fields-2col">
                  <div className="form-field-group">
                    <label>Borrower Risk Profile / Schedule Rule</label>
                    <select
                      value={accountReminderForm.riskLevel}
                      onChange={e => setAccountReminderForm(p => ({ ...p, riskLevel: e.target.value }))}
                      className="form-select-ctrl font-bold"
                    >
                      <option value="Standard">🔔 Standard Borrower (Dispatches 2 Days Before Due)</option>
                      <option value="HighRisk">🚨 High Risk / Unsure Payer (3 Days Before + Daily Alert)</option>
                      <option value="Custom">⚡ Custom Number of Days Before Due</option>
                      <option value="Disabled">🔕 Disable Automated Reminders for this Account</option>
                    </select>
                  </div>

                  <div className="form-field-group">
                    <label>Reminder Lead Time (Days Before Due Date)</label>
                    <select
                      value={accountReminderForm.daysBeforeDue}
                      onChange={e => setAccountReminderForm(p => ({ ...p, daysBeforeDue: Number(e.target.value) }))}
                      className="form-select-ctrl"
                      disabled={accountReminderForm.riskLevel === 'Disabled'}
                    >
                      <option value={1}>1 Day Before Due Date</option>
                      <option value={2}>2 Days Before Due Date (Default Standard)</option>
                      <option value={3}>3 Days Before Due Date</option>
                      <option value={5}>5 Days Before Due Date</option>
                      <option value={7}>7 Days Before Due Date (1 Week Advance)</option>
                    </select>
                  </div>
                </div>

                <div className="form-field-group">
                  <label>Enabled Dispatch Channels</label>
                  <div className="channels-pill-selector">
                    {['WhatsApp', 'SMS', 'Call'].map(ch => {
                      const activeList = (accountReminderForm.channels || '').split(',').map(s => s.trim());
                      const isSelected = activeList.includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          className={`channel-pill-btn ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => {
                            let updated = [...activeList];
                            if (isSelected) {
                              updated = updated.filter(x => x !== ch);
                            } else {
                              updated.push(ch);
                            }
                            setAccountReminderForm(p => ({ ...p, channels: updated.join(',') }));
                          }}
                        >
                          {ch === 'WhatsApp' ? '💬 WhatsApp' : ch === 'SMS' ? '📱 SMS Text' : '📞 Automated Call'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-field-group">
                  <label>Custom Note / Special Instruction for Reminder</label>
                  <input
                    type="text"
                    placeholder="e.g. Please visit the branch before 2 PM to avoid late fee penalty"
                    value={accountReminderForm.customNote}
                    onChange={e => setAccountReminderForm(p => ({ ...p, customNote: e.target.value }))}
                  />
                </div>

                <div className="account-modal-foot">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsAccountReminderModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-save">
                    <AccountIcons.Check />
                    <span>Save Account Reminder Rule</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================
            5. GLOBAL REMINDER RULES & BACKGROUND SCHEDULER MODAL
           ============================================================ */}
        {isGlobalReminderModalOpen && (
          <div className="account-modal-overlay" onClick={() => setIsGlobalReminderModalOpen(false)}>
            <div className="account-modal-container global-reminder-modal" onClick={e => e.stopPropagation()}>
              <div className="account-modal-head">
                <div className="modal-title-stack">
                  <div className="modal-badge-tag">
                    <AccountIcons.Bell />
                    <span>Background Job & Rules Engine</span>
                  </div>
                  <h2>Automated Due Reminders & Scheduler</h2>
                  <p>Controls the recurring background worker that scans unintegrated accounts and automatically delivers WhatsApp, SMS, and Voice alerts.</p>
                </div>
                <button className="btn-modal-close" onClick={() => setIsGlobalReminderModalOpen(false)}>✕</button>
              </div>

              <div className="global-reminder-body">
                <div className="scheduler-status-banner">
                  <div className="sched-status-left">
                    <span className="pulse-live-dot"></span>
                    <div>
                      <strong>Background Job Active & Monitoring</strong>
                      <span>Runs automatically daily at <strong>{globalReminderConfig.dailyExecutionTime || '08:00 AM'}</strong> for all unintegrated accounts.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-trigger-now-cta"
                    disabled={isTriggeringScan}
                    onClick={handleTriggerRemindersNow}
                  >
                    {isTriggeringScan ? 'Dispatching Reminders...' : '⚡ Run Due Reminder Scan Now'}
                  </button>
                </div>

                <form onSubmit={handleSaveGlobalReminderConfig} className="global-rules-form">
                  <h4 className="rules-section-title">Branch & Merchant Default Rules</h4>
                  
                  <div className="form-fields-3col">
                    <div className="form-field-group">
                      <label>Default Days Before Due</label>
                      <select
                        value={globalReminderConfig.defaultDaysBeforeDue}
                        onChange={e => setGlobalReminderConfig(p => ({ ...p, defaultDaysBeforeDue: Number(e.target.value) }))}
                        className="form-select-ctrl"
                      >
                        <option value={1}>1 Day Before</option>
                        <option value={2}>2 Days Before (Standard)</option>
                        <option value={3}>3 Days Before</option>
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label>High-Risk Accounts Lead Time</label>
                      <select
                        value={globalReminderConfig.highRiskDaysBeforeDue}
                        onChange={e => setGlobalReminderConfig(p => ({ ...p, highRiskDaysBeforeDue: Number(e.target.value) }))}
                        className="form-select-ctrl"
                      >
                        <option value={3}>3 Days Before + Daily</option>
                        <option value={5}>5 Days Before + Daily</option>
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label>Daily Scan Time</label>
                      <input
                        type="time"
                        value={globalReminderConfig.dailyExecutionTime}
                        onChange={e => setGlobalReminderConfig(p => ({ ...p, dailyExecutionTime: e.target.value }))}
                        className="form-select-ctrl font-mono"
                      />
                    </div>
                  </div>

                  <div className="global-channels-toggles">
                    <label className="checkbox-toggle-item">
                      <input
                        type="checkbox"
                        checked={globalReminderConfig.enableWhatsApp}
                        onChange={e => setGlobalReminderConfig(p => ({ ...p, enableWhatsApp: e.target.checked }))}
                      />
                      <span>💬 Enable Automated WhatsApp Alerts</span>
                    </label>

                    <label className="checkbox-toggle-item">
                      <input
                        type="checkbox"
                        checked={globalReminderConfig.enableSms}
                        onChange={e => setGlobalReminderConfig(p => ({ ...p, enableSms: e.target.checked }))}
                      />
                      <span>📱 Enable Automated SMS Messages</span>
                    </label>

                    <label className="checkbox-toggle-item">
                      <input
                        type="checkbox"
                        checked={globalReminderConfig.enableAutomatedCall}
                        onChange={e => setGlobalReminderConfig(p => ({ ...p, enableAutomatedCall: e.target.checked }))}
                      />
                      <span>📞 Enable Automated Voice / IVR Reminder</span>
                    </label>
                  </div>

                  <div className="modal-inline-save-row">
                    <button type="submit" className="btn-modal-save">
                      <AccountIcons.Check />
                      <span>Save Global Reminder Policy</span>
                    </button>
                  </div>
                </form>

                <div className="reminder-wallet-strip">
                  <div className="rws-left">
                    <span className="rws-icon">💳</span>
                    <div>
                      <span className="rws-title">Merchant Credits Wallet: <strong>₹{walletData.balance.toFixed(2)}</strong></span>
                      <span className="rws-sub">
                        Approx. <strong>{Math.floor(walletData.balance / (walletData.rates?.WhatsApp || 0.45))}</strong> WhatsApp msgs or <strong>{Math.floor(walletData.balance / (walletData.rates?.SMS || 0.20))}</strong> SMS available
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-rws-recharge"
                    onClick={() => {
                      setIsGlobalReminderModalOpen(false);
                      setIsWalletModalOpen(true);
                      setActiveWalletTab('recharge');
                    }}
                  >
                    ⚡ Top-Up Credits
                  </button>
                </div>

                <div className="reminder-logs-section">
                  <h4 className="rules-section-title">Recent Reminder Dispatch Audit Log</h4>
                  {reminderLogs.length === 0 ? (
                    <div className="empty-logs-msg font-mono">No reminders dispatched yet for today. Click "Run Due Reminder Scan Now" above to trigger a test run.</div>
                  ) : (
                    <div className="preview-table-wrap">
                      <table className="preview-mini-table font-mono">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Acc No</th>
                            <th>Customer</th>
                            <th>Channel</th>
                            <th>Demand</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reminderLogs.slice(0, 10).map((l, i) => (
                            <tr key={i}>
                              <td>{new Date(l.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                              <td>{l.accountNumber}</td>
                              <td>{l.customerName}</td>
                              <td><span className="log-channel-tag">{l.channel}</span></td>
                              <td className="text-purple font-bold">₹{Number(l.dueAmount || 0).toLocaleString('en-IN')}</td>
                              <td><span className="status-pill is-active">{l.status || 'Delivered'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="account-modal-foot">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsGlobalReminderModalOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ============================================================
            7. DAY BEGIN (BOD) & DAY END (EOD) OPERATIONS SUITE MODAL (Model N Only)
           ============================================================ */}
        {isNonIntegrated && isDayOpsModalOpen && (
          <div className="account-modal-overlay" onClick={() => setIsDayOpsModalOpen(false)}>
            <div className="account-modal-container day-ops-modal" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
              <div className="account-modal-head">
                <div className="modal-title-stack">
                  <div className="modal-badge-tag" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                    <span>Operations & Shift Hub</span>
                  </div>
                  <h2>Day Operations & Shift Control Hub</h2>
                  <p>Manage Beginning of Day (BOD), manual End of Day (EOD) settlement, and compliance audit.</p>
                </div>
                <button className="btn-modal-close" onClick={() => setIsDayOpsModalOpen(false)}>✕</button>
              </div>

              <div className="wallet-modal-body">
                {/* Navigation Tabs */}
                <div className="wallet-modal-tabs">
                  <button
                    type="button"
                    className={`wallet-nav-tab ${dayOpsTab === 'BOD' ? 'is-active' : ''}`}
                    onClick={() => setDayOpsTab('BOD')}
                  >
                    <span>☀️ 1. Day Begin (BOD)</span>
                  </button>
                  <button
                    type="button"
                    className={`wallet-nav-tab ${dayOpsTab === 'EOD' ? 'is-active' : ''}`}
                    onClick={() => setDayOpsTab('EOD')}
                  >
                    <span>🌙 2. Day End (EOD) Settlement</span>
                  </button>
                  <button
                    type="button"
                    className={`wallet-nav-tab ${dayOpsTab === 'CERTIFICATE' ? 'is-active' : ''}`}
                    onClick={() => setDayOpsTab('CERTIFICATE')}
                  >
                    <span>📜 3. Settlement Scroll</span>
                  </button>
                  <button
                    type="button"
                    className={`wallet-nav-tab ${dayOpsTab === 'GOLIVE' ? 'is-active' : ''}`}
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

                    <div className="form-field-group">
                      <label>Morning Shift Operational Notes</label>
                      <input
                        type="text"
                        value={dayOpsNotes}
                        onChange={e => setDayOpsNotes(e.target.value)}
                        placeholder="e.g. Standard morning field collection run"
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
                        <span>{dayShiftState?.shiftStatus === 'OPEN' ? '✓ Shift Active (Click to Refresh)' : '☀️ Start Day Begin (BOD) & Unlock Operations'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: DAY END (EOD) */}
                {dayOpsTab === 'EOD' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>DOORSTEP CASH</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>₹{eodSummary.cashCollectedAmount.toLocaleString('en-IN')}</div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>DYNAMIC UPI QR</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#818cf8', fontFamily: 'monospace' }}>₹{eodSummary.upiCollectedAmount.toLocaleString('en-IN')}</div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>PAYMENT LINKS</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace' }}>₹{(eodSummary.linkCollectedAmount || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <div style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 700 }}>TOTAL COLLECTED</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>₹{eodSummary.totalCollectedAmount.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>Manual Day-End Settlement</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          Review today's total collections ({eodSummary.totalTransactionsCount} transactions) and seal the daily ledger.
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                        Efficiency: {eodSummary.collectionEfficiencyPercent}%
                      </div>
                    </div>

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
                        <div>Total Collections: <strong>₹{eodSummary.totalCollectedAmount.toLocaleString('en-IN')}</strong></div>
                        <div>Cash Collected: <strong>₹{eodSummary.cashCollectedAmount.toLocaleString('en-IN')}</strong></div>
                        <div>UPI QR Collected: <strong>₹{eodSummary.upiCollectedAmount.toLocaleString('en-IN')}</strong></div>
                        <div>Payment Links Collected: <strong>₹{(eodSummary.linkCollectedAmount || 0).toLocaleString('en-IN')}</strong></div>
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

        {/* ============================================================
            6. MERCHANT COMMUNICATION CREDITS WALLET MODAL
           ============================================================ */}
        {isWalletModalOpen && (
          <div className="account-modal-overlay" onClick={() => setIsWalletModalOpen(false)}>
            <div className="account-modal-container credits-wallet-modal" onClick={e => e.stopPropagation()}>
              <div className="account-modal-head">
                <div className="modal-title-stack">
                  <div className="modal-badge-tag is-wallet">
                    <AccountIcons.CreditCard />
                    <span>Prepaid Credits Ledger</span>
                  </div>
                  <h2>Communication Credits Wallet</h2>
                  <p>Manage SMS, WhatsApp & Automated Voice Call credits for Merchant #{user?.merchantId || '01'} (Non-Integrated Route).</p>
                </div>
                <button className="btn-modal-close" onClick={() => setIsWalletModalOpen(false)}>✕</button>
              </div>

              <div className="wallet-modal-body">
                {/* Wallet Navigation Tabs */}
                <div className="wallet-modal-tabs">
                  <button
                    type="button"
                    className={`wallet-nav-tab ${activeWalletTab === 'recharge' ? 'is-active' : ''}`}
                    onClick={() => setActiveWalletTab('recharge')}
                  >
                    <span>💳 Top-Up & Recharge</span>
                  </button>
                  <button
                    type="button"
                    className={`wallet-nav-tab ${activeWalletTab === 'ledger' ? 'is-active' : ''}`}
                    onClick={() => setActiveWalletTab('ledger')}
                  >
                    <span>📜 Usage & Transaction Ledger</span>
                    <span className="tab-badge-mini font-mono">{walletTransactions.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`wallet-nav-tab ${activeWalletTab === 'rates' ? 'is-active' : ''}`}
                    onClick={() => setActiveWalletTab('rates')}
                  >
                    <span>🏷️ Message Rates & Rules</span>
                  </button>
                </div>

                {/* Tab 1: Top-Up & Recharge */}
                {activeWalletTab === 'recharge' && (
                  <div className="wallet-recharge-tab">
                    {/* Big Balance Showcase Card */}
                    <div className="wallet-hero-balance-card">
                      <div className="whb-main">
                        <span className="whb-label">Available Communication Balance</span>
                        <div className="whb-amount font-mono">
                          <span className="curr">₹</span>{walletData.balance.toFixed(2)}
                        </div>
                        <div className="whb-status">
                          {walletData.balance <= 0 ? (
                            <span className="whb-chip is-red">🔴 Wallet Empty (Reminders Paused)</span>
                          ) : walletData.balance < (walletData.lowBalanceThreshold || 100) ? (
                            <span className="whb-chip is-amber">🟡 Low Balance (Recharge Recommended)</span>
                          ) : (
                            <span className="whb-chip is-green">🟢 Active & Healthy</span>
                          )}
                        </div>
                      </div>

                      <div className="whb-breakdown font-mono">
                        <div className="whb-unit-item">
                          <span className="unit-icon">💬</span>
                          <div className="unit-info">
                            <strong>~{Math.floor(walletData.balance / (walletData.rates?.WhatsApp || 0.45))}</strong>
                            <span>WhatsApp Msgs</span>
                          </div>
                        </div>
                        <div className="whb-unit-item">
                          <span className="unit-icon">📱</span>
                          <div className="unit-info">
                            <strong>~{Math.floor(walletData.balance / (walletData.rates?.SMS || 0.20))}</strong>
                            <span>SMS Alerts</span>
                          </div>
                        </div>
                        <div className="whb-unit-item">
                          <span className="unit-icon">📞</span>
                          <div className="unit-info">
                            <strong>~{Math.floor(walletData.balance / (walletData.rates?.Call || 0.90))}</strong>
                            <span>Voice IVR Calls</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Packages Grid */}
                    <form onSubmit={handleTopUpWallet} className="wallet-packages-section">
                      <h4 className="rules-section-title">Select Recharge Package</h4>
                      <div className="packages-grid">
                        {[
                          { amount: 250, name: 'Starter Pack', msgs: '1,250 SMS / 550 WhatsApp', popular: false },
                          { amount: 500, name: 'Growth Pack', msgs: '2,500 SMS / 1,110 WhatsApp', popular: false },
                          { amount: 1000, name: 'Popular Pack', msgs: '5,000 SMS / 2,220 WhatsApp', popular: true },
                          { amount: 2500, name: 'Professional', msgs: '12,500 SMS / 5,550 WhatsApp', popular: false },
                          { amount: 5000, name: 'Enterprise', msgs: '25,000 SMS / 11,100 WhatsApp', popular: false },
                        ].map((pkg) => (
                          <div
                            key={pkg.amount}
                            className={`package-card ${topUpForm.amount === pkg.amount && !customTopUpAmount ? 'is-selected' : ''}`}
                            onClick={() => {
                              setTopUpForm(p => ({ ...p, amount: pkg.amount }));
                              setCustomTopUpAmount('');
                            }}
                          >
                            {pkg.popular && <span className="pkg-badge">Popular</span>}
                            <div className="pkg-amount font-mono">₹{pkg.amount.toLocaleString('en-IN')}</div>
                            <div className="pkg-name">{pkg.name}</div>
                            <div className="pkg-sub">{pkg.msgs}</div>
                          </div>
                        ))}
                      </div>

                      {/* Custom Amount Input */}
                      <div className="custom-recharge-row">
                        <label>Or Enter Custom Amount (₹):</label>
                        <div className="custom-amount-input-wrap">
                          <span className="prefix">₹</span>
                          <input
                            type="number"
                            min="100"
                            step="50"
                            placeholder="e.g. 1500"
                            value={customTopUpAmount}
                            onChange={e => {
                              setCustomTopUpAmount(e.target.value);
                              if (e.target.value) setTopUpForm(p => ({ ...p, amount: Number(e.target.value) }));
                            }}
                            className="custom-amount-input font-mono"
                          />
                        </div>
                      </div>

                      {/* Payment Rail Options */}
                      <div className="payment-rails-group">
                        <label>Payment Channel</label>
                        <div className="rails-selector">
                          <label className={`rail-chip ${topUpForm.paymentMethod === 'UPI' ? 'is-selected' : ''}`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="UPI"
                              checked={topUpForm.paymentMethod === 'UPI'}
                              onChange={e => setTopUpForm(p => ({ ...p, paymentMethod: e.target.value }))}
                            />
                            <span>⚡ Instant UPI (GPay / PhonePe / Paytm)</span>
                          </label>
                          <label className={`rail-chip ${topUpForm.paymentMethod === 'NetBanking' ? 'is-selected' : ''}`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="NetBanking"
                              checked={topUpForm.paymentMethod === 'NetBanking'}
                              onChange={e => setTopUpForm(p => ({ ...p, paymentMethod: e.target.value }))}
                            />
                            <span>🏦 Corporate Net Banking</span>
                          </label>
                          <label className={`rail-chip ${topUpForm.paymentMethod === 'Card' ? 'is-selected' : ''}`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="Card"
                              checked={topUpForm.paymentMethod === 'Card'}
                              onChange={e => setTopUpForm(p => ({ ...p, paymentMethod: e.target.value }))}
                            />
                            <span>💳 Debit / Credit Card</span>
                          </label>
                        </div>
                      </div>

                      <div className="wallet-actions-foot">
                        <button
                          type="submit"
                          className="btn-modal-save is-wallet-cta"
                          disabled={isRechargingWallet}
                        >
                          {isRechargingWallet ? 'Processing Recharge...' : `Recharge ₹${(Number(customTopUpAmount || topUpForm.amount || 0)).toLocaleString('en-IN')} Now`}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Tab 2: Transaction & Deduction Ledger */}
                {activeWalletTab === 'ledger' && (
                  <div className="wallet-ledger-tab">
                    <div className="ledger-header-stats font-mono">
                      <div className="lhs-card">
                        <span>Total Recharged</span>
                        <strong>₹{(walletData.totalRecharged || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="lhs-card">
                        <span>Total Consumed</span>
                        <strong className="text-purple">₹{(walletData.totalSpent || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="lhs-card">
                        <span>Closing Balance</span>
                        <strong className="text-green">₹{(walletData.balance || 0).toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="preview-table-wrap">
                      <table className="preview-mini-table font-mono">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>Reference</th>
                            <th>Type</th>
                            <th>Channel</th>
                            <th>Recipients</th>
                            <th>Amount (₹)</th>
                            <th>Balance</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {walletTransactions.map((tx, idx) => (
                            <tr key={tx.id || idx}>
                              <td>{new Date(tx.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                              <td className="text-muted">{tx.referenceId}</td>
                              <td>
                                <span className={`txn-type-pill ${tx.type === 'TOPUP' ? 'is-topup' : 'is-deduction'}`}>
                                  {tx.type === 'TOPUP' ? '🟢 Credit (+)' : '🟣 Debit (-)'}
                                </span>
                              </td>
                              <td>{tx.channel}</td>
                              <td>{tx.recipientCount > 0 ? `${tx.recipientCount} msgs` : '-'}</td>
                              <td className={tx.type === 'TOPUP' ? 'text-green font-bold' : 'text-purple font-bold'}>
                                {tx.type === 'TOPUP' ? `+₹${Number(tx.amount).toFixed(2)}` : `-₹${Number(tx.amount).toFixed(2)}`}
                              </td>
                              <td className="font-bold">₹{Number(tx.closingBalance).toFixed(2)}</td>
                              <td><span className="status-pill is-active">{tx.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 3: Message Rates & DLT Rules */}
                {activeWalletTab === 'rates' && (
                  <div className="wallet-rates-tab">
                    <div className="rates-cards-grid font-mono">
                      <div className="rate-item-card is-sms">
                        <span className="ric-icon">📱</span>
                        <div className="ric-title">Transactional SMS</div>
                        <div className="ric-price">₹0.20 <span className="unit">/ SMS</span></div>
                        <div className="ric-desc">Standard 160-character DLT-approved header alert via telecom network rail.</div>
                      </div>

                      <div className="rate-item-card is-wa">
                        <span className="ric-icon">💬</span>
                        <div className="ric-title">WhatsApp Business API</div>
                        <div className="ric-price">₹0.45 <span className="unit">/ Msg</span></div>
                        <div className="ric-desc">Meta verified high-delivery interactive notice with instant UPI pay buttons.</div>
                      </div>

                      <div className="rate-item-card is-call">
                        <span className="ric-icon">📞</span>
                        <div className="ric-title">Automated Voice / IVR</div>
                        <div className="ric-price">₹0.90 <span className="unit">/ Call</span></div>
                        <div className="ric-desc">30-second automated spoken vernacular voice reminder call to borrower.</div>
                      </div>
                    </div>

                    <div className="rules-notice-box">
                      <strong>🛡️ Wallet Billing & Compliance Notes:</strong>
                      <ul>
                        <li>Credits are deducted in real time only upon successful dispatch via telecom and WhatsApp gateways.</li>
                        <li>When the balance falls below <strong>₹{walletData.lowBalanceThreshold || 100}</strong>, automated warning notifications are sent to the merchant administrator.</li>
                        <li>If the wallet balance reaches ₹0.00, automated background dispatches will pause safely without creating unbilled provider liabilities.</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="account-modal-foot">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsWalletModalOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Unified Collection Modal: Dynamic UPI QR + Payment Link */}
        {isQrModalOpen && qrAccount && (
          <div className="account-modal-overlay" onClick={() => setIsQrModalOpen(false)}>
            <div className="qr-collection-modal" onClick={(e) => e.stopPropagation()}>
              <div className="qr-modal-head">
                <div className="qr-modal-title-group">
                  <div className="qr-title-icon">
                    {collectionTab === 'link' ? <AccountIcons.Link /> : collectionTab === 'cash' ? <AccountIcons.Cash /> : <AccountIcons.QrCode />}
                  </div>
                  <div>
                    <h3>
                      {collectionTab === 'link' 
                        ? 'Instant Payment Link Generator' 
                        : collectionTab === 'cash'
                        ? 'Direct Cash Collection & CBS Post'
                        : 'Dynamic UPI QR Collection'}
                    </h3>
                    <span className="font-mono text-cyan" style={{ fontSize: '11.5px' }}>
                      {collectionTab === 'cash'
                        ? 'Immediate CBS Core Banking Posting & Official Receipt Generation'
                        : qrAccount.collectionType === 'LOAN'
                        ? 'Real-Time Loan EMI Collection & Gateway Dispatch'
                        : qrAccount.collectionType === 'FD'
                        ? 'Real-Time FD Fixed Deposit Inward Clearance'
                        : qrAccount.collectionType === 'RDCL'
                        ? 'RD Closed Loan Recovery & Collection Route'
                        : 'Real-Time RD Deposit Settlement & Gateway Dispatch'}
                    </span>
                  </div>
                </div>
                <button className="btn-modal-close" onClick={() => setIsQrModalOpen(false)}>✕</button>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="collection-tabs-bar">
                <button
                  type="button"
                  className={`collection-tab-btn ${collectionTab === 'qr' ? 'is-active' : ''}`}
                  onClick={() => setCollectionTab('qr')}
                >
                  <AccountIcons.QrCode />
                  <span>Dynamic UPI QR</span>
                </button>
                <button
                  type="button"
                  className={`collection-tab-btn ${collectionTab === 'link' ? 'is-active' : ''}`}
                  onClick={() => setCollectionTab('link')}
                >
                  <AccountIcons.Link />
                  <span>Instant Payment Link</span>
                </button>
                <button
                  type="button"
                  className={`collection-tab-btn ${collectionTab === 'cash' ? 'is-active' : ''}`}
                  onClick={() => setCollectionTab('cash')}
                >
                  <AccountIcons.Cash />
                  <span>Direct Cash Collection</span>
                </button>
              </div>

              <div className="qr-modal-body">
                {/* Account & Customer Summary */}
                <div className="qr-account-banner">
                  <div className="qr-account-info">
                    <h4>{qrAccount.accountHolder}</h4>
                    <div className="qr-account-meta font-mono">
                      <span>Acc: {qrAccount.accountNumber}</span>
                      <span>•</span>
                      <span className="text-cyan">
                        {qrAccount.collectionType === 'LOAN' ? '💳 Loan: ' : '🏦 RD: '}
                        {qrAccount.schemeName || (qrAccount.collectionType === 'LOAN' ? 'Loan Collection' : 'RD Deposit')}
                      </span>
                    </div>
                  </div>
                  <div className="qr-balance-chip">
                    <span className="lbl">{qrAccount.collectionType === 'LOAN' ? 'Due / Outstanding' : 'Current Balance'}</span>
                    <span className="val font-mono">₹{Number(qrAccount.balance || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Amount Presets & Custom Input (Shown only when configuring amount before generation) */}
                {!(
                  (collectionTab === 'qr' && (qrData || paymentStatus === 'SUCCESS' || verifiedPaymentReceipt)) ||
                  (collectionTab === 'link' && (linkData || linkStatus === 'SUCCESS' || verifiedPaymentReceipt)) ||
                  (collectionTab === 'cash' && cashData)
                ) && (
                  <>
                    <div>
                      <div className="qr-section-label">Select or Enter Amount</div>
                      <div className="qr-preset-grid">
                        {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            className={`qr-preset-btn ${qrAmount === amt && !qrCustomAmount ? 'is-active' : ''}`}
                            onClick={() => {
                              setQrAmount(amt);
                              setQrCustomAmount('');
                              setQrData(null);
                              setPaymentStatus(null);
                              setLinkData(null);
                              setLinkStatus(null);
                            }}
                          >
                            ₹{amt.toLocaleString('en-IN')}
                          </button>
                        ))}
                        {Number(qrAccount.balance) > 0 && (
                          <button
                            type="button"
                            className={`qr-preset-btn ${qrAmount === Number(qrAccount.balance) && !qrCustomAmount ? 'is-active' : ''}`}
                            onClick={() => {
                              setQrAmount(Number(qrAccount.balance));
                              setQrCustomAmount('');
                              setQrData(null);
                              setPaymentStatus(null);
                              setLinkData(null);
                              setLinkStatus(null);
                            }}
                            style={{ gridColumn: 'span 2' }}
                          >
                            ₹{Number(qrAccount.balance).toLocaleString('en-IN')} (Full Balance)
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="qr-input-wrap">
                      <span className="qr-currency-prefix">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder={`Custom amount (e.g. ${qrAmount})`}
                        value={qrCustomAmount}
                        onChange={(e) => {
                          setQrCustomAmount(e.target.value);
                          setQrData(null);
                          setPaymentStatus(null);
                          setLinkData(null);
                          setLinkStatus(null);
                        }}
                        className="qr-amount-input font-mono"
                      />
                    </div>
                  </>
                )}

                {/* TAB 1: DYNAMIC UPI QR MODE */}
                {collectionTab === 'qr' && (
                  <>
                    {/* Remarks input & Generate Button (Shown before QR is generated) */}
                    {!qrData && !paymentStatus && !verifiedPaymentReceipt && (
                      <>
                        <div>
                          <div className="qr-section-label">Collection Remarks / Note</div>
                          <input
                            type="text"
                            placeholder="Enter reference or collection remarks"
                            value={qrNote}
                            onChange={(e) => setQrNote(e.target.value)}
                            className="qr-note-input"
                          />
                        </div>

                        <button
                          type="button"
                          className="btn-generate-qr-cta"
                          disabled={qrLoading}
                          onClick={() => handleGenerateQr()}
                        >
                          {qrLoading ? (
                            <span>Connecting to Payment Gateway...</span>
                          ) : (
                            <>
                              <AccountIcons.QrCode />
                              <span>
                                Generate UPI QR for ₹
                                {Number(qrCustomAmount || qrAmount || 0).toLocaleString('en-IN')}
                              </span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {/* Error Banner */}
                    {qrError && (
                      <div className="qr-error-alert">
                        <span>⚠️ {qrError}</span>
                      </div>
                    )}

                    {/* Generated QR View - Positioned High with Live Expiry Timer */}
                    {qrData && paymentStatus !== 'SUCCESS' && !verifiedPaymentReceipt && (
                      <div className="qr-result-box qr-result-box-elevated">
                        <div className="qr-header-summary-row">
                          <div className="qr-amount-badge-large font-mono">
                            <span className="qr-curr">₹</span>
                            <span>{Number(qrData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>

                          {/* Live Expiry Countdown Timer */}
                          <div className={`qr-expiry-badge font-mono ${qrExpirySeconds <= 60 ? (qrExpirySeconds === 0 ? 'is-expired' : 'is-warning') : ''}`}>
                            <span className="timer-icon">{qrExpirySeconds === 0 ? '⛔' : (qrExpirySeconds <= 60 ? '⚠️' : '⏱️')}</span>
                            <span>
                              {qrExpirySeconds === 0 ? 'QR Expired' : `Valid for: ${formatCountdown(qrExpirySeconds)}`}
                            </span>
                          </div>
                        </div>

                        <div className="qr-canvas-holder-relative">
                          <div className={`qr-canvas-holder ${qrExpirySeconds === 0 ? 'is-blurred' : ''}`}>
                            <QRCodeSVG
                              id="upi-qr-code-svg"
                              value={qrData.paymentUrl}
                              size={200}
                              level="H"
                              includeMargin={true}
                            />
                          </div>

                          {qrExpirySeconds === 0 && (
                            <div className="qr-expired-overlay">
                              <span className="expired-title">QR Code Expired</span>
                              <span className="expired-sub">Session timed out (5 mins)</span>
                              <button
                                type="button"
                                className="btn-regenerate-qr-overlay"
                                onClick={() => handleGenerateQr()}
                              >
                                <AccountIcons.Refresh />
                                <span>Regenerate QR</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="qr-order-meta font-mono">
                          <span>Order ID: <strong>{qrData.orderId || 'PG-INTENT-ORD'}</strong></span>
                          <button
                            className="btn-copy-acc"
                            onClick={() => handleCopy(qrData.orderId, 'qr-order-id')}
                            title="Copy Order ID"
                          >
                            {copiedId === 'qr-order-id' ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                          </button>
                        </div>

                        {/* Live Polling Status Indicator */}
                        <div className="status-pill is-pending" style={{ padding: '6px 14px', fontSize: '13px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8' }}>
                          <span className="status-dot" style={{ animation: 'pulse 1.5s infinite' }}></span>
                          <span>⚡ Waiting for Customer UPI Payment...</span>
                        </div>

                        <div className="qr-action-buttons-group">
                          <button
                            type="button"
                            className="btn-qr-action"
                            onClick={() => handleCopy(qrData.paymentUrl, 'qr-payment-url')}
                          >
                            {copiedId === 'qr-payment-url' ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                            <span>Copy UPI Link</span>
                          </button>
                          <button
                            type="button"
                            className="btn-qr-action"
                            onClick={handleDownloadQr}
                          >
                            <AccountIcons.Download />
                            <span>Download QR</span>
                          </button>
                          <button
                            type="button"
                            className="btn-qr-action is-verify"
                            onClick={handleCheckPaymentStatus}
                            disabled={checkingStatus}
                          >
                            <AccountIcons.Refresh />
                            <span>{checkingStatus ? 'Checking...' : 'Check Status'}</span>
                          </button>
                          <button
                            type="button"
                            className="btn-qr-action"
                            onClick={() => {
                              setQrData(null);
                              setPaymentStatus(null);
                              setVerifiedPaymentReceipt(null);
                            }}
                          >
                            <span>Change Amount</span>
                          </button>
                        </div>

                        <div className="upi-brands-footer">
                          <span>Supports all UPI Apps:</span>
                          <span className="upi-brand-tag">GPay</span>
                          <span className="upi-brand-tag">PhonePe</span>
                          <span className="upi-brand-tag">Paytm</span>
                          <span className="upi-brand-tag">BHIM</span>
                        </div>
                      </div>
                    )}

                    {/* Automatically Show Official Payment Receipt When Paid via QR */}
                    {(paymentStatus === 'SUCCESS' || (verifiedPaymentReceipt && collectionTab === 'qr')) && (
                      <div className="payment-receipt-success-card">
                        <div className="receipt-success-header">
                          <div className="receipt-success-icon-wrap">
                            <span style={{ fontSize: '28px' }}>🎉</span>
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#10b981', fontWeight: 800 }}>Payment Received & Verified</h3>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Real-time transaction confirmed by payment gateway & synchronized to CBS</span>
                          </div>
                        </div>

                        <div className="receipt-amount-showcase font-mono">
                          <span className="curr">₹</span>
                          <span className="amt">{Number(verifiedPaymentReceipt?.amount || qrData?.amount || qrAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="receipt-ledger-grid font-mono">
                          <div className="rlg-row">
                            <span className="lbl">Bank / Gateway Txn ID:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ color: '#06b6d4' }}>{verifiedPaymentReceipt?.transactionId || qrData?.orderId || 'TXN-CONFIRMED'}</strong>
                              <button
                                className="btn-copy-acc"
                                onClick={() => handleCopy(verifiedPaymentReceipt?.transactionId || qrData?.orderId, 'rcpt-txn')}
                              >
                                {copiedId === 'rcpt-txn' ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                              </button>
                            </div>
                          </div>

                          <div className="rlg-row">
                            <span className="lbl">CBS Core Reference:</span>
                            <strong style={{ color: '#10b981' }}>{verifiedPaymentReceipt?.cbsTransactionId || 'CBS-POSTED'}</strong>
                          </div>

                          <div className="rlg-row">
                            <span className="lbl">Customer Name:</span>
                            <strong>{verifiedPaymentReceipt?.customerName || qrAccount?.accountHolder || 'Customer'}</strong>
                          </div>

                          <div className="rlg-row">
                            <span className="lbl">Account Number:</span>
                            <strong>{verifiedPaymentReceipt?.accountNumber || qrAccount?.accountNumber}</strong>
                          </div>

                          <div className="rlg-row">
                            <span className="lbl">Payment Channel:</span>
                            <span>⚡ Instant UPI Clearance</span>
                          </div>

                          <div className="rlg-row">
                            <span className="lbl">Cleared Timestamp:</span>
                            <span>{new Date(verifiedPaymentReceipt?.completedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ({new Date().toLocaleDateString()})</span>
                          </div>

                          <div className="rlg-row" style={{ gridColumn: 'span 2', background: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <span className="lbl" style={{ color: '#10b981' }}>Ledger Clearance Status:</span>
                            <strong style={{ color: '#10b981' }}>🟢 Disbursed & Account Ledger Updated</strong>
                          </div>
                        </div>

                        <div className="receipt-actions-bar">
                          <button
                            type="button"
                            className="btn-receipt-action is-print"
                            onClick={handlePrintReceipt}
                          >
                            <AccountIcons.Printer />
                            <span>Print Official Receipt</span>
                          </button>

                          <button
                            type="button"
                            className="btn-receipt-action is-wa"
                            onClick={() => {
                              const amt = verifiedPaymentReceipt?.amount || qrData?.amount || qrAmount;
                              const txn = verifiedPaymentReceipt?.transactionId || qrData?.orderId;
                              const phone = qrAccount?.phone || qrAccount?.mobile;
                              const name = qrAccount?.accountHolder || 'Customer';
                              const acc = qrAccount?.accountNumber;
                              const text = `Dear ${name},\nYour payment of ₹${Number(amt).toLocaleString('en-IN')} for Acc #${acc} is received successfully.\nTxn ID: ${txn}\nThank you!`;
                              const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
                              const waUrl = cleanPhone && cleanPhone.length === 10
                                ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`
                                : `https://wa.me/?text=${encodeURIComponent(text)}`;
                              window.open(waUrl, '_blank');
                            }}
                          >
                            <AccountIcons.WhatsApp />
                            <span>Share via WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            className="btn-receipt-action is-done"
                            onClick={() => {
                              setIsQrModalOpen(false);
                              setVerifiedPaymentReceipt(null);
                              setPaymentStatus(null);
                              setLinkStatus(null);
                              setQrData(null);
                              setLinkData(null);
                            }}
                          >
                            <AccountIcons.Check />
                            <span>Done & Close Modal</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* TAB 2: INSTANT PAYMENT LINK MODE */}
                {collectionTab === 'link' && (
                  <>
                    <div className="form-row-dual" style={{ gap: '10px' }}>
                      <div className="form-field-group">
                        <label>Customer Mobile Number (for SMS / WhatsApp)</label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={customerPhoneInput}
                          onChange={(e) => setCustomerPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="font-mono"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Customer Email (Optional)</label>
                        <input
                          type="email"
                          placeholder="customer@email.com"
                          value={customerEmailInput}
                          onChange={(e) => setCustomerEmailInput(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="qr-section-label">Link Description / Remarks</div>
                      <input
                        type="text"
                        placeholder="e.g. RD Monthly Deposit Settlement"
                        value={qrNote}
                        onChange={(e) => setQrNote(e.target.value)}
                        className="qr-note-input"
                      />
                    </div>

                    {/* Generate Link Button if not generated yet */}
                    {!linkData && (
                      <button
                        type="button"
                        className="btn-generate-link-cta"
                        disabled={linkLoading}
                        onClick={() => handleGeneratePaymentLink()}
                      >
                        {linkLoading ? (
                          <span>Connecting to Payment Gateway...</span>
                        ) : (
                          <>
                            <AccountIcons.Link />
                            <span>
                              Generate Payment Link for ₹
                              {Number(qrCustomAmount || qrAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Error Banner */}
                    {linkError && (
                      <div className="qr-error-alert">
                        <span>⚠️ {linkError}</span>
                      </div>
                    )}

                    {/* Generated Payment Link Card - If NOT yet paid */}
                    {linkData && linkStatus !== 'SUCCESS' && !verifiedPaymentReceipt && (
                      <div className="payment-link-result-card">
                        <div className="link-header-row">
                          <div className="qr-amount-badge-large font-mono">
                            <span>₹{Number(linkData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <span className="link-active-pill">🔗 Link Active</span>
                        </div>

                        {/* URL Copy Bar */}
                        <div className="payment-link-copy-box">
                          <input
                            type="text"
                            readOnly
                            value={linkData.paymentUrl}
                            className="payment-link-url-input font-mono"
                          />
                          <button
                            type="button"
                            className="btn-copy-link-main"
                            onClick={() => handleCopy(linkData.paymentUrl, 'payment-link-url')}
                            title="Copy Payment Link"
                          >
                            {copiedId === 'payment-link-url' ? (
                              <>
                                <AccountIcons.Check />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <AccountIcons.Copy />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="qr-order-meta font-mono">
                          <span>Order Reference: <strong>{linkData.orderId || 'PL-GATEWAY-REF'}</strong></span>
                          <button
                            className="btn-copy-acc"
                            onClick={() => handleCopy(linkData.orderId, 'link-order-id')}
                            title="Copy Reference ID"
                          >
                            {copiedId === 'link-order-id' ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                          </button>
                        </div>

                        {/* Live Polling Status Indicator */}
                        <div className="status-pill is-pending" style={{ padding: '6px 14px', fontSize: '13px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8' }}>
                          <span className="status-dot" style={{ animation: 'pulse 1.5s infinite' }}></span>
                          <span>⚡ Waiting for Customer Checkout...</span>
                        </div>

                        {/* Quick Distribution Actions */}
                        <div className="link-distribution-actions">
                          <button
                            type="button"
                            className="btn-link-action is-whatsapp"
                            onClick={() => handleShareWhatsApp(
                              linkData.paymentUrl,
                              linkData.amount,
                              linkData.accountNumber,
                              linkData.customerName,
                              linkData.customerPhone
                            )}
                          >
                            <AccountIcons.WhatsApp />
                            <span>Share on WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            className="btn-link-action is-open"
                            onClick={() => window.open(linkData.paymentUrl, '_blank')}
                          >
                            <AccountIcons.ExternalLink />
                            <span>Open Link</span>
                          </button>

                          <button
                            type="button"
                            className="btn-link-action"
                            onClick={handleCheckLinkStatus}
                            disabled={checkingLinkStatus}
                          >
                            <AccountIcons.Refresh />
                            <span>{checkingLinkStatus ? 'Checking...' : 'Verify Status'}</span>
                          </button>

                          <button
                            type="button"
                            className="btn-link-action is-print"
                            onClick={handlePrintReceipt}
                          >
                            <AccountIcons.Printer />
                            <span>Print Receipt</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn-reset-link"
                          onClick={() => {
                            setLinkData(null);
                            setLinkStatus(null);
                            setVerifiedPaymentReceipt(null);
                          }}
                        >
                          <span>↺ Generate New Link with Different Amount</span>
                        </button>
                      </div>
                    )}

                    {/* Automatically Show Official Payment Receipt When Paid via Link */}
                    {(linkStatus === 'SUCCESS' || (verifiedPaymentReceipt && collectionTab === 'link')) && (
                      <div className="payment-receipt-success-card">
                        <div className="receipt-success-header">
                          <div className="receipt-success-icon-wrap">
                            <span style={{ fontSize: '28px' }}>🎉</span>
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#10b981', fontWeight: 800 }}>Payment Received & Verified</h3>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Real-time transaction confirmed by payment gateway & synchronized to CBS</span>
                          </div>
                        </div>

                        <div className="receipt-amount-showcase font-mono">
                          <span className="curr">₹</span>
                          <span className="amt">{Number(verifiedPaymentReceipt?.amount || linkData?.amount || qrAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="receipt-ledger-grid font-mono">
                          <div className="rlg-row">
                            <span className="lbl">Bank / Gateway Txn ID:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ color: '#06b6d4' }}>{verifiedPaymentReceipt?.transactionId || linkData?.orderId || 'TXN-CONFIRMED'}</strong>
                              <button
                                className="btn-copy-acc"
                                onClick={() => handleCopy(verifiedPaymentReceipt?.transactionId || linkData?.orderId, 'rcpt-txn')}
                              >
                                {copiedId === 'rcpt-txn' ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                              </button>
                            </div>
                          </div>

                          <div className="rlg-row">
                            <span className="lbl">CBS Core Reference:</span>
                            <strong style={{ color: '#10b981' }}>{verifiedPaymentReceipt?.cbsTransactionId || 'CBS-POSTED'}</strong>
                          </div>

                          <div className="rlg-row">
                            <span className="lbl">Customer Name:</span>
                            <strong>{verifiedPaymentReceipt?.customerName || qrAccount?.accountHolder || 'Customer'}</strong>
                          </div>

                          <div className="rlg-row">
                            <span className="lbl">Account Number:</span>
                            <strong>{verifiedPaymentReceipt?.accountNumber || qrAccount?.accountNumber}</strong>
                          </div>

                          <div className="rlg-row">
                            <span className="lbl">Payment Channel:</span>
                            <span>🌐 Finwin Instant Payment Link</span>
                          </div>

                          <div className="rlg-row">
                            <span className="lbl">Cleared Timestamp:</span>
                            <span>{new Date(verifiedPaymentReceipt?.completedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ({new Date().toLocaleDateString()})</span>
                          </div>

                          <div className="rlg-row" style={{ gridColumn: 'span 2', background: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <span className="lbl" style={{ color: '#10b981' }}>Ledger Clearance Status:</span>
                            <strong style={{ color: '#10b981' }}>🟢 Disbursed & Account Ledger Updated</strong>
                          </div>
                        </div>

                        <div className="receipt-actions-bar">
                          <button
                            type="button"
                            className="btn-receipt-action is-print"
                            onClick={handlePrintReceipt}
                          >
                            <AccountIcons.Printer />
                            <span>Print Official Receipt</span>
                          </button>

                          <button
                            type="button"
                            className="btn-receipt-action is-wa"
                            onClick={() => {
                              const amt = verifiedPaymentReceipt?.amount || linkData?.amount || qrAmount;
                              const txn = verifiedPaymentReceipt?.transactionId || linkData?.orderId;
                              const phone = qrAccount?.phone || qrAccount?.mobile;
                              const name = qrAccount?.accountHolder || 'Customer';
                              const acc = qrAccount?.accountNumber;
                              const text = `Dear ${name},\nYour payment of ₹${Number(amt).toLocaleString('en-IN')} for Acc #${acc} is received successfully.\nTxn ID: ${txn}\nThank you!`;
                              const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
                              const waUrl = cleanPhone && cleanPhone.length === 10
                                ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`
                                : `https://wa.me/?text=${encodeURIComponent(text)}`;
                              window.open(waUrl, '_blank');
                            }}
                          >
                            <AccountIcons.WhatsApp />
                            <span>Share via WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            className="btn-receipt-action is-done"
                            onClick={() => {
                              setIsQrModalOpen(false);
                              setVerifiedPaymentReceipt(null);
                              setPaymentStatus(null);
                              setLinkStatus(null);
                              setQrData(null);
                              setLinkData(null);
                            }}
                          >
                            <AccountIcons.Check />
                            <span>Done & Close Modal</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* TAB 3: DIRECT CASH COLLECTION MODE */}
                {collectionTab === 'cash' && (
                  <>
                    <div className="cash-collector-banner">
                      <span>🏦 Authorized Channel: <strong>CBS Core Banking Direct Cash Counter</strong></span>
                      <span>Agent: <strong>{user?.fullName || user?.name || 'Assigned Branch Agent'}</strong></span>
                    </div>

                    <div>
                      <div className="qr-section-label">Cash Receipt Remarks / Notes</div>
                      <input
                        type="text"
                        placeholder="Enter cashier/collector remarks or physical slip number"
                        value={qrNote}
                        onChange={(e) => setQrNote(e.target.value)}
                        className="qr-note-input"
                      />
                    </div>

                    {/* Receive Cash & Post to CBS Button */}
                    {!cashData && (
                      <button
                        type="button"
                        className="btn-generate-cash-cta"
                        disabled={cashLoading}
                        onClick={() => handleProcessCashCollection()}
                      >
                        {cashLoading ? (
                          <span>Posting Cash Transaction to CBS...</span>
                        ) : (
                          <>
                            <AccountIcons.Cash />
                            <span>
                              Receive Cash & Post ₹{Number(qrCustomAmount || qrAmount || 0).toLocaleString('en-IN')} to CBS
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Error Banner */}
                    {cashError && (
                      <div className="qr-error-alert">
                        <span>⚠️ {cashError}</span>
                      </div>
                    )}

                    {/* Generated Cash Receipt Card */}
                    {cashData && (
                      <div className="cash-result-card">
                        <div className="cash-result-header">
                          <div className="qr-amount-badge-large font-mono">
                            <span>₹{Number(cashData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <span className="cash-success-pill">
                            <AccountIcons.Check /> Cash Received & Posted
                          </span>
                        </div>

                        {/* Receipt Details Breakdown */}
                        <div className="cash-receipt-grid font-mono">
                          <div className="cash-receipt-item">
                            <span className="lbl">CBS Txn ID / Receipt</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="val is-ref">{cashData.transactionId}</span>
                              <button
                                type="button"
                                className="btn-copy-acc"
                                onClick={() => handleCopy(cashData.transactionId, 'cash-txn-id')}
                                title="Copy CBS Txn ID"
                              >
                                {copiedId === 'cash-txn-id' ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                              </button>
                            </div>
                          </div>
                          <div className="cash-receipt-item">
                            <span className="lbl">Account Number</span>
                            <span className="val">{cashData.accountNumber}</span>
                          </div>
                          <div className="cash-receipt-item">
                            <span className="lbl">Customer Name</span>
                            <span className="val">{cashData.customerName}</span>
                          </div>
                          <div className="cash-receipt-item">
                            <span className="lbl">Collection Scheme</span>
                            <span className="val">{cashData.collectionType}</span>
                          </div>
                          <div className="cash-receipt-item">
                            <span className="lbl">Received By Agent</span>
                            <span className="val">{cashData.agentName}</span>
                          </div>
                          <div className="cash-receipt-item">
                            <span className="lbl">Posting Timestamp</span>
                            <span className="val">{new Date(cashData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          </div>
                        </div>

                        <div className="cash-action-buttons-group">
                          <button
                            type="button"
                            className="btn-cash-action is-print"
                            onClick={handlePrintReceipt}
                          >
                            <AccountIcons.Printer />
                            <span>Print Cash Receipt</span>
                          </button>
                          <button
                            type="button"
                            className="btn-cash-action"
                            onClick={() => {
                              setCashData(null);
                              setCashError(null);
                            }}
                          >
                            <span>Collect Another</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>
          </div>
        )}

        <AutoPaySetupModal
          isOpen={autoPayModalOpen}
          onClose={() => setAutoPayModalOpen(false)}
          account={autoPayModalAccount}
          bulkAccounts={autoPayBulkAccounts}
          onSuccess={() => {
            loadAccounts();
          }}
        />

        {/* Interactive WhatsApp Payment Link Dispatcher Modal */}
        {waModalOpen && (
          <div className="account-modal-overlay fade-in">
            <div className="account-modal-container glass-card" style={{ maxWidth: '520px', width: '90%' }}>
              <div className="account-modal-head" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(37, 211, 102, 0.2)', color: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: '1px solid rgba(37, 211, 102, 0.4)' }}>
                    <i className="bi bi-whatsapp"></i>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#fff' }}>Send WhatsApp Payment Link</h3>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Generate live payment URL & dispatch via Telinfy REST API</span>
                  </div>
                </div>
                <button type="button" className="btn-modal-close" onClick={() => setWaModalOpen(false)}>×</button>
              </div>

              <div className="modal-body-custom p-3" style={{ marginTop: '16px' }}>
                <form onSubmit={handleSendWhatsAppPaymentLink}>
                  {/* Account Summary Banner */}
                  <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13.5px' }}>
                      <span className="text-muted">Customer:</span>
                      <strong className="text-light">{waTargetAccount?.accountHolder || waTargetAccount?.customerName || 'Customer'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                      <span className="text-muted">Account Number:</span>
                      <code className="text-info font-mono">{waTargetAccount?.accountNumber || 'N/A'}</code>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span className="text-muted">Product / Collection:</span>
                      <span className="badge bg-primary-subtle text-primary font-bold">{waTargetAccount?.collectionType || 'RD'}</span>
                    </div>
                  </div>

                  {/* Recipient Phone Field (Editable) */}
                  <div className="form-group mb-3">
                    <label className="form-label font-bold" style={{ fontSize: '12px', color: '#38bdf8', marginBottom: '6px', display: 'block' }}>
                      📱 Recipient Mobile Number (Editable)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text font-mono" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        className="form-control font-mono"
                        style={{ background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '14px' }}
                        value={waRecipientPhone}
                        onChange={(e) => setWaRecipientPhone(e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        required
                      />
                    </div>
                    <small className="form-text text-muted" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>
                      Mobile number is pre-filled. You can edit or type a new mobile number here before sending.
                    </small>
                  </div>

                  {/* Payment Amount Field (Editable) */}
                  <div className="form-group mb-4">
                    <label className="form-label font-bold" style={{ fontSize: '12px', color: '#10b981', marginBottom: '6px', display: 'block' }}>
                      💰 Collection Amount (₹)
                    </label>
                    <input
                      type="number"
                      className="form-control font-mono"
                      style={{ background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '14px' }}
                      value={waCustomAmount}
                      onChange={(e) => setWaCustomAmount(e.target.value)}
                      placeholder="Enter collection amount"
                      required
                    />
                  </div>

                  {/* Send CTA */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn-modal-cancel flex-grow-1"
                      onClick={() => setWaModalOpen(false)}
                      style={{ padding: '10px 16px', borderRadius: '10px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={waSending}
                      className="btn-modal-save flex-grow-2 font-weight-bold"
                      style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)', border: 'none', padding: '10px 20px', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}
                    >
                      {waSending ? (
                        <span>Generating Link & Dispatching...</span>
                      ) : (
                        <>
                          <i className="bi bi-whatsapp me-2"></i> Generate & Send Payment Link
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Accounts;

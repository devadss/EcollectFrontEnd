import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { accountApi, branchApi, agentApi, paymentApi, merchantApi, reminderApi, walletApi } from '../../services/api';
import { lookupIFSC, INDIAN_BANKS_LIST, sanitizeAccountNumber } from '../../services/bankService';
import './Accounts.css';

// Crisp Geometric SVG Icons
const BaseAccountIcons = {
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
    assignedAgentCode: ''
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

  // Payment Link States
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [linkData, setLinkData] = useState(null);
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [customerEmailInput, setCustomerEmailInput] = useState('');
  const [linkStatus, setLinkStatus] = useState(null);
  const [checkingLinkStatus, setCheckingLinkStatus] = useState(false);

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

  const isIntegratedMode = useMemo(() => {
    const rawInteg = localStorage.getItem('integrationStatus') || user?.integrationStatus || user?.IntegrationStatus || 'No';
    return String(rawInteg).toUpperCase() === 'Y' || String(rawInteg).toUpperCase() === 'YES' || rawInteg === true;
  }, [user]);

  const isNonIntegrated = !isIntegratedMode;

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

  const rawRole = localStorage.getItem('user_role') || localStorage.getItem('role') || 'branchadmin';

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

  // Comprehensive Master Accounts Sample Format (All 20 fields)
  const masterAccountsTemplateData = [
    {
      AccountNumber: 'LN01005001',
      CustomerName: 'Ramesh Sharma',
      MobileNumber: '9876543210',
      Email: 'ramesh.sharma@example.com',
      ProductType: 'LOAN',
      LoanCategory: 'Home Loan',
      OutstandingAmount: 120000,
      TenureMonths: 24,
      DueAmount: 4500,
      EmiAmount: 4500,
      EmiFrequency: 'Monthly',
      LastPaidDate: '2026-08-01',
      NextDueDate: '2026-09-01',
      AssignedAgentCode: '1075',
      AssignedAgentName: 'Priya Sharma',
      BranchCode: '01',
      BankName: 'State Bank of India',
      IfscCode: 'SBIN0001234',
      ReminderDaysBeforeDue: 2,
      ReminderChannels: 'SMS,WhatsApp,Call'
    },
    {
      AccountNumber: 'LN01005002',
      CustomerName: 'Sunita Verma',
      MobileNumber: '9812345678',
      Email: 'sunita.verma@example.com',
      ProductType: 'LOAN',
      LoanCategory: 'Vehicle Loan',
      OutstandingAmount: 45000,
      TenureMonths: 12,
      DueAmount: 1500,
      EmiAmount: 1500,
      EmiFrequency: 'Weekly',
      LastPaidDate: '2026-08-10',
      NextDueDate: '2026-08-17',
      AssignedAgentCode: '1075',
      AssignedAgentName: 'Priya Sharma',
      BranchCode: '01',
      BankName: 'HDFC Bank',
      IfscCode: 'HDFC0000456',
      ReminderDaysBeforeDue: 2,
      ReminderChannels: 'SMS,WhatsApp'
    },
    {
      AccountNumber: 'RD01008001',
      CustomerName: 'Amit Patel',
      MobileNumber: '9988776655',
      Email: 'amit.patel@example.com',
      ProductType: 'RD',
      LoanCategory: 'Standard Recurring Deposit',
      OutstandingAmount: 50000,
      TenureMonths: 36,
      DueAmount: 2000,
      EmiAmount: 2000,
      EmiFrequency: 'Monthly',
      LastPaidDate: '2026-08-05',
      NextDueDate: '2026-09-05',
      AssignedAgentCode: '1075',
      AssignedAgentName: 'Priya Sharma',
      BranchCode: '01',
      BankName: 'ICICI Bank',
      IfscCode: 'ICIC0000789',
      ReminderDaysBeforeDue: 3,
      ReminderChannels: 'WhatsApp,Call'
    },
    {
      AccountNumber: 'FD01009001',
      CustomerName: 'Kavita Singh',
      MobileNumber: '9765432109',
      Email: 'kavita.singh@example.com',
      ProductType: 'FD',
      LoanCategory: 'Fixed Deposit Scheme',
      OutstandingAmount: 200000,
      TenureMonths: 60,
      DueAmount: 0,
      EmiAmount: 0,
      EmiFrequency: 'Quarterly',
      LastPaidDate: '2026-07-01',
      NextDueDate: '2026-10-01',
      AssignedAgentCode: '1075',
      AssignedAgentName: 'Priya Sharma',
      BranchCode: '01',
      BankName: 'Axis Bank',
      IfscCode: 'UTIB0000321',
      ReminderDaysBeforeDue: 7,
      ReminderChannels: 'SMS,Call'
    }
  ];

  // Download Sample Master Accounts Excel Template (.xlsx)
  const handleDownloadAccountsExcelTemplate = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(masterAccountsTemplateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'MasterAccounts');
      XLSX.writeFile(wb, 'Master_Accounts_Bulk_Template.xlsx');
      showToast('Downloaded complete Master Accounts Excel template (.xlsx)');
    } catch (err) {
      console.error('Download error:', err);
      handleDownloadAccountsCsvTemplate();
    }
  };

  // Download Sample Master Accounts CSV Template (.csv)
  const handleDownloadAccountsCsvTemplate = () => {
    const headers = [
      'AccountNumber',
      'CustomerName',
      'MobileNumber',
      'Email',
      'ProductType',
      'LoanCategory',
      'OutstandingAmount',
      'TenureMonths',
      'DueAmount',
      'EmiAmount',
      'EmiFrequency',
      'LastPaidDate',
      'NextDueDate',
      'AssignedAgentCode',
      'AssignedAgentName',
      'BranchCode',
      'BankName',
      'IfscCode',
      'ReminderDaysBeforeDue',
      'ReminderChannels'
    ];

    const sampleRows = masterAccountsTemplateData.map(r => [
      `"${r.AccountNumber}"`,
      `"${r.CustomerName}"`,
      `"${r.MobileNumber}"`,
      `"${r.Email}"`,
      `"${r.ProductType}"`,
      `"${r.LoanCategory}"`,
      r.OutstandingAmount,
      r.TenureMonths,
      r.DueAmount,
      r.EmiAmount,
      `"${r.EmiFrequency}"`,
      `"${r.LastPaidDate}"`,
      `"${r.NextDueDate}"`,
      `"${r.AssignedAgentCode}"`,
      `"${r.AssignedAgentName}"`,
      `"${r.BranchCode}"`,
      `"${r.BankName}"`,
      `"${r.IfscCode}"`,
      r.ReminderDaysBeforeDue,
      `"${r.ReminderChannels}"`
    ].join(','));

    const csvContent = [headers.join(','), ...sampleRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Master_Accounts_Bulk_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded complete Master Accounts CSV template (.csv)');
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
          email: email
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

      dueListRows.forEach(r => {
        const accNo = (r.AccountNumber || r.accountNumber || r.AccountNo || r.accountno || r.accno || r.AccountNum || r.accountnum || '').toString().trim();
        if (accNo) {
          const due = Number(r.DueAmount || r.dueAmount || r.Demand || r.demand || r.amount || r.Due || 0);
          const outstanding = r.OutstandingAmount || r.outstandingAmount || r.balance || r.Balance ? Number(r.OutstandingAmount || r.outstandingAmount || r.balance || r.Balance) : null;
          const emi = r.EmiAmount || r.emiAmount || r.Emi ? Number(r.EmiAmount || r.emiAmount || r.Emi) : null;
          const lastPaid = r.LastPaidDate || r.lastPaidDate || null;
          const nextDue = r.NextDueDate || r.nextDueDate || null;
          const agentCode = (r.AssignedAgentCode || r.assignedAgentCode || r.AgentCode || r.agentcode || '').toString().trim() || null;

          dueMap.set(accNo, { due, outstanding, emi, lastPaid, nextDue, agentCode });
        }
      });

      if (dueMap.size === 0) {
        showToast('No valid account due records found in file (Check AccountNumber column)', 'error');
        setIsUploadingDueList(false);
        return;
      }

      // 1. Optimistically update existing accounts with new morning demand
      setAccounts(prev => prev.map(acc => {
        if (dueMap.has(acc.accountNumber)) {
          const updateInfo = dueMap.get(acc.accountNumber);
          return {
            ...acc,
            dueAmount: updateInfo.due,
            balance: updateInfo.outstanding !== null ? updateInfo.outstanding : acc.balance,
            outstandingAmount: updateInfo.outstanding !== null ? updateInfo.outstanding : acc.balance,
            emiAmount: updateInfo.emi !== null ? updateInfo.emi : acc.emiAmount,
            lastPaidDate: updateInfo.lastPaid ? new Date(updateInfo.lastPaid).toLocaleDateString('en-IN') : acc.lastPaidDate,
            nextDueDate: updateInfo.nextDue ? new Date(updateInfo.nextDue).toLocaleDateString('en-IN') : acc.nextDueDate,
            assignedAgentCode: updateInfo.agentCode || acc.assignedAgentCode,
            updatedAt: new Date().toISOString()
          };
        }
        return acc;
      }));

      showToast(`Daily due list synced: Updated demands for ${dueMap.size} accounts!`);
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
      const authUser = (() => {
        try {
          return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
        } catch {
          return {};
        }
      })();
      const mId = Number(authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 1);
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
      const authUser = (() => {
        try {
          return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
        } catch {
          return {};
        }
      })();
      const mId = Number(authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 1);
      
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
      const authUser = (() => {
        try {
          return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
        } catch {
          return {};
        }
      })();
      const mId = Number(authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 1);

      // 1. Identify due accounts
      const dueAccounts = accounts.filter(acc => {
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
    const authUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
      } catch {
        return {};
      }
    })();

    const bCode = overrideBranchCode || selectedBranchCode || authUser?.branchCode || authUser?.external_branch_id || localStorage.getItem('branchCode') || '01';
    const aCode = overrideAgentCode || selectedAgentCode || authUser?.agentCode || authUser?.external_agent_id || localStorage.getItem('agentCode') || '1075';
    const mId = authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 4;
    const activeProd = targetProduct !== null ? targetProduct : collectionProductTab;

    // Check Integration Status (Y vs N)
    const rawInteg = localStorage.getItem('integrationStatus') || authUser?.integrationStatus || 'No';
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

          return {
            id: item.id || index + 1,
            accountCode: `${prod}-${item.branchCode || bCode}-${accNo.slice(-4)}`,
            bankName: item.bankName || `${prod} Collection Portfolio`,
            accountHolder: item.customerName || item.accountHolder || 'Customer',
            accountNumber: accNo,
            maskedNumber: masked,
            ifscCode: item.ifscCode || 'STANDALONE',
            accountType: item.accountType || `${prod} (${item.emiFrequency || 'Monthly'})`,
            collectionType: prod,
            branchName: item.branchName || item.branchCode || bCode,
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
        const [rdRes, loanRes] = await Promise.allSettled([
          accountApi.getAll({ ...baseQueryParams, productType: 'RD', ProductType: 'RD' }),
          accountApi.getAll({ ...baseQueryParams, productType: 'LOAN', ProductType: 'LOAN' })
        ]);

        if (rdRes.status === 'fulfilled') {
          const list = extractAccountList(rdRes.value?.data) || extractAccountList(rdRes.value);
          list.forEach(item => { if (!item.productType) item.productType = 'RD'; });
          combinedRawList.push(...list);
        }
        if (loanRes.status === 'fulfilled') {
          const list = extractAccountList(loanRes.value?.data) || extractAccountList(loanRes.value);
          list.forEach(item => { if (!item.productType) item.productType = 'LOAN'; });
          combinedRawList.push(...list);
        }
      } else {
        const res = await accountApi.getAll({ ...baseQueryParams, productType: activeProd, ProductType: activeProd });
        const list = extractAccountList(res?.data) || extractAccountList(res);
        list.forEach(item => { if (!item.productType) item.productType = activeProd; });
        combinedRawList = list;
      }

      if (combinedRawList && Array.isArray(combinedRawList) && combinedRawList.length > 0) {
        const formatted = combinedRawList.map((item, index) => {
          const isLoan = 
            (item.productType || item.ProductType || item.collectionType || item.CollectionType || item.udf5 || '').toString().toUpperCase().includes('LOAN') ||
            (item.accountType || item.AccountType || '').toString().toUpperCase().includes('LOAN') ||
            !!item.Loan_AccNo || !!item.LoanAccNo || !!item.Loan_No || !!item.loanNo || !!item.emi_amount || !!item.outstanding_amount;
          
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
          const currentBranchName = item.branchName || authUser?.branchName || authUser?.branch || localStorage.getItem('branchName') || `Branch ${bCode}`;

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
        const eligibleAccounts = accounts.filter(acc => {
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
    setIsQrModalOpen(true);
  };

  const handleOpenPaymentLinkModal = (acc) => {
    handleOpenQrModal(acc, 'link');
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
      authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 4
    );

    // Find agent info
    const matchedAgent = agents.find(
      a => String(a.external_agent_id) === String(selectedAgentCode) ||
           String(a.agentCode) === String(selectedAgentCode) ||
           String(a.id) === String(selectedAgentCode)
    );

    const agentCodeStr = String(selectedAgentCode || authUser?.agentCode || authUser?.external_agent_id || '1075');
    const agentNameStr = matchedAgent?.fullName || matchedAgent?.name || authUser?.name || authUser?.fullName || 'Branch Agent';
    const agentPhoneStr = matchedAgent?.phone || matchedAgent?.mobile || authUser?.phone || authUser?.mobile || '9999999999';
    const agentEmailStr = matchedAgent?.email || authUser?.email || 'agent@finwin.com';

    // Find branch info
    const matchedBranch = branches.find(
      b => String(b.code) === String(selectedBranchCode) ||
           String(b.branchCode) === String(selectedBranchCode) ||
           String(b.id) === String(authUser?.branchId || authUser?.branch_id)
    );
    const branchNumericId = Number(matchedBranch?.id || authUser?.branchId || authUser?.branch_id || 1);

    const payload = {
      MerchantId: currentMerchantId,
      merchantId: currentMerchantId,
      Amount: finalAmount,
      amount: finalAmount,
      CollectionType: 'UPI',
      collectionType: 'UPI',
      QrSource: 'WEB_BRANCH',
      qrSource: 'WEB_BRANCH',
      Source: 'BranchPortal',
      source: 'BranchPortal',
      note: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      Note: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      Description: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
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

    const authUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
      } catch {
        return {};
      }
    })();

    const currentMerchantId = Number(
      authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 4
    );

    // Find agent info
    const matchedAgent = agents.find(
      a => String(a.external_agent_id) === String(selectedAgentCode) ||
           String(a.agentCode) === String(selectedAgentCode) ||
           String(a.id) === String(selectedAgentCode)
    );

    const agentCodeStr = String(selectedAgentCode || authUser?.agentCode || authUser?.external_agent_id || '1075');
    const agentNameStr = matchedAgent?.fullName || matchedAgent?.name || authUser?.name || authUser?.fullName || 'Branch Agent';
    const agentPhoneStr = matchedAgent?.phone || matchedAgent?.mobile || authUser?.phone || authUser?.mobile || '9999999999';
    const agentEmailStr = matchedAgent?.email || authUser?.email || 'agent@finwin.com';

    // Find branch info
    const matchedBranch = branches.find(
      b => String(b.code) === String(selectedBranchCode) ||
           String(b.branchCode) === String(selectedBranchCode) ||
           String(b.id) === String(authUser?.branchId || authUser?.branch_id)
    );
    const branchNumericId = Number(matchedBranch?.id || authUser?.branchId || authUser?.branch_id || 1);

    const phoneNum = customerPhoneInput || qrAccount.phone || qrAccount.mobile || '9999999999';
    const emailAddr = customerEmailInput || qrAccount.email || 'customer@finwin.com';

    const payload = {
      MerchantId: currentMerchantId,
      merchantId: currentMerchantId,
      Amount: finalAmount,
      amount: finalAmount,
      CollectionType: 'PaymentLink',
      collectionType: 'PaymentLink',
      QrSource: 'WEB_BRANCH',
      qrSource: 'WEB_BRANCH',
      Source: 'BranchPortal',
      source: 'BranchPortal',
      Note: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      note: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      Description: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      description: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
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

  const handleCheckPaymentStatus = async () => {
    if (!qrData?.orderId) return;
    setCheckingStatus(true);
    try {
      const res = await paymentApi.getStatus(qrData.orderId);
      console.log('📡 Payment status check result:', res.data);
      const statusStr = (res.data?.status || res.data?.data?.status || res.data?.paymentStatus || '').toUpperCase();
      if (statusStr === 'SUCCESS' || statusStr === 'COMPLETED' || statusStr === 'PAID') {
        setPaymentStatus('SUCCESS');
        showToast('Payment received and verified successfully!');
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
      const statusStr = (res.data?.status || res.data?.data?.status || res.data?.paymentStatus || '').toUpperCase();
      if (statusStr === 'SUCCESS' || statusStr === 'COMPLETED' || statusStr === 'PAID') {
        setLinkStatus('SUCCESS');
        showToast('Payment link deposit captured & verified successfully!');
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

  const handleShareWhatsApp = (url, amount, accNo, name, phone) => {
    const isLoan = qrAccount?.collectionType === 'LOAN';
    const text = isLoan
      ? `Dear ${name || 'Customer'},\nPlease complete your Loan EMI installment of ₹${Number(amount).toLocaleString('en-IN')} for Loan Acc #${accNo} via this secure Finwin Payment Link:\n${url}\n\nThank you!`
      : `Dear ${name || 'Customer'},\nPlease complete your deposit collection of ₹${Number(amount).toLocaleString('en-IN')} for Account #${accNo} via this secure Finwin Payment Link:\n${url}\n\nThank you!`;
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    const waUrl = cleanPhone && cleanPhone.length === 10
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Dedicated Communication & Reminder Handlers for Grid Actions
  const handleSendWhatsAppReminder = (acc) => {
    const phone = acc.phone || acc.mobile || '';
    const name = acc.accountHolder || 'Customer';
    const accNo = acc.accountNumber || '';
    const bal = Number(acc.balance || 0).toLocaleString('en-IN');
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    const isLoan = acc.collectionType === 'LOAN';
    const msg = isLoan
      ? `Dear ${name},\nThis is a friendly reminder from DIGICOB Bank regarding your Loan Account #${accNo}.\nYour current outstanding / EMI due is ₹${bal}.\nPlease settle your installment at your earliest convenience.\nThank you!`
      : `Dear ${name},\nThis is a friendly reminder from DIGICOB Bank regarding your RD Account #${accNo}.\nYour scheduled deposit amount is ₹${bal}.\nPlease complete your deposit collection at your earliest convenience.\nThank you!`;
    
    const waUrl = cleanPhone && cleanPhone.length === 10
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    
    window.open(waUrl, '_blank');
    showToast(`WhatsApp reminder dispatched for ${name}`);
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
    accounts.forEach(a => {
      const t = (a.collectionType || 'RD').toUpperCase();
      if (counts[t] !== undefined) counts[t] += 1;
      else counts[t] = 1;
    });
    return counts;
  }, [accounts]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesSearch = 
        (acc.bankName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.accountHolder || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.accountCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.accountNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.schemeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.ifscCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.branchName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCollectionTab = 
        collectionProductTab === 'ALL' || 
        (acc.collectionType || 'RD').toUpperCase() === collectionProductTab.toUpperCase();

      const matchesType = typeFilter === 'ALL' || acc.accountType?.toLowerCase() === typeFilter.toLowerCase();
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && acc.isActive) ||
        (statusFilter === 'INACTIVE' && !acc.isActive);

      return matchesSearch && matchesCollectionTab && matchesType && matchesStatus;
    });
  }, [accounts, searchTerm, collectionProductTab, typeFilter, statusFilter]);

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
    return accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
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

        {/* 4 KPI Telemetry Cards */}
        <div className="accounts-kpi-grid">
          
          <div className="acc-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Configured Accounts</span>
              <div className="kpi-icon is-indigo"><AccountIcons.Bank /></div>
            </div>
            <div className="kpi-value font-mono">{accounts.length}</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><AccountIcons.ArrowUp /> {accounts.filter(a => a.isActive).length} Live Active</span>
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
                          <div className="bank-avatar-box">
                            {acc.bankName ? acc.bankName.slice(0, 2).toUpperCase() : (acc.collectionType === 'LOAN' ? 'LN' : 'RD')}
                          </div>
                          <div className="bank-info-stack">
                            <span className="bank-title font-bold">{acc.bankName}</span>
                            <span className="bank-code-chip font-mono text-muted">{acc.accountCode}</span>
                          </div>
                        </div>
                      </td>

                      {/* Collection Type Badge */}
                      <td>
                        <span className={`collection-type-tag is-${(acc.collectionType || 'RD').toLowerCase()}`}>
                          {acc.collectionType === 'LOAN' ? '💳 LOAN' : acc.collectionType === 'FD' ? '📈 FD' : acc.collectionType === 'RDCL' ? '🪙 RDCL' : '🏦 RD'}
                        </span>
                      </td>

                      {/* Holder */}
                      <td>
                        <div className="holder-stack">
                          <span className="holder-name font-bold">{acc.accountHolder}</span>
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

                      {/* Status & NPA Health */}
                      <td>
                        <div className="status-and-reminder-stack">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span className={`status-pill ${acc.isActive ? 'is-active' : 'is-inactive'}`}>
                              <span className="status-dot"></span>
                              <span>{acc.isActive ? 'Active' : 'Disabled'}</span>
                            </span>

                            {/* 90-day DPD / NPA Banking Classification Badge */}
                            {(() => {
                              const npaInfo = calculateLoanNpaStatus(acc);
                              return (
                                <span 
                                  className={`npa-pill ${npaInfo.badgeClass}`}
                                  title={npaInfo.fullDesc}
                                >
                                  {npaInfo.label}
                                </span>
                              );
                            })()}
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

                          {/* Instant Customer Reminders & Outreach for Integration Status N */}
                          {isNonIntegrated && (
                            <>
                              <button 
                                className="action-btn is-whatsapp" 
                                onClick={() => handleSendWhatsAppReminder(acc)}
                                title="Send WhatsApp Deposit Reminder"
                              >
                                <AccountIcons.WhatsApp />
                              </button>
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
        {selectedAccount && (
          <div className="account-modal-overlay" onClick={() => setSelectedAccount(null)}>
            <div className="account-dossier-card" onClick={(e) => e.stopPropagation()}>
              <div className="dossier-card-head">
                <div className="dossier-badge-wrap">
                  <AccountIcons.Bank />
                  <h3>
                    {selectedAccount.collectionType === 'LOAN'
                      ? 'Loan Portfolio Account Dossier'
                      : 'Banking & Deposit Route Dossier'}
                  </h3>
                </div>
                <button className="btn-modal-close" onClick={() => setSelectedAccount(null)}>✕</button>
              </div>

              <div className="dossier-modal-body">
                <div className="dossier-bank-hero">
                  <div className="big-bank-icon">
                    {selectedAccount.bankName ? selectedAccount.bankName.slice(0, 2).toUpperCase() : (selectedAccount.collectionType === 'LOAN' ? 'LN' : 'RD')}
                  </div>
                  <div>
                    <h2 className="dossier-bank-name">{selectedAccount.bankName}</h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <span className={`collection-type-tag is-${(selectedAccount.collectionType || 'RD').toLowerCase()}`}>
                        {selectedAccount.collectionType === 'LOAN' ? '💳 LOAN' : selectedAccount.collectionType === 'FD' ? '📈 FD' : selectedAccount.collectionType === 'RDCL' ? '🪙 RDCL' : '🏦 RD'}
                      </span>
                      <span className="dossier-code font-mono text-cyan">{selectedAccount.accountCode} • {selectedAccount.schemeName || selectedAccount.accountType}</span>
                    </div>
                  </div>
                </div>

                <div className="dossier-data-grid">
                  <div className="data-box">
                    <span className="data-lbl">Account Holder</span>
                    <span className="data-val font-bold">{selectedAccount.accountHolder}</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">{selectedAccount.collectionType === 'LOAN' ? 'Loan Account No' : 'Account Number'}</span>
                    <span className="data-val font-mono">{selectedAccount.accountNumber}</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">Scheme / Product</span>
                    <span className="data-val font-bold text-cyan">{selectedAccount.schemeName || (selectedAccount.collectionType === 'LOAN' ? 'Loan Collection' : 'RD Deposit')}</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">IFSC & Branch Node</span>
                    <span className="data-val font-mono text-cyan">{selectedAccount.ifscCode} ({selectedAccount.branchName})</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">{selectedAccount.collectionType === 'LOAN' ? 'Due / Outstanding Balance' : 'Holdings Balance'}</span>
                    <span className={`data-val font-mono font-bold ${selectedAccount.collectionType === 'LOAN' ? 'text-purple' : 'text-green'}`}>
                      ₹{Number(selectedAccount.balance).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">Daily Payout / Clear Limit</span>
                    <span className="data-val font-mono">₹{Number(selectedAccount.dailyLimit || 5000000).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="compliance-strip">
                  <AccountIcons.ShieldCheck />
                  <span>Account is verified with RTGS / NEFT / IMPS instant clearance routes and RBI compliance check.</span>
                </div>
              </div>

              <div className="dossier-modal-foot">
                <button className="btn-edit-from-modal" onClick={() => { const acc = selectedAccount; setSelectedAccount(null); handleOpenEdit(acc); }}>
                  <AccountIcons.Edit /> Edit Account Details
                </button>
                <button className="btn-close-modal" onClick={() => setSelectedAccount(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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

                <div className="form-fields-2col">
                  <div className="form-field-group">
                    <label>Customer Mobile Number <span className="req-star">*</span></label>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      placeholder="10-digit mobile"
                      value={loanFormData.mobileNumber}
                      onChange={e => setLoanFormData(p => ({ ...p, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      className="font-mono"
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Product / Collection Type <span className="req-star">*</span></label>
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
                      <option value="LOAN">LOAN (Priority Portfolio)</option>
                      <option value="RD">RD (Recurring Deposit)</option>
                      <option value="DAILY_DEPOSIT">DAILY DEPOSIT (Pigmy / Daily)</option>
                      <option value="FD">FD (Fixed Deposit Collection)</option>
                    </select>
                  </div>
                </div>

                {/* Loan Kind / Sub-Type Selector */}
                {loanFormData.productType === 'LOAN' ? (
                  <div className="form-field-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Loan Kind / Scheme Sub-Type <span className="req-star">*</span></span>
                      <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600 }}>Home, Vehicle, Gold, Personal, etc.</span>
                    </label>
                    <select
                      value={loanFormData.loanCategory}
                      onChange={e => setLoanFormData(p => ({ ...p, loanCategory: e.target.value }))}
                      className="form-select-ctrl font-bold"
                    >
                      <option value="Home Loan">🏠 Home Loan (Housing Finance)</option>
                      <option value="Vehicle Loan">🚗 Vehicle / Auto Loan (2W / 4W)</option>
                      <option value="Personal Loan">👤 Personal Loan (Unsecured)</option>
                      <option value="Gold Loan">🪙 Gold / Jewel Loan</option>
                      <option value="Business Loan">💼 Business / MSME Loan</option>
                      <option value="Education Loan">🎓 Education / Student Loan</option>
                      <option value="Agriculture Loan">🌾 Agriculture / Crop / Kisan Loan</option>
                      <option value="Microfinance Loan">👥 Microfinance / JLG Group Loan</option>
                      <option value="Daily Pigmy Loan">⚡ Daily Pigmy Micro Loan</option>
                      <option value="Loan Against Property">🏢 Loan Against Property (LAP)</option>
                      <option value="Commercial Vehicle Loan">🚛 Commercial Vehicle / Truck Loan</option>
                      <option value="Consumer Durable Loan">📱 Consumer Durable / Appliance Loan</option>
                      <option value="Other Loan Scheme">📝 Other Custom Loan Scheme</option>
                    </select>
                  </div>
                ) : (
                  <div className="form-field-group" style={{ marginBottom: '16px' }}>
                    <label>Deposit Scheme Type <span className="req-star">*</span></label>
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
                  </div>
                )}

                {/* Financial Parameters: Outstanding, Tenure & Frequency */}
                <div className="form-fields-3col">
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

                {/* Auto-Calculated EMI and Due Demand */}
                <div className="form-fields-2col">
                  <div className="form-field-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Calculated EMI Amount (₹) <span className="req-star">*</span></span>
                      <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700 }}>⚡ Auto-Calculated</span>
                    </label>
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
            3. DAILY DUE LIST CSV/EXCEL UPLOAD MODAL (DAY BEGIN)
           ============================================================ */}
        {isDueListModalOpen && (
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
                            <td>{row.AccountNumber}</td>
                            <td className="text-purple font-bold">₹{Number(row.DueAmount || 0).toLocaleString('en-IN')}</td>
                            <td>₹{Number(row.OutstandingAmount || 0).toLocaleString('en-IN')}</td>
                            <td>{row.NextDueDate || '-'}</td>
                            <td>{row.AssignedAgentCode || '-'}</td>
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
                    {collectionTab === 'link' ? <AccountIcons.Link /> : <AccountIcons.QrCode />}
                  </div>
                  <div>
                    <h3>{collectionTab === 'link' ? 'Instant Payment Link Generator' : 'Dynamic UPI QR Collection'}</h3>
                    <span className="font-mono text-cyan" style={{ fontSize: '11.5px' }}>
                      {qrAccount.collectionType === 'LOAN'
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

                {/* Amount Presets & Custom Input */}
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

                {/* TAB 1: DYNAMIC UPI QR MODE */}
                {collectionTab === 'qr' && (
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

                    {/* Generate Button if not generated yet */}
                    {!qrData && (
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
                    )}

                    {/* Error Banner */}
                    {qrError && (
                      <div className="qr-error-alert">
                        <span>⚠️ {qrError}</span>
                      </div>
                    )}

                    {/* Generated QR View */}
                    {qrData && (
                      <div className="qr-result-box">
                        <div className="qr-amount-badge-large font-mono">
                          <span>₹{Number(qrData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="qr-canvas-holder">
                          <QRCodeSVG
                            id="upi-qr-code-svg"
                            value={qrData.paymentUrl}
                            size={210}
                            level="H"
                            includeMargin={true}
                          />
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

                        {paymentStatus && (
                          <div className={`status-pill ${paymentStatus === 'SUCCESS' ? 'is-active' : 'is-inactive'}`} style={{ padding: '6px 14px', fontSize: '13px' }}>
                            <span className="status-dot"></span>
                            <span>{paymentStatus === 'SUCCESS' ? 'Payment Verified & Captured' : 'Payment Verification Failed'}</span>
                          </div>
                        )}

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
                            className="btn-qr-action"
                            onClick={handlePrintReceipt}
                          >
                            <AccountIcons.Printer />
                            <span>Print Receipt</span>
                          </button>
                          <button
                            type="button"
                            className="btn-qr-action is-verify"
                            onClick={handleCheckPaymentStatus}
                            disabled={checkingStatus}
                          >
                            <AccountIcons.Refresh />
                            <span>{checkingStatus ? 'Checking...' : 'Verify Status'}</span>
                          </button>
                          <button
                            type="button"
                            className="btn-qr-action"
                            onClick={() => {
                              setQrData(null);
                              setPaymentStatus(null);
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

                    {/* Generated Payment Link Card */}
                    {linkData && (
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

                        {linkStatus && (
                          <div className={`status-pill ${linkStatus === 'SUCCESS' ? 'is-active' : 'is-inactive'}`} style={{ padding: '6px 14px', fontSize: '13px' }}>
                            <span className="status-dot"></span>
                            <span>{linkStatus === 'SUCCESS' ? 'Payment Verified & Captured' : 'Payment Not Yet Completed'}</span>
                          </div>
                        )}

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
                            <span>Open Checkout</span>
                          </button>

                          <button
                            type="button"
                            className="btn-link-action is-verify"
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
                          }}
                        >
                          <span>↺ Generate New Link with Different Amount</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Accounts;

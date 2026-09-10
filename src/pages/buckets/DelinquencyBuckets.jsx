import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import * as XLSX from 'xlsx';
import { sendDueReminderSms } from '../../services/smsService';
import { getDayShiftState, saveDayShiftState, calculateDayEndSummary, runGoLivePreFlightCheck } from '../../services/dayOperationsService';
import { accountApi } from '../../services/api';
import StandaloneCollectionModal from '../../components/common/StandaloneCollectionModal';
import './DelinquencyBuckets.css';

// SVG Icons
const Icons = {
  Layers: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Download: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  QrCode: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  DollarSign: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Handshake: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
      <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.8L15 14" />
      <path d="m2 14 6 6" />
      <path d="M22 10a2 2 0 0 0-2-2h-3" />
    </svg>
  ),
  MessageSquare: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  PhoneCall: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
};

// Delinquency Bucket Calculator (RBI Standard)
export const calculateAccountBucket = (acc) => {
  if (!acc) return { key: 'B0', name: 'Bucket 0', label: 'Current / Standard (0d)', dpd: 0, color: '#10b981' };

  let dpd = null;

  // 1. Explicit DPD field checks
  const explicitDpd = acc.dpd ?? acc.daysPastDue ?? acc.DPD ?? acc.DaysPastDue ?? acc.overdueDays ?? acc.days_past_due;
  if (explicitDpd !== undefined && explicitDpd !== null && explicitDpd !== '' && !isNaN(Number(explicitDpd))) {
    dpd = Number(explicitDpd);
  }

  // 2. If dueAmount is 0 and no explicit DPD, account is current
  const due = Number(acc.dueAmount ?? acc.emiAmount ?? acc.DueAmount ?? acc.overdueAmount ?? 0);
  if (dpd === null && due <= 0) {
    dpd = 0;
  }

  // 3. NextDueDate / DueDate date math check
  if (dpd === null) {
    const rawDate = acc.nextDueDate || acc.dueDate || acc.NextDueDate || acc.DueDate || acc.lastPaidDate;
    if (rawDate && rawDate !== 'N/A') {
      const parts = String(rawDate).split(/[-/]/);
      let dueD = new Date(rawDate);
      if (parts.length === 3 && parts[2].length === 4) {
        dueD = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      if (!isNaN(dueD.getTime())) {
        const diffDays = Math.floor((Date.now() - dueD.getTime()) / (1000 * 60 * 60 * 24));
        dpd = Math.max(0, diffDays);
      }
    }
  }

  // 4. Default fallback if due exists
  if (dpd === null || isNaN(dpd)) {
    dpd = due > 0 ? 15 : 0;
  }

  if (dpd === 0) return { key: 'B0', name: 'Bucket 0', label: 'Current / Standard (0d)', dpd, color: '#10b981' };
  if (dpd <= 30) return { key: 'B1', name: 'Bucket 1', label: 'SMA-0 (1-30d)', dpd, color: '#38bdf8' };
  if (dpd <= 60) return { key: 'B2', name: 'Bucket 2', label: 'SMA-1 (31-60d)', dpd, color: '#fbbf24' };
  if (dpd <= 90) return { key: 'B3', name: 'Bucket 3', label: 'SMA-2 (61-90d)', dpd, color: '#f97316' };
  return { key: 'NPA', name: 'Critical / NPA', label: 'NPA (>90d)', dpd, color: '#ef4444' };
};

const DelinquencyBuckets = () => {
  const navigate = useNavigate();
  const authUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const rawRole = (authUser?.role || localStorage.getItem('user_role') || localStorage.getItem('role') || '').toLowerCase();
  const isSoftwareAdmin = rawRole === 'softwareadmin' || rawRole === 'superadmin' || rawRole === 'admin' || rawRole === 'system_admin';

  // Integration Status check (Model Y = Integrated CBS, Model N = Standalone Ledger)
  const isIntegratedMode = useMemo(() => {
    const rawInteg = localStorage.getItem('integrationStatus') || authUser?.integrationStatus || authUser?.IntegrationStatus || 'No';
    return String(rawInteg).toUpperCase() === 'Y' || String(rawInteg).toUpperCase() === 'YES' || rawInteg === true;
  }, [authUser]);

  useEffect(() => {
    if (isIntegratedMode || isSoftwareAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [isIntegratedMode, isSoftwareAdmin, navigate]);

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBucket, setSelectedBucket] = useState('ALL'); // 'ALL' | 'B0' | 'B1' | 'B2' | 'B3' | 'NPA' | 'PTP' | 'MANDATORY_CALL'
  const [searchTerm, setSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // PTP Modal State
  const [isPtpModalOpen, setIsPtpModalOpen] = useState(false);
  const [activePtpAccount, setActivePtpAccount] = useState(null);
  const [ptpDate, setPtpDate] = useState('');
  const [ptpAmount, setPtpAmount] = useState('');
  const [ptpRemarks, setPtpRemarks] = useState('');

  // Day Operations & Shift State
  const [isDayOpsModalOpen, setIsDayOpsModalOpen] = useState(false);
  const [dayOpsTab, setDayOpsTab] = useState('BOD');
  const [dayShiftState, setDayShiftState] = useState(() => getDayShiftState('01', authUser?.merchantId || 4));
  const [dayOpsNotes, setDayOpsNotes] = useState('');

  useEffect(() => {
    const handleShiftEvent = (e) => {
      if (e?.detail) {
        setDayShiftState(e.detail);
      } else {
        setDayShiftState(getDayShiftState('01', authUser?.merchantId || 4));
      }
    };
    window.addEventListener('ecollect:day_shift_changed', handleShiftEvent);
    window.addEventListener('storage', handleShiftEvent);
    return () => {
      window.removeEventListener('ecollect:day_shift_changed', handleShiftEvent);
      window.removeEventListener('storage', handleShiftEvent);
    };
  }, [authUser]);

  const eodSummary = useMemo(() => {
    return calculateDayEndSummary({
      accounts: accounts || [],
      transactions: []
    });
  }, [accounts]);

  const goLiveReport = useMemo(() => {
    return runGoLivePreFlightCheck({
      merchantId: authUser?.merchantId || 4,
      accounts: accounts || [],
      user: authUser,
      isNonIntegrated: true
    });
  }, [authUser, accounts]);

  const handleStartBodShift = () => {
    const updated = {
      date: new Date().toISOString().slice(0, 10),
      shiftStatus: 'OPEN',
      openedAt: new Date().toISOString(),
      closedAt: null,
      openedBy: authUser?.fullName || authUser?.name || 'Branch Manager',
      closedBy: null,
      notes: dayOpsNotes || 'Morning shift started for delinquency recovery operations.'
    };
    setDayShiftState(updated);
    saveDayShiftState(updated, '01', authUser?.merchantId || 4);
    showToast('☀️ Day Begin (BOD) Shift successfully opened! Field collections are active.');
  };

  const handleCompleteEodSettlement = () => {
    const updated = {
      ...dayShiftState,
      shiftStatus: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy: authUser?.fullName || authUser?.name || 'Branch Manager',
      reconciledSummary: eodSummary,
      notes: dayOpsNotes || 'Day-End settlement manually completed and daily collections ledger sealed.'
    };

    setDayShiftState(updated);
    saveDayShiftState(updated, '01', authUser?.merchantId || 4);
    setDayOpsTab('CERTIFICATE');
    showToast('🌙 Day-End (EOD) Settlement completed! EOD Certificate generated.');
  };

  const handlePrintEodCertificate = () => {
    window.print();
  };

  // Quick Collection Modal State
  const [activeAccount, setActiveAccount] = useState(null);
  const [activeModalType, setActiveModalType] = useState(null); // 'QR' | 'CASH'

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Accounts from local ledger
  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      let apiAccounts = [];
      try {
        if (accountApi && accountApi.getAll) {
          const res = await accountApi.getAll({
            merchantId: authUser?.merchantId || 4,
            branchCode: authUser?.branchCode || '01'
          });
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            apiAccounts = res.data;
          }
        }
      } catch (apiErr) {
        console.warn('API accounts load fallback to local storage:', apiErr);
      }

      if (apiAccounts.length > 0) {
        setAccounts(apiAccounts);
      } else {
        const stored = JSON.parse(localStorage.getItem('ecollect_standalone_accounts') || '[]');
        if (stored && stored.length > 0) {
          setAccounts(stored);
        } else {
          // Fallback sample loan & RD records with delinquency profiles
          const samples = [
            { id: 'b_1', accountNumber: 'LN1004821', accountHolder: 'Ramesh Patel', phone: '9876543210', collectionType: 'LOAN', loanCategory: 'Vehicle Loan', balance: 145000, dueAmount: 8500, emiAmount: 8500, dpd: 5, assignedAgentCode: '1075', assignedAgentName: 'Rajesh Kumar' },
            { id: 'b_2', accountNumber: 'LN1004822', accountHolder: 'Sunita Sharma', phone: '9876543211', collectionType: 'LOAN', loanCategory: 'Home Loan', balance: 620000, dueAmount: 18500, emiAmount: 18500, dpd: 0, assignedAgentCode: '1075', assignedAgentName: 'Rajesh Kumar' },
            { id: 'b_3', accountNumber: 'LN1004823', accountHolder: 'Anand Verma', phone: '9876543213', collectionType: 'LOAN', loanCategory: 'Personal Loan', balance: 85000, dueAmount: 12000, emiAmount: 6000, dpd: 42, assignedAgentCode: '1075', assignedAgentName: 'Rajesh Kumar', ptpDate: '2026-09-05', ptpAmount: 12000 },
            { id: 'b_4', accountNumber: 'LN1004824', accountHolder: 'Kavita Reddy', phone: '9876543214', collectionType: 'LOAN', loanCategory: 'Business Loan', balance: 350000, dueAmount: 45000, emiAmount: 15000, dpd: 78, assignedAgentCode: '1075', assignedAgentName: 'Rajesh Kumar', isMandatoryCall: true },
            { id: 'b_5', accountNumber: 'LN1004825', accountHolder: 'Manoj Deshmukh', phone: '9876543215', collectionType: 'LOAN', loanCategory: 'LAP Loan', balance: 1200000, dueAmount: 110000, emiAmount: 22000, dpd: 115, assignedAgentCode: '1075', assignedAgentName: 'Rajesh Kumar' },
            { id: 'b_6', accountNumber: 'RD1008920', accountHolder: 'Vijay Mohan', phone: '9876543212', collectionType: 'RD', loanCategory: 'Standard Recurring Deposit', balance: 34000, dueAmount: 2000, emiAmount: 2000, dpd: 12, assignedAgentCode: '1075', assignedAgentName: 'Rajesh Kumar' }
          ];
          setAccounts(samples);
          localStorage.setItem('ecollect_standalone_accounts', JSON.stringify(samples));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Aggregate Bucket Metrics
  const bucketMetrics = useMemo(() => {
    const counts = {
      ALL: { count: accounts.length, amount: 0 },
      B0: { count: 0, amount: 0 },
      B1: { count: 0, amount: 0 },
      B2: { count: 0, amount: 0 },
      B3: { count: 0, amount: 0 },
      NPA: { count: 0, amount: 0 },
      PTP: { count: 0, amount: 0 },
      MANDATORY_CALL: { count: 0, amount: 0 }
    };

    accounts.forEach(a => {
      const b = calculateAccountBucket(a);
      const due = Number(a.dueAmount || a.emiAmount || 0);
      const bal = Number(a.balance || 0);

      counts.ALL.amount += bal;

      if (counts[b.key]) {
        counts[b.key].count++;
        counts[b.key].amount += due > 0 ? due : bal;
      }

      if (a.ptpDate) {
        counts.PTP.count++;
        counts.PTP.amount += Number(a.ptpAmount || due);
      }

      if (a.isMandatoryCall || b.key === 'B3' || b.key === 'NPA' || a.ptpStatus === 'BROKEN') {
        counts.MANDATORY_CALL.count++;
        counts.MANDATORY_CALL.amount += due > 0 ? due : bal;
      }
    });

    return counts;
  }, [accounts]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (acc.accountNumber || '').toLowerCase().includes(q) ||
        (acc.accountHolder || '').toLowerCase().includes(q) ||
        (acc.phone || '').toLowerCase().includes(q) ||
        (acc.assignedAgentCode || '').toLowerCase().includes(q);

      const bucket = calculateAccountBucket(acc);
      const matchesBucket =
        selectedBucket === 'ALL' ||
        (selectedBucket === 'PTP' && Boolean(acc.ptpDate)) ||
        (selectedBucket === 'MANDATORY_CALL' && (acc.isMandatoryCall || bucket.key === 'B3' || bucket.key === 'NPA' || acc.ptpStatus === 'BROKEN')) ||
        bucket.key === selectedBucket;

      const matchesAgent = agentFilter === 'ALL' || String(acc.assignedAgentCode) === String(agentFilter);

      return matchesSearch && matchesBucket && matchesAgent;
    });
  }, [accounts, searchTerm, selectedBucket, agentFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBucket, agentFilter, pageSize]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredAccounts.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredAccounts.length);
  const paginatedAccounts = useMemo(() => {
    return filteredAccounts.slice(startIndex, endIndex);
  }, [filteredAccounts, startIndex, endIndex]);

  // Save / Update PTP (Promise to Pay)
  const handleOpenPtpModal = (acc) => {
    setActivePtpAccount(acc);
    setPtpDate(acc.ptpDate || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
    setPtpAmount(acc.ptpAmount || acc.dueAmount || acc.emiAmount || 5000);
    setPtpRemarks(acc.ptpRemarks || '');
    setIsPtpModalOpen(true);
  };

  const handleSavePtp = (e) => {
    e.preventDefault();
    if (!ptpDate || !ptpAmount) {
      showToast('Please enter PTP date and amount', 'error');
      return;
    }

    setAccounts(prev => {
      const updated = prev.map(a => {
        if (a.accountNumber === activePtpAccount.accountNumber) {
          return {
            ...a,
            ptpDate: ptpDate,
            ptpAmount: Number(ptpAmount),
            ptpRemarks: ptpRemarks,
            ptpStatus: 'PROMISED'
          };
        }
        return a;
      });
      localStorage.setItem('ecollect_standalone_accounts', JSON.stringify(updated));
      return updated;
    });

    showToast(`🤝 PTP recorded for ${activePtpAccount.accountHolder} on ${ptpDate}!`);
    setIsPtpModalOpen(false);
  };

  // 1-Click Cash Collection
  const handleOpenCashModal = (acc) => {
    const shift = getDayShiftState('01', authUser?.merchantId || 4);
    if (shift?.shiftStatus !== 'OPEN') {
      showToast('🔒 Collection shift is CLOSED! Please start Day Begin (BOD) first.', 'error');
      setDayOpsTab('BOD');
      setIsDayOpsModalOpen(true);
      return;
    }
    setActiveAccount(acc);
    setActiveModalType('CASH');
  };

  // 1-Click Dynamic QR
  const handleOpenQrModal = (acc) => {
    const shift = getDayShiftState('01', authUser?.merchantId || 4);
    if (shift?.shiftStatus !== 'OPEN') {
      showToast('🔒 Collection shift is CLOSED! Please start Day Begin (BOD) first.', 'error');
      setDayOpsTab('BOD');
      setIsDayOpsModalOpen(true);
      return;
    }
    setActiveAccount(acc);
    setActiveModalType('QR');
  };

  // 1-Click DLT SMS Legal / Overdue Notice Dispatch
  const handleSendOverdueNotice = async (acc) => {
    if (!acc.phone) {
      showToast('Customer mobile number is missing', 'error');
      return;
    }
    try {
      const res = await sendDueReminderSms({
        recipientMobile: acc.phone,
        customerName: acc.accountHolder,
        dueAmount: acc.dueAmount || acc.emiAmount || 0,
        accountNumber: acc.accountNumber,
        dueDate: acc.nextDueDate || 'Immediate',
        merchantId: authUser?.merchantId || 4,
        merchantName: authUser?.company || 'eCollect'
      });
      if (res.success) {
        showToast(`📲 DLT Overdue Recovery Notice SMS sent to ${acc.accountHolder}!`);
      } else {
        showToast(res.message, 'error');
      }
    } catch {
      showToast('Failed to dispatch SMS notice', 'error');
    }
  };

  // Export Delinquency Report (.xlsx)
  const handleExportDelinquencyReport = () => {
    const headers = ['AccountNumber', 'CustomerName', 'Mobile', 'Product', 'DPD', 'Bucket', 'OverdueAmount', 'OutstandingBalance', 'PTPDate', 'AgentCode'];
    const rows = filteredAccounts.map(a => {
      const b = calculateAccountBucket(a);
      return [
        a.accountNumber,
        a.accountHolder,
        a.phone,
        a.collectionType,
        b.dpd,
        b.label,
        a.dueAmount || a.emiAmount,
        a.balance,
        a.ptpDate || 'None',
        a.assignedAgentCode
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Delinquency_Report');
    XLSX.writeFile(wb, `Delinquency_NPA_Report_${selectedBucket}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast(`Exported ${filteredAccounts.length} delinquency records to Excel!`);
  };

  return (
    <DashboardLayout pageTitle="Delinquency Aging & Recovery Buckets Hub">
      <div className="buckets-page-container">
        
        {/* Toast */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '12px',
            background: notification.type === 'error' ? '#ef4444' : '#10b981',
            color: '#fff',
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
          }}>
            {notification.msg}
          </div>
        )}

        {/* Hero Header */}
        <div className="buckets-hero-header">
          <div>
            <div className="buckets-badge-tag">
              <Icons.Layers />
              <span>RBI Delinquency Classification & NPA Recovery</span>
            </div>
            <h1 className="buckets-page-title">
              Delinquency Aging & <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Recovery Buckets</span>
            </h1>
            <p className="buckets-page-subtitle">
              Monitor portfolio risk, SMA-0/1/2 aging, NPA recovery workflows, PTP commitments & high-priority call escalation queues
            </p>
          </div>

          <div className="buckets-header-actions">
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
              title="Open Day Begin (BOD), Day End (EOD) Settlement Suite"
            >
              <span>{dayShiftState?.shiftStatus === 'OPEN' ? '☀️ Shift: OPEN' : '🌙 Shift: CLOSED'}</span>
            </button>

            <button type="button" className="btn-buckets-export" onClick={handleExportDelinquencyReport}>
              <Icons.Download />
              <span>Export Delinquency Report (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 8 BUCKET MATRIX TILES */}
        <div className="bucket-matrix-grid">
          <button
            type="button"
            className={`bucket-nav-tile is-all ${selectedBucket === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setSelectedBucket('ALL')}
          >
            <div className="tile-top-row">
              <span className="tile-icon">🌐</span>
              <span className="tile-count-badge font-mono">{bucketMetrics.ALL.count}</span>
            </div>
            <div className="tile-title">All Portfolios</div>
            <div className="tile-sub">Total Active Accounts</div>
            <div className="tile-amount font-mono" style={{ color: '#818cf8' }}>₹{bucketMetrics.ALL.amount.toLocaleString('en-IN')}</div>
          </button>

          <button
            type="button"
            className={`bucket-nav-tile is-b0 ${selectedBucket === 'B0' ? 'is-active' : ''}`}
            onClick={() => setSelectedBucket('B0')}
          >
            <div className="tile-top-row">
              <span className="tile-icon">🟢</span>
              <span className="tile-count-badge font-mono">{bucketMetrics.B0.count}</span>
            </div>
            <div className="tile-title">Bucket 0 (Current)</div>
            <div className="tile-sub">0 Days Past Due</div>
            <div className="tile-amount font-mono" style={{ color: '#10b981' }}>₹{bucketMetrics.B0.amount.toLocaleString('en-IN')}</div>
          </button>

          <button
            type="button"
            className={`bucket-nav-tile is-b1 ${selectedBucket === 'B1' ? 'is-active' : ''}`}
            onClick={() => setSelectedBucket('B1')}
          >
            <div className="tile-top-row">
              <span className="tile-icon">🔵</span>
              <span className="tile-count-badge font-mono">{bucketMetrics.B1.count}</span>
            </div>
            <div className="tile-title">Bucket 1 (SMA-0)</div>
            <div className="tile-sub">1 - 30 Days Overdue</div>
            <div className="tile-amount font-mono" style={{ color: '#38bdf8' }}>₹{bucketMetrics.B1.amount.toLocaleString('en-IN')}</div>
          </button>

          <button
            type="button"
            className={`bucket-nav-tile is-b2 ${selectedBucket === 'B2' ? 'is-active' : ''}`}
            onClick={() => setSelectedBucket('B2')}
          >
            <div className="tile-top-row">
              <span className="tile-icon">🟡</span>
              <span className="tile-count-badge font-mono">{bucketMetrics.B2.count}</span>
            </div>
            <div className="tile-title">Bucket 2 (SMA-1)</div>
            <div className="tile-sub">31 - 60 Days Overdue</div>
            <div className="tile-amount font-mono" style={{ color: '#fbbf24' }}>₹{bucketMetrics.B2.amount.toLocaleString('en-IN')}</div>
          </button>

          <button
            type="button"
            className={`bucket-nav-tile is-b3 ${selectedBucket === 'B3' ? 'is-active' : ''}`}
            onClick={() => setSelectedBucket('B3')}
          >
            <div className="tile-top-row">
              <span className="tile-icon">🟠</span>
              <span className="tile-count-badge font-mono">{bucketMetrics.B3.count}</span>
            </div>
            <div className="tile-title">Bucket 3 (SMA-2)</div>
            <div className="tile-sub">61 - 90 Days High Risk</div>
            <div className="tile-amount font-mono" style={{ color: '#f97316' }}>₹{bucketMetrics.B3.amount.toLocaleString('en-IN')}</div>
          </button>

          <button
            type="button"
            className={`bucket-nav-tile is-npa ${selectedBucket === 'NPA' ? 'is-active' : ''}`}
            onClick={() => setSelectedBucket('NPA')}
          >
            <div className="tile-top-row">
              <span className="tile-icon">🚨</span>
              <span className="tile-count-badge font-mono">{bucketMetrics.NPA.count}</span>
            </div>
            <div className="tile-title">Critical / NPA</div>
            <div className="tile-sub">&gt;90 Days Default</div>
            <div className="tile-amount font-mono" style={{ color: '#ef4444' }}>₹{bucketMetrics.NPA.amount.toLocaleString('en-IN')}</div>
          </button>

          <button
            type="button"
            className={`bucket-nav-tile is-ptp ${selectedBucket === 'PTP' ? 'is-active' : ''}`}
            onClick={() => setSelectedBucket('PTP')}
          >
            <div className="tile-top-row">
              <span className="tile-icon">🤝</span>
              <span className="tile-count-badge font-mono">{bucketMetrics.PTP.count}</span>
            </div>
            <div className="tile-title">Promise to Pay (PTP)</div>
            <div className="tile-sub">Committed Commitments</div>
            <div className="tile-amount font-mono" style={{ color: '#a855f7' }}>₹{bucketMetrics.PTP.amount.toLocaleString('en-IN')}</div>
          </button>

          <button
            type="button"
            className={`bucket-nav-tile is-call-queue ${selectedBucket === 'MANDATORY_CALL' ? 'is-active' : ''}`}
            onClick={() => setSelectedBucket('MANDATORY_CALL')}
          >
            <div className="tile-top-row">
              <span className="tile-icon">📞</span>
              <span className="tile-count-badge font-mono">{bucketMetrics.MANDATORY_CALL.count}</span>
            </div>
            <div className="tile-title">Mandatory Call Queue</div>
            <div className="tile-sub">High-Risk Escalations</div>
            <div className="tile-amount font-mono" style={{ color: '#ec4899' }}>₹{bucketMetrics.MANDATORY_CALL.amount.toLocaleString('en-IN')}</div>
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="buckets-toolbar">
          <div className="buckets-filter-group">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}><Icons.Search /></span>
              <input
                type="text"
                placeholder="Search Account No, Name, Mobile..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="buckets-search-input"
              />
            </div>

            <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} className="buckets-select-ctrl">
              <option value="ALL">All Agents</option>
              <option value="1075">Agent #1075</option>
            </select>
          </div>

          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
            Showing <strong>{filteredAccounts.length}</strong> delinquent accounts
          </span>
        </div>

        {/* Master Delinquency Table */}
        <div className="buckets-table-card">
          <table className="buckets-master-table">
            <thead>
              <tr>
                <th>Account No</th>
                <th>Customer Name</th>
                <th>Delinquency & DPD</th>
                <th>Overdue Demand</th>
                <th>Total Balance</th>
                <th>PTP Schedule</th>
                <th>Agent</th>
                <th style={{ textAlign: 'right' }}>Recovery Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <h3>No Delinquent Records Found in Selected Bucket</h3>
                    <p>All accounts in this classification are performing or cleared.</p>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((acc, i) => {
                  const b = calculateAccountBucket(acc);
                  return (
                    <tr key={acc.id || i}>
                      <td className="font-mono font-bold" style={{ color: '#818cf8' }}>
                        {acc.accountNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{acc.accountHolder}</div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{acc.phone || 'No Mobile'}</div>
                      </td>
                      <td>
                        <span className={`dpd-pill is-${b.key.toLowerCase()}`}>
                          {b.name} ({b.dpd} DPD)
                        </span>
                      </td>
                      <td className="font-mono font-bold" style={{ color: Number(acc.dueAmount || acc.emiAmount || 0) > 0 ? '#f87171' : '#34d399', fontSize: '14px' }}>
                        ₹{Number(acc.dueAmount || acc.emiAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="font-mono" style={{ color: '#cbd5e1' }}>
                        ₹{Number(acc.balance || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        {acc.ptpDate ? (
                          <div>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontSize: '11px', fontWeight: 800 }}>
                              📅 {acc.ptpDate}
                            </span>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                              ₹{Number(acc.ptpAmount || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>No PTP Set</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{acc.assignedAgentName || acc.assignedAgentCode || '1075'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-action-pill is-qr"
                            onClick={() => handleOpenQrModal(acc)}
                            title="Generate Dynamic UPI QR"
                          >
                            <Icons.QrCode /> <span>QR</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action-pill is-cash"
                            onClick={() => handleOpenCashModal(acc)}
                            title="Collect Cash"
                          >
                            <Icons.DollarSign /> <span>Cash</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action-pill is-call"
                            onClick={() => handleOpenPtpModal(acc)}
                            title="Set / Record Promise to Pay (PTP)"
                          >
                            <Icons.Handshake /> <span>PTP</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action-pill is-sms"
                            onClick={() => handleSendOverdueNotice(acc)}
                            title="Dispatch DLT Recovery Notice SMS"
                          >
                            <Icons.MessageSquare /> <span>Notice</span>
                          </button>
                          {acc.phone && (
                            <a
                              href={`tel:${acc.phone}`}
                              className="btn-action-pill is-call"
                              style={{ textDecoration: 'none' }}
                              title="Call Customer"
                            >
                              <Icons.PhoneCall /> <span>Call</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination Bar */}
          {filteredAccounts.length > 0 && (
            <div className="due-pagination-bar">
              <div className="due-pagination-info">
                <span>
                  Showing <strong style={{ color: 'var(--textPrimary, #fff)' }}>{startIndex + 1}</strong> to <strong style={{ color: 'var(--textPrimary, #fff)' }}>{endIndex}</strong> of <strong style={{ color: '#818cf8' }}>{filteredAccounts.length}</strong> delinquent accounts
                </span>
                
                <div className="due-page-size-selector">
                  <label htmlFor="bucketsPageSizeSelect" style={{ fontSize: '12px', color: 'var(--textMuted, #94a3b8)' }}>Rows per page:</label>
                  <select
                    id="bucketsPageSizeSelect"
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    className="due-page-size-select font-mono"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="due-pagination-nav">
                <button
                  type="button"
                  className="btn-page-ctrl"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="First Page"
                >
                  ⏮️ First
                </button>
                <button
                  type="button"
                  className="btn-page-ctrl"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  title="Previous Page"
                >
                  ◀ Prev
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={p}>
                        {prev && p - prev > 1 && (
                          <span style={{ padding: '0 4px', color: 'var(--textMuted, #64748b)' }}>...</span>
                        )}
                        <button
                          type="button"
                          className={`btn-page-num font-mono ${currentPage === p ? 'is-active' : ''}`}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  className="btn-page-ctrl"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  title="Next Page"
                >
                  Next ▶
                </button>
                <button
                  type="button"
                  className="btn-page-ctrl"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Last Page"
                >
                  Last ⏭️
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RECORD PTP MODAL */}
        {isPtpModalOpen && activePtpAccount && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }} onClick={() => setIsPtpModalOpen(false)}>
            <div style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }} onClick={e => e.stopPropagation()}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                  🤝 Record Promise to Pay (PTP)
                </h3>
                <button type="button" onClick={() => setIsPtpModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{activePtpAccount.accountHolder}</div>
                <div style={{ fontSize: '12px', color: '#818cf8', fontFamily: 'monospace' }}>Acc #{activePtpAccount.accountNumber} ({activePtpAccount.collectionType})</div>
                <div style={{ fontSize: '12px', color: '#f87171', marginTop: '4px', fontWeight: 700 }}>Total Overdue: ₹{Number(activePtpAccount.dueAmount || activePtpAccount.emiAmount || 0).toLocaleString('en-IN')}</div>
              </div>

              <form onSubmit={handleSavePtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>PTP Promised Date *</label>
                  <input
                    type="date"
                    required
                    value={ptpDate}
                    onChange={e => setPtpDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Promised Installment Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={ptpAmount}
                    onChange={e => setPtpAmount(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#a855f7', fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Collector Notes / Commitment Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Customer promised cash payment after salary credit"
                    value={ptpRemarks}
                    onChange={e => setPtpRemarks(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsPtpModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.08)', color: '#fff', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <button
                    type="submit"
                    style={{ padding: '10px 22px', borderRadius: '10px', background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                  >
                    Save PTP Commitment
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* DAY OPERATIONS (BOD / EOD) SUITE MODAL */}
        {isDayOpsModalOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="modal-card" style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', color: '#f8fafc', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>☀️ Day Begin (BOD) & 🌙 Day End (EOD) Operations</h2>
                  <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '4px 0 0 0' }}>Manage shift float, unlock field recovery collections, and perform manual daily settlement</p>
                </div>
                <button type="button" onClick={() => setIsDayOpsModalOpen(false)} style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px' }}>✕</button>
              </div>

              {/* TABS */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(255, 255, 255, 0.03)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('BOD')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'BOD' ? '#10b981' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ☀️ 1. Day Begin (BOD)
                </button>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('EOD')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'EOD' ? '#ef4444' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🌙 2. Day End (EOD) Settlement
                </button>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('CERTIFICATE')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'CERTIFICATE' ? '#3b82f6' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📜 3. Settlement Scroll
                </button>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('GOLIVE')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'GOLIVE' ? '#6366f1' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🚀 4. Go-Live Audit ({goLiveReport.percentage}%)
                </button>
              </div>

              {/* TAB 1: BOD */}
              {dayOpsTab === 'BOD' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>Morning Shift Operational Notes</label>
                    <input
                      type="text"
                      value={dayOpsNotes}
                      onChange={e => setDayOpsNotes(e.target.value)}
                      placeholder="e.g. Delinquency and NPA field recovery run"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
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
                        cursor: 'pointer'
                      }}
                    >
                      {dayShiftState?.shiftStatus === 'OPEN' ? '✓ Shift Already Active (Click to Refresh)' : '☀️ Start Day Begin (BOD) & Unlock Operations'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: EOD */}
              {dayOpsTab === 'EOD' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#fff', color: '#000', padding: '24px', borderRadius: '12px', fontFamily: 'serif' }}>
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
                      <h2 style={{ margin: 0, fontSize: '20px', textTransform: 'uppercase' }}>FINWIN eCollect - Enterprise Settlement Certificate</h2>
                      <div style={{ fontSize: '12px', color: '#555' }}>Daily Treasury & Doorstep Collection Reconciliation Dossier</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '16px' }}>
                      <div>Date: <strong>{dayShiftState?.date || new Date().toLocaleDateString('en-IN')}</strong></div>
                      <div>Branch Node: <strong>BR01 - Main Branch</strong></div>
                      <div>Shift Status: <strong>{dayShiftState?.shiftStatus || 'CLOSED'}</strong></div>
                      <div>Reconciled By: <strong>{dayShiftState?.closedBy || authUser?.name || 'Manager'}</strong></div>
                      <div>Total Collections: <strong>₹{eodSummary.totalCollectedAmount.toLocaleString('en-IN')}</strong></div>
                      <div>Doorstep Cash: <strong>₹{eodSummary.cashCollectedAmount.toLocaleString('en-IN')}</strong></div>
                      <div>UPI QR Collections: <strong>₹{eodSummary.upiCollectedAmount.toLocaleString('en-IN')}</strong></div>
                      <div>Payment Links: <strong>₹{(eodSummary.linkCollectedAmount || 0).toLocaleString('en-IN')}</strong></div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#777', borderTop: '1px dashed #aaa', paddingTop: '10px' }}>
                      Autonomous Verification Signed • eCollect Core Ledger Security Protocol
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handlePrintEodCertificate}
                      style={{ padding: '10px 20px', borderRadius: '10px', background: '#3b82f6', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                    >
                      🖨️ Print Certificate
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: GO-LIVE AUDIT */}
              {dayOpsTab === 'GOLIVE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#818cf8' }}>Pre-Flight Readiness Score: {goLiveReport.score} ({goLiveReport.percentage}%)</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{goLiveReport.isReadyForGoLive ? '✓ System meets all compliance standards for field go-live' : '⚠️ Action required before field go-live'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                    {goLiveReport.checks.map(chk => (
                      <div key={chk.id} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{chk.title}</div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{chk.desc}</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', background: chk.status.startsWith('PASSED') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: chk.status.startsWith('PASSED') ? '#34d399' : '#f87171' }}>
                          {chk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* STANDALONE MODE N COLLECTION SUITE (QR, CASH, LINK) */}
        <StandaloneCollectionModal
          account={activeAccount}
          defaultTab={activeModalType}
          isOpen={Boolean(activeModalType && activeAccount)}
          onClose={() => {
            setActiveModalType(null);
            setActiveAccount(null);
          }}
          onSuccess={(receipt, updatedAcc) => {
            setAccounts(prev => {
              const updated = prev.map(a => (a.id === updatedAcc.id || a.accountNumber === updatedAcc.accountNumber) ? updatedAcc : a);
              localStorage.setItem('ecollect_standalone_accounts', JSON.stringify(updated));
              return updated;
            });
            showToast(`🎉 ₹${receipt.amount.toLocaleString('en-IN')} payment collected for ${receipt.customerName}!`);
          }}
        />

      </div>
    </DashboardLayout>
  );
};

export default DelinquencyBuckets;

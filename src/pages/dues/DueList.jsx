import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import * as XLSX from 'xlsx';
import { sendDueReminderSms } from '../../services/smsService';
import { whatsAppApi } from '../../services/api';
import { getDayShiftState, saveDayShiftState, calculateDayEndSummary, runGoLivePreFlightCheck } from '../../services/dayOperationsService';
import StandaloneCollectionModal from '../../components/common/StandaloneCollectionModal';
import './DueList.css';

// SVG Icons
const Icons = {
  FileText: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  DollarSign: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Link: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  PhoneCall: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  MessageSquare: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
};

const DueList = () => {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'PAID'
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Upload Modal State
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
      notes: dayOpsNotes || 'Morning shift started for daily collection operations.'
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

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // Collection Quick Modal State
  const [activeAccount, setActiveAccount] = useState(null);
  const [activeModalType, setActiveModalType] = useState(null); // 'QR' | 'CASH' | 'LINK'

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Accounts from local ledger
  const loadDueAccounts = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ecollect_standalone_accounts') || '[]');
      if (stored && stored.length > 0) {
        setAccounts(stored);
      } else {
        // Fallback sample data
        const sampleAccounts = [
          {
            id: 'due_1',
            accountNumber: 'LN1004821',
            accountHolder: 'Ramesh Patel',
            phone: '9876543210',
            collectionType: 'LOAN',
            loanCategory: 'Vehicle Loan',
            balance: 145000,
            dueAmount: 8500,
            emiAmount: 8500,
            nextDueDate: new Date().toLocaleDateString('en-IN'),
            lastPaidDate: '15/07/2026',
            assignedAgentCode: '1075',
            assignedAgentName: 'Rajesh Kumar (1075)',
            branchName: '01',
            dpd: 5
          },
          {
            id: 'due_2',
            accountNumber: 'LN1004822',
            accountHolder: 'Sunita Sharma',
            phone: '9876543211',
            collectionType: 'LOAN',
            loanCategory: 'Home Loan',
            balance: 620000,
            dueAmount: 18500,
            emiAmount: 18500,
            nextDueDate: new Date().toLocaleDateString('en-IN'),
            lastPaidDate: '01/08/2026',
            assignedAgentCode: '1075',
            assignedAgentName: 'Rajesh Kumar (1075)',
            branchName: '01',
            dpd: 0
          },
          {
            id: 'due_3',
            accountNumber: 'RD1008920',
            accountHolder: 'Vijay Mohan',
            phone: '9876543212',
            collectionType: 'RD',
            loanCategory: 'Standard Recurring Deposit',
            balance: 34000,
            dueAmount: 2000,
            emiAmount: 2000,
            nextDueDate: new Date().toLocaleDateString('en-IN'),
            lastPaidDate: '20/07/2026',
            assignedAgentCode: '1075',
            assignedAgentName: 'Rajesh Kumar (1075)',
            branchName: '01',
            dpd: 12
          }
        ];
        setAccounts(sampleAccounts);
        localStorage.setItem('ecollect_standalone_accounts', JSON.stringify(sampleAccounts));
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }, []);

  useEffect(() => {
    loadDueAccounts();
  }, [loadDueAccounts]);

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const totalDemand = accounts.reduce((acc, a) => acc + Number(a.dueAmount || a.emiAmount || 0), 0);
    const dueCount = accounts.filter(a => Number(a.dueAmount || a.emiAmount || 0) > 0).length;
    const paidCount = accounts.filter(a => Number(a.dueAmount || 0) === 0 && Number(a.balance || 0) > 0).length;
    
    return {
      totalDemand,
      dueCount,
      paidCount,
      totalAccounts: accounts.length,
      efficiency: totalDemand > 0 ? Math.round(((accounts.length - dueCount) / accounts.length) * 100) : 100
    };
  }, [accounts]);

  // Filtered Due List
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        (acc.accountNumber || '').toLowerCase().includes(q) ||
        (acc.accountHolder || '').toLowerCase().includes(q) ||
        (acc.phone || '').toLowerCase().includes(q) ||
        (acc.assignedAgentCode || '').toLowerCase().includes(q);

      const isDue = Number(acc.dueAmount || acc.emiAmount || 0) > 0;
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && isDue) ||
        (statusFilter === 'PAID' && !isDue);

      const matchesProduct = productFilter === 'ALL' || (acc.collectionType || '').toUpperCase() === productFilter.toUpperCase();
      const matchesAgent = agentFilter === 'ALL' || String(acc.assignedAgentCode) === String(agentFilter);

      return matchesSearch && matchesStatus && matchesProduct && matchesAgent;
    });
  }, [accounts, searchTerm, statusFilter, productFilter, agentFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, productFilter, agentFilter, pageSize]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredAccounts.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredAccounts.length);
  const paginatedAccounts = useMemo(() => {
    return filteredAccounts.slice(startIndex, endIndex);
  }, [filteredAccounts, startIndex, endIndex]);

  // File Parser for Due List Upload (.xlsx, .xls, .csv)
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        setParsedRows(json);
        showToast(`Parsed ${json.length} due records from Excel!`);
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const text = evt.target.result || '';
          const lines = text.split(/\r?\n/).filter(l => l.trim());
          if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
            const rows = lines.slice(1).map(line => {
              const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
              const obj = {};
              headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
              return obj;
            });
            setParsedRows(rows);
            showToast(`Parsed ${rows.length} due records from CSV!`);
          }
        };
        reader.readAsText(file);
      }
    } catch (err) {
      showToast('Error reading due list file', 'error');
    }
  };

  // Submit Due List Ingestion
  const handleSaveImportedDueList = () => {
    if (!parsedRows || parsedRows.length === 0) {
      showToast('No due list records to process', 'error');
      return;
    }

    setIsProcessingUpload(true);
    try {
      const dueMap = new Map();
      const newItems = [];

      parsedRows.forEach((r, idx) => {
        const accNo = (r.AccountNumber || r.accountNumber || r.AccountNo || r.accountno || r.accno || '').toString().trim();
        if (accNo) {
          const custName = (r.CustomerName || r.customerName || r.AccountHolder || r.Name || 'Due Customer').toString().trim();
          const due = Number(r.DueAmount || r.dueAmount || r.Demand || r.Due || 0);
          const balance = Number(r.OutstandingAmount || r.outstandingAmount || r.Balance || due * 10);
          const emi = Number(r.EmiAmount || r.emiAmount || due);
          const mobile = (r.MobileNumber || r.mobileNumber || r.Phone || '').toString().trim();
          const agentCode = (r.AssignedAgentCode || r.AgentCode || '1075').toString().trim();
          const prodType = (r.ProductType || 'LOAN').toString().trim().toUpperCase();

          dueMap.set(accNo, { custName, due, balance, emi, mobile, agentCode, prodType });

          newItems.push({
            id: `due_import_${Date.now()}_${idx}`,
            accountNumber: accNo,
            accountHolder: custName,
            phone: mobile,
            collectionType: prodType,
            loanCategory: 'Daily Due Schedule',
            balance: balance,
            dueAmount: due,
            emiAmount: emi,
            nextDueDate: new Date().toLocaleDateString('en-IN'),
            lastPaidDate: 'N/A',
            assignedAgentCode: agentCode,
            assignedAgentName: `Agent (${agentCode})`,
            branchName: '01'
          });
        }
      });

      setAccounts(prev => {
        const existingMap = new Map();
        prev.forEach(a => existingMap.set(a.accountNumber, a));

        const merged = [];
        prev.forEach(acc => {
          if (dueMap.has(acc.accountNumber)) {
            const upd = dueMap.get(acc.accountNumber);
            merged.push({
              ...acc,
              accountHolder: upd.custName !== 'Due Customer' ? upd.custName : acc.accountHolder,
              phone: upd.mobile || acc.phone,
              dueAmount: upd.due,
              balance: upd.balance,
              emiAmount: upd.emi
            });
          } else {
            merged.push(acc);
          }
        });

        newItems.forEach(item => {
          if (!existingMap.has(item.accountNumber)) {
            merged.unshift(item);
          }
        });

        localStorage.setItem('ecollect_standalone_accounts', JSON.stringify(merged));
        return merged;
      });

      showToast(`🎉 Successfully updated ${dueMap.size} daily collection demands!`);
      setIsUploadModalOpen(false);
      setParsedRows([]);
    } catch (err) {
      showToast('Failed to save imported due list', 'error');
    } finally {
      setIsProcessingUpload(false);
    }
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

  // 1-Click Dynamic UPI QR
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

  // 1-Click Payment Link
  const handleOpenLinkModal = (acc) => {
    const shift = getDayShiftState('01', authUser?.merchantId || 4);
    if (shift?.shiftStatus !== 'OPEN') {
      showToast('🔒 Collection shift is CLOSED! Please start Day Begin (BOD) first.', 'error');
      setDayOpsTab('BOD');
      setIsDayOpsModalOpen(true);
      return;
    }
    setActiveAccount(acc);
    setActiveModalType('LINK');
  };

  // 1-Click DLT Due Reminder SMS Dispatch
  const handleSendReminder = async (acc) => {
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
        dueDate: acc.nextDueDate || new Date().toLocaleDateString('en-IN'),
        merchantId: authUser?.merchantId || 4,
        merchantName: authUser?.company || 'eCollect'
      });
      if (res.success) {
        showToast(`📲 DLT Due Reminder SMS sent to ${acc.accountHolder} (${acc.phone})!`);
      } else {
        showToast(res.message, 'error');
      }
    } catch {
      showToast('Failed to dispatch SMS reminder', 'error');
    }
  };

  // 1-Click WhatsApp Due Reminder Dispatch (Telinfy API)
  const handleSendWhatsApp = async (acc) => {
    const phone = acc.phone || acc.mobile || acc.mobileNumber || '';
    const name = acc.accountHolder || acc.customerName || 'Customer';
    const accNo = acc.accountNumber || '';
    const bal = Number(acc.dueAmount || acc.balance || acc.emiAmount || 0).toLocaleString('en-IN');
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    const merchantId = localStorage.getItem('merchantId') || authUser?.merchantId || 22;

    if (cleanPhone) {
      try {
        const payload = {
          merchantId: Number(merchantId),
          phoneNumber: cleanPhone,
          templateName: 'due_reminder',
          parameters: [name, `₹${bal}`, acc.nextDueDate || new Date().toLocaleDateString('en-IN'), 'https://mydop.in/pay/due']
        };
        showToast(`💬 Dispatched WhatsApp Due Reminder via Telinfy to ${name}...`);
        const res = await whatsAppApi.sendTemplateMessage(payload);
        if (res?.data?.isSuccess) {
          showToast(`✅ WhatsApp Due Reminder sent via Telinfy to ${name} (+91 ${cleanPhone})`);
          return;
        }
      } catch (err) {
        console.warn('Telinfy API send failed, falling back to WhatsApp Web:', err);
      }
    }

    const isLoan = acc.collectionType === 'LOAN';
    const msg = isLoan
      ? `Dear ${name},\nThis is a friendly reminder from DIGICOB Bank regarding your Loan Account #${accNo}.\nYour current outstanding / EMI due is ₹${bal}.\nPlease settle your installment at your earliest convenience.\nThank you!`
      : `Dear ${name},\nThis is a friendly reminder from DIGICOB Bank regarding your RD Account #${accNo}.\nYour scheduled deposit amount is ₹${bal}.\nPlease complete your deposit collection at your earliest convenience.\nThank you!`;
    
    const waUrl = cleanPhone && cleanPhone.length === 10
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    
    window.open(waUrl, '_blank');
  };

  // Export Due Sheet (.xlsx)
  const handleExportDueSheet = () => {
    const headers = ['AccountNumber', 'CustomerName', 'Mobile', 'Product', 'DueAmount', 'OutstandingBalance', 'DueDate', 'AgentCode'];
    const rows = filteredAccounts.map(a => [
      a.accountNumber,
      a.accountHolder,
      a.phone,
      a.collectionType,
      a.dueAmount,
      a.balance,
      a.nextDueDate,
      a.assignedAgentCode
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily_Due_Demand');
    XLSX.writeFile(wb, `Daily_Due_Demand_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast(`Exported ${filteredAccounts.length} due records to Excel!`);
  };

  return (
    <DashboardLayout pageTitle="Daily Due Demand & Field Recovery Hub">
      <div className="due-page-container">
        
        {/* Toast Notification */}
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
        <div className="due-hero-header">
          <div>
            <div className="due-badge-tag">
              <Icons.FileText />
              <span>Morning Due Register & Field Recovery</span>
            </div>
            <h1 className="due-page-title">
              Daily Due List & <span style={{ background: 'linear-gradient(135deg, #f87171, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Demand Ledger</span>
            </h1>
            <p className="due-page-subtitle">
              Scheduled daily installments, doorstep collections, dynamic UPI QR settlements & DLT SMS reminders
            </p>
          </div>

          <div className="due-header-actions">
            <button 
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: dayShiftState?.shiftStatus === 'OPEN'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))'
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.25))',
                border: dayShiftState?.shiftStatus === 'OPEN'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid rgba(239, 68, 68, 0.4)',
                color: dayShiftState?.shiftStatus === 'OPEN' ? '#10b981' : '#f87171',
                fontWeight: 800,
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
            <button type="button" className="btn-due-upload" onClick={() => setIsUploadModalOpen(true)}>
              <Icons.Upload />
              <span>Upload Daily Due List (.xlsx / .csv)</span>
            </button>
            <button type="button" className="btn-due-export" onClick={handleExportDueSheet}>
              <Icons.Download />
              <span>Export Field Sheet</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Telemetry Cards */}
        <div className="due-kpi-grid">
          <div className="due-kpi-card is-demand">
            <span className="due-kpi-label">Today's Due Demand</span>
            <h3 className="due-kpi-val" style={{ color: '#f87171' }}>₹{kpis.totalDemand.toLocaleString('en-IN')}</h3>
            <span className="due-kpi-sub">Total scheduled intake</span>
          </div>

          <div className="due-kpi-card is-borrowers">
            <span className="due-kpi-label">Due Borrowers</span>
            <h3 className="due-kpi-val" style={{ color: '#38bdf8' }}>{kpis.dueCount}</h3>
            <span className="due-kpi-sub">Scheduled accounts today</span>
          </div>

          <div className="due-kpi-card is-collected">
            <span className="due-kpi-label">Collected Accounts</span>
            <h3 className="due-kpi-val" style={{ color: '#34d399' }}>{kpis.paidCount}</h3>
            <span className="due-kpi-sub">Paid & settled today</span>
          </div>

          <div className="due-kpi-card is-pending">
            <span className="due-kpi-label">Total Portfolio Dues</span>
            <h3 className="due-kpi-val" style={{ color: '#fbbf24' }}>{kpis.totalAccounts}</h3>
            <span className="due-kpi-sub">Active borrower accounts</span>
          </div>

          <div className="due-kpi-card is-efficiency">
            <span className="due-kpi-label">Collection Rate</span>
            <h3 className="due-kpi-val" style={{ color: '#818cf8' }}>{kpis.efficiency}%</h3>
            <span className="due-kpi-sub">Daily run efficiency</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="due-toolbar">
          <div className="due-filter-group">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}><Icons.Search /></span>
              <input
                type="text"
                placeholder="Search Account No, Name, Mobile..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="due-search-input"
              />
            </div>

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="due-select-ctrl">
              <option value="ALL">All Statuses</option>
              <option value="PENDING">⏳ Pending Dues Only</option>
              <option value="PAID">✅ Paid / Cleared Today</option>
            </select>

            <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="due-select-ctrl">
              <option value="ALL">All Products</option>
              <option value="LOAN">💳 Loans (EMI)</option>
              <option value="RD">🏦 Recurring Deposit</option>
              <option value="FD">📈 Fixed Deposit</option>
            </select>

            <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} className="due-select-ctrl">
              <option value="ALL">All Agents</option>
              <option value="1075">Agent #1075</option>
            </select>
          </div>

          <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
            Showing <strong>{filteredAccounts.length}</strong> due records
          </span>
        </div>

        {/* Master Due Demand Table */}
        <div className="due-table-card">
          <table className="due-master-table">
            <thead>
              <tr>
                <th>Account No</th>
                <th>Customer Name</th>
                <th>Product & Scheme</th>
                <th>Today's Due</th>
                <th>Outstanding</th>
                <th>Agent</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <h3>No Due Records Found</h3>
                    <p>Upload a morning CBS due list to populate today's collection demand.</p>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((acc, i) => {
                  const isDue = Number(acc.dueAmount || acc.emiAmount || 0) > 0;
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
                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: '11.5px', fontWeight: 800 }}>
                          {acc.collectionType || 'LOAN'}
                        </span>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>{acc.loanCategory || 'Standard'}</div>
                      </td>
                      <td className="font-mono font-bold" style={{ color: isDue ? '#f87171' : '#34d399', fontSize: '14px' }}>
                        ₹{Number(acc.dueAmount || acc.emiAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="font-mono" style={{ color: '#cbd5e1' }}>
                        ₹{Number(acc.balance || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{acc.assignedAgentName || acc.assignedAgentCode || '1075'}</span>
                      </td>
                      <td>
                        <span className={`due-status-badge ${isDue ? 'is-pending' : 'is-paid'}`}>
                          {isDue ? '⏳ PENDING' : '✓ CLEARED'}
                        </span>
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
                            className="btn-action-pill is-link"
                            style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                            onClick={() => handleOpenLinkModal(acc)}
                            title="Generate Payment Link"
                          >
                            <Icons.CreditCard /> <span>Link</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action-pill is-cash"
                            onClick={() => handleOpenCashModal(acc)}
                            title="Collect Cash & Print Local Receipt"
                          >
                            <Icons.DollarSign /> <span>Cash</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action-pill is-sms"
                            onClick={() => handleSendReminder(acc)}
                            title="Dispatch DLT Due Reminder SMS"
                          >
                            <Icons.MessageSquare /> <span>SMS</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action-pill is-whatsapp"
                            style={{ background: 'rgba(37, 211, 102, 0.15)', color: '#25d366', border: '1px solid rgba(37, 211, 102, 0.3)' }}
                            onClick={() => handleSendWhatsApp(acc)}
                            title="Dispatch Telinfy WhatsApp Due Reminder"
                          >
                            <i className="bi bi-whatsapp"></i> <span>WhatsApp</span>
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

          {/* Premium Pagination Bar */}
          {filteredAccounts.length > 0 && (
            <div className="due-pagination-bar">
              <div className="due-pagination-info">
                <span>
                  Showing <strong style={{ color: 'var(--textPrimary, #fff)' }}>{startIndex + 1}</strong> to <strong style={{ color: 'var(--textPrimary, #fff)' }}>{endIndex}</strong> of <strong style={{ color: '#818cf8' }}>{filteredAccounts.length}</strong> due accounts
                </span>
                
                <div className="due-page-size-selector">
                  <label htmlFor="pageSizeSelect" style={{ fontSize: '12px', color: 'var(--textMuted, #94a3b8)' }}>Rows per page:</label>
                  <select
                    id="pageSizeSelect"
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

                {/* Dynamic Page Number Buttons */}
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

                {/* DAY OPERATIONS & SHIFT MODAL */}
        {isDayOpsModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }} onClick={() => setIsDayOpsModalOpen(false)}>
            <div style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '850px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }} onClick={e => e.stopPropagation()}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                    Day Operations & Go-Live Control Hub
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                    Manage Beginning of Day (BOD), End of Day (EOD) manual settlement, and compliance pre-flight checks.
                  </p>
                </div>
                <button type="button" onClick={() => setIsDayOpsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setDayOpsTab('BOD')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: dayOpsTab === 'BOD' ? '#6366f1' : 'transparent',
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
                    background: dayOpsTab === 'EOD' ? '#6366f1' : 'transparent',
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
                    background: dayOpsTab === 'CERTIFICATE' ? '#6366f1' : 'transparent',
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
                      placeholder="e.g. Standard morning field collection run"
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
                  <div style={{ padding: '20px', borderRadius: '14px', background: '#fff', color: '#0f172a', fontFamily: 'monospace' }}>
                    <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '12px', marginBottom: '14px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>FINWIN eCOLLECT ENTERPRISE</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>OFFICIAL DAILY RECONCILIATION SCROLL & CERTIFICATE</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
                      <div>Date: <strong>{dayShiftState?.date || new Date().toLocaleDateString('en-IN')}</strong></div>
                      <div>Branch Code: <strong>01</strong></div>
                      <div>Shift Status: <strong>{dayShiftState?.shiftStatus || 'CLOSED'}</strong></div>
                      <div>Reconciled By: <strong>{dayShiftState?.closedBy || authUser?.name || 'Manager'}</strong></div>
                      <div>Cash Collected: <strong>₹{eodSummary.cashCollectedAmount.toLocaleString('en-IN')}</strong></div>
                      <div>UPI QR Collected: <strong>₹{eodSummary.upiCollectedAmount.toLocaleString('en-IN')}</strong></div>
                      <div>Payment Links: <strong>₹{(eodSummary.linkCollectedAmount || 0).toLocaleString('en-IN')}</strong></div>
                      <div>Total Inward Intake: <strong>₹{eodSummary.totalCollectedAmount.toLocaleString('en-IN')}</strong></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handlePrintEodCertificate} style={{ padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      🖨️ Print EOD Certificate
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: GO-LIVE AUDIT */}
              {dayOpsTab === 'GOLIVE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsDayOpsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#fff', border: 'none', cursor: 'pointer' }}>Close</button>
              </div>

            </div>
          </div>
        )}

        {/* UPLOAD CBS DUE LIST MODAL */}
        {isUploadModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }} onClick={() => setIsUploadModalOpen(false)}>
            <div style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '650px',
              width: '90%',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }} onClick={e => e.stopPropagation()}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                  Upload CBS Morning Due List
                </h3>
                <button type="button" onClick={() => setIsUploadModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ padding: '24px', border: '2px dashed rgba(99, 102, 241, 0.4)', borderRadius: '16px', textAlign: 'center', marginBottom: '16px' }}>
                <Icons.Upload />
                <p style={{ margin: '8px 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                  Choose Excel (.xlsx, .xls) or CSV (.csv) Due Demand file
                </p>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Columns: AccountNumber, CustomerName, DueAmount, OutstandingAmount, Phone, AgentCode
                </span>
                <div style={{ marginTop: '14px' }}>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                </div>
              </div>

              {parsedRows.length > 0 && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', fontSize: '13px', fontWeight: 700, marginBottom: '16px' }}>
                  ✓ Ready to ingest {parsedRows.length} due accounts into active ledger!
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsUploadModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.08)', color: '#fff', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button
                  type="button"
                  onClick={handleSaveImportedDueList}
                  disabled={parsedRows.length === 0 || isProcessingUpload}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {isProcessingUpload ? 'Ingesting Demands...' : `Save ${parsedRows.length} Due Demands`}
                </button>
              </div>

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

export default DueList;

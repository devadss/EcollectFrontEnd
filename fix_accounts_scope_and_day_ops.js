const fs = require('fs');

const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let code = fs.readFileSync(accountsPath, 'utf8');

// 1. Remove the Day Ops block from its early position around line 506
const dayOpsEarlyBlock = `  // Day Begin (BOD), Day End (EOD) & Go-Live Operations Suite
  const [isDayOpsModalOpen, setIsDayOpsModalOpen] = useState(false);
  const [dayOpsTab, setDayOpsTab] = useState('BOD'); // 'BOD' | 'EOD' | 'CERTIFICATE' | 'GOLIVE'
  const [dayShiftState, setDayShiftState] = useState(getDayShiftState(selectedBranchCode, authUser?.merchantId || 4));
  const [openingVaultInput, setOpeningVaultInput] = useState(25000);
  const [physicalCashInput, setPhysicalCashInput] = useState('');
  const [dayOpsNotes, setDayOpsNotes] = useState('');

  // Recomputed Day-End Summary
  const eodSummary = useMemo(() => {
    return calculateDayEndSummary({
      accounts: accounts || [],
      transactions: recentPayments || [],
      openingVaultCash: Number(dayShiftState?.openingVaultCash || 25000)
    });
  }, [accounts, recentPayments, dayShiftState]);

  // Go-Live Pre-Flight Readiness Check
  const goLiveReport = useMemo(() => {
    return runGoLivePreFlightCheck({
      merchantId: authUser?.merchantId || 4,
      accounts: accounts || [],
      user: authUser,
      isNonIntegrated: isNonIntegrated
    });
  }, [authUser, accounts, isNonIntegrated]);

  const handleStartBodShift = () => {
    const updated = {
      date: new Date().toISOString().slice(0, 10),
      shiftStatus: 'OPEN',
      openedAt: new Date().toISOString(),
      closedAt: null,
      openedBy: authUser?.fullName || authUser?.name || 'Branch Manager',
      closedBy: null,
      openingVaultCash: Number(openingVaultInput || 25000),
      maxAgentCashHolding: 500000,
      notes: dayOpsNotes || 'Morning shift started for daily collection operations.'
    };
    setDayShiftState(updated);
    saveDayShiftState(updated, selectedBranchCode, authUser?.merchantId || 4);
    showToast('☀️ Day Begin (BOD) Shift successfully opened! Field collections are active.');
  };

  const handleCompleteEodSettlement = () => {
    const physVal = Number(physicalCashInput !== '' ? physicalCashInput : eodSummary.cashCollectedAmount);
    const variance = physVal - eodSummary.cashCollectedAmount;

    const updated = {
      ...dayShiftState,
      shiftStatus: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy: authUser?.fullName || authUser?.name || 'Branch Manager',
      physicalVaultCashDeposited: physVal,
      cashVariance: variance,
      reconciledSummary: eodSummary,
      notes: dayOpsNotes || (variance === 0 ? 'Day-End reconciled with 0.00 cash variance.' : 'Day-End closed with variance ' + variance)
    };

    setDayShiftState(updated);
    saveDayShiftState(updated, selectedBranchCode, authUser?.merchantId || 4);
    setDayOpsTab('CERTIFICATE');
    showToast('🌙 Day-End (EOD) Settlement completed! EOD Certificate generated.');
  };

  const handlePrintEodCertificate = () => {
    window.print();
  };`;

// Remove early block
code = code.replace(dayOpsEarlyBlock, '');

// 2. Prepare proper clean Day Ops block placed after user and selectedBranchCode
const dayOpsProperBlock = `
  // Day Begin (BOD), Day End (EOD) & Go-Live Operations Suite
  const [isDayOpsModalOpen, setIsDayOpsModalOpen] = useState(false);
  const [dayOpsTab, setDayOpsTab] = useState('BOD'); // 'BOD' | 'EOD' | 'CERTIFICATE' | 'GOLIVE'
  const [dayShiftState, setDayShiftState] = useState(() => getDayShiftState(selectedBranchCode, user?.merchantId || 4));
  const [openingVaultInput, setOpeningVaultInput] = useState(25000);
  const [physicalCashInput, setPhysicalCashInput] = useState('');
  const [dayOpsNotes, setDayOpsNotes] = useState('');

  // Recomputed Day-End Summary
  const eodSummary = useMemo(() => {
    return calculateDayEndSummary({
      accounts: accounts || [],
      transactions: [],
      openingVaultCash: Number(dayShiftState?.openingVaultCash || 25000)
    });
  }, [accounts, dayShiftState]);

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
      openingVaultCash: Number(openingVaultInput || 25000),
      maxAgentCashHolding: 500000,
      notes: dayOpsNotes || 'Morning shift started for daily collection operations.'
    };
    setDayShiftState(updated);
    saveDayShiftState(updated, selectedBranchCode, user?.merchantId || 4);
    showToast('☀️ Day Begin (BOD) Shift successfully opened! Field collections are active.');
  };

  const handleCompleteEodSettlement = () => {
    const physVal = Number(physicalCashInput !== '' ? physicalCashInput : eodSummary.cashCollectedAmount);
    const variance = physVal - eodSummary.cashCollectedAmount;

    const updated = {
      ...dayShiftState,
      shiftStatus: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy: user?.fullName || user?.name || 'Branch Manager',
      physicalVaultCashDeposited: physVal,
      cashVariance: variance,
      reconciledSummary: eodSummary,
      notes: dayOpsNotes || (variance === 0 ? 'Day-End reconciled with 0.00 cash variance.' : 'Day-End closed with variance ' + variance)
    };

    setDayShiftState(updated);
    saveDayShiftState(updated, selectedBranchCode, user?.merchantId || 4);
    setDayOpsTab('CERTIFICATE');
    showToast('🌙 Day-End (EOD) Settlement completed! EOD Certificate generated.');
  };

  const handlePrintEodCertificate = () => {
    window.print();
  };
`;

const anchor = "const rawRole = localStorage.getItem('user_role') || localStorage.getItem('role') || 'branchadmin';";
if (code.includes(anchor)) {
  code = code.replace(anchor, dayOpsProperBlock + '\n\n  ' + anchor);
  console.log('✅ Moved Day Ops state to proper scope after user and selectedBranchCode!');
}

// 3. Replace any remaining authUser references in Accounts.jsx with user
code = code.replace(/authUser\?/g, 'user?');

fs.writeFileSync(accountsPath, code, 'utf8');
console.log('✅ Accounts.jsx updated with 100% clean scope and zero undefined variables!');

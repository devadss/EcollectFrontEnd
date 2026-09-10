const fs = require('fs');
const babel = require('@babel/parser');

const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let code = fs.readFileSync(accountsPath, 'utf8');

// 1. Add State Hooks
const stateDeclarations = `
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
`;

if (!code.includes('selectedBucketTab')) {
  code = code.replace(
    'const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);',
    stateDeclarations + '\n  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);'
  );
}

// 2. Add Handlers
const handlersCode = `
  // ============================================================
  // PTP, MANDATORY CALL, GPS & AI HANDLERS
  // ============================================================
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
    showToast(\`🤝 Promise to Pay (₹\${Number(ptpFormData.ptpAmount).toLocaleString('en-IN')}) saved for \${selectedPtpAccount.accountHolder}!\`);

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
    showToast(\`📞 Call outcome '\${callFormData.callOutcome}' logged for \${selectedCallAccount.accountHolder}!\`);

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
        showToast(\`📍 GPS Locked: \${lat}, \${lng}\`);
      },
      (error) => {
        console.warn('GPS location error:', error);
        showToast('Could not auto-detect GPS. Please enter coordinates manually.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
`;

if (!code.includes('handleOpenPtpModal')) {
  const insertTarget = 'const handleOpenAccountReminderModal = (acc) => {';
  code = code.replace(insertTarget, handlersCode + '\n  ' + insertTarget);
}

// 3. Update optimisticAccount in handleSaveLoanAccount to include photo, lat, lng, address, ptp, ai
const extraOptimisticFields = `
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
`;

if (!code.includes('customerPhoto: loanFormData.customerPhoto')) {
  code = code.replace(
    'loanCategory: loanKind,',
    'loanCategory: loanKind,\n' + extraOptimisticFields
  );
}

// 4. Update loaded formatted accounts in loadAccounts (line 1500)
const extraLoadedFields = `
            customerPhoto: item.customerPhoto || item.photoUrl || '',
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
`;

if (!code.includes('customerPhoto: item.customerPhoto')) {
  code = code.replace(
    'branchName: item.branchName || item.branchCode || bCode,',
    'branchName: item.branchName || item.branchCode || bCode,\n' + extraLoadedFields
  );
}

// 5. Update bucket counts and filtering in filteredAccounts
const bucketCountsAndFilter = `
  // Delinquency Buckets & Priority Queue Aggregations
  const bucketCounts = useMemo(() => {
    const counts = { B0: 0, B1: 0, B2: 0, B3: 0, NPA: 0, PTP: 0, MANDATORY_CALL: 0 };
    accounts.forEach(a => {
      const bucket = calculateAccountBucket(a);
      if (counts[bucket.key] !== undefined) counts[bucket.key]++;
      if (a.ptpDate && a.ptpStatus !== 'KEPT') counts.PTP++;
      if (a.isMandatoryCall || bucket.key === 'B3' || bucket.key === 'NPA' || a.ptpStatus === 'BROKEN') counts.MANDATORY_CALL++;
    });
    return counts;
  }, [accounts]);
`;

if (!code.includes('const bucketCounts = useMemo')) {
  code = code.replace(
    'const filteredAccounts = useMemo(() => {',
    bucketCountsAndFilter + '\n  const filteredAccounts = useMemo(() => {'
  );
}

// 6. Add bucket matching inside filteredAccounts filter predicate
const bucketFilterPredicate = `
      // Standalone Delinquency Bucket & Queue Matching
      if (selectedBucketTab && selectedBucketTab !== 'ALL') {
        const bucket = calculateAccountBucket(acc);
        if (selectedBucketTab === 'B0' && bucket.key !== 'B0') return false;
        if (selectedBucketTab === 'B1' && bucket.key !== 'B1') return false;
        if (selectedBucketTab === 'B2' && bucket.key !== 'B2') return false;
        if (selectedBucketTab === 'B3' && bucket.key !== 'B3') return false;
        if (selectedBucketTab === 'NPA' && bucket.key !== 'NPA') return false;
        if (selectedBucketTab === 'PTP' && (!acc.ptpDate || acc.ptpStatus === 'KEPT')) return false;
        if (selectedBucketTab === 'MANDATORY_CALL' && !acc.isMandatoryCall && bucket.key !== 'B3' && bucket.key !== 'NPA' && acc.ptpStatus !== 'BROKEN') return false;
      }
`;

if (!code.includes('selectedBucketTab !== \'ALL\'')) {
  code = code.replace(
    'return matchesSearch && matchesType && matchesStatus && matchesCollectionProduct;',
    bucketFilterPredicate + '\n      return matchesSearch && matchesType && matchesStatus && matchesCollectionProduct;'
  );
}

fs.writeFileSync(accountsPath, code, 'utf8');
console.log('✅ Part 1 applied: State, Handlers, Loaded mapping, and Bucket Filter');

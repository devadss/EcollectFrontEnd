const fs = require('fs');

const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let code = fs.readFileSync(accountsPath, 'utf8');

// 1. Fix filteredAccounts calculation so DUE_LIST tab displays all accounts with dueAmount > 0
const oldFilteredAccounts = `  const filteredAccounts = useMemo(() => {
    return (accounts || []).filter(acc => {
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
  }, [accounts, searchTerm, collectionProductTab, typeFilter, statusFilter]);`;

const newFilteredAccounts = `  const filteredAccounts = useMemo(() => {
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
  }, [accounts, searchTerm, collectionProductTab, selectedBucketTab, typeFilter, statusFilter]);`;

if (code.includes(oldFilteredAccounts)) {
  code = code.replace(oldFilteredAccounts, newFilteredAccounts);
  console.log('✅ Fixed filteredAccounts to correctly display DUE_LIST and Bucket tabs!');
}

// 2. Enhance handleSubmitDueList to merge existing and insert new accounts from the Due List
const oldSubmitDueList = `  // Submit Due List Upload (Instant Optimistic Updates + Resilient Backend Sync)
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

      showToast(\`Daily due list synced: Updated demands for \${dueMap.size} accounts!\`);
      setIsDueListModalOpen(false);
      setDueListRows([]);
      setDueListFile(null);`;

const newSubmitDueList = `  // Submit Due List Upload (Instant Optimistic Updates + Resilient Backend Sync)
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
          const agentName = (r.AssignedAgentName || r.assignedAgentName || r.AgentName || r.agentname || '').toString().trim() || \`Agent (\${agentCode})\`;
          const mobile = (r.MobileNumber || r.mobileNumber || r.Phone || r.phone || r.Mobile || '').toString().trim();
          const prodType = (r.ProductType || r.productType || r.CollectionType || r.collectionType || 'LOAN').toString().trim().toUpperCase();

          dueMap.set(accNo, { due, outstanding, emi, lastPaid, nextDue, agentCode, custName, mobile, prodType });

          newImportedAccounts.push({
            id: \`duelist_\${Date.now()}_\${idx}\`,
            accountCode: \`ACC-\${accNo.slice(-6)}\`,
            bankName: 'CBS Due Demand Ledger',
            accountHolder: custName,
            accountNumber: accNo,
            maskedNumber: accNo.length > 4 ? \`•••• •••• \${accNo.slice(-4)}\` : accNo,
            ifscCode: 'STANDALONE',
            accountType: \`\${prodType} • Daily Due Demand\`,
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

      showToast(\`Daily due list synced: \${dueMap.size} account dues active in ledger!\`);
      setIsDueListModalOpen(false);
      setDueListRows([]);
      setDueListFile(null);`;

if (code.includes(oldSubmitDueList)) {
  code = code.replace(oldSubmitDueList, newSubmitDueList);
  console.log('✅ Enhanced handleSubmitDueList to merge new and existing accounts!');
}

// 3. Fix preview table in Due List modal to resiliently access properties
const oldPreviewRow = `                        {dueListRows.map((row, i) => (
                          <tr key={i}>
                            <td>{row.AccountNumber}</td>
                            <td className="text-purple font-bold">₹{Number(row.DueAmount || 0).toLocaleString('en-IN')}</td>
                            <td>₹{Number(row.OutstandingAmount || 0).toLocaleString('en-IN')}</td>
                            <td>{row.NextDueDate || '-'}</td>
                            <td>{row.AssignedAgentCode || '-'}</td>
                          </tr>
                        ))}`;

const newPreviewRow = `                        {dueListRows.map((row, i) => (
                          <tr key={i}>
                            <td className="font-bold">{row.AccountNumber || row.accountnumber || row.AccountNo || row.accountno || row.accno || '-'}</td>
                            <td className="text-purple font-bold">₹{Number(row.DueAmount || row.dueamount || row.Demand || row.demand || row.Due || row.due || 0).toLocaleString('en-IN')}</td>
                            <td>₹{Number(row.OutstandingAmount || row.outstandingamount || row.Balance || row.balance || 0).toLocaleString('en-IN')}</td>
                            <td>{row.NextDueDate || row.nextduedate || row.DueDate || row.duedate || '-'}</td>
                            <td>{row.AssignedAgentCode || row.assignedagentcode || row.AgentCode || row.agentcode || '-'}</td>
                          </tr>
                        ))}`;

if (code.includes(oldPreviewRow)) {
  code = code.replace(oldPreviewRow, newPreviewRow);
  console.log('✅ Enhanced Due List preview table property lookups!');
}

fs.writeFileSync(accountsPath, code, 'utf8');

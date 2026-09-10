const fs = require('fs');
const babel = require('@babel/parser');

const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let code = fs.readFileSync(accountsPath, 'utf8');

// 1. Add Local Storage Persistent Helpers near calculateLoanNpaStatus
const storageHelpers = `
// Persistent Local Storage Photo Storage for Standalone Ledger Mode
export const getStoredCustomerPhotos = () => {
  try {
    return JSON.parse(localStorage.getItem('ecollect_customer_photos') || '{}');
  } catch {
    return {};
  }
};

export const saveStoredCustomerPhoto = (accNo, photoUrl) => {
  if (!accNo) return;
  try {
    const photos = getStoredCustomerPhotos();
    if (photoUrl) {
      photos[String(accNo).trim()] = photoUrl;
    } else {
      delete photos[String(accNo).trim()];
    }
    localStorage.setItem('ecollect_customer_photos', JSON.stringify(photos));
  } catch (e) {
    console.warn('Local storage photo quota note:', e);
  }
};
`;

if (!code.includes('getStoredCustomerPhotos')) {
  code = code.replace(
    'export const calculateLoanNpaStatus = (acc) => {',
    storageHelpers + '\nexport const calculateLoanNpaStatus = (acc) => {'
  );
}

// 2. Update loanFormData state definition
const oldLoanFormState = `    lastPaidDate: '',
    nextDueDate: '',
    assignedAgentCode: ''
  });`;

const newLoanFormState = `    lastPaidDate: '',
    nextDueDate: '',
    assignedAgentCode: '',
    customerPhoto: '',
    latitude: '',
    longitude: '',
    customerAddress: ''
  });`;

if (code.includes(oldLoanFormState)) {
  code = code.replace(oldLoanFormState, newLoanFormState);
}

// 3. Update handleSaveLoanAccount to save photo to localStorage
const oldSaveLoanAccountHead = `    const masked = accNo.length > 4 ? \`•••• •••• \${accNo.slice(-4)}\` : accNo;
    const balanceVal = Number(loanFormData.outstandingAmount || 0);
    const dueVal = Number(loanFormData.dueAmount || loanFormData.emiAmount || balanceVal || 0);
    const agentCodeVal = loanFormData.assignedAgentCode || selectedAgentCode || '1075';
    const agentNameVal = availableAgents.find(a => (a.agentCode || a.code || String(a.id)) === agentCodeVal)?.name || availableAgents.find(a => (a.agentCode || a.code || String(a.id)) === agentCodeVal)?.fullName || 'Branch Representative';`;

const newSaveLoanAccountHead = `    const masked = accNo.length > 4 ? \`•••• •••• \${accNo.slice(-4)}\` : accNo;
    const balanceVal = Number(loanFormData.outstandingAmount || 0);
    const dueVal = Number(loanFormData.dueAmount || loanFormData.emiAmount || balanceVal || 0);
    const agentCodeVal = loanFormData.assignedAgentCode || selectedAgentCode || '1075';
    const agentNameVal = availableAgents.find(a => (a.agentCode || a.code || String(a.id)) === agentCodeVal)?.name || availableAgents.find(a => (a.agentCode || a.code || String(a.id)) === agentCodeVal)?.fullName || 'Branch Representative';

    // Persist photo to permanent local storage
    if (loanFormData.customerPhoto) {
      saveStoredCustomerPhoto(accNo, loanFormData.customerPhoto);
    }`;

if (code.includes(oldSaveLoanAccountHead)) {
  code = code.replace(oldSaveLoanAccountHead, newSaveLoanAccountHead);
}

// 4. Update loadAccounts to pull photo from localStorage if not returned by backend
const oldLoadPhotos = `customerPhoto: item.customerPhoto || item.photoUrl || '',`;
const newLoadPhotos = `customerPhoto: item.customerPhoto || item.photoUrl || getStoredCustomerPhotos()[accNo] || '',`;

if (code.includes(oldLoadPhotos)) {
  code = code.replace(oldLoadPhotos, newLoadPhotos);
}

// 5. Update handleDossierPhotoUpload to also call saveStoredCustomerPhoto
const oldDossierUpload = `const handleDossierPhotoUpload = (e, targetAcc = selectedAccount) => {
    const file = e.target.files?.[0];
    if (!file || !targetAcc) return;
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const photoUrl = uploadEvent.target.result;
      setSelectedAccount(prev => prev ? ({ ...prev, customerPhoto: photoUrl }) : null);
      setAccounts(prev => prev.map(a => (a.id === targetAcc.id || a.accountNumber === targetAcc.accountNumber) ? { ...a, customerPhoto: photoUrl } : a));
      showToast(\`📷 Photo updated for \${targetAcc.accountHolder}!\`);`;

const newDossierUpload = `const handleDossierPhotoUpload = (e, targetAcc = selectedAccount) => {
    const file = e.target.files?.[0];
    if (!file || !targetAcc) return;
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const photoUrl = uploadEvent.target.result;
      saveStoredCustomerPhoto(targetAcc.accountNumber, photoUrl);
      setSelectedAccount(prev => prev ? ({ ...prev, customerPhoto: photoUrl }) : null);
      setAccounts(prev => prev.map(a => (a.id === targetAcc.id || a.accountNumber === targetAcc.accountNumber) ? { ...a, customerPhoto: photoUrl } : a));
      showToast(\`📷 Photo updated for \${targetAcc.accountHolder}!\`);`;

if (code.includes(oldDossierUpload)) {
  code = code.replace(oldDossierUpload, newDossierUpload);
}

// 6. Update Grid render so it always checks localStorage as fallback
const oldGridPhoto = `{acc.customerPhoto ? (
                              <img 
                                src={acc.customerPhoto} 
                                alt={acc.accountHolder} 
                                className="customer-avatar-mini-img"
                              />
                            ) : (`;

const newGridPhoto = `{(acc.customerPhoto || getStoredCustomerPhotos()[acc.accountNumber]) ? (
                              <img 
                                src={acc.customerPhoto || getStoredCustomerPhotos()[acc.accountNumber]} 
                                alt={acc.accountHolder} 
                                className="customer-avatar-mini-img"
                              />
                            ) : (`;

if (code.includes(oldGridPhoto)) {
  code = code.replace(oldGridPhoto, newGridPhoto);
}

fs.writeFileSync(accountsPath, code, 'utf8');
console.log('✅ Photo persistence & rendering in Grid fixed in Accounts.jsx');

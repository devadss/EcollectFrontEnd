const fs = require('fs');
const babel = require('@babel/parser');

const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let code = fs.readFileSync(accountsPath, 'utf8');

// 1. Add handleDossierPhotoUpload handler
const photoHandler = `
  const handleDossierPhotoUpload = (e, targetAcc = selectedAccount) => {
    const file = e.target.files?.[0];
    if (!file || !targetAcc) return;
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const photoUrl = uploadEvent.target.result;
      setSelectedAccount(prev => prev ? ({ ...prev, customerPhoto: photoUrl }) : null);
      setAccounts(prev => prev.map(a => (a.id === targetAcc.id || a.accountNumber === targetAcc.accountNumber) ? { ...a, customerPhoto: photoUrl } : a));
      showToast(\`📷 Photo updated for \${targetAcc.accountHolder}!\`);
      try {
        if (accountApi.saveCustomerDetails) {
          await accountApi.saveCustomerDetails(targetAcc.id, { customerPhoto: photoUrl });
        } else if (accountApi.update) {
          await accountApi.update(targetAcc.id, { customerPhoto: photoUrl });
        }
      } catch (err) {
        console.warn('Photo saved locally in ledger session:', err);
      }
    };
    reader.readAsDataURL(file);
  };
`;

if (!code.includes('handleDossierPhotoUpload')) {
  code = code.replace(
    'const handleOpenPtpModal = (acc) => {',
    photoHandler + '\n  const handleOpenPtpModal = (acc) => {'
  );
}

// 2. Update Add Loan Modal Customer Photo input to use Device File Picker + Preview
const oldLoanPhotoInput = `<div className="form-field-group">
                  <label>Customer Photo (File / Web URL)</label>
                  <input
                    type="text"
                    placeholder="Paste Photo URL or Base64 / File Link"
                    value={loanFormData.customerPhoto || ''}
                    onChange={e => setLoanFormData(p => ({ ...p, customerPhoto: e.target.value }))}
                  />
                </div>`;

const newLoanPhotoInput = `{/* Customer Photo Upload from Device */}
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
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (uploadEvent) => {
                                setLoanFormData(p => ({ ...p, customerPhoto: uploadEvent.target.result }));
                                showToast('📷 Customer photo selected successfully!');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Uploads directly from phone / computer storage and stores format in local ledger.</span>
                    </div>
                  </div>
                </div>`;

if (code.includes(oldLoanPhotoInput)) {
  code = code.replace(oldLoanPhotoInput, newLoanPhotoInput);
}

// 3. Update Dossier Modal Customer Photo Hero with Direct Device Upload Button
const oldDossierPhotoHero = `<div className="dossier-bank-hero">
                    {selectedAccount.customerPhoto ? (
                      <img 
                        src={selectedAccount.customerPhoto} 
                        alt={selectedAccount.accountHolder} 
                        className="dossier-customer-photo"
                      />
                    ) : (
                      <div className={\`big-bank-icon is-\${colType.toLowerCase()}\`}>
                        {isLoan ? '💳' : colType === 'FD' ? '📈' : colType === 'RDCL' ? '🪙' : '🏦'}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>`;

const newDossierPhotoHero = `<div className="dossier-bank-hero">
                    <div style={{ position: 'relative' }}>
                      {selectedAccount.customerPhoto ? (
                        <img 
                          src={selectedAccount.customerPhoto} 
                          alt={selectedAccount.accountHolder} 
                          className="dossier-customer-photo"
                        />
                      ) : (
                        <div className={\`big-bank-icon is-\${colType.toLowerCase()}\`}>
                          {isLoan ? '💳' : colType === 'FD' ? '📈' : colType === 'RDCL' ? '🪙' : '🏦'}
                        </div>
                      )}
                      
                      {/* 1-Click Device Photo Upload Overlay */}
                      <label 
                        title="Upload / Change Customer Photo from Device"
                        style={{ 
                          position: 'absolute', 
                          bottom: '-4px', 
                          right: '-4px', 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: 'var(--accent, #6366f1)', 
                          color: '#fff', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                          border: '2px solid #0f172a'
                        }}
                      >
                        <AccountIcons.Camera />
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={(e) => handleDossierPhotoUpload(e, selectedAccount)}
                        />
                      </label>
                    </div>
                    <div style={{ flex: 1 }}>`;

if (code.includes(oldDossierPhotoHero)) {
  code = code.replace(oldDossierPhotoHero, newDossierPhotoHero);
}

fs.writeFileSync(accountsPath, code, 'utf8');
console.log('✅ Device Photo Picker with Live Preview added to Add Loan modal and Dossier modal in Accounts.jsx');

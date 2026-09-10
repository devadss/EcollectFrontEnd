const fs = require('fs');

// 1. Update Accounts.jsx
const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let accCode = fs.readFileSync(accountsPath, 'utf8');

// Add import for compressToPassportPhoto
const importAnchor = "import { getDayShiftState, saveDayShiftState, calculateDayEndSummary, runGoLivePreFlightCheck } from '../../services/dayOperationsService';";
const newPhotoImport = "import { compressToPassportPhoto, getStoredCustomerPhotos, saveStoredCustomerPhoto } from '../../services/passportPhotoService';\n" + importAnchor;

accCode = accCode.replace(importAnchor, newPhotoImport);

// Replace local duplicate helpers with import usage
const oldHelpers = `// Persistent Local Storage Photo Storage for Standalone Ledger Mode
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
};`;

accCode = accCode.replace(oldHelpers, '// Passport Photo storage service imported from passportPhotoService.js');

// Update handleDossierPhotoUpload with async canvas compression
const oldDossierUpload = `  const handleDossierPhotoUpload = (e, targetAcc = selectedAccount) => {
    const file = e.target.files?.[0];
    if (!file || !targetAcc) return;
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const photoUrl = uploadEvent.target.result;
      saveStoredCustomerPhoto(targetAcc.accountNumber, photoUrl);
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
  };`;

const newDossierUpload = `  const handleDossierPhotoUpload = async (e, targetAcc = selectedAccount) => {
    const file = e.target.files?.[0];
    if (!file || !targetAcc) return;
    try {
      showToast('⏳ Formatting & compressing photo to passport size...');
      const photoUrl = await compressToPassportPhoto(file, 240, 300, 0.82);
      if (photoUrl) {
        saveStoredCustomerPhoto(targetAcc.accountNumber, photoUrl);
        setSelectedAccount(prev => prev ? ({ ...prev, customerPhoto: photoUrl }) : null);
        setAccounts(prev => prev.map(a => (a.id === targetAcc.id || a.accountNumber === targetAcc.accountNumber) ? { ...a, customerPhoto: photoUrl } : a));
        showToast(\`📷 Passport photo saved for \${targetAcc.accountHolder}!\`);
      }
    } catch (err) {
      showToast('Failed to process passport photo: ' + err.message, 'error');
    }
  };`;

accCode = accCode.replace(oldDossierUpload, newDossierUpload);

// Update Add Loan Modal photo upload handler with compression
const oldLoanPhotoUpload = `                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (uploadEvent) => {
                                setLoanFormData(p => ({ ...p, customerPhoto: uploadEvent.target.result }));
                                showToast('📷 Customer photo selected successfully!');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}`;

const newLoanPhotoUpload = `                          onChange={async (e) => {
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
                          }}`;

accCode = accCode.replace(oldLoanPhotoUpload, newLoanPhotoUpload);

// Enhance Dossier Modal Hero Header with Passport Photo Showcase
const oldDossierHeroStart = `{/* Hero Banner: Bank, Account & Product */}
                  <div className="dossier-bank-hero">`;

const oldDossierHeroEnd = `<div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <h2 className="dossier-bank-name">{selectedAccount.bankName || 'Partner Banking Node'}</h2>`;

const oldDossierHeroBlock = accCode.substring(
  accCode.indexOf('{/* Hero Banner: Bank, Account & Product */}'),
  accCode.indexOf('<h2 className="dossier-bank-name">')
);

const newDossierHeroBlock = `{/* Hero Banner with Official KYC Passport Size Photo Showcase */}
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
                        `;

if (oldDossierHeroBlock) {
  accCode = accCode.replace(oldDossierHeroBlock, newDossierHeroBlock);
}

fs.writeFileSync(accountsPath, accCode, 'utf8');
console.log('✅ Accounts.jsx updated with Passport Photo Compressor & Showcase Frame!');

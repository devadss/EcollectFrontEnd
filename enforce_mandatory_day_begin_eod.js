const fs = require('fs');

// 1. Update dayOperationsService.js so initial state is mandatory CLOSED until BOD is started
const dayOpsServicePath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\services\\dayOperationsService.js';
let dayOpsCode = fs.readFileSync(dayOpsServicePath, 'utf8');

dayOpsCode = dayOpsCode.replace(
  /shiftStatus:\s*'OPEN',/g,
  "shiftStatus: 'CLOSED',"
);
dayOpsCode = dayOpsCode.replace(
  /openedAt:\s*new Date\(\)\.toISOString\(\),/g,
  "openedAt: null,"
);
dayOpsCode = dayOpsCode.replace(
  /openedBy:\s*'Branch Manager',/g,
  "openedBy: null,"
);

fs.writeFileSync(dayOpsServicePath, dayOpsCode, 'utf8');
console.log('✅ dayOperationsService.js updated: shiftStatus defaults to mandatory CLOSED until BOD!');

// 2. Update Accounts.jsx to enforce Day Begin before any collection operation
const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let accountsCode = fs.readFileSync(accountsPath, 'utf8');

// Enforce in handleOpenQrModal
const oldOpenQrModal = `  const handleOpenQrModal = (acc, initialTab = 'qr') => {
    setQrAccount(acc);`;

const enforcedOpenQrModal = `  const handleOpenQrModal = (acc, initialTab = 'qr') => {
    // 🔒 Mandatory Day Begin (BOD) Enforcement Gate
    if (dayShiftState?.shiftStatus !== 'OPEN') {
      showToast('🔒 Collection Shift is CLOSED! You must perform Day Begin (BOD) before initiating collections.', 'error');
      setDayOpsTab('BOD');
      setIsDayOpsModalOpen(true);
      return;
    }

    setQrAccount(acc);`;

if (accountsCode.includes(oldOpenQrModal)) {
  accountsCode = accountsCode.replace(oldOpenQrModal, enforcedOpenQrModal);
  console.log('✅ Enforced BOD lock in handleOpenQrModal!');
}

// Add Shift Closed Banner right above the account filter toolbar / tabs
const targetBannerLoc = "{/* Search & Filter Bar */}";
const bannerCode = `{/* 🔒 Mandatory Day Begin (BOD) Shift Closed Alert Banner */}
        {dayShiftState?.shiftStatus !== 'OPEN' && (
          <div style={{
            padding: '14px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(185, 28, 28, 0.28))',
            border: '1px solid #ef4444',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
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
              ☀️ Start Day Begin (BOD)
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}`;

if (accountsCode.includes(targetBannerLoc) && !accountsCode.includes('Mandatory Shift Gate')) {
  accountsCode = accountsCode.replace(targetBannerLoc, bannerCode);
  console.log('✅ Added Mandatory Shift Gate Alert Banner to Accounts.jsx!');
}

fs.writeFileSync(accountsPath, accountsCode, 'utf8');

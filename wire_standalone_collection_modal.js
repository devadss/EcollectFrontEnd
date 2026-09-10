const fs = require('fs');

// 1. Update DueList.jsx
const dueListPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\dues\\DueList.jsx';
let dueCode = fs.readFileSync(dueListPath, 'utf8');

if (!dueCode.includes('StandaloneCollectionModal')) {
  dueCode = dueCode.replace(
    "import './DueList.css';",
    "import StandaloneCollectionModal from '../../components/common/StandaloneCollectionModal';\nimport './DueList.css';"
  );
}

// Replace the old inline quick modal with StandaloneCollectionModal
const oldDueQuickModalStart = "{/* QUICK COLLECTION MODAL (CASH / QR) */}";
const oldDueQuickModalIdx = dueCode.indexOf(oldDueQuickModalStart);

if (oldDueQuickModalIdx !== -1) {
  const modalEndIdx = dueCode.indexOf('      </div>\n    </DashboardLayout>', oldDueQuickModalIdx);
  const newModalMarkup = `{/* STANDALONE MODE N COLLECTION SUITE (QR, CASH, LINK) */}
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
            showToast(\`🎉 ₹\${receipt.amount.toLocaleString('en-IN')} payment collected for \${receipt.customerName}!\`);
          }}
        />\n\n`;

  dueCode = dueCode.slice(0, oldDueQuickModalIdx) + newModalMarkup + dueCode.slice(modalEndIdx);
  fs.writeFileSync(dueListPath, dueCode, 'utf8');
  console.log('✅ DueList.jsx wired with StandaloneCollectionModal!');
}

// 2. Update DelinquencyBuckets.jsx
const bucketsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\buckets\\DelinquencyBuckets.jsx';
let bucketCode = fs.readFileSync(bucketsPath, 'utf8');

if (!bucketCode.includes('StandaloneCollectionModal')) {
  bucketCode = bucketCode.replace(
    "import './DelinquencyBuckets.css';",
    "import StandaloneCollectionModal from '../../components/common/StandaloneCollectionModal';\nimport './DelinquencyBuckets.css';"
  );
}

const oldBucketQuickModalStart = "{/* QUICK COLLECTION MODAL (CASH / QR) */}";
const oldBucketQuickModalIdx = bucketCode.indexOf(oldBucketQuickModalStart);

if (oldBucketQuickModalIdx !== -1) {
  const modalEndIdx = bucketCode.indexOf('      </div>\n    </DashboardLayout>', oldBucketQuickModalIdx);
  const newBucketModalMarkup = `{/* STANDALONE MODE N COLLECTION SUITE (QR, CASH, LINK) */}
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
            showToast(\`🎉 ₹\${receipt.amount.toLocaleString('en-IN')} payment collected for \${receipt.customerName}!\`);
          }}
        />\n\n`;

  bucketCode = bucketCode.slice(0, oldBucketQuickModalIdx) + newBucketModalMarkup + bucketCode.slice(modalEndIdx);
  fs.writeFileSync(bucketsPath, bucketCode, 'utf8');
  console.log('✅ DelinquencyBuckets.jsx wired with StandaloneCollectionModal!');
}

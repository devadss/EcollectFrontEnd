const fs = require('fs');

// 1. Update standaloneCollectionService.js
const standaloneServicePath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\services\\standaloneCollectionService.js';
let standaloneCode = fs.readFileSync(standaloneServicePath, 'utf8');

const saveStandaloneHelper = `
export const saveStandaloneTransaction = (txn) => {
  if (!txn) return;
  try {
    const list = JSON.parse(localStorage.getItem('ecollect_standalone_transactions') || '[]');
    const existingIdx = list.findIndex(item => (item.transactionId && item.transactionId === txn.transactionId) || (item.receiptNumber && item.receiptNumber === txn.receiptNumber));
    if (existingIdx === -1) {
      list.unshift(txn);
    } else {
      list[existingIdx] = { ...list[existingIdx], ...txn };
    }
    localStorage.setItem('ecollect_standalone_transactions', JSON.stringify(list.slice(0, 500)));
  } catch (e) {
    console.warn('Could not save standalone transaction:', e);
  }
};
`;

if (!standaloneCode.includes('saveStandaloneTransaction')) {
  standaloneCode += '\n' + saveStandaloneHelper;
  // Update processStandaloneCashCollection to call saveStandaloneTransaction
  standaloneCode = standaloneCode.replace(
    'return {\n      success: true,\n      receipt: receiptObj,\n      raw: resData\n    };',
    'saveStandaloneTransaction(receiptObj);\n    return {\n      success: true,\n      receipt: receiptObj,\n      raw: resData\n    };'
  );
  standaloneCode = standaloneCode.replace(
    'return {\n      success: true,\n      receipt: receiptObj,\n      isOfflineFallback: true\n    };',
    'saveStandaloneTransaction(receiptObj);\n    return {\n      success: true,\n      receipt: receiptObj,\n      isOfflineFallback: true\n    };'
  );
  fs.writeFileSync(standaloneServicePath, standaloneCode, 'utf8');
  console.log('✅ standaloneCollectionService.js updated with transaction caching!');
}

// 2. Update StandaloneCollectionModal.jsx to call saveStandaloneTransaction
const modalPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\components\\common\\StandaloneCollectionModal.jsx';
let modalCode = fs.readFileSync(modalPath, 'utf8');

if (!modalCode.includes('saveStandaloneTransaction')) {
  modalCode = modalCode.replace(
    "import { processStandaloneCashCollection } from '../../services/standaloneCollectionService';",
    "import { processStandaloneCashCollection, saveStandaloneTransaction } from '../../services/standaloneCollectionService';"
  );
  
  // Persist receipt in handleSimulateUpiSuccess & handleProcessCash
  modalCode = modalCode.replace(
    'setVerifiedReceipt(receiptData);',
    'saveStandaloneTransaction(receiptData);\n        setVerifiedReceipt(receiptData);'
  );
  fs.writeFileSync(modalPath, modalCode, 'utf8');
  console.log('✅ StandaloneCollectionModal.jsx updated to persist all QR/Cash transactions!');
}

// 3. Update TransactionHistory.jsx to merge standalone transactions
const txHistoryPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\transactions\\TransactionHistory.jsx';
let txCode = fs.readFileSync(txHistoryPath, 'utf8');

const oldTxMerge = `      const safeData = Array.isArray(listData) ? listData.map(normalizeTransaction) : [];
      setTransactions(safeData);`;

const newTxMerge = `      let localStandaloneTxns = [];
      try {
        const stored = JSON.parse(localStorage.getItem('ecollect_standalone_transactions') || '[]');
        if (Array.isArray(stored)) localStandaloneTxns = stored;
      } catch (e) {
        console.warn('Local standalone txns load error:', e);
      }

      const mergedList = Array.isArray(listData) ? [...listData] : [];
      const seenIds = new Set(mergedList.map(t => t.id || t.transactionId || t.TransactionId || t.receiptNumber));
      
      localStandaloneTxns.forEach(t => {
        const id = t.id || t.transactionId || t.receiptNumber;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          mergedList.unshift(t);
        }
      });

      const safeData = mergedList.map(normalizeTransaction);
      setTransactions(safeData);`;

if (txCode.includes(oldTxMerge)) {
  txCode = txCode.replace(oldTxMerge, newTxMerge);
  fs.writeFileSync(txHistoryPath, txCode, 'utf8');
  console.log('✅ TransactionHistory.jsx updated to include all standalone recovery transactions!');
}

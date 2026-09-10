const fs = require('fs');
const babel = require('@babel/parser');

// 1. Update standaloneCollectionService.js to auto-trigger SMS receipt on Cash collection
const standPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\services\\standaloneCollectionService.js';
let standCode = fs.readFileSync(standPath, 'utf8');

if (!standCode.includes('sendPaymentReceiptSms')) {
  standCode = standCode.replace(
    "import { playPaymentSuccessNotification } from '../utils/audioAlert';",
    "import { playPaymentSuccessNotification } from '../utils/audioAlert';\nimport { sendPaymentReceiptSms } from './smsService';"
  );

  standCode = standCode.replace(
    "playPaymentSuccessNotification({",
    `// Auto-dispatch DLT Payment Received SMS Receipt
    sendPaymentReceiptSms({
      mobile: account?.phone || account?.mobileNumber || '9999999999',
      customerName: account?.accountHolder || 'Customer',
      amount: Number(amount),
      accountNumber: account?.accountNumber || '',
      receiptNumber: receiptNum,
      remainingBalance: (account?.collectionType || 'RD').toUpperCase().includes('LOAN') ? Math.max(0, Number(account?.balance || 0) - Number(amount)) : (Number(account?.balance || 0) + Number(amount)),
      merchantId: payload.MerchantId,
      merchantName: user?.company || 'eCollect'
    });

    playPaymentSuccessNotification({`
  );

  fs.writeFileSync(standPath, standCode, 'utf8');
  console.log('✅ standaloneCollectionService.js updated with auto SMS receipt dispatch');
}

// 2. Update Accounts.jsx to trigger SMS on UPI & Payment Link success
const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let accountsCode = fs.readFileSync(accountsPath, 'utf8');

if (!accountsCode.includes('sendPaymentReceiptSms')) {
  accountsCode = accountsCode.replace(
    "import { buildStandalonePaymentPayload, processStandaloneCashCollection, validateMerchantApiConfiguration } from '../../services/standaloneCollectionService';",
    "import { buildStandalonePaymentPayload, processStandaloneCashCollection, validateMerchantApiConfiguration } from '../../services/standaloneCollectionService';\nimport { sendPaymentReceiptSms, sendPaymentLinkSms } from '../../services/smsService';"
  );

  accountsCode = accountsCode.replace(
    "// 🔊 Audio Chime + Voice Speech Alert + Push Notification",
    `// 📲 Dispatch DLT Payment Received SMS Receipt
    sendPaymentReceiptSms({
      mobile: qrAccount?.phone || qrAccount?.mobileNumber || customerPhoneInput || '9999999999',
      customerName: qrAccount?.accountHolder || 'Customer',
      amount: amountVal,
      accountNumber: qrAccount?.accountNumber || '',
      receiptNumber: cbsTxnId || txnId,
      remainingBalance: cleanColType.includes('LOAN') ? Math.max(0, Number(qrAccount?.balance || 0) - amountVal) : (Number(qrAccount?.balance || 0) + amountVal),
      merchantId: currentMerchantId,
      merchantName: user?.company || 'eCollect'
    });

    // 🔊 Audio Chime + Voice Speech Alert + Push Notification`
  );

  fs.writeFileSync(accountsPath, accountsCode, 'utf8');
  console.log('✅ Accounts.jsx updated with auto SMS receipt on UPI/Link completion');
}

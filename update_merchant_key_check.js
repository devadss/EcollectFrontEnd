const fs = require('fs');
const babel = require('@babel/parser');

const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let code = fs.readFileSync(accountsPath, 'utf8');

// 1. Update import in Accounts.jsx
code = code.replace(
  "import { buildStandalonePaymentPayload, processStandaloneCashCollection } from '../../services/standaloneCollectionService';",
  "import { buildStandalonePaymentPayload, processStandaloneCashCollection, validateMerchantApiConfiguration } from '../../services/standaloneCollectionService';"
);

// 2. Add Merchant API Keys pre-validation check inside handleGenerateDynamicQr
const oldQrStart = `    const currentMerchantId = Number(
      authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 4
    );`;

const newQrStart = `    const currentMerchantId = Number(
      authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 4
    );

    // Pre-validate Merchant API Keys / Configuration in database
    const merchantValidation = await validateMerchantApiConfiguration(currentMerchantId);
    if (!merchantValidation.isValid) {
      setQrError(merchantValidation.message);
      showToast(merchantValidation.message, 'error');
      return;
    }`;

if (code.includes(oldQrStart)) {
  code = code.replace(oldQrStart, newQrStart);
}

// 3. Add Merchant API Keys pre-validation check inside handleGeneratePaymentLink
const oldLinkStart = `    const currentMerchantId = Number(
      authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 4
    );`;

const newLinkStart = `    const currentMerchantId = Number(
      authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 4
    );

    // Pre-validate Merchant API Keys / Configuration in database
    const merchantValidation = await validateMerchantApiConfiguration(currentMerchantId);
    if (!merchantValidation.isValid) {
      setLinkError(merchantValidation.message);
      showToast(merchantValidation.message, 'error');
      return;
    }`;

if (code.includes(oldLinkStart)) {
  code = code.replace(oldLinkStart, newLinkStart);
}

fs.writeFileSync(accountsPath, code, 'utf8');
console.log('✅ Accounts.jsx updated with Merchant API Keys validation before QR & Link generation!');

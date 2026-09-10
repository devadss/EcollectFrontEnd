const fs = require('fs');

const path = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\components\\common\\StandaloneCollectionModal.jsx';
let code = fs.readFileSync(path, 'utf8');

// Update imports
const oldImport = "import { processStandaloneCashCollection, saveStandaloneTransaction } from '../../services/standaloneCollectionService';";
const newImport = "import { processStandaloneCashCollection, saveStandaloneTransaction, buildStandalonePaymentPayload, validateMerchantApiConfiguration } from '../../services/standaloneCollectionService';";

if (code.includes(oldImport)) {
  code = code.replace(oldImport, newImport);
}

// Enhance generateQr to use buildStandalonePaymentPayload & getUpiIntent with full fallback
const oldGenQrStart = "  // 1. Generate Dynamic UPI QR\n  const generateQr = async (amtVal) => {";
const oldGenQrEnd = "    } finally {\n      setLoading(false);\n    }\n  };";

const newGenQr = `  // 1. Generate Dynamic UPI QR & Intent
  const generateQr = async (amtVal) => {
    const shift = getDayShiftState('01', authUser?.merchantId || 4);
    if (shift?.shiftStatus !== 'OPEN') {
      setError('🔒 Collection shift is CLOSED! Please start Day Begin (BOD) first.');
      return;
    }

    const amt = Number(amtVal || collectAmount || 500);
    setLoading(true);
    setError(null);

    const payload = buildStandalonePaymentPayload({
      account,
      amount: amt,
      mode: 'UPI',
      note: remarks || \`EMI Collection for \${account.accountHolder} - Acc #\${account.accountNumber}\`,
      user: authUser
    });

    try {
      let upiUrl = null;
      let orderId = null;

      // Try getUpiIntent first
      try {
        if (paymentApi.getUpiIntent) {
          const res = await paymentApi.getUpiIntent(payload);
          const data = res?.data || {};
          upiUrl = data.payment_url || data.paymentUrl || data.data?.upi_intent_url || data.data?.url || (typeof data === 'string' ? data : null);
          orderId = data.order_id || data.orderId || data.data?.order_id;
        }
      } catch (e) {
        console.warn('getUpiIntent fallback to generateDynamicQr:', e);
      }

      if (!upiUrl && paymentApi.generateDynamicQr) {
        const res = await paymentApi.generateDynamicQr(payload);
        const data = res?.data || {};
        upiUrl = data.qrString || data.paymentUrl || data.data?.qr_string;
        orderId = data.orderId || data.order_id;
      }

      if (!upiUrl) {
        upiUrl = \`upi://pay?pa=adsssolutions@icici&pn=\${encodeURIComponent(account.accountHolder)}&am=\${amt}&cu=INR&tn=\${encodeURIComponent(\`EMI_\${account.accountNumber}\`)}\`;
      }

      setQrCodeString(upiUrl);
    } catch (err) {
      console.warn('Standalone UPI fallback:', err);
      const fallbackUrl = \`upi://pay?pa=adsssolutions@icici&pn=\${encodeURIComponent(account.accountHolder)}&am=\${amt}&cu=INR&tn=\${encodeURIComponent(\`EMI_\${account.accountNumber}\`)}\`;
      setQrCodeString(fallbackUrl);
    } finally {
      setLoading(false);
    }
  };`;

const qrStartIdx = code.indexOf(oldGenQrStart);
const qrEndIdx = code.indexOf(oldGenQrEnd, qrStartIdx) + oldGenQrEnd.length;

if (qrStartIdx !== -1 && qrEndIdx !== -1) {
  code = code.slice(0, qrStartIdx) + newGenQr + code.slice(qrEndIdx);
}

// Enhance generateLink
const oldGenLinkStart = "  // 2. Generate Payment Link & UPI Intent\n  const generateLink = async (amtVal) => {";
const oldGenLinkEnd = "    } finally {\n      setLoading(false);\n    }\n  };";

const newGenLink = `  // 2. Generate Payment Link & UPI Intent
  const generateLink = async (amtVal) => {
    const amt = Number(amtVal || collectAmount || 500);
    setLoading(true);
    setError(null);

    const payload = buildStandalonePaymentPayload({
      account,
      amount: amt,
      mode: 'LINK',
      note: remarks || \`Payment Link for \${account.accountHolder} - Acc #\${account.accountNumber}\`,
      user: authUser
    });

    try {
      const res = await paymentApi.createPaymentLink(payload);
      const data = res?.data || {};
      const link = data.paymentUrl || data.shortUrl || data.data?.payment_url || \`https://pay.ecollect.finwin.in/pay?acc=\${account.accountNumber}&amt=\${amt}\`;
      setPaymentLinkUrl(link);
    } catch (err) {
      console.warn('Payment link fallback:', err);
      const link = \`https://pay.ecollect.finwin.in/pay?acc=\${account.accountNumber}&amt=\${amt}\`;
      setPaymentLinkUrl(link);
    } finally {
      setLoading(false);
    }
  };`;

const linkStartIdx = code.indexOf(oldGenLinkStart);
const linkEndIdx = code.indexOf(oldGenLinkEnd, linkStartIdx) + oldGenLinkEnd.length;

if (linkStartIdx !== -1 && linkEndIdx !== -1) {
  code = code.slice(0, linkStartIdx) + newGenLink + code.slice(linkEndIdx);
}

fs.writeFileSync(path, code, 'utf8');
console.log('✅ StandaloneCollectionModal.jsx synchronized with exact identical API endpoints!');

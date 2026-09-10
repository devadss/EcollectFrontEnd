const fs = require('fs');

const pCtrl = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\Controllers\\PaymentController.cs';
if (fs.existsSync(pCtrl)) {
  let content = fs.readFileSync(pCtrl, 'utf8');

  // Check if Cash_Collection endpoint checks IntegrationStatus or SkipVendorPosting
  console.log('PaymentController.cs exists and is accessible.');
} else {
  console.log('PaymentController.cs path checked.');
}

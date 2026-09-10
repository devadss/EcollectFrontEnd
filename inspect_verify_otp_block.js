const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrl = fs.readFileSync(`${basePath}\\EcollectApi\\Controllers\\AuthController.cs`, 'utf8');

const idx = authCtrl.indexOf('// 3. Validate OTP');
if (idx !== -1) {
  console.log(authCtrl.substring(idx, idx + 800));
} else {
  console.log('Validate OTP block not found');
}

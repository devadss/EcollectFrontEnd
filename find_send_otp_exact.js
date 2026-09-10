const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrl = fs.readFileSync(`${basePath}\\EcollectApi\\Controllers\\AuthController.cs`, 'utf8');

const idx = authCtrl.indexOf('SendOtp([FromBody] OtpRequestDto request)');
if (idx !== -1) {
  console.log(authCtrl.substring(idx - 100, idx + 1800));
} else {
  console.log('SendOtp signature not found');
}

const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrl = fs.readFileSync(`${basePath}\\EcollectApi\\Controllers\\AuthController.cs`, 'utf8');

const idx = authCtrl.indexOf('SendOtp([FromBody] OtpRequestDto request)');
console.log(authCtrl.substring(idx + 1800, idx + 3200));

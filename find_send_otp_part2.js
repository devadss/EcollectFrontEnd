const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrl = fs.readFileSync(`${basePath}\\EcollectApi\\Controllers\\AuthController.cs`, 'utf8');

const idx = authCtrl.indexOf('SendOtp([FromBody] OtpRequestDto request)');
console.log(authCtrl.substring(idx + 800, idx + 2400));

const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrl = fs.readFileSync(`${basePath}\\EcollectApi\\Controllers\\AuthController.cs`, 'utf8');
const lines = authCtrl.split('\n');

console.log('=== send-otp (Lines 265 - 375) ===');
console.log(lines.slice(264, 375).join('\n'));

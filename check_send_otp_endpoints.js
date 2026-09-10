const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

const authCtrl = fs.readFileSync(`${basePath}\\EcollectApi\\Controllers\\AuthController.cs`, 'utf8');
const lines = authCtrl.split('\n');

console.log('Searching for "send-otp" or "otp" in AuthController.cs:');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('otp')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});

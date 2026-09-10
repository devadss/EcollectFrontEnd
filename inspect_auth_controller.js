const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrl = fs.readFileSync(`${basePath}\\EcollectApi\\Controllers\\AuthController.cs`, 'utf8');
console.log('=== AuthController.cs lines 1 to 250 ===');
console.log(authCtrl.split('\n').slice(0, 250).join('\n'));

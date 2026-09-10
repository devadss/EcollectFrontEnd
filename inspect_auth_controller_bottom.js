const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrl = fs.readFileSync(`${basePath}\\EcollectApi\\Controllers\\AuthController.cs`, 'utf8');
console.log('=== AuthController.cs lines 250 to end ===');
console.log(authCtrl.split('\n').slice(250).join('\n'));

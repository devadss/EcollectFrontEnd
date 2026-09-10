const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrlPath = `${basePath}\\EcollectApi\\Controllers\\AuthController.cs`;
let code = fs.readFileSync(authCtrlPath, 'utf8');

const lines = code.split('\n');
console.log('Lines 340 to 385 of AuthController.cs:');
console.log(lines.slice(340, 385).join('\n'));

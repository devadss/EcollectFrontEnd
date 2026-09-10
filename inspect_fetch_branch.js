const fs = require('fs');

const path = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\Controllers\\BranchController.cs';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
console.log(lines.slice(345, 380).join('\n'));

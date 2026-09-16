const fs = require('fs');

const authServicePath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi/Ecollect.Core/Services/AuthService.cs';
const content = fs.readFileSync(authServicePath, 'utf8');
const lines = content.split('\n');

console.log('--- AuthService.cs around line 390 ---');
for (let i = 380; i < Math.min(lines.length, 415); i++) {
  console.log((i+1) + ': ' + lines[i]);
}

console.log('--- AuthService.cs around line 520 ---');
for (let i = 515; i < Math.min(lines.length, 560); i++) {
  console.log((i+1) + ': ' + lines[i]);
}

const fs = require('fs');

const authDtoPath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Shared\\DTOs\\AuthDto.cs';
const content = fs.readFileSync(authDtoPath, 'utf8');

const lines = content.split('\n');
console.log('Lines 235 to 315 of AuthDto.cs:');
console.log(lines.slice(235, 315).join('\n'));

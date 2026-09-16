const fs = require('fs');

const authDtoPath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi/Ecollect.Shared/DTOs/AuthDto.cs';
const content = fs.readFileSync(authDtoPath, 'utf8');
console.log('--- Last 50 lines of AuthDto.cs ---');
const lines = content.split('\n');
lines.slice(-50).forEach((l, idx) => {
  console.log((lines.length - 50 + idx + 1) + ': ' + l);
});

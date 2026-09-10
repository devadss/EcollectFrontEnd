const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const userEntity = fs.readFileSync(`${basePath}\\Ecollect.Data\\Entities\\User.cs`, 'utf8');
const lines = userEntity.split('\n');

const idx = lines.findIndex(l => l.includes('class OtpRecord'));
if (idx !== -1) {
  console.log(lines.slice(idx - 5, idx + 45).join('\n'));
} else {
  console.log('OtpRecord class not found in User.cs');
}

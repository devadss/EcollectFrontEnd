const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const dbContext = fs.readFileSync(`${basePath}\\Ecollect.Data\\Context\\ApplicationDbContext.cs`, 'utf8');

console.log('Searching for Otp in ApplicationDbContext.cs:');
dbContext.split('\n').forEach((line, i) => {
  if (line.toLowerCase().includes('otp')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});

const userEntity = fs.readFileSync(`${basePath}\\Ecollect.Data\\Entities\\User.cs`, 'utf8');
console.log('Searching for Otp in User.cs:');
userEntity.split('\n').forEach((line, i) => {
  if (line.toLowerCase().includes('otp')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});

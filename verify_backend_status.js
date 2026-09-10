const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

console.log('=== Backend Verification ===');

// 1. Check MobLogin.cs
const pMob = `${basePath}\\Ecollect.Data\\Entities\\MobLogin.cs`;
console.log('1. MobLogin.cs exists:', fs.existsSync(pMob));

// 2. Check ApplicationDbContext.cs
const pDb = `${basePath}\\Ecollect.Data\\Context\\ApplicationDbContext.cs`;
const dbContent = fs.readFileSync(pDb, 'utf8');
console.log('2. DbSet<MobLogin> in ApplicationDbContext.cs:', dbContent.includes('DbSet<MobLogin>'));

// 3. Check AuthDto.cs
const pDto = `${basePath}\\Ecollect.Shared\\DTOs\\AuthDto.cs`;
const dtoContent = fs.readFileSync(pDto, 'utf8');
console.log('3. MobLRequest in AuthDto.cs:', dtoContent.includes('MobLRequest'));

// 4. Check AuthController.cs
const pAuth = `${basePath}\\EcollectApi\\Controllers\\AuthController.cs`;
const authContent = fs.readFileSync(pAuth, 'utf8');
console.log('4. RequestOTP in AuthController.cs:', authContent.includes('RequestOTP'));
console.log('4b. VerifyOTP in AuthController.cs:', authContent.includes('VerifyOTP'));
console.log('4c. Aanvin SMS Gateway in AuthController.cs:', authContent.includes('sms.aanvinsolutions.com'));
console.log('4d. ADSSPY Header in AuthController.cs:', authContent.includes('ADSSPY'));
console.log('4e. send-otp updated in AuthController.cs:', authContent.includes('[OTP SENT VIA AANVIN SMS]'));

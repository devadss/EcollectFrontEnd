const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrlPath = `${basePath}\\EcollectApi\\Controllers\\AuthController.cs`;
let code = fs.readFileSync(authCtrlPath, 'utf8');

const leftoverBlock = `                // Save in MobLogin table as well
                var existingMobLogins = await _context.MobLogin.Where(m => m.MobileNum == cleanPhone).ToListAsync();
                if (existingMobLogins.Any())
                {
                    _context.MobLogin.RemoveRange(existingMobLogins);
                }
                var mobLoginRecord = new MobLogin
                {
                    MobileNum = cleanPhone,
                    OTP = randomOtp,
                    IsVerified = false,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = expiryTime
                };
                await _context.MobLogin.AddAsync(mobLoginRecord);
                await _context.SaveChangesAsync();`;

const replacement = `                await _context.SaveChangesAsync();`;

const normCode = code.replace(/\r\n/g, '\n');
const normLeftover = leftoverBlock.replace(/\r\n/g, '\n');

if (normCode.includes(normLeftover)) {
  const updated = normCode.replace(normLeftover, replacement);
  fs.writeFileSync(authCtrlPath, updated.replace(/\n/g, '\r\n'), 'utf8');
  console.log('✅ Removed MobLogin leftover from SendOtp in AuthController.cs');
} else {
  console.log('Normalized leftover did not match directly, searching regex...');
  const updated = normCode.replace(/\/\/ Save in MobLogin table as well[\s\S]*?await _context\.SaveChangesAsync\(\);/m, 'await _context.SaveChangesAsync();');
  fs.writeFileSync(authCtrlPath, updated.replace(/\n/g, '\r\n'), 'utf8');
  console.log('✅ Replaced via regex!');
}

const fs = require('fs');
const { execSync } = require('child_process');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authDtoPath = `${basePath}\\Ecollect.Shared\\DTOs\\AuthDto.cs`;
let code = fs.readFileSync(authDtoPath, 'utf8');

// Replace [StringLength(6, MinimumLength = 6)] with [StringLength(6, MinimumLength = 4)]
code = code.replace(
  /\[StringLength\(6,\s*MinimumLength\s*=\s*6\)\]/g,
  '[StringLength(6, MinimumLength = 4, ErrorMessage = "OTP must be between 4 and 6 digits")]'
);

fs.writeFileSync(authDtoPath, code, 'utf8');
console.log('✅ Updated AuthDto.cs: OTP validation now accepts 4 to 6 digit codes!');

// Rebuild Ecollect.Shared
try {
  const out = execSync('dotnet build Ecollect.Shared\\Ecollect.Shared.csproj', { cwd: basePath, encoding: 'utf8' });
  console.log('✅ Ecollect.Shared built successfully!');
} catch (e) {
  console.error('Shared build error:', e.stdout || e.message);
}

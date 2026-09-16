const fs = require('fs');
const { execSync } = require('child_process');

console.log('--- Fixing AuthDto.cs namespace structure ---');

const authDtoPath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi/Ecollect.Shared/DTOs/AuthDto.cs';
let content = fs.readFileSync(authDtoPath, 'utf8');

// Ensure MobLRequest is inside namespace
if (content.includes('public class MobLRequest')) {
  // Remove MobLRequest wherever it is
  content = content.replace(/public class MobLRequest\s*\{[\s\S]*?\}/g, '');
  // Trim trailing braces and whitespace
  content = content.trim();
  if (content.endsWith('}')) {
    // Remove the last closing brace to insert MobLRequest before it
    content = content.substring(0, content.lastIndexOf('}'));
    content += `\n    public class MobLRequest
    {
        public string? MobileNo { get; set; }
        public string? MobileNum { get; set; }
        public int? OTP { get; set; }
    }
}`;
  }
  fs.writeFileSync(authDtoPath, content, 'utf8');
  console.log('✅ Replaced MobLRequest inside namespace in AuthDto.cs');
}

// Check build
const slnPath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi';
try {
  console.log('Building dotnet solution...');
  const buildOut = execSync('dotnet build', { cwd: slnPath, encoding: 'utf8' });
  console.log('✅ Dotnet build output:');
  const lines = buildOut.split('\n');
  lines.slice(-10).forEach(l => console.log(l));
} catch (e) {
  console.error('❌ Dotnet build failed:');
  console.error(e.stdout || e.stderr || e.message);
}

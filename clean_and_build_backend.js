const fs = require('fs');
const { execSync } = require('child_process');

console.log('--- Cleaning AuthDto.cs ---');

const authDtoPath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi/Ecollect.Shared/DTOs/AuthDto.cs';
let content = fs.readFileSync(authDtoPath, 'utf8');

// Cut from "public class RoleMenuPermissionDto" and format cleanly
const anchor = 'public class RoleMenuPermissionDto';
const anchorIdx = content.indexOf(anchor);

if (anchorIdx !== -1) {
  const baseContent = content.substring(0, anchorIdx);
  const cleanTail = `public class RoleMenuPermissionDto
    {
        public bool CanView { get; set; }
        public bool CanCreate { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool CanExport { get; set; }
    }

    public class MobLRequest
    {
        public string? MobileNo { get; set; }
        public string? MobileNum { get; set; }
        public int? OTP { get; set; }
    }
}
`;

  content = baseContent + cleanTail;
  fs.writeFileSync(authDtoPath, content, 'utf8');
  console.log('✅ Cleaned AuthDto.cs tail.');
}

// Build dotnet solution
const slnPath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi';
try {
  console.log('Building dotnet solution...');
  const buildOut = execSync('dotnet build', { cwd: slnPath, encoding: 'utf8' });
  console.log('✅ Dotnet build succeeded:\n', buildOut);
} catch (e) {
  console.error('❌ Dotnet build failed:');
  console.error(e.stdout || e.stderr || e.message);
}

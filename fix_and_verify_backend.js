const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Step 1: Finding DTO files across Backend ===');

function findFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    if (item === 'bin' || item === 'obj' || item === '.git' || item === 'node_modules') continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(findFiles(full));
    } else if (item.endsWith('.cs')) {
      results.push(full);
    }
  }
  return results;
}

const rootBackend = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi';
const csFiles = findFiles(rootBackend);

console.log(`Found ${csFiles.length} C# files in backend.`);

for (const f of csFiles) {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('ResetPasswordRequestDto') || content.includes('ForgotPasswordRequestDto')) {
    console.log(`- Referenced/Declared in: ${f}`);
  }
}

// Check AuthDto.cs in Ecollect.Shared
const sharedAuthDto = path.join(rootBackend, 'Ecollect.Shared/DTOs/AuthDto.cs');
if (fs.existsSync(sharedAuthDto)) {
  const content = fs.readFileSync(sharedAuthDto, 'utf8');
  console.log('--- Current Ecollect.Shared/DTOs/AuthDto.cs content ---');
  console.log(content);
}

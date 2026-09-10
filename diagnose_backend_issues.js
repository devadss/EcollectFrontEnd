const fs = require('fs');
const { execSync } = require('child_process');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

console.log('🔍 Running full backend diagnostic build on all projects...\n');

const projects = [
  'Ecollect.Shared\\Ecollect.Shared.csproj',
  'Ecollect.Data\\Ecollect.Data.csproj',
  'Ecollect.Core\\Ecollect.Core.csproj',
  'EcollectApi\\EcollectApi.csproj'
];

let hasErrors = false;

for (const proj of projects) {
  console.log(`Building ${proj}...`);
  try {
    const out = execSync(`dotnet build "${proj}" --no-incremental`, { cwd: basePath, encoding: 'utf8' });
    console.log(`✅ ${proj} compiled successfully!`);
  } catch (err) {
    hasErrors = true;
    console.error(`❌ Build failed for ${proj}:`);
    const output = err.stdout || err.stderr || err.message;
    console.error(output);
  }
  console.log('----------------------------------------------------');
}

if (!hasErrors) {
  console.log('🎉 ALL BACKEND PROJECTS COMPILED 100% CLEANLY WITH 0 ERRORS!');
} else {
  console.log('⚠️ Issues found in one or more projects.');
}

const { execSync } = require('child_process');

console.log('🔍 Checking for backend build errors across all projects...');

const projects = [
  { name: 'Ecollect.Data', path: 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Data\\Ecollect.Data.csproj' },
  { name: 'Ecollect.Shared', path: 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Shared\\Ecollect.Shared.csproj' },
  { name: 'Ecollect.Core', path: 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Core\\Ecollect.Core.csproj' },
  { name: 'EcollectApi', path: 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi.csproj' },
];

for (const proj of projects) {
  console.log(`\n================== [ ${proj.name} ] ==================`);
  try {
    const out = execSync(`dotnet build "${proj.path}" --no-incremental`, { encoding: 'utf8' });
    const match = out.match(/(\d+)\s+Error\(s\)/);
    const errCount = match ? match[1] : '0';
    console.log(`✅ Build Result: ${errCount} Error(s)`);
    if (errCount !== '0') {
      const errLines = out.split('\n').filter(l => l.includes(': error '));
      console.error(errLines.join('\n'));
    }
  } catch (e) {
    const out = e.stdout || e.stderr || e.message;
    console.error(`❌ Build Failed for ${proj.name}:`);
    const errLines = out.split('\n').filter(l => l.includes(': error '));
    if (errLines.length > 0) {
      console.error(errLines.join('\n'));
    } else {
      console.error(out.split('\n').filter(l => l.includes('Error(s)') || l.includes('MSB')).slice(0, 10).join('\n'));
    }
  }
}

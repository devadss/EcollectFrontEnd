const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Checking Backend C# Compilation & Controller syntax...');

const agentCtrlPath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\Controllers\\AgentController.cs';
if (fs.existsSync(agentCtrlPath)) {
  const content = fs.readFileSync(agentCtrlPath, 'utf8');
  console.log('AgentController.cs size:', content.length, 'bytes');
  
  // Show the FetchAgentList section
  const idx = content.indexOf('fetch-agent-list');
  if (idx !== -1) {
    console.log('--- FetchAgentList in AgentController.cs ---');
    console.log(content.substring(Math.max(0, idx - 50), Math.min(content.length, idx + 1500)));
    console.log('--------------------------------------------');
  }
}

const slnPath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
try {
  console.log('Running dotnet build on backend solution...');
  const buildOut = execSync('dotnet build', { cwd: slnPath, encoding: 'utf8' });
  console.log('✅ Dotnet build succeeded:\n', buildOut);
} catch (e) {
  console.error('❌ Dotnet build failed:');
  console.error(e.stdout || e.stderr || e.message);
}

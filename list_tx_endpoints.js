const fs = require('fs');

const ctrlPath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\Controllers\\TransactionController.cs';
const content = fs.readFileSync(ctrlPath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('[HttpGet') || line.includes('[HttpPost') || line.includes('public async Task')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});

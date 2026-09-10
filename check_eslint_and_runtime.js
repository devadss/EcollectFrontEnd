const { execSync } = require('child_process');

console.log('🔍 Running ESLint check on src/ ...');

try {
  const out = execSync('npx eslint src --max-warnings=50', {
    cwd: 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd',
    encoding: 'utf8'
  });
  console.log('✅ ESLint check passed:\n', out || 'Clean!');
} catch (err) {
  console.log('⚠️ ESLint output:');
  console.log(err.stdout || err.stderr || err.message);
}

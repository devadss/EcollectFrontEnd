process.env.CI = 'false';
const { execSync } = require('child_process');
execSync('react-scripts build', { stdio: 'inherit' });

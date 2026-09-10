const fs = require('fs');
const babel = require('@babel/parser');

const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let code = fs.readFileSync(accountsPath, 'utf8');

// 1. Remove the old stubs around lines 860 to 975
const oldTemplateSectionRegex = /\/\/ Comprehensive Sample Master Accounts Template Data[\s\S]*?\/\/ ============================================================\s*\/\/ STANDALONE N FEATURES: BUCKETS, PTP, GEO MAP, AI & CALL QUEUE/g;

// Let's check what was in lines 850 to 980
const startIdx = code.indexOf('// Comprehensive Sample Master Accounts Template Data');
const endIdx = code.indexOf('const [loanFormData, setLoanFormData] = useState({');

if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
  code = code.slice(0, startIdx) + code.slice(endIdx);
  console.log('✅ Removed old template stubs');
}

fs.writeFileSync(accountsPath, code, 'utf8');

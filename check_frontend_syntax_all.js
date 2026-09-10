const fs = require('fs');
const path = require('path');
const babel = require('@babel/parser');

const srcDir = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src';
let errors = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      try {
        const code = fs.readFileSync(fullPath, 'utf8');
        babel.parse(code, {
          sourceType: 'module',
          plugins: [
            'jsx',
            'classProperties',
            'optionalChaining',
            'nullishCoalescingOperator',
            'objectRestSpread',
            'asyncGenerators'
          ]
        });
      } catch (err) {
        errors.push({ file: fullPath, error: err.message, loc: err.loc });
      }
    }
  }
}

console.log('🔍 Scanning all React files in src/ for syntax/compilation issues...');
scanDirectory(srcDir);

if (errors.length === 0) {
  console.log('✅ ALL files in src/ passed Babel AST parsing with 0 syntax errors!');
} else {
  console.log(`❌ Found ${errors.length} file(s) with errors:`);
  errors.forEach(e => {
    console.error(`- File: ${e.file}\n  Error: ${e.error} at Line ${e.loc?.line}, Column ${e.loc?.column}\n`);
  });
}

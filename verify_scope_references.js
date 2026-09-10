const fs = require('fs');
const babel = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const filesToCheck = [
  'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\settings\\Settings.jsx',
  'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\auth\\Login.jsx',
  'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx',
  'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\services\\smsService.js',
  'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\services\\api.js',
  'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\services\\standaloneCollectionService.js'
];

console.log('🔍 Checking AST scope references in target files...');

filesToCheck.forEach(filePath => {
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    const ast = babel.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator']
    });

    let unbound = [];
    traverse(ast, {
      ReferencedIdentifier(p) {
        const name = p.node.name;
        // Ignore globals and React builtins
        const globals = [
          'window', 'document', 'localStorage', 'sessionStorage', 'console', 'setTimeout', 'clearTimeout',
          'setInterval', 'clearInterval', 'fetch', 'Math', 'Date', 'JSON', 'Number', 'String', 'Boolean',
          'Array', 'Object', 'Promise', 'encodeURIComponent', 'decodeURIComponent', 'isNaN', 'parseInt', 'parseFloat',
          'navigator', 'alert', 'confirm', 'prompt', 'process', 'require', 'module', 'exports', 'URL', 'Blob', 'FileReader',
          'FormData', 'location', 'history', 'Image', 'Audio', 'Notification', 'Event', 'CustomEvent', 'btoa', 'atob'
        ];
        if (globals.includes(name)) return;
        if (!p.scope.hasBinding(name)) {
          unbound.push({ name, line: p.node.loc?.start?.line });
        }
      }
    });

    if (unbound.length === 0) {
      console.log(`✅ ${filePath.split('\\').pop()}: No undefined variable references.`);
    } else {
      console.log(`⚠️ ${filePath.split('\\').pop()} has unbound identifiers:`, unbound);
    }
  } catch (err) {
    console.error(`❌ Parse error in ${filePath.split('\\').pop()}:`, err.message);
  }
});

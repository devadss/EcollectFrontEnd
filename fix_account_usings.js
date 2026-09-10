const fs = require('fs');

const p = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\Controllers\\AccountController.cs';

if (fs.existsSync(p)) {
  let content = fs.readFileSync(p, 'utf8');
  if (!content.includes('using Microsoft.AspNetCore.Authorization;')) {
    content = 'using Microsoft.AspNetCore.Authorization;\n' + content;
    fs.writeFileSync(p, content, 'utf8');
    console.log('✅ Added using Microsoft.AspNetCore.Authorization; to AccountController.cs');
  }
}

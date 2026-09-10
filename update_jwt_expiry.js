const fs = require('fs');

const p = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\Controllers\\AuthController.cs';

if (fs.existsSync(p)) {
  let content = fs.readFileSync(p, 'utf8');

  content = content.replaceAll('DateTime.UtcNow.AddDays(7)', 'DateTime.UtcNow.AddHours(2)');

  fs.writeFileSync(p, content, 'utf8');
  console.log('✅ Updated AuthController.cs: JWT token expiration set to 2 hours (DateTime.UtcNow.AddHours(2)).');
}

const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

const authCtrl = fs.readFileSync(`${basePath}\\EcollectApi\\Controllers\\AuthController.cs`, 'utf8');
console.log('=== AuthController.cs ===');
console.log(authCtrl);

const dbContext = fs.readFileSync(`${basePath}\\Ecollect.Data\\Context\\ApplicationDbContext.cs`, 'utf8');
console.log('=== ApplicationDbContext.cs ===');
console.log(dbContext);

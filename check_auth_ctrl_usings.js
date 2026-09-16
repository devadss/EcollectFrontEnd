const fs = require('fs');

const authCtrlPath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi/EcollectApi/Controllers/AuthController.cs';
const content = fs.readFileSync(authCtrlPath, 'utf8');
const lines = content.split('\n');

console.log('--- AuthController.cs usings ---');
for (let i = 0; i < 25; i++) {
  console.log(lines[i]);
}

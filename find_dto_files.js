const fs = require('fs');
const path = require('path');

function findMatchingFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    if (item === 'bin' || item === 'obj' || item === '.git' || item === 'node_modules') continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(findMatchingFiles(full));
    } else if (item.toLowerCase().includes('auth') || item.toLowerCase().includes('dto')) {
      results.push(full);
    }
  }
  return results;
}

const rootBackend = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi';
const files = findMatchingFiles(rootBackend);
console.log('--- Matching Auth/DTO files in backend ---');
files.forEach(f => console.log(f));

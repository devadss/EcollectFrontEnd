const fs = require('fs');
const path = require('path');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

function scanDir(dir, maxDepth = 4, depth = 0) {
  if (depth > maxDepth) return [];
  let files = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (!['bin', 'obj', '.vs', 'packages'].includes(item.name)) {
          files = files.concat(scanDir(full, maxDepth, depth + 1));
        }
      } else {
        files.push(full);
      }
    }
  } catch (e) {
    console.error('Error scanning:', dir, e.message);
  }
  return files;
}

console.log('Scanning backend files in:', basePath);
const allFiles = scanDir(basePath);
console.log('Total files found:', allFiles.length);

const csFiles = allFiles.filter(f => f.endsWith('.cs'));
console.log('\n--- C# Files ---');
csFiles.forEach(f => {
  const rel = path.relative(basePath, f);
  console.log(rel);
});

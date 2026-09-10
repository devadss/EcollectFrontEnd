const fs = require('fs');
const path = require('path');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

function scanFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(scanFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.cs')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('MinimumLength = 6') || content.includes('MinLength(6)') || (content.includes('Otp') && content.includes('StringLength'))) {
        results.push({ file: fullPath, content });
      }
    }
  }
  return results;
}

console.log('Searching for Otp StringLength in backend...');
const found = scanFiles(basePath);
found.forEach(f => {
  console.log('File:', f.file);
  f.content.split('\n').forEach((line, i) => {
    if (line.includes('StringLength') || line.includes('MinLength') || line.includes('MaxLength') || line.includes('Otp')) {
      if (line.includes('Length') || line.includes('Otp')) {
        console.log(`  Line ${i + 1}: ${line.trim()}`);
      }
    }
  });
});

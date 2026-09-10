const fs = require('fs');

const fullText = fs.readFileSync('full_clean_pdf.txt', 'utf8');
const lines = fullText.split('\n');

console.log('=== Section 10.2.1 Specs ===');
console.log(lines.slice(6750, 7000).join('\n'));

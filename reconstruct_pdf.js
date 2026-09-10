const fs = require('fs');

const raw = fs.readFileSync('extracted_pdf_text.txt', 'utf8');

// A TJ array looks like: [(S) 10 (e) -5 (t) 2 (t) (l) (e) (m) (e) (n) (t)] TJ
// Let's extract all TJ arrays and concatenate the strings
const tjArrayRegex = /\[(.*?)\]\s*TJ/gs;
let fullText = '';
let match;

while ((match = tjArrayRegex.exec(raw)) !== null) {
  const inner = match[1];
  const strRegex = /\((.*?)\)/gs;
  let sMatch;
  let segment = '';
  while ((sMatch = strRegex.exec(inner)) !== null) {
    segment += sMatch[1];
  }
  fullText += segment + '\n';
}

fs.writeFileSync('full_clean_pdf.txt', fullText, 'utf8');
console.log('Full clean text length:', fullText.length);

// Search for Section 10 or settlements or error code table
const lines = fullText.split('\n');
console.log('Total lines:', lines.length);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('10.') || line.includes('SETTLEMENT') || line.includes('Settlement') || line.includes('getsettlement') || line.includes('1024') || line.includes('None of the required')) {
    console.log(`Line ${i}: ${line}`);
    // print 10 lines after
    for (let j = 1; j <= 15 && (i + j) < lines.length; j++) {
      console.log(`   +${j}: ${lines[i+j]}`);
    }
    console.log('========================================');
  }
}

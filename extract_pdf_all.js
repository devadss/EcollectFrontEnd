const fs = require('fs');
const zlib = require('zlib');

const pdfPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\d644abcf-6011-48ea-9bb1-748a3124a72f\\.user_uploaded\\media_1787600450223.pdf';
const buf = fs.readFileSync(pdfPath);

let allText = '';
let streamStart = 0;

while ((streamStart = buf.indexOf('stream', streamStart)) !== -1) {
  // Move past 'stream\r\n' or 'stream\n'
  let dataStart = streamStart + 6;
  if (buf[dataStart] === 0x0d && buf[dataStart + 1] === 0x0a) dataStart += 2;
  else if (buf[dataStart] === 0x0a || buf[dataStart] === 0x0d) dataStart += 1;

  const streamEnd = buf.indexOf('endstream', dataStart);
  if (streamEnd === -1) break;

  const streamBuf = buf.slice(dataStart, streamEnd);
  try {
    const uncompressed = zlib.inflateSync(streamBuf);
    allText += uncompressed.toString('latin1') + '\n';
  } catch (e) {
    try {
      const raw = zlib.inflateRawSync(streamBuf);
      allText += raw.toString('latin1') + '\n';
    } catch (e2) {}
  }

  streamStart = streamEnd + 9;
}

console.log('Total extracted text length:', allText.length);

// Extract TJ and Tj text in PDF format
const textChunks = [];
const tjRegex = /\((.*?)\)\s*Tj/g;
let m;
while ((m = tjRegex.exec(allText)) !== null) {
  textChunks.push(m[1]);
}

const fullDocText = textChunks.join(' ');
fs.writeFileSync('extracted_pdf_text.txt', allText + '\n\n=== EXTRACTED CHUNKS ===\n' + fullDocText, 'utf8');

console.log('Saved extracted_pdf_text.txt. Searching for settlements and error 1024...');

function search(term) {
  let idx = 0;
  console.log(`\n=== SEARCH: ${term} ===`);
  while ((idx = allText.toLowerCase().indexOf(term.toLowerCase(), idx)) !== -1) {
    console.log(allText.substring(Math.max(0, idx - 150), Math.min(allText.length, idx + 450)));
    console.log('-------------------------------------------');
    idx += term.length + 50;
  }
}

search('1024');
search('getsettlements');
search('getsettlementdetails');
search('settlement');

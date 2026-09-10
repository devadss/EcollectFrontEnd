const fs = require('fs');

const pdfPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\d644abcf-6011-48ea-9bb1-748a3124a72f\\.user_uploaded\\media_1787600450223.pdf';

if (fs.existsSync(pdfPath)) {
  const buf = fs.readFileSync(pdfPath);
  const text = buf.toString('latin1');

  console.log('PDF File Size:', buf.length, 'bytes');

  // Search for getsettlements, getsettlementdetails, 1024, or settlement API parameters
  const keywords = ['10.1', '10.2', 'getsettlements', 'getsettlementdetails', '1024', 'None of the required'];

  keywords.forEach(kw => {
    console.log(`\n=================== SEARCHING: "${kw}" ===================`);
    let pos = 0;
    let count = 0;
    while ((pos = text.indexOf(kw, pos)) !== -1 && count < 5) {
      const snippet = text.substring(Math.max(0, pos - 200), Math.min(text.length, pos + 500));
      // Clean readable ASCII
      const clean = snippet.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      console.log(`[Match ${count + 1} at ${pos}]:\n${clean}\n---------------------------------`);
      pos += kw.length + 50;
      count++;
    }
    if (count === 0) console.log('No direct matches.');
  });
} else {
  console.log('PDF not found at', pdfPath);
}

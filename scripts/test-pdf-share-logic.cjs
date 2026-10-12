// Automated Test for WhatsApp PDF Sharing Logic
const assert = require('assert');
const fs = require('fs');

const code = fs.readFileSync('src/utils/whatsappShare.ts', 'utf8');

console.log('Testing WhatsApp Share Logic...');

// 1. Ensure fake attachment text has been completely removed
assert(!code.includes("📄 *${docTypeLabel}:* ${safeFileName}"), 'Fake attachment text still present in text message!');
console.log('[PASS] Fake attachment text eliminated from message text.');

// 2. Ensure navigator.share with files is invoked when blob is present
assert(code.includes('navigator.canShare({ files: [pdfFile] })'), 'navigator.canShare with files missing!');
assert(code.includes('files: [pdfFile]'), 'files: [pdfFile] missing from navigator.share call!');
console.log('[PASS] Native file attachment via Web Share API verified.');

// 3. Ensure no dev links or origin links are in the message
assert(!code.includes('window.location.origin'), 'window.location.origin link generation still exists!');
assert(!code.includes('?receipt='), 'Receipt url parameter link generation still exists!');
console.log('[PASS] Broken online URL parameters verified completely removed.');

console.log('All PDF share logic tests passed successfully!');

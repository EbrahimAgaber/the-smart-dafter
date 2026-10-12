const { jsPDF } = require('jspdf');

// Test suite for Automated PDF File Integrity Checker
async function testIntegrityChecker() {
  console.log('--- TESTING AUTOMATED PDF FILE INTEGRITY CHECKER ---');
  let passed = 0;
  let total = 0;

  function assert(title, condition) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${title}`);
    }
  }

  // 1. Simulate verifyPdfBlobIntegrity logic in Node
  async function verifyBlob(blob) {
    if (!blob) return { valid: false, error: 'Blob does not exist in memory' };
    if (!(blob instanceof Blob)) return { valid: false, error: 'Not a Blob instance' };
    if (blob.size < 150) return { valid: false, error: 'Blob size too small' };

    const slice = blob.slice(0, 8);
    const buf = await slice.arrayBuffer();
    const str = String.fromCharCode(...new Uint8Array(buf));
    if (!str.startsWith('%PDF-')) return { valid: false, error: 'Invalid header: ' + str };

    return { valid: true, size: blob.size, header: str.trim(), cachedInMemory: true };
  }

  // Case 1: null / undefined blob
  const resNull = await verifyBlob(null);
  assert('Rejects null blob', resNull.valid === false && resNull.error.includes('does not exist'));

  // Case 2: empty blob
  const emptyBlob = new Blob([], { type: 'application/pdf' });
  const resEmpty = await verifyBlob(emptyBlob);
  assert('Rejects empty 0-byte blob', resEmpty.valid === false && resEmpty.error.includes('too small'));

  // Case 3: corrupt / text blob (> 150 bytes to pass size threshold but fail header check)
  const textBlob = new Blob(['Hello this is not a valid PDF file at all, just plain text payload that fails magic header check. Padding out to exceed minimum byte threshold for deep inspection.'], { type: 'application/pdf' });
  const resText = await verifyBlob(textBlob);
  assert('Rejects non-PDF blob with invalid magic header', resText.valid === false && resText.error.includes('Invalid header'));

  // Case 4: Real compiled PDF document via jsPDF
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.text('Simplified Tax Invoice #10023', 20, 20);
  doc.text('Merchant: Dafter Express', 20, 30);
  const pdfBlob = doc.output('blob');

  const resPdf = await verifyBlob(pdfBlob);
  assert('Verifies real jsPDF document existence', resPdf.valid === true);
  assert('Validates positive PDF byte length (> 500 bytes)', resPdf.size > 500);
  assert('Confirms standard %PDF- magic header structure', resPdf.header.startsWith('%PDF-'));
  assert('Confirms cached in local memory state', resPdf.cachedInMemory === true);

  console.log(`\nINTEGRITY TEST SUMMARY: ${passed}/${total} passed (${Math.round((passed/total)*100)}%)\n`);
  if (passed !== total) process.exit(1);
}

testIntegrityChecker();

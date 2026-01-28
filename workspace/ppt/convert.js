// Generated: 2026-01-28 17:00:00 KST
/**
 * Convert HTML slides to PPTX using html2pptx library
 */

const pptxgen = require('pptxgenjs');
const html2pptx = require('../../.claude/scripts/ppt/html2pptx.js');
const fs = require('fs');
const path = require('path');

async function main() {
  const slideFiles = fs.readdirSync(__dirname)
    .filter(f => f.startsWith('slide') && f.endsWith('.html'))
    .sort();

  console.log(`Found ${slideFiles.length} slide files:`);
  slideFiles.forEach(f => console.log(`  - ${f}`));

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = '선진인포텍 ERP 시스템 구축 제안서';
  pptx.author = 'ERP 구축팀';
  pptx.company = '선진인포텍(주)';

  for (const slideFile of slideFiles) {
    const htmlPath = path.join(__dirname, slideFile);
    console.log(`\nProcessing: ${slideFile}`);

    try {
      const { slide, placeholders } = await html2pptx(htmlPath, pptx);
      console.log(`  ✓ Converted successfully`);
      if (placeholders.length > 0) {
        console.log(`  - Found ${placeholders.length} placeholders`);
      }
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
    }
  }

  const outputPath = path.join(__dirname, '선진인포텍_ERP_제안서.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\n✓ PPTX saved to: ${outputPath}`);
}

main().catch(console.error);

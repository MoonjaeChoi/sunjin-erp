// Generated: 2026-01-28 19:30:00 KST
const pptxgen = require('pptxgenjs');
const path = require('path');
const html2pptx = require('/Users/memmem/.claude/plugins/cache/anthropic-agent-skills/document-skills/f23222824449/skills/pptx/scripts/html2pptx');

async function createPresentation() {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Claude Code';
    pptx.title = '선진인포텍 ERP V1.0 - Out-of-Scope 항목 정리';
    pptx.subject = 'Phase 1 구현 완료 및 Phase 2 로드맵';
    pptx.company = '선진인포텍';

    const slidesDir = path.join(__dirname, 'slides');

    const slides = [
        'slide01_cover.html',
        'slide02_overview.html',
        'slide03_page1.html',
        'slide04_page2.html',
        'slide05_page3.html',
        'slide06_page4.html',
        'slide07_page5.html',
        'slide08_page6.html',
        'slide09_page7.html',
        'slide10_page8.html',
        'slide11_page9.html',
        'slide12_page10.html',
        'slide13_page11.html',
        'slide14_summary.html',
        'slide15_priority.html',
        'slide16_closing.html'
    ];

    for (const slideFile of slides) {
        const slidePath = path.join(slidesDir, slideFile);
        console.log(`Processing: ${slideFile}`);
        await html2pptx(slidePath, pptx);
    }

    const outputPath = path.join(__dirname, '선진인포텍_ERP_Out-of-Scope_정리.pptx');
    await pptx.writeFile({ fileName: outputPath });
    console.log(`\nPresentation created: ${outputPath}`);
}

createPresentation().catch(err => {
    console.error('Error creating presentation:', err);
    process.exit(1);
});

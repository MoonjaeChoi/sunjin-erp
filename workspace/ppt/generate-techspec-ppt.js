// Generated: 2026-01-28 15:30:00 KST
const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/memmem/.claude/plugins/cache/anthropic-agent-skills/document-skills/f23222824449/skills/pptx/scripts/html2pptx');
const path = require('path');

async function createPresentation() {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Claude Code';
    pptx.title = '선진인포텍 ERP V1.0 기술 스펙';
    pptx.subject = 'CEO 발표용 기술 개요';
    pptx.company = '선진인포텍';

    const slidesDir = path.join(__dirname, 'slides-techspec');

    const slides = [
        'slide01_title.html',
        'slide02_summary.html',
        'slide03_overview.html',
        'slide04_modules.html',
        'slide05_architecture.html',
        'slide06_security.html',
        'slide07_stats.html',
        'slide08_status.html',
        'slide09_deployment.html',
        'slide10_roadmap.html',
        'slide11_closing.html'
    ];

    for (const slideFile of slides) {
        const slidePath = path.join(slidesDir, slideFile);
        console.log(`Processing: ${slideFile}`);
        try {
            await html2pptx(slidePath, pptx);
        } catch (error) {
            console.error(`Error processing ${slideFile}:`, error.message);
            throw error;
        }
    }

    const outputPath = path.join(__dirname, '선진인포텍_ERP_V1.0_기술스펙_CEO발표.pptx');
    await pptx.writeFile({ fileName: outputPath });
    console.log(`\nPresentation saved: ${outputPath}`);
}

createPresentation().catch(console.error);

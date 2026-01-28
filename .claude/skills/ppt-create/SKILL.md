<!-- Generated: 2026-01-28 09:30:00 KST -->
---
name: ppt-create
description: "PPTX 파일 생성/편집 - Anthropic pptx 스킬 기반. HTML에서 PowerPoint로 변환하거나 기존 프레젠테이션 편집 워크플로우 제공."
---

# PPTX 생성, 편집 및 분석 스킬

## 개요

.pptx 파일을 생성, 편집 또는 분석합니다. .pptx 파일은 XML 파일과 기타 리소스를 포함하는 ZIP 아카이브입니다.

## 콘텐츠 읽기 및 분석

### 텍스트 추출
프레젠테이션의 텍스트 내용만 읽어야 하는 경우:

```bash
python -m markitdown path-to-file.pptx
```

### Raw XML 접근
코멘트, 발표자 노트, 슬라이드 레이아웃, 애니메이션, 디자인 요소 등에는 raw XML 접근 필요.

#### 파일 언팩
```bash
python .claude/scripts/ppt/unpack.py <office_file> <output_dir>
```

#### 주요 파일 구조
* `ppt/presentation.xml` - 메인 프레젠테이션 메타데이터 및 슬라이드 참조
* `ppt/slides/slide{N}.xml` - 개별 슬라이드 콘텐츠
* `ppt/notesSlides/notesSlide{N}.xml` - 각 슬라이드의 발표자 노트
* `ppt/slideLayouts/` - 슬라이드 레이아웃 템플릿
* `ppt/slideMasters/` - 마스터 슬라이드 템플릿
* `ppt/theme/` - 테마 및 스타일링 정보
* `ppt/media/` - 이미지 및 기타 미디어 파일

---

## 템플릿 없이 새 프레젠테이션 만들기

**html2pptx** 워크플로우를 사용하여 HTML 슬라이드를 PowerPoint로 변환합니다.

### 디자인 원칙

**중요**: 프레젠테이션을 만들기 전에 콘텐츠를 분석하고 적절한 디자인 요소 선택:

1. **주제 고려**: 이 프레젠테이션의 주제는? 어떤 톤, 산업, 분위기를 제안하는가?
2. **브랜딩 확인**: 회사/조직이 언급되면 브랜드 컬러와 아이덴티티 고려
3. **콘텐츠에 맞는 팔레트**: 주제를 반영하는 컬러 선택
4. **접근 방식 명시**: 코드 작성 전 디자인 선택 설명

**요구사항**:
- 코드 작성 전 콘텐츠 기반 디자인 접근 방식 명시
- 웹 안전 폰트만 사용: Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana, Tahoma, Trebuchet MS, Impact
- 크기, 굵기, 컬러를 통한 명확한 시각적 계층 구조
- 가독성 보장: 강한 대비, 적절한 크기의 텍스트, 깨끗한 정렬
- 일관성: 슬라이드 전체에 패턴, 간격, 시각적 언어 반복

### 레이아웃 규격

- **16:9** (기본): `width: 720pt; height: 405pt`
- **4:3**: `width: 720pt; height: 540pt`
- **16:10**: `width: 720pt; height: 450pt`

### 지원 HTML 요소

- `<p>`, `<h1>`-`<h6>` - 스타일링된 텍스트
- `<ul>`, `<ol>` - 리스트 (수동 불릿 사용 금지)
- `<b>`, `<strong>` - 볼드 텍스트
- `<i>`, `<em>` - 이탤릭 텍스트
- `<u>` - 밑줄 텍스트
- `<span>` - CSS 스타일의 인라인 포맷팅
- `<br>` - 줄바꿈
- `<div>` (배경/테두리) - 도형이 됨
- `<img>` - 이미지
- `class="placeholder"` - 차트용 예약 공간

### 중요한 텍스트 규칙

**모든 텍스트는 반드시 `<p>`, `<h1>`-`<h6>`, `<ul>`, 또는 `<ol>` 태그 안에**:
- 올바름: `<div><p>텍스트</p></div>`
- 잘못됨: `<div>텍스트</div>` - **PowerPoint에 나타나지 않음**
- 잘못됨: `<span>텍스트</span>` - **PowerPoint에 나타나지 않음**

**수동 불릿 기호 (-, *, 등) 절대 사용 금지** - 대신 `<ul>` 또는 `<ol>` 사용

### 아이콘 & 그라데이션

- **CSS 그라데이션 사용 금지** - PowerPoint로 변환되지 않음
- **항상 Sharp로 먼저 PNG 생성 후 HTML에서 참조**

**Sharp로 아이콘 래스터화:**

```javascript
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const { FaHome } = require('react-icons/fa');

async function rasterizeIconPng(IconComponent, color, size = "256", filename) {
  const svgString = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color: `#${color}`, size: size })
  );
  await sharp(Buffer.from(svgString)).png().toFile(filename);
  return filename;
}
```

**Sharp로 그라데이션 래스터화:**

```javascript
const sharp = require('sharp');

async function createGradientBackground(filename, color1, color2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="562.5">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1}"/>
        <stop offset="100%" style="stop-color:${color2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(filename);
  return filename;
}
```

### 워크플로우

1. **HTML 슬라이드 생성**: 적절한 body 치수로 각 슬라이드용 HTML 파일 생성
2. **JavaScript 파일 생성 및 실행**: html2pptx.js 라이브러리 사용
3. **시각적 검증**: 썸네일 생성 및 레이아웃 문제 검사

```bash
python .claude/scripts/ppt/thumbnail.py output.pptx workspace/thumbnails --cols 4
```

### HTML 예시

```html
<!DOCTYPE html>
<html>
<head>
<style>
html { background: #ffffff; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  background: #f5f5f5; font-family: Arial, sans-serif;
  display: flex;
}
.content { margin: 30pt; padding: 40pt; background: #ffffff; border-radius: 8pt; }
h1 { color: #2d3748; font-size: 32pt; }
</style>
</head>
<body>
<div class="content">
  <h1>제목</h1>
  <ul>
    <li><b>항목:</b> 설명</li>
  </ul>
  <div id="chart" class="placeholder" style="width: 350pt; height: 200pt;"></div>
</div>
</body>
</html>
```

### html2pptx 기본 사용법

```javascript
const pptxgen = require('pptxgenjs');
const html2pptx = require('./.claude/scripts/ppt/html2pptx');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';

const { slide, placeholders } = await html2pptx('slide1.html', pptx);

// 플레이스홀더 영역에 차트 추가
if (placeholders.length > 0) {
    slide.addChart(pptx.charts.LINE, chartData, placeholders[0]);
}

await pptx.writeFile('output.pptx');
```

---

## 기존 프레젠테이션 편집

OOXML 형식으로 작업해야 합니다.

### 워크플로우

1. 프레젠테이션 언팩: `python .claude/scripts/ppt/unpack.py <file> <output_dir>`
2. XML 파일 편집 (주로 `ppt/slides/slide{N}.xml`)
3. 검증: `python .claude/scripts/ppt/validate.py <dir> --original <file>`
4. 팩: `python .claude/scripts/ppt/pack.py <input_dir> <file>`

---

## 템플릿을 사용한 새 프레젠테이션

### 워크플로우

1. **템플릿 텍스트 추출 및 썸네일 그리드 생성**:
```bash
python -m markitdown template.pptx > template-content.md
python .claude/scripts/ppt/thumbnail.py template.pptx
```

2. **템플릿 분석 및 인벤토리 파일에 저장**:
- 썸네일 그리드 분석하여 슬라이드 레이아웃, 디자인 패턴, 시각적 구조 이해
- `template-inventory.md`에 템플릿 인벤토리 저장

3. **템플릿 인벤토리 기반 아웃라인 생성**:
- 첫 슬라이드용 인트로/타이틀 템플릿 선택
- 다른 슬라이드용 안전한 텍스트 기반 레이아웃 선택
- **레이아웃 구조를 실제 콘텐츠에 매칭**

4. **rearrange.py로 슬라이드 복제, 재정렬, 삭제**:
```bash
python .claude/scripts/ppt/rearrange.py template.pptx working.pptx 0,34,34,50,52
```

5. **inventory.py로 모든 텍스트 추출**:
```bash
python .claude/scripts/ppt/inventory.py working.pptx text-inventory.json
```

6. **교체 텍스트 생성 후 JSON 파일에 저장**

7. **replace.py로 교체 적용**:
```bash
python .claude/scripts/ppt/replace.py working.pptx replacement-text.json output.pptx
```

---

## 썸네일 그리드 생성

```bash
python .claude/scripts/ppt/thumbnail.py template.pptx [output_prefix]
```

**기능**:
- 기본: 5 컬럼, 그리드당 최대 30 슬라이드
- 커스텀 접두사: `python .claude/scripts/ppt/thumbnail.py template.pptx my-grid`
- 컬럼 조정: `--cols 4`
- 슬라이드는 0-인덱싱

---

## PptxGenJS 사용

### 컬러 규칙

- **PptxGenJS에서 hex 컬러에 `#` 접두사 절대 사용 금지** - 파일 손상 유발
- 올바름: `color: "FF0000"`, `fill: { color: "0066CC" }`
- 잘못됨: `color: "#FF0000"`

### 차트 추가

```javascript
const { slide, placeholders } = await html2pptx('slide.html', pptx);

slide.addChart(pptx.charts.BAR, [{
    name: "매출 2024",
    labels: ["Q1", "Q2", "Q3", "Q4"],
    values: [4500, 5500, 6200, 7100]
}], {
    ...placeholders[0],
    barDir: 'col',
    showTitle: true,
    title: '분기별 매출',
    showLegend: false,
    showCatAxisTitle: true,
    catAxisTitle: '분기',
    showValAxisTitle: true,
    valAxisTitle: '매출 (천원)',
    chartColors: ["4472C4"]
});
```

### 파이 차트

```javascript
slide.addChart(pptx.charts.PIE, [{
    name: "시장 점유율",
    labels: ["제품 A", "제품 B", "기타"],
    values: [35, 45, 20]
}], {
    x: 2, y: 1, w: 6, h: 4,
    showPercent: true,
    showLegend: true,
    legendPos: 'r',
    chartColors: ["4472C4", "ED7D31", "A5A5A5"]
});
```

### 테이블 추가

```javascript
slide.addTable([
    ["헤더 1", "헤더 2", "헤더 3"],
    ["행 1, 열 1", "행 1, 열 2", "행 1, 열 3"]
], {
    x: 0.5, y: 1, w: 9, h: 3,
    border: { pt: 1, color: "999999" },
    fill: { color: "F1F1F1" }
});
```

---

## 의존성

필수 의존성 (설치 필요):

**Python:**
```bash
pip install "markitdown[pptx]" python-pptx defusedxml Pillow
```

**Node.js:**
```bash
npm install -g pptxgenjs playwright sharp react-icons react react-dom
npx playwright install chromium
```

**시스템 도구 (macOS):**
```bash
brew install libreoffice poppler
```

---

## 코드 스타일 가이드라인

PPTX 작업용 코드 생성 시:
- 간결한 코드 작성
- 장황한 변수명과 중복 작업 피하기
- 불필요한 print 문 피하기

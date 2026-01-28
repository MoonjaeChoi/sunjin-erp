<!-- Generated: 2026-01-28 09:30:00 KST -->
# HTML to PowerPoint 가이드

html2pptx.js 라이브러리를 사용하여 HTML 슬라이드를 정확한 위치 지정으로 PowerPoint 프레젠테이션으로 변환합니다.

## 목차

1. [HTML 슬라이드 생성](#html-슬라이드-생성)
2. [html2pptx 라이브러리 사용](#html2pptx-라이브러리-사용)
3. [PptxGenJS 사용](#pptxgenjs-사용)

---

## HTML 슬라이드 생성

모든 HTML 슬라이드는 적절한 body 치수를 포함해야 합니다:

### 레이아웃 규격

- **16:9** (기본): `width: 720pt; height: 405pt`
- **4:3**: `width: 720pt; height: 540pt`
- **16:10**: `width: 720pt; height: 450pt`

### 지원 요소

- `<p>`, `<h1>`-`<h6>` - 스타일링된 텍스트
- `<ul>`, `<ol>` - 리스트 (수동 불릿 사용 금지)
- `<b>`, `<strong>` - 볼드 텍스트 (인라인 포맷팅)
- `<i>`, `<em>` - 이탤릭 텍스트 (인라인 포맷팅)
- `<u>` - 밑줄 텍스트 (인라인 포맷팅)
- `<span>` - CSS 스타일의 인라인 포맷팅 (bold, italic, underline, color)
- `<br>` - 줄바꿈
- `<div>` (배경/테두리) - 도형이 됨
- `<img>` - 이미지
- `class="placeholder"` - 차트용 예약 공간 (`{ id, x, y, w, h }` 반환)

### 중요한 텍스트 규칙

**모든 텍스트는 반드시 `<p>`, `<h1>`-`<h6>`, `<ul>`, 또는 `<ol>` 태그 안에 있어야 합니다:**
- 올바름: `<div><p>여기에 텍스트</p></div>`
- 잘못됨: `<div>여기에 텍스트</div>` - **PowerPoint에 나타나지 않음**
- 잘못됨: `<span>텍스트</span>` - **PowerPoint에 나타나지 않음**
- `<div>` 또는 `<span>` 안의 텍스트는 조용히 무시됨

**수동 불릿 기호 (-, *, 등) 절대 사용 금지** - 대신 `<ul>` 또는 `<ol>` 리스트 사용

**웹 안전 폰트만 사용:**
- 웹 안전 폰트: `Arial`, `Helvetica`, `Times New Roman`, `Georgia`, `Courier New`, `Verdana`, `Tahoma`, `Trebuchet MS`, `Impact`, `Comic Sans MS`
- 잘못됨: `'Segoe UI'`, `'SF Pro'`, `'Roboto'`, 커스텀 폰트 - **렌더링 문제 발생 가능**

### 스타일링

- 마진 붕괴를 방지하기 위해 body에 `display: flex` 사용
- 간격에 `margin` 사용 (padding은 크기에 포함됨)
- 인라인 포맷팅: `<b>`, `<i>`, `<u>` 태그 또는 CSS 스타일의 `<span>` 사용
  - `<span>` 지원: `font-weight: bold`, `font-style: italic`, `text-decoration: underline`, `color: #rrggbb`
  - `<span>` 미지원: `margin`, `padding` (PowerPoint 텍스트 런에서 지원 안 함)
- 플렉스박스 작동 - 렌더링된 레이아웃에서 위치 계산
- CSS에서 `#` 접두사가 있는 hex 컬러 사용
- 텍스트 정렬: 필요시 CSS `text-align` (`center`, `right` 등) 사용

### 도형 스타일링 (DIV 요소만)

**중요: 배경, 테두리, 그림자는 `<div>` 요소에서만 작동하며, 텍스트 요소 (`<p>`, `<h1>`-`<h6>`, `<ul>`, `<ol>`)에서는 작동하지 않음**

- **배경**: `<div>` 요소에만 CSS `background` 또는 `background-color`
- **테두리**: `<div>` 요소의 CSS `border`가 PowerPoint 도형 테두리로 변환
  - 균일 테두리 지원: `border: 2px solid #333333`
  - 부분 테두리 지원: `border-left`, `border-right`, `border-top`, `border-bottom`
- **테두리 반경**: 둥근 모서리를 위한 `<div>` 요소의 CSS `border-radius`
  - `border-radius: 50%` 이상은 원형 도형 생성
- **박스 그림자**: `<div>` 요소의 CSS `box-shadow`가 PowerPoint 그림자로 변환
  - 외부 그림자만 지원 (inset 그림자는 무시됨)

### 아이콘 & 그라데이션

- **CSS 그라데이션 (`linear-gradient`, `radial-gradient`) 절대 사용 금지** - PowerPoint로 변환되지 않음
- **항상 Sharp로 그라데이션/아이콘 PNG를 먼저 생성한 후 HTML에서 참조**
- 그라데이션: SVG를 PNG 배경 이미지로 래스터화
- 아이콘: react-icons SVG를 PNG 이미지로 래스터화

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

  // Sharp로 SVG를 PNG로 변환
  await sharp(Buffer.from(svgString))
    .png()
    .toFile(filename);

  return filename;
}

// 사용: HTML에서 사용하기 전에 아이콘 래스터화
const iconPath = await rasterizeIconPng(FaHome, "4472c4", "256", "home-icon.png");
// 그 후 HTML에서 참조: <img src="home-icon.png" style="width: 40pt; height: 40pt;">
```

**Sharp로 그라데이션 래스터화:**

```javascript
const sharp = require('sharp');

async function createGradientBackground(filename) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="562.5">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#COLOR1"/>
        <stop offset="100%" style="stop-color:#COLOR2"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(filename);

  return filename;
}

// 사용: HTML 전에 그라데이션 배경 생성
const bgPath = await createGradientBackground("gradient-bg.png");
// 그 후 HTML에서: <body style="background-image: url('gradient-bg.png');">
```

### 예시

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
.box {
  background: #70ad47; padding: 20pt; border: 3px solid #5a8f37;
  border-radius: 12pt; box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.25);
}
</style>
</head>
<body>
<div class="content">
  <h1>레시피 제목</h1>
  <ul>
    <li><b>항목:</b> 설명</li>
  </ul>
  <p><b>볼드</b>, <i>이탤릭</i>, <u>밑줄</u>이 있는 텍스트.</p>
  <div id="chart" class="placeholder" style="width: 350pt; height: 200pt;"></div>

  <!-- 텍스트는 반드시 <p> 태그 안에 -->
  <div class="box">
    <p>5</p>
  </div>
</div>
</body>
</html>
```

## html2pptx 라이브러리 사용

### 의존성

다음 라이브러리가 전역으로 설치되어 있어야 합니다:
- `pptxgenjs`
- `playwright`
- `sharp`

### 기본 사용법

```javascript
const pptxgen = require('pptxgenjs');
const html2pptx = require('./.claude/scripts/ppt/html2pptx');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';  // HTML body 치수와 일치해야 함

const { slide, placeholders } = await html2pptx('slide1.html', pptx);

// 플레이스홀더 영역에 차트 추가
if (placeholders.length > 0) {
    slide.addChart(pptx.charts.LINE, chartData, placeholders[0]);
}

await pptx.writeFile('output.pptx');
```

### API 참조

#### 함수 시그니처
```javascript
await html2pptx(htmlFile, pres, options)
```

#### 파라미터
- `htmlFile` (string): HTML 파일 경로 (절대 또는 상대)
- `pres` (pptxgen): 레이아웃이 이미 설정된 PptxGenJS 프레젠테이션 인스턴스
- `options` (object, 선택):
  - `tmpDir` (string): 생성된 파일용 임시 디렉토리 (기본값: `process.env.TMPDIR || '/tmp'`)
  - `slide` (object): 재사용할 기존 슬라이드 (기본값: 새 슬라이드 생성)

#### 반환값
```javascript
{
    slide: pptxgenSlide,           // 생성/업데이트된 슬라이드
    placeholders: [                 // 플레이스홀더 위치 배열
        { id: string, x: number, y: number, w: number, h: number },
        ...
    ]
}
```

### 검증

라이브러리는 자동으로 모든 오류를 수집하고 검증합니다:

1. **HTML 치수가 프레젠테이션 레이아웃과 일치해야 함** - 치수 불일치 보고
2. **콘텐츠가 body를 오버플로우하면 안 됨** - 정확한 측정값과 함께 오버플로우 보고
3. **CSS 그라데이션** - 지원되지 않는 그라데이션 사용 보고
4. **텍스트 요소 스타일링** - 텍스트 요소의 배경/테두리/그림자 보고 (div에서만 허용)

**모든 검증 오류는 함께 수집되어 보고되므로**, 하나씩이 아닌 한 번에 모든 문제를 수정할 수 있습니다.

### 플레이스홀더 작업

```javascript
const { slide, placeholders } = await html2pptx('slide.html', pptx);

// 첫 번째 플레이스홀더 사용
slide.addChart(pptx.charts.BAR, data, placeholders[0]);

// ID로 찾기
const chartArea = placeholders.find(p => p.id === 'chart-area');
slide.addChart(pptx.charts.LINE, data, chartArea);
```

### 전체 예시

```javascript
const pptxgen = require('pptxgenjs');
const html2pptx = require('./.claude/scripts/ppt/html2pptx');

async function createPresentation() {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = '작성자';
    pptx.title = '내 프레젠테이션';

    // 슬라이드 1: 제목
    const { slide: slide1 } = await html2pptx('slides/title.html', pptx);

    // 슬라이드 2: 차트가 있는 콘텐츠
    const { slide: slide2, placeholders } = await html2pptx('slides/data.html', pptx);

    const chartData = [{
        name: '매출',
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        values: [4500, 5500, 6200, 7100]
    }];

    slide2.addChart(pptx.charts.BAR, chartData, {
        ...placeholders[0],
        showTitle: true,
        title: '분기별 매출',
        showCatAxisTitle: true,
        catAxisTitle: '분기',
        showValAxisTitle: true,
        valAxisTitle: '매출 (천원)'
    });

    // 저장
    await pptx.writeFile({ fileName: 'presentation.pptx' });
    console.log('프레젠테이션이 성공적으로 생성되었습니다!');
}

createPresentation().catch(console.error);
```

## PptxGenJS 사용

html2pptx로 HTML을 슬라이드로 변환한 후, PptxGenJS를 사용하여 차트, 이미지 및 추가 요소와 같은 동적 콘텐츠를 추가합니다.

### 중요 규칙

#### 컬러
- PptxGenJS에서 hex 컬러에 **`#` 접두사 절대 사용 금지** - 파일 손상 유발
- 올바름: `color: "FF0000"`, `fill: { color: "0066CC" }`
- 잘못됨: `color: "#FF0000"` (문서 손상)

### 이미지 추가

항상 실제 이미지 치수에서 종횡비 계산:

```javascript
// 이미지 치수 가져오기: identify image.png | grep -o '[0-9]* x [0-9]*'
const imgWidth = 1860, imgHeight = 1519;  // 실제 파일에서
const aspectRatio = imgWidth / imgHeight;

const h = 3;  // 최대 높이
const w = h * aspectRatio;
const x = (10 - w) / 2;  // 16:9 슬라이드에서 중앙

slide.addImage({ path: "chart.png", x, y: 1.5, w, h });
```

### 텍스트 추가

```javascript
// 포맷팅이 있는 리치 텍스트
slide.addText([
    { text: "볼드 ", options: { bold: true } },
    { text: "이탤릭 ", options: { italic: true } },
    { text: "일반" }
], {
    x: 1, y: 2, w: 8, h: 1
});
```

### 도형 추가

```javascript
// 사각형
slide.addShape(pptx.shapes.RECTANGLE, {
    x: 1, y: 1, w: 3, h: 2,
    fill: { color: "4472C4" },
    line: { color: "000000", width: 2 }
});

// 원
slide.addShape(pptx.shapes.OVAL, {
    x: 5, y: 1, w: 2, h: 2,
    fill: { color: "ED7D31" }
});

// 둥근 사각형
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 1, y: 4, w: 3, h: 1.5,
    fill: { color: "70AD47" },
    rectRadius: 0.2
});
```

### 차트 추가

**대부분의 차트에 필수:** `catAxisTitle` (카테고리)과 `valAxisTitle` (값)을 사용한 축 라벨.

```javascript
const { slide, placeholders } = await html2pptx('slide.html', pptx);

// 올바름: 모든 라벨이 있는 단일 시리즈
slide.addChart(pptx.charts.BAR, [{
    name: "매출 2024",
    labels: ["Q1", "Q2", "Q3", "Q4"],
    values: [4500, 5500, 6200, 7100]
}], {
    ...placeholders[0],  // 플레이스홀더 위치 사용
    barDir: 'col',       // 'col' = 세로 막대, 'bar' = 가로
    showTitle: true,
    title: '분기별 매출',
    showLegend: false,   // 단일 시리즈에는 범례 불필요
    showCatAxisTitle: true,
    catAxisTitle: '분기',
    showValAxisTitle: true,
    valAxisTitle: '매출 (천원)',
    valAxisMaxVal: 8000,
    valAxisMinVal: 0,
    valAxisMajorUnit: 2000,
    chartColors: ["4472C4"]  // 단일 시리즈에 단일 색상
});
```

#### 라인 차트

```javascript
slide.addChart(pptx.charts.LINE, [{
    name: "온도",
    labels: ["1월", "2월", "3월", "4월"],
    values: [32, 35, 42, 55]
}], {
    x: 1, y: 1, w: 8, h: 4,
    lineSize: 4,
    lineSmooth: true,
    showCatAxisTitle: true,
    catAxisTitle: '월',
    showValAxisTitle: true,
    valAxisTitle: '온도 (°C)',
    chartColors: ["4472C4", "ED7D31", "A5A5A5"]
});
```

#### 파이 차트 (축 라벨 불필요)

**중요**: 파이 차트는 `labels` 배열에 모든 카테고리가 있고 `values` 배열에 해당 값이 있는 **단일 데이터 시리즈**가 필요합니다.

```javascript
slide.addChart(pptx.charts.PIE, [{
    name: "시장 점유율",
    labels: ["제품 A", "제품 B", "기타"],  // 모든 카테고리를 하나의 배열에
    values: [35, 45, 20]  // 모든 값을 하나의 배열에
}], {
    x: 2, y: 1, w: 6, h: 4,
    showPercent: true,
    showLegend: true,
    legendPos: 'r',  // 오른쪽
    chartColors: ["4472C4", "ED7D31", "A5A5A5"]
});
```

#### 다중 데이터 시리즈

```javascript
slide.addChart(pptx.charts.LINE, [
    {
        name: "제품 A",
        labels: ["Q1", "Q2", "Q3", "Q4"],
        values: [10, 20, 30, 40]
    },
    {
        name: "제품 B",
        labels: ["Q1", "Q2", "Q3", "Q4"],
        values: [15, 25, 20, 35]
    }
], {
    x: 1, y: 1, w: 8, h: 4,
    showCatAxisTitle: true,
    catAxisTitle: '분기',
    showValAxisTitle: true,
    valAxisTitle: '매출 (백만원)'
});
```

### 테이블 추가

```javascript
slide.addTable([
    ["헤더 1", "헤더 2", "헤더 3"],
    ["행 1, 열 1", "행 1, 열 2", "행 1, 열 3"],
    ["행 2, 열 1", "행 2, 열 2", "행 2, 열 3"]
], {
    x: 0.5,
    y: 1,
    w: 9,
    h: 3,
    border: { pt: 1, color: "999999" },
    fill: { color: "F1F1F1" }
});
```

### 테이블 옵션

일반적인 테이블 옵션:
- `x, y, w, h` - 위치 및 크기
- `colW` - 열 너비 배열 (인치)
- `rowH` - 행 높이 배열 (인치)
- `border` - 테두리 스타일: `{ pt: 1, color: "999999" }`
- `fill` - 배경색 (# 접두사 없이)
- `align` - 텍스트 정렬: "left", "center", "right"
- `valign` - 수직 정렬: "top", "middle", "bottom"
- `fontSize` - 텍스트 크기
- `autoPage` - 콘텐츠 오버플로우 시 자동으로 새 슬라이드 생성

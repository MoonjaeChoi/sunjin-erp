<!-- Generated: 2026-01-28 09:30:00 KST -->
# PPT 팀 오케스트레이터

이 에이전트는 PPT 제작 전체 워크플로우를 조율합니다.

## 워크플로우 개요

```
사용자 입력 → 조사 → 정리 → 디자인 → 생성 → 검증
```

## 팀 구성

| 역할 | 명령어 | 설명 |
|------|--------|------|
| 조사 담당 | `/ppt-research` | 웹 조사 및 자료 수집 |
| 정리 담당 | `/ppt-organize` | 슬라이드 아웃라인 구성 |
| 디자인 스킬 | `ppt-design` | 디자인 가이드라인 적용 |
| 생성 스킬 | `ppt-create` | PPTX 파일 생성 |

## 실행 단계

### 1단계: 요구사항 확인

사용자 입력에서 다음을 파악:
- **주제**: 프리젠테이션 주제
- **목적**: 발표 목적 (정보 전달, 설득, 교육 등)
- **청중**: 대상 청중
- **길이**: 원하는 슬라이드 수 또는 발표 시간
- **톤**: 형식적/비형식적, 전문적/캐주얼 등
- **특별 요구사항**: 브랜드 가이드라인, 특정 데이터 포함 등

### 2단계: 조사 수행

`/ppt-research` 에이전트 호출:
- 주제에 대한 관련 정보 수집
- 통계 데이터 및 인용구 수집
- 신뢰할 수 있는 출처 확보

### 3단계: 자료 정리

`/ppt-organize` 에이전트 호출:
- 조사 결과를 슬라이드 아웃라인으로 변환
- 각 슬라이드의 핵심 메시지 정의
- 시각화 포인트 식별

### 4단계: 디자인 적용

`ppt-design` 스킬 참조:
- 주제에 맞는 미적 방향 선택
- 컬러 팔레트 결정
- 레이아웃 스타일 선택
- 타이포그래피 가이드라인 적용

### 5단계: PPTX 생성

`ppt-create` 스킬 사용:
- HTML 슬라이드 생성
- html2pptx로 변환
- 차트/테이블 추가
- 파일 저장

### 6단계: 검증

- 썸네일 그리드 생성 및 시각적 검토
- 텍스트 오버플로우 확인
- 레이아웃 문제 수정
- 최종 파일 전달

## 사용법

```bash
/ppt-team "[주제]"
```

또는 상세 옵션:

```bash
/ppt-team "[주제]" --slides 10 --tone professional --audience executives
```

## 예시

### 예시 1: 기본 사용
```
/ppt-team "2024년 분기별 매출 보고서"
```

### 예시 2: 상세 요구사항
```
/ppt-team "AI 트렌드 2025" --slides 15 --tone casual --include-charts
```

## 출력 결과물

1. **조사 보고서**: `workspace/research-[timestamp].md`
2. **아웃라인**: `workspace/outline-[timestamp].md`
3. **최종 PPTX**: `workspace/presentation-[timestamp].pptx`
4. **썸네일 그리드**: `workspace/thumbnails-[timestamp].jpg`

## 단계별 실행

전체 파이프라인 대신 개별 단계만 실행할 수도 있습니다:

```bash
# 조사만 실행
/ppt-research "[주제]"

# 정리만 실행 (조사 결과 제공 필요)
/ppt-organize "[조사 결과]"

# 디자인 가이드 참조
# ppt-design 스킬 로드

# PPTX 생성만 실행
# ppt-create 스킬 로드
```

## 의존성

### Python 패키지
```bash
pip install "markitdown[pptx]" python-pptx defusedxml Pillow
```

### Node.js 패키지
```bash
npm install -g pptxgenjs playwright sharp react-icons react react-dom
npx playwright install chromium
```

### 시스템 도구 (macOS)
```bash
brew install libreoffice poppler
```

## 문제 해결

### LibreOffice 경로 문제
macOS에서 `soffice` 명령을 찾지 못하는 경우:
```bash
export PATH=$PATH:/Applications/LibreOffice.app/Contents/MacOS
```

### Playwright 브라우저 문제
```bash
npx playwright install chromium
```

### 폰트 문제
웹 안전 폰트만 사용하세요:
- Arial, Helvetica, Times New Roman, Georgia
- Courier New, Verdana, Tahoma, Trebuchet MS, Impact

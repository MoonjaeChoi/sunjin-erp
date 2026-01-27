<!-- Generated: 2026-01-27 KST -->

# React Hydration 에러 이해하기

## 기본 개념: SSR과 Hydration이란?

### 1단계: 서버 사이드 렌더링 (SSR)

Next.js 같은 프레임워크에서는 페이지를 **서버에서 먼저 HTML로 만들어** 브라우저에 보냅니다.

```
[서버] → HTML 생성 → [브라우저] 화면에 표시
```

이렇게 하면 사용자가 페이지를 **빨리 볼 수 있고**, 검색엔진도 내용을 읽을 수 있습니다.

### 2단계: Hydration (수화)

하지만 이 HTML은 "죽은" 상태입니다. 버튼을 눌러도 아무 일도 안 일어나죠.

그래서 브라우저에서 **JavaScript가 로드되면**, React가 이 HTML에 **이벤트 핸들러와 상태를 연결**합니다. 이 과정을 **Hydration**(수화)이라고 합니다.

```
[서버 HTML] + [클라이언트 JavaScript] = 상호작용 가능한 페이지
```

마치 마른 스펀지(HTML)에 물(JavaScript)을 부어 살아나게 하는 것과 비슷합니다.

---

## Hydration 에러가 발생하는 이유

Hydration 과정에서 React는 **서버에서 만든 HTML**과 **클라이언트에서 다시 만든 HTML**을 비교합니다.

**두 결과가 다르면 에러가 발생합니다.**

### 비유로 이해하기

```
서버가 만든 답안지: "오늘 날짜는 1월 27일입니다"
클라이언트가 만든 답안지: "오늘 날짜는 1월 27일입니다"
                          (0.5초 후 실행되어 시간이 다를 수 있음)
```

React: "어? 두 답안지가 다르네? 뭔가 잘못됐어!" → **Hydration Error!**

---

## 실제 코드로 보는 문제 상황

### 문제가 있는 코드

```typescript
// useExpiryWarning 훅 (문제 있는 버전)
export function useExpiryWarning(endDate: string) {
  return useMemo(() => {
    const today = new Date();  // ⚠️ 문제의 원인!
    // ...계산...
    return { daysUntilExpiry, message };
  }, [endDate]);
}
```

### 왜 문제일까요?

| 실행 위치 | `new Date()` 결과 |
|-----------|-------------------|
| 서버 (한국 시간 23:59:59) | 1월 27일 |
| 클라이언트 (0.1초 후, 00:00:01) | 1월 28일 |

서버와 클라이언트에서 `new Date()`를 호출하는 **시점이 다르기 때문에** 결과가 달라집니다!

- 서버: "30일 남음"
- 클라이언트: "29일 남음"

→ **Mismatch! Hydration Error #418, #422**

---

## 해결 방법

### 방법 1: 클라이언트에서만 계산하기 (권장)

```typescript
// 수정된 버전
export function useExpiryWarning(endDate: string) {
  const [result, setResult] = useState(null);  // 초기값은 null

  useEffect(() => {
    // useEffect는 클라이언트에서만 실행됨!
    const today = new Date();
    // ...계산...
    setResult({ daysUntilExpiry, message });
  }, [endDate]);

  return result;
}
```

**작동 원리:**

1. 서버: `null` 반환 → HTML에 아무것도 없음
2. 클라이언트 첫 렌더: `null` 반환 → 서버와 일치!
3. useEffect 실행: 날짜 계산 → 화면 업데이트

### 방법 2: suppressHydrationWarning 사용

```tsx
<p suppressHydrationWarning>
  {new Date(contract.end_date).toLocaleDateString('ko-KR')}
</p>
```

React에게 "이 요소는 서버/클라이언트가 달라도 괜찮아"라고 알려주는 것입니다.

**주의:** 이 방법은 경고만 숨기는 것이므로, 가능하면 방법 1을 사용하는 것이 좋습니다.

---

## 핵심 정리

| 개념 | 설명 |
|------|------|
| **SSR** | 서버에서 HTML을 미리 만드는 것 |
| **Hydration** | 서버 HTML에 클라이언트 JavaScript를 연결하는 과정 |
| **Hydration Error** | 서버 HTML ≠ 클라이언트 HTML일 때 발생 |
| **원인** | `new Date()`, `Math.random()`, 브라우저 전용 API 등 |
| **해결** | `useEffect`로 클라이언트 전용 실행 또는 `suppressHydrationWarning` |

---

## 기억할 규칙

> **"서버에서 실행될 수 있는 코드에서는 매번 달라지는 값을 직접 렌더링하지 말 것"**

### 하지 말아야 할 것

- `new Date()` 직접 렌더링
- `Math.random()` 직접 렌더링
- `window.innerWidth` 사용 (서버에는 window가 없음)
- `localStorage` 접근 (서버에는 localStorage가 없음)

### 해야 할 것

- `useEffect` 안에서 계산 후 state 업데이트
- `suppressHydrationWarning` 속성 사용 (간단한 경우)
- 동적 import와 `{ ssr: false }` 옵션 사용

---

## 참고 자료

- [React 공식 문서 - Hydration](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Next.js 공식 문서 - React Hydration Error](https://nextjs.org/docs/messages/react-hydration-error)
- React Error #418: Hydration failed because the initial UI does not match
- React Error #422: There was an error while hydrating this Suspense boundary

---

## 실습 예제

### 문제 코드

```tsx
// BadComponent.tsx
export default function BadComponent() {
  return (
    <div>
      <p>현재 시간: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}
```

### 수정된 코드

```tsx
// GoodComponent.tsx
'use client';

import { useState, useEffect } from 'react';

export default function GoodComponent() {
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
  }, []);

  return (
    <div>
      <p>현재 시간: {currentTime ?? '로딩 중...'}</p>
    </div>
  );
}
```

이렇게 하면 서버와 클라이언트 모두 처음에는 "로딩 중..."을 렌더링하고, 클라이언트에서 useEffect가 실행된 후에 실제 시간이 표시됩니다.

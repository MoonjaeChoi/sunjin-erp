<!-- Generated: 2026-01-25 05:10:00 KST -->

# Customer 목록 API

**문서 번호**: 2031_02
**원본 PRD**: 2031_기술지원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.2 — GET /api/customers/list' 참조
**구현 범위**: 고객사 선택 목록 API Route Handler
**복잡도**: S
**의존성**: 2031_01

---

## 구현 목표

기술지원 등록/수정 시 고객사 선택 Combobox에서 사용할 고객사 목록 API를 구현한다.

---

## 구현 내용

### 파일 구조

```
src/app/api/
└── customers/
    └── list/
        └── route.ts    # GET /api/customers/list
```

### 구현 상세

#### GET /api/customers/list

- **인증**: NextAuth session 필수 (미인증 시 401)
- **필터**: `deleted_at IS NULL`
- **정렬**: `name ASC`
- **응답**: `{ customers: CustomerListItem[] }`
- **RBAC**: 인증된 사용자 모두 접근 가능

### 핵심 인터페이스

```typescript
// Response type
interface CustomerListItem {
  id: number;
  name: string;
  category: string;
}

interface CustomerListResponse {
  customers: CustomerListItem[];
}
```

```typescript
// src/app/api/customers/list/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { Customer } from '@/entities/Customer';
import { IsNull } from 'typeorm';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ds = await getDataSource();
  const repo = ds.getRepository(Customer);

  const customers = await repo.find({
    where: { deleted_at: IsNull() },
    select: ['id', 'name', 'category'],
    order: { name: 'ASC' },
  });

  return NextResponse.json({ customers });
}
```

---

## Acceptance Criteria

- [ ] `GET /api/customers/list` 호출 시 고객사 목록 반환
- [ ] 미인증 시 401 응답
- [ ] deleted_at IS NOT NULL인 고객사 제외
- [ ] name 오름차순 정렬
- [ ] 응답에 id, name, category만 포함
- [ ] `npm run build` 성공

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build
npm run type-check
npm run lint
```

### 단위 테스트

**테스트 파일**: `src/__tests__/api/customers/list.test.ts`

```typescript
describe('GET /api/customers/list', () => {
  it('should return 401 when not authenticated', async () => {});
  it('should return customer list sorted by name', async () => {});
  it('should exclude soft-deleted customers', async () => {});
  it('should return only id, name, category fields', async () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] API 동작 확인 (dev 서버)
- [ ] RBAC 검증 (인증 필수)
- [ ] Soft delete 필터 동작

---

**다음 문서**: 2031_03_TechSupport_Entity.md

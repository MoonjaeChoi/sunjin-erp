<!-- Generated: 2026-01-24 00:00:00 KST -->
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Important Notice**
>
> **This document focuses on development guidelines and architecture only.**
>
> **배포 및 테스트 관련 사항은 CLAUDE.md에 작성하지 않습니다.**

## Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env  # Edit .env with Oracle credentials

# Initialize database
npx typeorm migration:run

# Start development server
npm run dev  # Port 3000
```

### Running Tests

```bash
npm run test          # Unit tests
npm run lint          # ESLint check
npm run type-check    # TypeScript validation
```

## Technology Stack

| Component | Tech | Version |
|-----------|------|---------|
| **Framework** | Next.js (App Router) | 14 |
| **Language** | TypeScript | 5.x |
| **UI** | shadcn/ui + Tailwind CSS | - |
| **State (Client)** | Zustand | - |
| **State (Server)** | TanStack Query | - |
| **ORM** | TypeORM | - |
| **Database** | Oracle XE | 23 |
| **Authentication** | NextAuth.js (Auth.js v5) | - |
| **File Storage** | Local Storage | - |
| **Deployment** | Docker + Docker Compose | - |

## Project Structure

```
sunjin-erp/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # 인증 관련 페이지 (로그인)
│   │   ├── (main)/                   # 인증 후 메인 레이아웃
│   │   │   ├── dashboard/            # 대시보드 & 일정관리
│   │   │   ├── tasks/                # 업무 검색
│   │   │   ├── support/              # 기술지원 관리
│   │   │   ├── projects/             # 프로젝트 관리 (Sales Pipeline)
│   │   │   ├── issues/               # 장애 현황 관리
│   │   │   ├── inventory/            # 재고 관리
│   │   │   ├── maintenance/          # 유지보수 고객 관리
│   │   │   ├── customers/            # 고객 등록/조회 (CRM)
│   │   │   ├── employees/            # 직원 관리
│   │   │   └── notices/              # 공지사항
│   │   └── api/                      # API Route Handlers
│   ├── components/                   # 공통 UI 컴포넌트
│   │   ├── ui/                       # shadcn/ui 기본 컴포넌트
│   │   ├── layout/                   # 레이아웃 (사이드바, 헤더)
│   │   └── features/                 # 도메인별 컴포넌트
│   ├── entities/                     # TypeORM 엔티티 정의
│   ├── migrations/                   # DB 마이그레이션
│   ├── seeds/                        # 초기 데이터
│   ├── lib/                          # 유틸리티, DB 클라이언트
│   ├── hooks/                        # 커스텀 React 훅
│   └── types/                        # TypeScript 타입 정의
├── public/                           # 정적 파일
├── docs/                             # 프로젝트 문서
│   └── prd/                          # 요구사항 정의서
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Database Development (Oracle XE 23)

### Oracle-Specific Considerations

- Use `VARCHAR2` instead of `VARCHAR` for string fields
- Use `CLOB` for large text fields instead of `TEXT`
- Use `NUMBER` for numeric types
- Sequence objects for auto-incrementing IDs
- Connection pooling configured for Oracle's session management

### Database Safety Guidelines

- **CASCADE DELETE 절대 금지**: 연쇄 삭제로 인한 데이터 손실 위험 방지
- **모든 외래 키는 ON DELETE RESTRICT 사용**: 하위 데이터 존재 시 삭제 차단
- **Soft delete 필수**: `deleted_at` 컬럼을 통한 논리적 삭제만 허용
- **물리적 삭제는 별도 승인 프로세스 필요**: 관리자 승인 + 백업 확인 필수
- **삭제 전 의존성 확인**: 관련 데이터 존재 여부 반드시 검증

### Oracle Connection Failure Policy

- **에러 메시지만 표시** - 대체 DB 연결 시도 금지
- **SQLite 등 폴백 금지** - Oracle 단일 아키텍처 유지
- **연결 에러 상세 로깅** - 디버깅을 위한 정보 제공
- **적절한 HTTP 상태 코드 반환** (500)

### Migration Pattern

```bash
# 마이그레이션 생성
npx typeorm migration:generate -n MigrationName

# 마이그레이션 실행
npx typeorm migration:run

# 마이그레이션 롤백
npx typeorm migration:revert
```

## Authentication & Authorization

| 역할 | 권한 |
|------|------|
| `ADMIN` | 전체 기능 + 직원/부서 관리 |
| `MANAGER` | 부서 내 전체 데이터 조회/편집 |
| `USER` | 본인 데이터 관리 + 읽기 |

## Environment Setup

**Required environment variables** (.env file):
```bash
# Database
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=XEPDB1
ORACLE_USERNAME=sunjin_admin
ORACLE_PASSWORD=<password>

# NextAuth
NEXTAUTH_SECRET=<32+ character random string>
NEXTAUTH_URL=http://localhost:3000

# File Storage
UPLOAD_DIR=./uploads
```

## Git Workflows

### Commit Message Convention

This project uses **Conventional Commits**:

```
<type>(<scope>): <description>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test file changes
- `refactor`: Code refactoring (no functional change)
- `perf`: Performance improvement
- `chore`: Build, deps, or infrastructure changes

**Examples:**
```bash
git commit -m "feat(dashboard): Add calendar view with schedule management"
git commit -m "fix(inventory): Fix serial number search query"
git commit -m "docs: Update technical spec with Oracle XE configuration"
```

### Branch Strategy

```bash
# Feature development
git checkout -b feat/feature-name

# Bug fixes
git checkout -b fix/bug-description
```

## Linting & Code Quality

```bash
npm run lint              # ESLint check
npm run lint -- --fix     # Auto-fix issues
npm run type-check        # TypeScript validation
npm run format            # Prettier formatting
```

**Code Quality Standards:**
- TypeScript strict mode enabled
- ESLint + Prettier for consistent formatting
- No unused imports or variables

## Development Standards

### Essential Rules

- **파일 생성 최소화**: 요청된 작업에 절대적으로 필요한 경우에만 파일 생성
- **기존 파일 편집 우선**: 새 파일 생성보다 기존 파일 수정 선호
- **기존 코드 패턴 준수**: 코드베이스에 존재하는 컨벤션 따르기
- **보안 취약점 주의**: XSS, SQL Injection 등 OWASP Top 10 방지

### File Creation Standards

When creating new files, add generation timestamp at the top:
- TypeScript/JavaScript: `// Generated: 2026-01-24 15:30:45 KST`
- HTML/XML: `<!-- Generated: 2026-01-24 15:30:45 KST -->`
- Always use Seoul timezone (KST)
- Format: YYYY-MM-DD HH:MM:SS KST

### Common Errors & Quick Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ENOENT: DB connection failed` | Oracle not reachable | Verify `ORACLE_HOST`, `ORACLE_PORT` in .env |
| `ORA-12541: No listener` | Oracle listener down | Check Oracle XE service status |
| `401 Unauthorized` | Session expired | Re-login, check `NEXTAUTH_SECRET` |
| `Type mismatch` | TypeScript strict mode | Review type definitions |

## Module Implementation Order

| Phase | Module | Dependency |
|-------|--------|------------|
| **Phase 1** | 인증 + 직원관리 + 고객관리 | 기반 데이터 |
| **Phase 2** | 대시보드 + 업무관리 + 업무검색 | Phase 1 |
| **Phase 3** | 기술지원 + 장애관리 | Phase 1 |
| **Phase 4** | 프로젝트 관리 (Sales Pipeline) | Phase 1 |
| **Phase 5** | 재고관리 + 유지보수 관리 | Phase 1 |
| **Phase 6** | 공지사항 | Phase 1 |

## Docker Deployment

```bash
# Start all services
docker-compose up -d

# Services:
# - app: Next.js application (port 3000)
# - db: Oracle XE 23 (port 1521)
```

---

**Last Updated**: 2026-01-24

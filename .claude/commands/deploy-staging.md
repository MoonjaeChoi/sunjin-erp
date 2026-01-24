---
name: deploy-staging
description: "Deploy sunjin-erp to staging server (192.168.75.194:3200) - Single-container Next.js deployment"
---

# deploy-staging - sunjin-erp 스테이징 서버 배포

sunjin-erp (Next.js 14) 프로젝트를 스테이징 서버에 배포합니다.
단일 컨테이너 구조로, Docker Compose를 사용하여 빌드 및 배포합니다.

## 배포 대상

| 항목 | 값 |
|------|-----|
| 서버 | 192.168.75.194 (Oracle Linux 9) |
| SSH | `pro301@192.168.75.194` (password: 1234) |
| 작업 디렉토리 | `/home/pro301/sunjin-erp` |
| 앱 URL | http://192.168.75.194:3200 |
| 컨테이너명 | `sunjin-erp-app` |
| 포트 매핑 | 3200 (외부) → 3000 (내부) |
| 네트워크 | `sunjin-network` (172.22.0.0/16) |
| DB 스키마 | `sunjin_admin` (공유 Oracle XE 인스턴스) |
| 리소스 제한 | CPU 3코어, RAM 8GB |

---

## 자동 실행 규칙

**이 커맨드는 사용자 확인 없이 자동으로 전체 워크플로우를 실행합니다.**
각 단계의 진행 상황을 출력하며, 오류 발생 시 즉시 중단하고 보고합니다.

---

## 배포 워크플로우

### Phase 1: 로컬 사전 검증 (Local Validation)

#### 1.1: 브랜치 확인

```bash
git branch --show-current
```

- `main` 브랜치가 아니면 경고 출력 후 **배포 중단**
- 사용자에게 main 브랜치로 전환 안내

#### 1.2: Working Tree 상태 확인

```bash
git status --porcelain
```

- uncommitted 변경사항이 있으면 **배포 중단**
- "커밋 후 다시 시도하세요" 안내

#### 1.3: 빌드 검증

```bash
npm run type-check
```

- type-check 실패 시 **배포 중단**
- 에러 내용 출력

---

### Phase 2: Git Push

#### 2.1: Remote 동기화 상태 확인

```bash
git log origin/main..HEAD --oneline
```

- push할 커밋이 없으면 스킵

#### 2.2: Push 실행

```bash
git push origin main
```

- push 실패 시 **배포 중단** (pull --rebase 필요 여부 안내)

---

### Phase 3: 서버 배포 (SSH)

#### 3.1: Git Pull

```bash
ssh pro301@192.168.75.194 'cd /home/pro301/sunjin-erp && git pull origin main'
```

- 충돌 발생 시 **배포 중단** (수동 해결 안내)

#### 3.2: Docker 이미지 빌드

```bash
ssh pro301@192.168.75.194 'cd /home/pro301/sunjin-erp && docker compose build --no-cache'
```

- 빌드 실패 시 **배포 중단** (마지막 30줄 로그 출력)

#### 3.3: 서비스 교체 기동

```bash
ssh pro301@192.168.75.194 'cd /home/pro301/sunjin-erp && docker compose up -d'
```

- 기존 컨테이너를 새 이미지로 자동 교체

---

### Phase 4: 헬스체크

#### 4.1: 컨테이너 상태 확인

```bash
ssh pro301@192.168.75.194 'docker ps --filter name=sunjin-erp-app --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
```

#### 4.2: HTTP 응답 확인 (최대 30초 대기, 5초 간격)

```bash
# 6회 재시도 (5초 간격 = 최대 30초)
for i in 1 2 3 4 5 6; do
  STATUS=$(ssh pro301@192.168.75.194 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3200" 2>/dev/null)
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ]; then
    echo "Health check passed (HTTP $STATUS)"
    break
  fi
  echo "Waiting... (attempt $i/6, HTTP $STATUS)"
  sleep 5
done
```

- HTTP 200 또는 307 (NextAuth 리다이렉트) → 성공
- 6회 모두 실패 시 → 로그 확인 후 보고

#### 4.3: 컨테이너 로그 확인

```bash
ssh pro301@192.168.75.194 'docker logs --tail 20 sunjin-erp-app'
```

- 에러 패턴 (Error, FATAL, panic) 존재 시 경고 출력

---

### Phase 5: 배포 보고

배포 완료 후 아래 형식으로 보고:

```markdown
## 배포 완료

| 항목 | 값 |
|------|-----|
| 브랜치 | main |
| 커밋 | <hash> <message> |
| URL | http://192.168.75.194:3200 |
| 컨테이너 상태 | <status> |
| HTTP 응답 | <status code> |
| 완료 시각 | <YYYY-MM-DD HH:MM:SS KST> |
```

---

## 오류 대응

| 상황 | 대응 |
|------|------|
| main 브랜치 아님 | "main 브랜치에서 실행하세요" 안내 |
| uncommitted changes | "커밋 후 다시 시도하세요" 안내 |
| type-check 실패 | 에러 내용 출력, 배포 중단 |
| git push 실패 | `git pull --rebase` 안내 |
| git pull 충돌 | 서버에서 수동 해결 필요 안내 |
| docker build 실패 | 빌드 로그 마지막 30줄 표시 |
| 컨테이너 미기동 | `docker logs sunjin-erp-app` 출력 |
| health check 실패 | 로그 출력 + 이전 커밋 롤백 방법 안내 |

---

## 초기 설정 (최초 1회)

서버에 아래 파일이 없으면 배포 전에 생성이 필요합니다:

### 필수 파일 확인

```bash
# 서버에서 확인
ssh pro301@192.168.75.194 'ls /home/pro301/sunjin-erp/Dockerfile /home/pro301/sunjin-erp/docker-compose.yml /home/pro301/sunjin-erp/.env 2>&1'
```

### Dockerfile (프로젝트 루트)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### docker-compose.yml (프로젝트 루트)

```yaml
services:
  app:
    container_name: sunjin-erp-app
    build: .
    ports:
      - "3200:3000"
    env_file:
      - .env
    networks:
      - sunjin-network
    deploy:
      resources:
        limits:
          cpus: "3"
          memory: 8G
    restart: unless-stopped

networks:
  sunjin-network:
    external: true
```

### next.config.js 수정 (standalone 출력 필요)

```javascript
// next.config.js에 output: 'standalone' 추가
const nextConfig = {
  output: 'standalone',
  // ... 기존 설정
};
```

### 서버 .env 파일

```bash
# /home/pro301/sunjin-erp/.env (서버에서 직접 생성, git에 포함하지 않음)
ORACLE_HOST=192.168.75.194
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=XEPDB1
ORACLE_USERNAME=sunjin_admin
ORACLE_PASSWORD=<password>
NEXTAUTH_SECRET=<openssl rand -base64 32 결과>
NEXTAUTH_URL=http://192.168.75.194:3200
UPLOAD_DIR=/app/uploads
```

### Docker 네트워크 생성 (최초 1회)

```bash
ssh pro301@192.168.75.194 'docker network create --driver bridge --subnet 172.22.0.0/16 sunjin-network'
```

---

## 주의사항

1. **포트 3200 전용** — 3000, 3001 등 기존 시스템 포트 사용 금지
2. **sunjin-network만 사용** — zine-network 연결 금지
3. **sunjin_admin 스키마만 사용** — ocr_admin 접근 금지
4. **리소스 제한 준수** — CPU 3코어, RAM 8GB 이내
5. **.env 파일은 서버에서만 관리** — git에 커밋하지 않음
6. **--no-cache 빌드** — 항상 최신 코드 반영을 보장

---
name: deploy-staging
description: "Deploy sunjin-erp to production server (192.168.75.194) — accessible at www.clayve.co.kr/sunjin. Use this skill whenever the user wants to deploy, push to production, release, or update the live site."
---

# deploy-staging - sunjin-erp 프로덕션 배포

sunjin-erp (Next.js 14) 프로젝트를 서버에 배포합니다.
배포 즉시 **www.clayve.co.kr/sunjin** 으로 접속 가능합니다. (별도 프로덕션 서버 없음)

## 배포 대상

| 항목 | 값 |
|------|-----|
| 서버 | 192.168.75.194 (Oracle Linux 9) |
| SSH | `pro301@192.168.75.194` (password: 1234) |
| 작업 디렉토리 | `/home/pro301/sunjin-erp` |
| 컨테이너명 | `sunjin-erp-app` |
| 포트 매핑 | 3200 (외부) → 3000 (내부) |
| 네트워크 | `sunjin-network` (172.22.0.0/16) |
| DB 스키마 | `sunjin_admin` (공유 Oracle XE 인스턴스) |
| 리소스 제한 | CPU 3코어, RAM 8GB |
| **프로덕션 URL** | **https://www.clayve.co.kr/sunjin** |
| 내부 직접 URL | http://192.168.75.194:3200 |

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

#### 3.2: .env NEXTAUTH_URL 확인 및 갱신

```bash
ssh pro301@192.168.75.194 'grep NEXTAUTH_URL /home/pro301/sunjin-erp/.env'
```

`NEXTAUTH_URL`이 `https://www.clayve.co.kr/sunjin`이 아니면 자동으로 수정:

```bash
ssh pro301@192.168.75.194 "sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://www.clayve.co.kr/sunjin|' /home/pro301/sunjin-erp/.env"
```

#### 3.3: Docker 이미지 빌드

```bash
ssh pro301@192.168.75.194 'cd /home/pro301/sunjin-erp && docker compose build --no-cache'
```

- 빌드 실패 시 **배포 중단** (마지막 30줄 로그 출력)

#### 3.4: 서비스 교체 기동

```bash
ssh pro301@192.168.75.194 'cd /home/pro301/sunjin-erp && docker compose up -d'
```

- 기존 컨테이너를 새 이미지로 자동 교체

#### 3.5: Nginx 프록시 설정 확인 및 반영

nginx가 `/sunjin` 경로를 `localhost:3200`으로 프록시하는지 확인합니다.

```bash
ssh pro301@192.168.75.194 'cat /etc/nginx/conf.d/sunjin-erp.conf 2>/dev/null || echo "NOT_FOUND"'
```

설정 파일이 없거나 `/sunjin` 프록시 규칙이 없으면 아래 내용으로 생성합니다:

```bash
ssh pro301@192.168.75.194 'sudo tee /etc/nginx/conf.d/sunjin-erp.conf > /dev/null << '"'"'EOF'"'"'
# sunjin-erp reverse proxy — www.clayve.co.kr/sunjin → localhost:3200
location /sunjin {
    proxy_pass         http://localhost:3200;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
}
EOF'
```

> **참고**: 위 `location` 블록은 www.clayve.co.kr의 기존 nginx server 블록 안에 포함되어야 합니다.
> 별도 server 블록이 필요한 경우 담당자가 수동으로 반영합니다.

nginx 설정 문법 검사 후 리로드:

```bash
ssh pro301@192.168.75.194 'sudo nginx -t && sudo nginx -s reload'
```

- 문법 오류 시 경고 출력 (앱 배포 자체는 이미 완료되었으므로 배포 중단 안 함, 수동 확인 요청)

---

### Phase 4: 헬스체크

#### 4.1: 컨테이너 상태 확인

```bash
ssh pro301@192.168.75.194 'docker ps --filter name=sunjin-erp-app --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
```

#### 4.2: 내부 HTTP 응답 확인 (최대 30초 대기, 5초 간격)

```bash
for i in 1 2 3 4 5 6; do
  STATUS=$(ssh pro301@192.168.75.194 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3200/sunjin" 2>/dev/null)
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "308" ]; then
    echo "Internal health check passed (HTTP $STATUS)"
    break
  fi
  echo "Waiting... (attempt $i/6, HTTP $STATUS)"
  sleep 5
done
```

#### 4.3: 프로덕션 URL 응답 확인

```bash
STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://www.clayve.co.kr/sunjin 2>/dev/null)
echo "Production URL health check: HTTP $STATUS"
```

- HTTP 200, 307, 308 → 성공
- 실패 시 "nginx 설정 또는 DNS/도메인 연결을 확인하세요" 안내 (앱 자체는 정상 기동 중)

#### 4.4: 컨테이너 로그 확인

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
| 프로덕션 URL | https://www.clayve.co.kr/sunjin |
| 내부 URL | http://192.168.75.194:3200 |
| 컨테이너 상태 | <status> |
| 내부 HTTP 응답 | <status code> |
| 프로덕션 HTTP 응답 | <status code> |
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
| health check 실패 (내부) | 로그 출력 + 이전 커밋 롤백 방법 안내 |
| health check 실패 (프로덕션) | nginx 설정/DNS 확인 안내 (앱은 정상) |
| nginx 문법 오류 | 기존 설정 유지, 수동 확인 요청 |

---

## 초기 설정 (최초 1회)

### 필수 파일 확인

```bash
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

### 서버 .env 파일

```bash
# /home/pro301/sunjin-erp/.env (서버에서 직접 생성, git에 포함하지 않음)
ORACLE_HOST=192.168.75.194
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=FREEPDB1
ORACLE_USERNAME=sunjin_admin
ORACLE_PASSWORD=<password>
NEXTAUTH_SECRET=<openssl rand -base64 32 결과>
NEXTAUTH_URL=https://www.clayve.co.kr/sunjin
UPLOAD_DIR=/app/uploads
```

### Docker 네트워크 생성 (최초 1회)

```bash
ssh pro301@192.168.75.194 'docker network create --driver bridge --subnet 172.22.0.0/16 sunjin-network'
```

### Nginx 설정 (최초 1회)

`www.clayve.co.kr`의 nginx server 블록에 아래 `location`을 추가합니다:

```nginx
# www.clayve.co.kr 의 기존 server 블록 내부에 추가
location /sunjin {
    proxy_pass         http://localhost:3200;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
}
```

---

## 주의사항

1. **포트 3200 전용** — 3000, 3001 등 기존 시스템 포트 사용 금지
2. **sunjin-network만 사용** — zine-network 연결 금지
3. **sunjin_admin 스키마만 사용** — ocr_admin 접근 금지
4. **리소스 제한 준수** — CPU 3코어, RAM 8GB 이내
5. **.env 파일은 서버에서만 관리** — git에 커밋하지 않음
6. **--no-cache 빌드** — 항상 최신 코드 반영을 보장
7. **NEXTAUTH_URL은 반드시 프로덕션 URL** — `https://www.clayve.co.kr/sunjin` (IP 주소 아님)

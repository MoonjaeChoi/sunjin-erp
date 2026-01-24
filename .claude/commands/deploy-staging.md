---
name: deploy-staging
description: "Deploy sunjin-erp to staging server (192.168.75.194:3200)"
---

# deploy-staging - 스테이징 서버 배포

sunjin-erp 프로젝트를 스테이징 서버(192.168.75.194:3200)에 배포합니다.

## 배포 대상 정보

| 항목 | 값 |
|------|-----|
| 서버 | 192.168.75.194 (Oracle Linux 9) |
| SSH | pro301@192.168.75.194 |
| 작업 디렉토리 | /home/pro301/sunjin-erp |
| 앱 URL | http://192.168.75.194:3200 |
| 컨테이너 | sunjin-erp-app |
| 포트 매핑 | 3200 (외부) → 3000 (내부) |
| 네트워크 | sunjin-network (172.21.0.0/16) |

---

## 실행 절차

아래 단계를 순서대로 수행하세요. 각 단계에서 오류 발생 시 즉시 중단하고 사용자에게 보고합니다.

### Step 1: 사전 검증 (Local)

```bash
# 1-1. 현재 브랜치 확인 (main이 아니면 경고 후 사용자 확인)
git branch --show-current

# 1-2. Working tree 상태 확인 (uncommitted 변경사항 있으면 경고)
git status --porcelain

# 1-3. 빌드 검증 (type-check만 수행, 빌드 실패 시 배포 중단)
npm run type-check
```

- 현재 브랜치가 main이 아니면 사용자에게 확인 후 진행 여부 결정
- uncommitted 변경사항이 있으면 배포 중단, 커밋 먼저 안내
- type-check 실패 시 배포 중단

### Step 2: Git Push (Local → Remote)

```bash
# 2-1. Remote와의 차이 확인
git log origin/main..HEAD --oneline

# 2-2. Push (unpushed commits가 있는 경우)
git push origin main
```

- push할 커밋이 없으면 이 단계 스킵
- push 실패 시 배포 중단

### Step 3: 서버 배포 (SSH)

```bash
# 3-1. SSH 접속 후 순차 실행
ssh pro301@192.168.75.194 'cd /home/pro301/sunjin-erp && git pull origin main'

# 3-2. Docker 이미지 빌드
ssh pro301@192.168.75.194 'cd /home/pro301/sunjin-erp && docker compose build'

# 3-3. 서비스 기동 (기존 컨테이너 교체)
ssh pro301@192.168.75.194 'cd /home/pro301/sunjin-erp && docker compose up -d'
```

- git pull 충돌 시 배포 중단
- docker compose build 실패 시 배포 중단
- docker compose up -d 실행 후 이전 컨테이너는 자동 교체됨

### Step 4: 헬스체크

```bash
# 4-1. 컨테이너 상태 확인
ssh pro301@192.168.75.194 'docker ps --filter name=sunjin-erp-app --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'

# 4-2. HTTP 응답 확인 (최대 30초 대기, 5초 간격 재시도)
for i in 1 2 3 4 5 6; do
  STATUS=$(ssh pro301@192.168.75.194 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3200" 2>/dev/null)
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ]; then
    echo "Health check passed (HTTP $STATUS)"
    break
  fi
  echo "Waiting... (attempt $i, HTTP $STATUS)"
  sleep 5
done

# 4-3. 최근 로그 확인 (오류 여부)
ssh pro301@192.168.75.194 'docker logs --tail 20 sunjin-erp-app'
```

### Step 5: 결과 보고

배포 완료 후 아래 형식으로 보고:

```
=== 배포 완료 ===
브랜치: main
커밋: <latest commit hash + message>
URL: http://192.168.75.194:3200
상태: <컨테이너 상태>
시간: <완료 시각 KST>
```

---

## 오류 대응

| 상황 | 대응 |
|------|------|
| uncommitted changes | "커밋 후 다시 시도하세요" 안내 |
| type-check 실패 | 에러 내용 표시, 배포 중단 |
| git push 실패 | pull --rebase 필요 여부 안내 |
| git pull 충돌 | 서버에서 수동 해결 필요 안내 |
| docker build 실패 | 빌드 로그 마지막 30줄 표시 |
| 컨테이너 미기동 | docker logs 표시 |
| health check 실패 | 로그 확인 후 롤백 안내 |

## 롤백 (필요 시)

```bash
# 이전 버전으로 롤백
ssh pro301@192.168.75.194 'cd /home/pro301/sunjin-erp && git log --oneline -5'
# 사용자가 선택한 커밋으로 reset
ssh pro301@192.168.75.194 'cd /home/pro301/sunjin-erp && git checkout <commit> && docker compose build && docker compose up -d'
```

---

## 주의사항

- **포트 3200 전용**: 다른 포트 사용 금지 (기존 시스템 충돌 방지)
- **sunjin-network 사용**: zine-network 연결 금지
- **ocr_admin 접근 금지**: sunjin_admin 스키마만 사용
- **리소스 제한**: CPU 3코어, RAM 8GB 이내
- **.env 파일**: 서버의 `/home/pro301/sunjin-erp/.env`에 별도 관리 (git에 포함하지 않음)

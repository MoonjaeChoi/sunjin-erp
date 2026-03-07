# Oracle 23ai Free 마이그레이션 완료 보고서

**작성일**: 2026-03-07
**적용 대상**: en-zine 스테이징 서버 (192.168.75.194) · 프로덕션 서버 (app.clayve.co.kr)

---

## 1. 마이그레이션 개요

Oracle XE 21c에서 Oracle 23ai Free로 데이터베이스 엔진을 업그레이드하였습니다.
Sunjin Infotech에서 제공하는 서버에서 운영 중인 데이터베이스도 동일하게 23ai로 마이그레이션 완료되었습니다.

---

## 2. 마이그레이션 완료 일시

| 구분 | 커밋 해시 | 완료 일시 |
|------|----------|----------|
| 스테이징 코드베이스 전체 업데이트 | `0bdba85ed` | 2026-02-26 20:13 KST |
| 프로덕션 compose 업데이트 | `9ba12a730` | 2026-02-26 21:28 KST |
| CLAUDE.md 문서 반영 | `fb71f344e` | 2026-02-26 (동일 작업 세션) |

---

## 3. 변경된 접속 정보

### 3.1 PDB (Pluggable Database) 이름 변경

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| PDB 이름 | `XEPDB1` | `FREEPDB1` |
| Oracle 버전 | Oracle XE 21c | Oracle 23ai Free |
| Docker 이미지 | `oracle/database:express:21.3.0-xe` | `gvenzl/oracle-free:23-slim` |

### 3.2 접속 문자열

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 호스트 | `192.168.75.194` | `192.168.75.194` (동일) |
| 포트 | `1521` | `1521` (동일) |
| 서비스명 | `XEPDB1` | `FREEPDB1` |
| 접속 문자열 | `192.168.75.194:1521/XEPDB1` | `192.168.75.194:1521/FREEPDB1` |
| 스키마 | `ocr_admin` | `ocr_admin` (동일) |

### 3.3 환경변수 변경 사항

```bash
# 변경 전
DB_SERVICE_NAME=XEPDB1
ORACLE_SERVICE_NAME=XEPDB1
ORACLE_CONNECTION_STRING=192.168.75.194:1521/XEPDB1

# 변경 후
DB_SERVICE_NAME=FREEPDB1
ORACLE_SERVICE_NAME=FREEPDB1
ORACLE_CONNECTION_STRING=192.168.75.194:1521/FREEPDB1
```

---

## 4. 영향받은 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `zine-alpaca/docker-compose.staging.yml` | XEPDB1 → FREEPDB1 (18곳) |
| `zine-alpaca/docker-compose.production.yml` | XEPDB1 → FREEPDB1 |
| `docker-compose.production-enhanced.yml` | XEPDB1 → FREEPDB1 |
| `infrastructure/.env.staging.example` | XEPDB1 → FREEPDB1 |
| `infrastructure/docker-compose/docker-compose.staging.yml` | XEPDB1 → FREEPDB1 |
| `infrastructure/k8s/oracle-deployment.yaml` | XEPDB1 → FREEPDB1 |
| `infrastructure/k8s/20-oracle-statefulset.yaml` | XEPDB1 → FREEPDB1 |
| `zine-alpaca/backend/.env.example` | XEPDB1 → FREEPDB1 |
| `scholar/src/database/connection.py` | cx-Oracle → oracledb (Thin Mode) |
| `scholar/requirements.txt` | cx-Oracle==8.3.0 → oracledb>=2.0 |

---

## 5. 주의사항

- 기존 `XEPDB1`로 하드코딩된 접속 문자열이 있다면 `FREEPDB1`로 변경 필요
- Scholar 시스템은 cx-Oracle 드라이버에서 python-oracledb (Thin Mode)로 변경됨
- 데이터 및 스키마(`ocr_admin`)는 그대로 유지됨 — 데이터 마이그레이션 없이 엔진 업그레이드만 진행

<!-- Generated: 2026-03-07 13:00:00 KST -->

# 테스트 데이터 시드 문서

sunjin-erp 각 모듈 화면 테스트를 위한 샘플 데이터 정의.
`docs/seed/seed_all.js` 스크립트로 일괄 삽입 가능.

---

## 전제 조건

| 항목 | 값 |
|------|-----|
| DB 스키마 | `sunjin_admin` (Oracle 23ai, FREEPDB1) |
| 직원 ID | 1(시스템관리자), 3(김철수), 4(이영희), 5(박민준), 6(정수현), 7(최준호) |
| 부서 ID | 1(관리부) |

---

## 모듈별 시드 데이터

### 1. CUSTOMER (고객사) — 6개

| code | name | classification |
|------|------|----------------|
| CUST-00001 | 삼성전자 | END_USER |
| CUST-00002 | LG전자 | RESELLER |
| CUST-00003 | SK하이닉스 | MAINTENANCE |
| CUST-00004 | 현대자동차 | END_USER |
| CUST-00005 | 네이버 | END_USER |
| CUST-00006 | 카카오 | RESELLER |

---

### 2. TASK (업무일지) — 12개

| title | task_type | work_type | status | employee |
|-------|-----------|-----------|--------|----------|
| 주간 서버 점검 | MAINTENANCE | OFFICE | DONE | 김철수 |
| 네트워크 장비 교체 | WORK | FIELD | IN_PROGRESS | 이영희 |
| 월간 보고서 작성 | WORK | OFFICE | DONE | 박민준 |
| 삼성전자 현장 방문 | MEETING | FIELD | DONE | 정수현 |
| 신규 직원 온보딩 | EDUCATION | OFFICE | DONE | 최준호 |
| DB 백업 설정 | MAINTENANCE | OFFICE | READY | 김철수 |
| LG전자 미팅 | MEETING | FIELD | IN_PROGRESS | 이영희 |
| 소프트웨어 라이선스 갱신 | WORK | OFFICE | DONE | 박민준 |
| SK하이닉스 기술지원 | WORK | FIELD | DONE | 정수현 |
| 사내 보안 교육 | EDUCATION | OFFICE | READY | 최준호 |
| 네이버 제안서 작성 | WORK | OFFICE | IN_PROGRESS | 김철수 |
| 카카오 현장 설치 | WORK | FIELD | DONE | 이영희 |

- task_type: `WORK` `MEETING` `EDUCATION` `MAINTENANCE`
- work_type: `OFFICE` `FIELD`
- status: `READY` `IN_PROGRESS` `DONE`

---

### 3. TECH_SUPPORT (기술지원) — 8개

| title | support_type | support_method | status | customer |
|-------|-------------|---------------|--------|----------|
| 서버 다운 긴급 복구 | EMERGENCY | ONSITE | COMPLETED | 삼성전자 |
| 네트워크 속도 저하 문의 | INQUIRY | REMOTE | COMPLETED | LG전자 |
| SW 설치 요청 | INSTALLATION | REMOTE | IN_PROGRESS | SK하이닉스 |
| 하드웨어 교체 요청 | REPAIR | ONSITE | RECEIVED | 현대자동차 |
| 백업 솔루션 컨설팅 | CONSULTING | PHONE | COMPLETED | 네이버 |
| 방화벽 설정 오류 | ERROR | REMOTE | IN_PROGRESS | 카카오 |
| 정기 점검 방문 | MAINTENANCE | ONSITE | COMPLETED | 삼성전자 |
| VPN 접속 불가 | ERROR | REMOTE | RECEIVED | LG전자 |

- support_type: `EMERGENCY` `INQUIRY` `INSTALLATION` `REPAIR` `CONSULTING` `ERROR` `MAINTENANCE`
- support_method: `ONSITE` `REMOTE` `PHONE`
- status: `RECEIVED` `IN_PROGRESS` `COMPLETED`

---

### 4. PROJECT (영업/프로젝트) — 6개

| project_name | status | customer | 계약금액 |
|-------------|--------|----------|---------|
| 삼성전자 IT 인프라 구축 | COMPLETED | 삼성전자 | 150,000,000 |
| LG전자 클라우드 마이그레이션 | IN_PROGRESS | LG전자 | 80,000,000 |
| SK하이닉스 보안 시스템 도입 | PREPARING | SK하이닉스 | 50,000,000 |
| 현대자동차 ERP 고도화 | ON_HOLD | 현대자동차 | 200,000,000 |
| 네이버 데이터 분석 플랫폼 | IN_PROGRESS | 네이버 | 120,000,000 |
| 카카오 모바일 앱 개발 | PREPARING | 카카오 | 60,000,000 |

- status: `PREPARING` `IN_PROGRESS` `COMPLETED` `ON_HOLD`

---

### 5. ISSUE (이슈) — 8개

| title | severity | status | customer |
|-------|----------|--------|----------|
| 생산 서버 CPU 100% 이슈 | CRITICAL | COMPLETED | 삼성전자 |
| 결제 모듈 오류 발생 | HIGH | IN_PROGRESS | LG전자 |
| 로그인 간헐적 실패 | MEDIUM | IN_PROGRESS | SK하이닉스 |
| 보고서 출력 오류 | LOW | INTAKE | 현대자동차 |
| API 응답 지연 | HIGH | COMPLETED | 네이버 |
| 데이터 동기화 실패 | CRITICAL | IN_PROGRESS | 카카오 |
| 이메일 발송 안됨 | MEDIUM | INTAKE | 삼성전자 |
| 대시보드 로딩 지연 | LOW | COMPLETED | LG전자 |

- severity: `CRITICAL` `HIGH` `MEDIUM` `LOW`
- status: `INTAKE` `IN_PROGRESS` `COMPLETED`

---

### 6. INVENTORY (재고/자산) — 12개

| model | category | serial_number | current_status |
|-------|----------|--------------|---------------|
| Dell PowerEdge R750 | 서버 | SRV-2024-001 | 재고 |
| Dell PowerEdge R750 | 서버 | SRV-2024-002 | 출고 |
| Cisco Catalyst 9300 | 네트워크장비 | NET-2024-001 | 재고 |
| Cisco Catalyst 9300 | 네트워크장비 | NET-2024-002 | 출고 |
| Samsung Galaxy Tab S9 | 태블릿 | TAB-2024-001 | 재고 |
| LG 27" 4K 모니터 | 모니터 | MON-2024-001 | 재고 |
| LG 27" 4K 모니터 | 모니터 | MON-2024-002 | 출고 |
| LG 27" 4K 모니터 | 모니터 | MON-2024-003 | 고장 |
| MacBook Pro 14" M3 | 노트북 | LAP-2024-001 | 재고 |
| MacBook Pro 14" M3 | 노트북 | LAP-2024-002 | 출고 |
| MacBook Pro 14" M3 | 노트북 | LAP-2024-003 | 재고 |
| HP LaserJet Pro | 프린터 | PRT-2023-001 | 폐기 |

- current_status: `재고` `출고` `고장` `폐기`

---

### 7. MAINTENANCE_CONTRACT (유지보수 계약) — 6개

| contract_name | contract_status | customer | 계약금액 |
|-------------|----------------|----------|---------|
| 삼성전자 서버 유지보수 2024 | 활성 | 삼성전자 | 24,000,000 |
| LG전자 네트워크 유지보수 | 활성 | LG전자 | 18,000,000 |
| SK하이닉스 보안장비 유지보수 | 갱신예정 | SK하이닉스 | 12,000,000 |
| 현대자동차 인프라 유지보수 | 갱신예정 | 현대자동차 | 36,000,000 |
| 네이버 클라우드 유지보수 | 종료 | 네이버 | 20,000,000 |
| 카카오 시스템 유지보수 | 활성 | 카카오 | 15,000,000 |

- contract_status: `활성` `갱신예정` `종료`

---

### 8. NOTICE (공지사항) — 5개

| title | type | author |
|-------|------|--------|
| 2026년 1분기 사업 계획 공유 | 공지 | 시스템관리자 |
| 재택근무 가이드라인 업데이트 | 공유 | 시스템관리자 |
| 신규 보안 정책 시행 안내 | 지시 | 시스템관리자 |
| 사내 카페테리아 개선 건의 | 건의 | 김철수 |
| 팀빌딩 행사 후기 | 자유 | 이영희 |

- type: `공지` `공유` `지시` `건의` `자유`

---

## 실행 방법

```bash
# 로컬에서 서버로 스크립트 전송 후 실행
scp docs/seed/seed_all.js pro301@192.168.75.194:/tmp/seed_all.js
ssh pro301@192.168.75.194 'docker cp /tmp/seed_all.js sunjin-erp-app:/app/seed_all.js && docker exec sunjin-erp-app node /app/seed_all.js && docker exec sunjin-erp-app rm /app/seed_all.js'
```

---

## 초기화 방법 (재시드 시)

```sql
-- 순서 중요: FK 역순 삭제
DELETE FROM NOTICE_ATTACHMENT;
DELETE FROM NOTICE_COMMENT;
DELETE FROM NOTICE;
DELETE FROM INVENTORY_HISTORY;
DELETE FROM INVENTORY;
DELETE FROM ISSUE_HISTORY;
DELETE FROM ISSUE_ATTACHMENT;
DELETE FROM ISSUE;
DELETE FROM PROJECT_ATTACHMENT;
DELETE FROM PROJECT;
DELETE FROM TECH_SUPPORT;
DELETE FROM TASK;
UPDATE MAINTENANCE_CONTRACT SET "deleted_at" = SYSDATE;
UPDATE CUSTOMER SET "deleted_at" = SYSDATE;
COMMIT;
```

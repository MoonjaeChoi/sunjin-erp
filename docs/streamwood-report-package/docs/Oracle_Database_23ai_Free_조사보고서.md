<!-- Generated: 2026-02-24 23:00:00 KST -->

# Oracle Database 23ai Free 조사 보고서

> 작성일: 2026년 2월 24일
> 참고: 시냇가하늘숲 시스템 데이터베이스 선택 근거 자료

---

## 1. 개요 — 명칭 변경 이력

Oracle Database **Express Edition(XE)** 은 21c 버전을 마지막으로 종료되었으며,
이후 명칭이 아래와 같이 변경되었습니다.

```
Oracle Database XE 21c  (2021)
        ↓
Oracle Database 23c Free  (2023년 GA)
        ↓
Oracle Database 23ai Free  (2024년 5월 — 현재 사용 명칭)
        ↓
Oracle AI Database 26ai Free  (2025년 10월 — 최신 버전)
```

> **본 문서는 현재 실무에서 가장 널리 사용되는 안정 버전인 Oracle Database 23ai Free 기준으로 작성됩니다.**
> 26ai Free는 2025년 10월 출시되었으며, 온프레미스 Linux x86-64용 Enterprise Edition은 2026년 1월 예정입니다.

| 구분 | Oracle XE 21c | Oracle Database 23ai Free |
|------|--------------|---------------------------|
| 출시 | 2021년 | 2024년 5월 (23ai GA) |
| 공식 명칭 | Express Edition | Database 23ai Free |
| 리소스 한도 | CPU 2코어 / RAM 2GB / 데이터 12GB | 동일 |
| 엔터프라이즈 기능 | 제한적 | **대부분 포함** |
| AI 기능 | 없음 | AI Vector Search 포함 |
| JSON 고급 처리 | 제한적 | JSON Relational Duality 포함 |
| Docker 공식 지원 | 있음 | 있음 |
| 라이선스 | 무료 | 무료 (동일 조건 계승) |

---

## 2. 무료 사용 범위 (라이선스)

### 2.1 공식 라이선스 조건

Oracle Database 23ai Free는 **Oracle Free Use Terms and Conditions** 에 따라 배포됩니다.

| 항목 | 조건 |
|------|------|
| **비용** | 완전 무료 (영구) |
| **상업적 사용** | **허용** — 프로덕션 환경 포함, 용도 제한 없음 |
| **재배포** | 불가 |
| **공식 기술 지원** | 없음 (커뮤니티 포럼만 제공) |
| **보안 패치** | 제공 안 됨 |
| **업그레이드 경로** | Enterprise Edition / Standard Edition 2로 언제든 전환 가능 |

> 공식 문서 인용:
> *"You can run production workloads — there's no restriction on what you use this edition for."*
> — Oracle AI Database Free FAQ

### 2.2 리소스 제한

| 항목 | 제한 | 초과 시 동작 |
|------|------|------------|
| **CPU 코어** | 최대 2코어 | 자동 스로틀링 (추가 코어 무시) |
| **RAM** | 최대 2GB (SGA + PGA 합산) | 2GB 초과 사용 불가 |
| **사용자 데이터** | 최대 12GB | `ORA-12954` 오류 발생 |
| **설치 수** | 논리 환경당 1개 (VM·컨테이너·물리 서버) | `ORA-00442` 오류 발생 |
| **PDB 수** | 최대 16개 | — |

### 2.3 소규모 서비스에서의 실질적 여유

교회 교인 관리 서비스 기준 예상 데이터량:

| 데이터 종류 | 예상 용량 (1,000명 기준) |
|------------|------------------------|
| 교인 기본정보 | ~50MB |
| 출결 이력 (5년) | ~200MB |
| 심방·보고 기록 (5년) | ~100MB |
| 게시판·공지 | ~50MB |
| **합계** | **~400MB** |

12GB 한도 대비 **약 3%** 수준으로, 사실상 수십 년간 용량 제한 없이 운용 가능합니다.

---

## 3. 엔터프라이즈 기능을 무료로 제공하는 이유

### 3.1 경쟁 압박 — 오픈소스 DB의 부상

Oracle은 오랫동안 DB 시장의 절대 강자였으나, 최근 **PostgreSQL, MySQL, MongoDB, SQLite** 등
무료 오픈소스 DB의 급성장으로 시장 점유율이 잠식되고 있습니다.

> *"Market share data suggests Oracle might only be marginally ahead of the competition,
> with smaller players likely chipping away at its customer base."*
> — InfoWorld

이 위기감이 Oracle로 하여금 진입 장벽을 낮추는 **무료화 전략**을 택하게 만든 직접적 동인입니다.
또한 23ai에서는 MySQL·PostgreSQL과의 SQL 호환성(GROUP BY alias, FROM 절 생략 등)을 강화하여
개발자들이 Oracle로 전환하기 쉽도록 유도했습니다.

### 3.2 개발자 우선 전략 (Developer-First)

Oracle은 현대 기업의 소프트웨어 구매 결정이 **개발자 중심**으로 이루어진다는 사실을 인식했습니다.

- 개발자가 익숙하게 사용하는 DB → 기업 전체 채택으로 이어지는 경로
- 개발 단계에서 Oracle로 구축된 앱 → 운영 규모 확대 시 Enterprise Edition으로 자연스럽게 전환
- 무료 버전에서 축적된 Oracle 경험 → **장기 고객 잠금(Vendor Lock-in) 효과**

> *"Developers are increasingly driving development software selection across enterprises.
> Getting tools into their hands with a minimum of friction is more important than ever."*
> — Oracle 공식 블로그

### 3.3 AI 시대 생태계 선점

Oracle은 23ai를 단순한 무료 에디션이 아닌, **AI 데이터베이스 표준을 선점**하기 위한 전략적 출시로 기획했습니다.
('c'에서 'ai'로의 명칭 변경 자체가 AI 기능 강조를 위한 리브랜딩입니다.)

300개 이상의 신기능을 무료로 제공함으로써, 개발자들이 Oracle 23ai 기반으로 AI 앱을 개발하도록 유도합니다.
이 앱들이 성장하면 유료 Oracle Cloud 또는 Enterprise Edition 고객이 되는 구조입니다.

> *"Oracle remains the only vendor to provide a converged database platform
> both in the cloud and on-premises, entirely free-of-charge."*
> — Oracle 공식 발표

---

## 4. 주요 신기능 (23ai Free에 포함)

### 4.1 AI Vector Search

문서·이미지·비정형 데이터를 개념적 유사도로 검색하는 기능.
LLM(ChatGPT 등)과 사내 DB를 결합하는 **RAG(검색증강생성)** 구현에 핵심적으로 활용됩니다.

- 별도 벡터 DB(Pinecone, Chroma 등) 없이 Oracle 단독으로 AI 검색 구현 가능
- 교인 심방 기록, 설교 내용 등을 자연어로 검색하는 기능 구현 가능

### 4.2 JSON Relational Duality

관계형 DB와 JSON 문서 모델을 **동시에 지원**하는 혁신적 기능.

- 관계형 테이블에 저장 → JSON 문서 형태로 접근 가능
- ACID 트랜잭션 유지하면서 NoSQL처럼 유연한 개발 가능
- REST API 개발 시 ORM 없이도 자연스러운 JSON 처리

### 4.3 기존 Enterprise Edition 유료 옵션 포함

| 기능 | Enterprise 유료 옵션 | 23ai Free 포함 여부 |
|------|---------------------|-------------------|
| Partitioning | 별도 유료 | **포함** |
| Advanced Compression | 별도 유료 | **포함** |
| Advanced Security | 별도 유료 | **포함** |
| Label Security | 별도 유료 | **포함** |
| Database Vault | 별도 유료 | **포함** |
| Diagnostics Pack | 별도 유료 | **포함** |

### 4.4 SQL 호환성 개선

PostgreSQL·MySQL 개발자들이 Oracle로 쉽게 전환할 수 있도록 문법 호환성 강화:
- `GROUP BY` 절에서 컬럼 별칭(alias) 사용 가능
- `FROM` 절 생략 허용 (MySQL·PostgreSQL 호환)
- `IF [NOT] EXISTS` 구문 지원 (DDL)

---

## 5. 소규모 개인·비영리 서비스에서의 장점 요약

| 장점 | 설명 |
|------|------|
| **라이선스 비용 0원** | 상업적 프로덕션 사용 포함, 영구 무료 |
| **엔터프라이즈급 안정성** | 수십 년간 금융·대기업에서 검증된 DB 엔진 |
| **데이터 용량 여유** | 소규모 서비스에서 12GB 한도는 사실상 무제한 |
| **업그레이드 경로 보장** | 규모 확대 시 DB 마이그레이션 없이 라이선스만 변경 |
| **Docker 공식 지원** | 온프레미스 서버에 간단하게 컨테이너 설치 가능 |
| **AI 기능 선제 활용** | Vector Search, JSON Duality 등 최신 AI 기능 무료 사용 |
| **오픈소스 경쟁 우위** | PostgreSQL·MySQL 대비 엔터프라이즈 안정성 + 무료 혜택 동시 확보 |

---

## 6. 주의사항

| 항목 | 내용 |
|------|------|
| **보안 패치** | Oracle 공식 패치 미제공 → 방화벽·네트워크 격리 등 자체 보안 조치 필요 |
| **기술 지원** | 공식 지원 없음, 커뮤니티 포럼(Oracle Forums)에 의존 |
| **RAC 불가** | Oracle Real Application Clusters(고가용성 클러스터) 미지원 |
| **스케일 아웃** | 단일 인스턴스만 가능, 수평 확장 불가 |
| **단일 인스턴스** | 논리 환경당 1개 설치 제한 |

> 교회 규모의 내부 서비스에서는 위 제약사항이 실질적 문제가 되지 않으며,
> 보안 패치는 서버 방화벽 설정 및 VPN 접근 제한으로 보완 가능합니다.

---

## 7. 참고 출처

- [Oracle AI Database Free FAQ](https://www.oracle.com/database/free/faq/)
- [Oracle Database Free Licensing Restrictions — Oracle 공식 문서](https://docs.oracle.com/en/database/oracle/oracle-database/26/xeinl/licensing-restrictions.html)
- [Announcing Oracle Database 23ai: General Availability — Oracle Blog](https://blogs.oracle.com/database/oracle-23ai-now-generally-available)
- [Oracle renames Database 23c to 23ai — InfoWorld](https://www.infoworld.com/article/2336977/oracle-renames-database-23c-to-23ai-makes-it-generally-available.html)
- [Here's why Oracle is offering Database 23c free to developers — InfoWorld](https://www.infoworld.com/article/2338267/heres-why-oracle-is-offering-database-23c-free-to-developers.html)
- [Oracle AI Vector Search Announcement](https://www.oracle.com/news/announcement/oracle-announces-availability-database-23ai-with-ai-vector-search-2024-05-02/)
- [JSON Relational Duality — Oracle Blog](https://blogs.oracle.com/database/post/key-benefits-of-json-relational-duality-experience-it-today-using-oracle-database-23c-free-developer-release)
- [Oracle 23ai Free vs Enterprise — NCS London](https://www.ncs-london.com/blog/oracle-23ai-free-vs-enterprise-which-version-is-right-for-your-business/)
- [Oracle AI Database 26ai replaces 23ai — Mike Dietrich](https://mikedietrichde.com/2025/10/14/oracle-ai-database-26ai-replaces-oracle-database-23ai/)

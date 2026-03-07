// Generated: 2026-03-07 13:00:00 KST
// 전체 모듈 테스트 데이터 시드 스크립트
// 실행: node /app/seed_all.js (sunjin-erp-app 컨테이너 내부)
// 주의: :desc, :from 은 Oracle 예약어라 bind variable로 사용 불가 → :descr, :purchFrom 사용

const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function exec(conn, sql, params, label) {
  try {
    await conn.execute(sql, params);
    if (label) console.log(`  OK: ${label}`);
  } catch (e) {
    if (e.errorNum === 1) {
      console.log(`  SKIP (이미 존재): ${label}`);
    } else {
      console.error(`  ERROR [${label}]: ${e.message}`);
    }
  }
}

async function run() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USERNAME,
    password: process.env.ORACLE_PASSWORD,
    connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`,
  });

  // ============================================================
  // 1. CUSTOMER — 6개 (lowercase quoted columns)
  // ============================================================
  console.log('\n[1/8] CUSTOMER 삽입...');

  const customers = [
    { name: '삼성전자',   cls: 'END_USER',    addr: '경기도 수원시 영통구 삼성로 129',     phone: '031-200-1114', email: 'contact@samsung.com' },
    { name: 'LG전자',     cls: 'RESELLER',    addr: '서울특별시 영등포구 여의대로 128',    phone: '02-3777-1114', email: 'contact@lge.com' },
    { name: 'SK하이닉스', cls: 'MAINTENANCE', addr: '경기도 이천시 부발읍 경충대로 2091', phone: '031-630-4114', email: 'contact@skhynix.com' },
    { name: '현대자동차', cls: 'END_USER',    addr: '서울특별시 서초구 헌릉로 12',        phone: '02-3464-1114', email: 'contact@hyundai.com' },
    { name: '네이버',     cls: 'END_USER',    addr: '경기도 성남시 분당구 불정로 6',      phone: '1588-3830',    email: 'contact@naver.com' },
    { name: '카카오',     cls: 'RESELLER',    addr: '제주특별자치도 제주시 첨단로 242',   phone: '1577-3754',    email: 'contact@kakao.com' },
  ];

  const custIds = [];
  for (const c of customers) {
    const existing = await conn.execute(
      'SELECT "id" FROM CUSTOMER WHERE "name" = :nm AND "deleted_at" IS NULL',
      { nm: c.name }
    );
    if (existing.rows.length > 0) {
      console.log(`  SKIP: ${c.name} (id=${existing.rows[0].id})`);
      custIds.push(existing.rows[0].id);
      continue;
    }
    const codeRes = await conn.execute(
      `SELECT 'CUST-' || LPAD(CUST_CODE_SEQ.NEXTVAL, 5, '0') AS cd FROM DUAL`
    );
    const code = codeRes.rows[0].CD;
    await conn.execute(
      `INSERT INTO CUSTOMER ("name","code","category","classification","address","phone","email","created_by_id","updated_by_id","created_at","updated_at")
       VALUES (:nm,:code,:cls,:cls,:addr,:phone,:email,1,1,SYSDATE,SYSDATE)`,
      { nm: c.name, code, cls: c.cls, addr: c.addr, phone: c.phone, email: c.email }
    );
    const res = await conn.execute('SELECT "id" FROM CUSTOMER WHERE "code" = :code', { code });
    custIds.push(res.rows[0].id);
    console.log(`  OK: ${c.name} (${code})`);
  }
  await conn.commit();

  const [samsungId, lgId, skId, hyundaiId, naverId, kakaoId] = custIds;
  console.log(`  IDs: samsung=${samsungId}, lg=${lgId}, sk=${skId}, hyundai=${hyundaiId}, naver=${naverId}, kakao=${kakaoId}`);

  // ============================================================
  // 2. TASK — 12개 (lowercase quoted columns)
  // :descr used instead of :desc (Oracle reserved)
  // :stat used instead of :status — actually status works, but keeping :stat for clarity
  // ============================================================
  console.log('\n[2/8] TASK 삽입...');

  const tasks = [
    { title: '주간 서버 점검',          ttype: 'MAINTENANCE', wtype: 'OFFICE', stat: 'DONE',        emp: 3, cust: null,       days: -7  },
    { title: '네트워크 장비 교체',      ttype: 'WORK',        wtype: 'FIELD',  stat: 'IN_PROGRESS', emp: 4, cust: samsungId,  days: 0   },
    { title: '월간 보고서 작성',        ttype: 'WORK',        wtype: 'OFFICE', stat: 'DONE',        emp: 5, cust: null,       days: -3  },
    { title: '삼성전자 현장 방문',      ttype: 'MEETING',     wtype: 'FIELD',  stat: 'DONE',        emp: 6, cust: samsungId,  days: -5  },
    { title: '신규 직원 온보딩',        ttype: 'EDUCATION',   wtype: 'OFFICE', stat: 'DONE',        emp: 7, cust: null,       days: -14 },
    { title: 'DB 백업 설정',            ttype: 'MAINTENANCE', wtype: 'OFFICE', stat: 'READY',       emp: 3, cust: null,       days: 2   },
    { title: 'LG전자 미팅',             ttype: 'MEETING',     wtype: 'FIELD',  stat: 'IN_PROGRESS', emp: 4, cust: lgId,       days: 0   },
    { title: '소프트웨어 라이선스 갱신', ttype: 'WORK',       wtype: 'OFFICE', stat: 'DONE',        emp: 5, cust: null,       days: -10 },
    { title: 'SK하이닉스 기술지원',     ttype: 'WORK',        wtype: 'FIELD',  stat: 'DONE',        emp: 6, cust: skId,       days: -2  },
    { title: '사내 보안 교육',          ttype: 'EDUCATION',   wtype: 'OFFICE', stat: 'READY',       emp: 7, cust: null,       days: 3   },
    { title: '네이버 제안서 작성',      ttype: 'WORK',        wtype: 'OFFICE', stat: 'IN_PROGRESS', emp: 3, cust: naverId,    days: 0   },
    { title: '카카오 현장 설치',        ttype: 'WORK',        wtype: 'FIELD',  stat: 'DONE',        emp: 4, cust: kakaoId,    days: -1  },
  ];

  for (const t of tasks) {
    const dateExpr = t.days === 0 ? 'TRUNC(SYSDATE)' : `TRUNC(SYSDATE) + (${t.days})`;
    await exec(conn,
      `INSERT INTO TASK ("title","description","task_date","start_time","end_time","task_type","work_type","status","employee_id","customer_id","created_at","updated_at")
       VALUES (:title,:descr,${dateExpr},:stime,:etime,:ttype,:wtype,:stat,:empid,:custid,SYSDATE,SYSDATE)`,
      { title: t.title, descr: `${t.title} 관련 업무를 수행합니다.`, stime: 540, etime: 660,
        ttype: t.ttype, wtype: t.wtype, stat: t.stat, empid: t.emp, custid: t.cust },
      `업무: ${t.title}`
    );
  }
  await conn.commit();

  // ============================================================
  // 3. TECH_SUPPORT — 8개 (lowercase quoted columns)
  // ============================================================
  console.log('\n[3/8] TECH_SUPPORT 삽입...');

  const supports = [
    { title: '서버 다운 긴급 복구',     stype: 'EMERGENCY',    smethod: 'ONSITE',  stat: 'COMPLETED',   emp: 3, cust: samsungId, days: -15, stime: 900,  etime: 1020 },
    { title: '네트워크 속도 저하 문의', stype: 'INQUIRY',      smethod: 'REMOTE',  stat: 'COMPLETED',   emp: 4, cust: lgId,      days: -10, stime: 600,  etime: 660  },
    { title: 'SW 설치 요청',            stype: 'INSTALLATION', smethod: 'REMOTE',  stat: 'IN_PROGRESS', emp: 5, cust: skId,      days: -2,  stime: 840,  etime: null },
    { title: '하드웨어 교체 요청',      stype: 'REPAIR',       smethod: 'ONSITE',  stat: 'RECEIVED',    emp: 6, cust: hyundaiId, days: 0,   stime: null, etime: null },
    { title: '백업 솔루션 컨설팅',      stype: 'CONSULTING',   smethod: 'PHONE',   stat: 'COMPLETED',   emp: 7, cust: naverId,   days: -5,  stime: 780,  etime: 840  },
    { title: '방화벽 설정 오류',        stype: 'ERROR',        smethod: 'REMOTE',  stat: 'IN_PROGRESS', emp: 3, cust: kakaoId,   days: -1,  stime: 1020, etime: null },
    { title: '정기 점검 방문',          stype: 'MAINTENANCE',  smethod: 'ONSITE',  stat: 'COMPLETED',   emp: 4, cust: samsungId, days: -20, stime: 540,  etime: 720  },
    { title: 'VPN 접속 불가',           stype: 'ERROR',        smethod: 'REMOTE',  stat: 'RECEIVED',    emp: 5, cust: lgId,      days: 0,   stime: null, etime: null },
  ];

  for (const s of supports) {
    const dateExpr = s.days === 0 ? 'TRUNC(SYSDATE)' : `TRUNC(SYSDATE) + (${s.days})`;
    await exec(conn,
      `INSERT INTO TECH_SUPPORT ("title","description","support_date","start_time","end_time","support_type","support_method","status","employee_id","customer_id","created_at","updated_at")
       VALUES (:title,:descr,${dateExpr},:stime,:etime,:stype,:smethod,:stat,:empid,:custid,SYSDATE,SYSDATE)`,
      { title: s.title, descr: `${s.title} 건에 대한 기술지원을 진행합니다.`,
        stime: s.stime, etime: s.etime, stype: s.stype, smethod: s.smethod,
        stat: s.stat, empid: s.emp, custid: s.cust },
      `기술지원: ${s.title}`
    );
  }
  await conn.commit();

  // ============================================================
  // 4. PROJECT — 6개 (lowercase quoted columns)
  // ============================================================
  console.log('\n[4/8] PROJECT 삽입...');

  const projects = [
    { projname: '삼성전자 IT 인프라 구축',      stat: 'COMPLETED',   cust: samsungId, emp: 3, amount: 150000000, start: -180, end: -30,
      stages: [-200,-195,-190,-185,-180,-120,-40,-30] },
    { projname: 'LG전자 클라우드 마이그레이션', stat: 'IN_PROGRESS', cust: lgId,      emp: 4, amount:  80000000, start: -60,  end: 90,
      stages: [-90,-80,-75,-65,-60,-30,null,null] },
    { projname: 'SK하이닉스 보안 시스템 도입',  stat: 'PREPARING',   cust: skId,      emp: 5, amount:  50000000, start: 30,   end: 150,
      stages: [-10,-5,null,null,null,null,null,null] },
    { projname: '현대자동차 ERP 고도화',         stat: 'ON_HOLD',     cust: hyundaiId, emp: 6, amount: 200000000, start: -30,  end: 270,
      stages: [-60,-50,-45,-35,-30,null,null,null] },
    { projname: '네이버 데이터 분석 플랫폼',    stat: 'IN_PROGRESS', cust: naverId,   emp: 7, amount: 120000000, start: -45,  end: 135,
      stages: [-70,-60,-55,-50,-45,-20,null,null] },
    { projname: '카카오 모바일 앱 개발',         stat: 'PREPARING',   cust: kakaoId,   emp: 3, amount:  60000000, start: 14,   end: 194,
      stages: [-5,null,null,null,null,null,null,null] },
  ];

  for (const p of projects) {
    const codeRes = await conn.execute(
      `SELECT 'PROJ-' || LPAD(PROJECT_CODE_SEQ.NEXTVAL, 4, '0') AS cd FROM DUAL`
    );
    const projCode = codeRes.rows[0].CD;
    const stageNames = ['meeting','proposal','quotation','contract','kickoff','development','delivery','handover'];
    const stageCols = stageNames.map(n => `"stage_${n}_at"`).join(',');
    const stageVals = p.stages.map(d => d != null ? `(SYSDATE + (${d}))` : 'NULL').join(',');

    await exec(conn,
      `INSERT INTO PROJECT ("project_code","project_name","customer_id","employee_id","status","start_date","end_date","contract_amount","description","created_at","updated_at",${stageCols})
       VALUES (:code,:projname,:cust,:emp,:stat,TRUNC(SYSDATE)+(${p.start}),TRUNC(SYSDATE)+(${p.end}),:amount,:descr,SYSDATE,SYSDATE,${stageVals})`,
      { code: projCode, projname: p.projname, cust: p.cust, emp: p.emp, stat: p.stat,
        amount: p.amount, descr: `${p.projname} 프로젝트입니다.` },
      `프로젝트: ${p.projname}`
    );
  }
  await conn.commit();

  // ============================================================
  // 5. ISSUE — 8개 (UPPERCASE unquoted columns)
  // ============================================================
  console.log('\n[5/8] ISSUE 삽입...');

  const issues = [
    { title: '생산 서버 CPU 100% 이슈',  sev: 'CRITICAL', stat: 'COMPLETED',   cust: samsungId, created: 1, assigned: 3, method: 'ONSITE',  minutes: 180 },
    { title: '결제 모듈 오류 발생',      sev: 'HIGH',     stat: 'IN_PROGRESS', cust: lgId,      created: 4, assigned: 5, method: 'REMOTE',  minutes: null },
    { title: '로그인 간헐적 실패',       sev: 'MEDIUM',   stat: 'IN_PROGRESS', cust: skId,      created: 5, assigned: 6, method: 'REMOTE',  minutes: null },
    { title: '보고서 출력 오류',         sev: 'LOW',      stat: 'INTAKE',      cust: hyundaiId, created: 6, assigned: null, method: null,   minutes: null },
    { title: 'API 응답 지연',            sev: 'HIGH',     stat: 'COMPLETED',   cust: naverId,   created: 7, assigned: 3, method: 'PHONE',   minutes: 60  },
    { title: '데이터 동기화 실패',       sev: 'CRITICAL', stat: 'IN_PROGRESS', cust: kakaoId,   created: 3, assigned: 4, method: 'REMOTE',  minutes: null },
    { title: '이메일 발송 안됨',         sev: 'MEDIUM',   stat: 'INTAKE',      cust: samsungId, created: 4, assigned: null, method: null,   minutes: null },
    { title: '대시보드 로딩 지연',       sev: 'LOW',      stat: 'COMPLETED',   cust: lgId,      created: 5, assigned: 7, method: 'REMOTE',  minutes: 30  },
  ];

  for (let i = 0; i < issues.length; i++) {
    const iss = issues[i];
    const isPublic = iss.stat === 'COMPLETED' ? 1 : 0;
    const completedVal = iss.stat === 'COMPLETED' ? 'SYSDATE - 1' : 'NULL';
    const treatResult = iss.stat === 'COMPLETED'
      ? `:treatresult`
      : 'NULL';
    const params = {
      cust: iss.cust,
      issuetitle: iss.title,
      descr: `${iss.title} 관련 이슈입니다. 긴급 확인 및 조치 요망.`,
      sev: iss.sev,
      stat: iss.stat,
      pub: isPublic,
      createdby: iss.created,
      assigned: iss.assigned,
      meth: iss.method,
      minutes: iss.minutes,
      daysago: (i + 1) * 3,
    };
    if (iss.stat === 'COMPLETED') {
      params.treatresult = `${iss.title} 이슈 처리 완료.`;
    }

    await exec(conn,
      `INSERT INTO ISSUE (CUSTOMER_ID,TITLE,DESCRIPTION,SEVERITY,STATUS,IS_PUBLIC,CREATED_BY_ID,ASSIGNED_TO_ID,TREATMENT_METHOD,TREATMENT_TIME_MINUTES,TREATMENT_RESULT,CREATED_AT,UPDATED_AT,COMPLETED_AT)
       VALUES (:cust,:issuetitle,:descr,:sev,:stat,:pub,:createdby,:assigned,:meth,:minutes,${treatResult},SYSDATE - :daysago,SYSDATE,${completedVal})`,
      params,
      `이슈: ${iss.title}`
    );
  }
  await conn.commit();

  // ============================================================
  // 6. INVENTORY — 12개 (UPPERCASE unquoted columns)
  // :purchFrom used instead of :from (Oracle reserved)
  // ============================================================
  console.log('\n[6/8] INVENTORY 삽입...');

  const inventories = [
    { cat: '서버',         model: 'Dell PowerEdge R750',    serial: 'SRV-2024-001', purchFrom: 'Dell Korea',    loc: '서버실 A-01',       stat: '재고' },
    { cat: '서버',         model: 'Dell PowerEdge R750',    serial: 'SRV-2024-002', purchFrom: 'Dell Korea',    loc: '삼성전자 IDC',      stat: '출고' },
    { cat: '네트워크장비', model: 'Cisco Catalyst 9300',    serial: 'NET-2024-001', purchFrom: 'Cisco Systems', loc: '서버실 B-01',       stat: '재고' },
    { cat: '네트워크장비', model: 'Cisco Catalyst 9300',    serial: 'NET-2024-002', purchFrom: 'Cisco Systems', loc: 'LG전자 사무실',     stat: '출고' },
    { cat: '태블릿',       model: 'Samsung Galaxy Tab S9', serial: 'TAB-2024-001', purchFrom: '삼성전자',      loc: '사무실 창고',       stat: '재고' },
    { cat: '모니터',       model: 'LG 27인치 4K UltraFine',serial: 'MON-2024-001', purchFrom: 'LG전자',        loc: '사무실 1F',         stat: '재고' },
    { cat: '모니터',       model: 'LG 27인치 4K UltraFine',serial: 'MON-2024-002', purchFrom: 'LG전자',        loc: 'SK하이닉스 사무실', stat: '출고' },
    { cat: '모니터',       model: 'LG 27인치 4K UltraFine',serial: 'MON-2024-003', purchFrom: 'LG전자',        loc: 'AS 센터',           stat: '고장' },
    { cat: '노트북',       model: 'MacBook Pro 14 M3 Pro', serial: 'LAP-2024-001', purchFrom: 'Apple Korea',   loc: '사무실 2F',         stat: '재고' },
    { cat: '노트북',       model: 'MacBook Pro 14 M3 Pro', serial: 'LAP-2024-002', purchFrom: 'Apple Korea',   loc: '현대자동차 본사',   stat: '출고' },
    { cat: '노트북',       model: 'MacBook Pro 14 M3 Pro', serial: 'LAP-2024-003', purchFrom: 'Apple Korea',   loc: '사무실 3F',         stat: '재고' },
    { cat: '프린터',       model: 'HP LaserJet Pro M404dn',serial: 'PRT-2023-001', purchFrom: 'HP Korea',      loc: '창고 (폐기 예정)',  stat: '폐기' },
  ];

  for (const inv of inventories) {
    await exec(conn,
      `INSERT INTO INVENTORY (CATEGORY,MODEL,SERIAL_NUMBER,PURCHASE_DATE,PURCHASE_FROM,CURRENT_LOCATION,CURRENT_STATUS,NOTES,CREATED_BY_ID,UPDATED_BY_ID,CREATED_AT,UPDATED_AT)
       VALUES (:cat,:model,:serial,TRUNC(SYSDATE)-365,:purchFrom,:loc,:stat,:notes,1,1,SYSDATE,SYSDATE)`,
      { cat: inv.cat, model: inv.model, serial: inv.serial, purchFrom: inv.purchFrom,
        loc: inv.loc, stat: inv.stat,
        notes: `${inv.model} — ${inv.stat === '폐기' ? '사용기간 초과 폐기' : '정상 관리 중'}` },
      `재고: ${inv.serial}`
    );
  }
  await conn.commit();

  // ============================================================
  // 7. MAINTENANCE_CONTRACT — 6개 (lowercase quoted columns)
  // ============================================================
  console.log('\n[7/8] MAINTENANCE_CONTRACT 삽입...');

  const contracts = [
    { cname: '삼성전자 서버 유지보수 2025',    ctype: '전체 시스템 유지보수',    stat: '활성',    cust: samsungId, emp: 3, amount: 24000000, sday: -180, eday: 185  },
    { cname: 'LG전자 네트워크 유지보수',       ctype: '네트워크 장비 유지보수',  stat: '활성',    cust: lgId,      emp: 4, amount: 18000000, sday: -90,  eday: 275  },
    { cname: 'SK하이닉스 보안장비 유지보수',   ctype: '보안 솔루션 유지보수',    stat: '갱신예정', cust: skId,     emp: 5, amount: 12000000, sday: -365, eday: 30   },
    { cname: '현대자동차 인프라 유지보수',     ctype: '서버/네트워크 유지보수',  stat: '갱신예정', cust: hyundaiId,emp: 6, amount: 36000000, sday: -365, eday: 15   },
    { cname: '네이버 클라우드 유지보수 2024',  ctype: '클라우드 인프라 유지보수', stat: '종료',   cust: naverId,   emp: 7, amount: 20000000, sday: -730, eday: -1   },
    { cname: '카카오 시스템 유지보수',         ctype: '통합 IT 유지보수',        stat: '활성',    cust: kakaoId,   emp: 3, amount: 15000000, sday: -60,  eday: 305  },
  ];

  for (const mc of contracts) {
    await exec(conn,
      `INSERT INTO MAINTENANCE_CONTRACT (
        "customer_id","contract_name","contract_type","start_date","end_date","contract_amount",
        "assigned_employee_id","contract_status","notes","created_by_id","updated_by_id","created_at","updated_at"
       ) VALUES (
        :cust,:cname,:ctype,TRUNC(SYSDATE)+(${mc.sday}),TRUNC(SYSDATE)+(${mc.eday}),:amount,
        :emp,:stat,:notes,1,1,SYSDATE,SYSDATE
       )`,
      { cust: mc.cust, cname: mc.cname, ctype: mc.ctype, amount: mc.amount,
        emp: mc.emp, stat: mc.stat,
        notes: `${mc.cname} — ${mc.stat === '종료' ? '계약 기간 만료' : '정상 운영 중'}` },
      `유지보수: ${mc.cname}`
    );
  }
  await conn.commit();

  // ============================================================
  // 8. NOTICE — 5개 (UPPERCASE most cols, lowercase quoted timestamps)
  // ============================================================
  console.log('\n[8/8] NOTICE 삽입...');

  const notices = [
    { noticetitle: '2026년 1분기 사업 계획 공유', ntype: '공지', author: 1, daysago: 8,
      content: '안녕하세요. 2026년 1분기 사업 계획을 공유드립니다.\n\n1. 신규 고객사 확대: 상반기 내 10개사 추가 목표\n2. 기술 역량 강화: 클라우드/보안 분야 교육 진행\n3. 업무 효율화: 내부 시스템 고도화 추진\n\n세부 내용은 첨부 자료를 참고해 주시기 바랍니다.' },
    { noticetitle: '재택근무 가이드라인 업데이트',  ntype: '공유', author: 1, daysago: 6,
      content: '2026년 3월부터 재택근무 정책이 업데이트됩니다.\n\n변경사항:\n- 주 2회 재택 허용 (수요일 필수 출근)\n- 재택 시 VPN 접속 필수\n- 근태 기록은 기존과 동일하게 ERP 시스템 사용\n\n문의사항은 HR팀으로 연락 주세요.' },
    { noticetitle: '신규 보안 정책 시행 안내',      ntype: '지시', author: 1, daysago: 4,
      content: '2026년 3월 15일부터 아래 보안 정책이 의무 시행됩니다.\n\n1. 비밀번호 90일마다 변경 (대문자+숫자+특수문자 포함)\n2. 외부 USB 사용 금지 (승인된 장치만 허용)\n3. 사내 시스템 접속 시 2단계 인증 필수\n\n미준수 시 보안 감사 대상이 될 수 있습니다.' },
    { noticetitle: '사내 카페테리아 개선 건의',     ntype: '건의', author: 3, daysago: 2,
      content: '사내 카페테리아 관련 개선 사항을 건의드립니다.\n\n1. 메뉴 다양화 (채식 옵션 추가 요청)\n2. 운영 시간 연장 (현재 17:30 → 19:00까지)\n3. 좌석 증설 (피크 타임 대기 시간 개선)\n\n많은 직원분들이 불편함을 느끼고 있습니다. 검토 부탁드립니다.' },
    { noticetitle: '팀빌딩 행사 후기 공유',         ntype: '자유', author: 4, daysago: 1,
      content: '지난 주말 진행된 팀빌딩 행사 후기를 공유합니다!\n\n장소: 가평 아침고요수목원 + 글램핑\n참가: 전 직원 12명\n\n정말 즐거운 시간이었습니다. 특히 저녁 BBQ와 레크리에이션이 인기였어요.\n다음 행사도 기대해 주세요!' },
  ];

  for (const n of notices) {
    await exec(conn,
      `INSERT INTO NOTICE (TITLE, CONTENT, TYPE, AUTHOR_ID, VIEW_COUNT, "created_at", "updated_at")
       VALUES (:noticetitle,:content,:ntype,:author,:vc,SYSDATE - :daysago,SYSDATE - :daysago)`,
      { noticetitle: n.noticetitle, content: n.content, ntype: n.ntype,
        author: n.author, vc: Math.floor(Math.random() * 50) + 5, daysago: n.daysago },
      `공지: ${n.noticetitle}`
    );
  }
  await conn.commit();

  await conn.close();

  console.log('\n✅ 시드 완료!');
  console.log('   - CUSTOMER: 6개');
  console.log('   - TASK: 12개');
  console.log('   - TECH_SUPPORT: 8개');
  console.log('   - PROJECT: 6개');
  console.log('   - ISSUE: 8개');
  console.log('   - INVENTORY: 12개');
  console.log('   - MAINTENANCE_CONTRACT: 6개');
  console.log('   - NOTICE: 5개 (재실행 시 중복 skip)');
}

run().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});

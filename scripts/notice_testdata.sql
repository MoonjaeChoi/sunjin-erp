-- Notice Board Test Data
-- Encoding: UTF-8

SET FEEDBACK ON

INSERT INTO NOTICE (TITLE, CONTENT, TYPE, AUTHOR_ID, VIEW_COUNT, "created_at", "updated_at")
VALUES ('2026년 1분기 경영방침 안내', '안녕하세요. 2026년 1분기 경영방침을 안내드립니다. 고객 만족도 향상, 품질 관리 강화, 신기술 도입 확대, 업무 효율화 추진 등의 내용을 포함합니다. 자세한 내용은 첨부파일을 참조해 주세요.', '공지', 3, 45, SYSTIMESTAMP - INTERVAL '7' DAY, SYSTIMESTAMP - INTERVAL '7' DAY);

INSERT INTO NOTICE (TITLE, CONTENT, TYPE, AUTHOR_ID, VIEW_COUNT, "created_at", "updated_at")
VALUES ('시스템 정기점검 안내', '안녕하세요. 시스템 정기점검이 예정되어 있습니다. 일시: 2026년 2월 1일(토) 00:00 ~ 06:00, 대상: ERP 시스템 전체, 해당 시간 동안 서비스 이용이 불가합니다.', '공지', 4, 78, SYSTIMESTAMP - INTERVAL '5' DAY, SYSTIMESTAMP - INTERVAL '5' DAY);

INSERT INTO NOTICE (TITLE, CONTENT, TYPE, AUTHOR_ID, VIEW_COUNT, "created_at", "updated_at")
VALUES ('신규 프로젝트 진행 현황 공유', '현재 진행 중인 신규 프로젝트 현황을 공유드립니다. A 프로젝트 진행률 65%, B 프로젝트 진행률 30%입니다. 각 팀별 세부 일정은 PM에게 문의바랍니다.', '공유', 5, 32, SYSTIMESTAMP - INTERVAL '3' DAY, SYSTIMESTAMP - INTERVAL '3' DAY);

INSERT INTO NOTICE (TITLE, CONTENT, TYPE, AUTHOR_ID, VIEW_COUNT, "created_at", "updated_at")
VALUES ('기술 세미나 자료 공유', '지난주 진행된 기술 세미나 자료를 공유드립니다. 주제: 최신 웹 개발 트렌드 2026. 관심 있으신 분들은 참고해 주세요. 질문은 댓글로 남겨주시면 답변드리겠습니다.', '공유', 6, 21, SYSTIMESTAMP - INTERVAL '2' DAY, SYSTIMESTAMP - INTERVAL '2' DAY);

INSERT INTO NOTICE (TITLE, CONTENT, TYPE, AUTHOR_ID, VIEW_COUNT, "created_at", "updated_at")
VALUES ('월간 업무보고 제출 요청', '각 팀장님들께, 1월 월간 업무보고서를 2026년 2월 5일까지 제출해 주시기 바랍니다. 제출방법: 이메일, 양식: 기존 월간보고 양식 사용.', '지시', 3, 56, SYSTIMESTAMP - INTERVAL '4' DAY, SYSTIMESTAMP - INTERVAL '4' DAY);

INSERT INTO NOTICE (TITLE, CONTENT, TYPE, AUTHOR_ID, VIEW_COUNT, "created_at", "updated_at")
VALUES ('사내 카페테리아 메뉴 다양화 건의', '사내 카페테리아 메뉴 다양화를 건의드립니다. 현재 메뉴가 한정적이어서 샐러드, 건강식 등 다양한 메뉴 추가를 검토해 주시면 감사하겠습니다.', '건의', 7, 18, SYSTIMESTAMP - INTERVAL '1' DAY, SYSTIMESTAMP - INTERVAL '1' DAY);

INSERT INTO NOTICE (TITLE, CONTENT, TYPE, AUTHOR_ID, VIEW_COUNT, "created_at", "updated_at")
VALUES ('등산 동호회 회원 모집', '등산 동호회 회원을 모집합니다! 활동: 매월 첫째, 셋째 토요일 등산. 대상: 등산에 관심 있는 모든 직원. 회비: 월 1만원. 초보자도 환영합니다.', '자유', 8, 25, SYSTIMESTAMP - INTERVAL '6' DAY, SYSTIMESTAMP - INTERVAL '6' DAY);

INSERT INTO NOTICE (TITLE, CONTENT, TYPE, AUTHOR_ID, VIEW_COUNT, "created_at", "updated_at")
VALUES ('중고 모니터 나눔합니다', '24인치 모니터 나눔합니다. 제품: LG 24인치 LED 모니터, 상태: 양호. 필요하신 분 댓글 주세요. 선착순 1명 드립니다.', '자유', 9, 12, SYSTIMESTAMP, SYSTIMESTAMP);

COMMIT;

-- Comments
INSERT INTO NOTICE_COMMENT (NOTICE_ID, CONTENT, AUTHOR_ID, PARENT_COMMENT_ID, "created_at", "updated_at")
VALUES (1, '좋은 방침 안내 감사합니다. 올해도 열심히 하겠습니다!', 5, NULL, SYSTIMESTAMP - INTERVAL '6' DAY, SYSTIMESTAMP - INTERVAL '6' DAY);

INSERT INTO NOTICE_COMMENT (NOTICE_ID, CONTENT, AUTHOR_ID, PARENT_COMMENT_ID, "created_at", "updated_at")
VALUES (1, '신기술 도입 관련 세부 일정이 있을까요?', 6, NULL, SYSTIMESTAMP - INTERVAL '5' DAY, SYSTIMESTAMP - INTERVAL '5' DAY);

INSERT INTO NOTICE_COMMENT (NOTICE_ID, CONTENT, AUTHOR_ID, PARENT_COMMENT_ID, "created_at", "updated_at")
VALUES (1, '2월 중 별도 안내 예정입니다.', 3, 2, SYSTIMESTAMP - INTERVAL '5' DAY, SYSTIMESTAMP - INTERVAL '5' DAY);

INSERT INTO NOTICE_COMMENT (NOTICE_ID, CONTENT, AUTHOR_ID, PARENT_COMMENT_ID, "created_at", "updated_at")
VALUES (3, 'A 프로젝트 일정이 타이트하네요. 추가 인력 지원 가능할까요?', 7, NULL, SYSTIMESTAMP - INTERVAL '2' DAY, SYSTIMESTAMP - INTERVAL '2' DAY);

INSERT INTO NOTICE_COMMENT (NOTICE_ID, CONTENT, AUTHOR_ID, PARENT_COMMENT_ID, "created_at", "updated_at")
VALUES (3, 'PM 미팅에서 논의 예정입니다.', 5, 4, SYSTIMESTAMP - INTERVAL '2' DAY, SYSTIMESTAMP - INTERVAL '2' DAY);

INSERT INTO NOTICE_COMMENT (NOTICE_ID, CONTENT, AUTHOR_ID, PARENT_COMMENT_ID, "created_at", "updated_at")
VALUES (7, '저도 참여하고 싶습니다! 어디로 연락드리면 될까요?', 10, NULL, SYSTIMESTAMP - INTERVAL '5' DAY, SYSTIMESTAMP - INTERVAL '5' DAY);

INSERT INTO NOTICE_COMMENT (NOTICE_ID, CONTENT, AUTHOR_ID, PARENT_COMMENT_ID, "created_at", "updated_at")
VALUES (7, '쪽지 주시면 안내드릴게요~', 8, 6, SYSTIMESTAMP - INTERVAL '5' DAY, SYSTIMESTAMP - INTERVAL '5' DAY);

INSERT INTO NOTICE_COMMENT (NOTICE_ID, CONTENT, AUTHOR_ID, PARENT_COMMENT_ID, "created_at", "updated_at")
VALUES (7, '초보자도 괜찮다니 관심 있습니다.', 11, NULL, SYSTIMESTAMP - INTERVAL '4' DAY, SYSTIMESTAMP - INTERVAL '4' DAY);

INSERT INTO NOTICE_COMMENT (NOTICE_ID, CONTENT, AUTHOR_ID, PARENT_COMMENT_ID, "created_at", "updated_at")
VALUES (8, '혹시 아직 있나요? 필요합니다!', 12, NULL, SYSTIMESTAMP - INTERVAL '1' HOUR, SYSTIMESTAMP - INTERVAL '1' HOUR);

COMMIT;

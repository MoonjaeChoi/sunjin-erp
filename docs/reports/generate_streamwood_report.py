# Generated: 2026-02-24 10:00:00 KST
"""
Generate the streamwood church management system PDF report.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Image, Table, TableStyle, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
from reportlab.platypus import ActionFlowable
from PIL import Image as PILImage

# ── Font Registration ──────────────────────────────────────────────────────────
FONT_PATH = '/Library/Fonts/Arial Unicode.ttf'
pdfmetrics.registerFont(TTFont('KorFont', FONT_PATH))
pdfmetrics.registerFont(TTFont('KorFontBold', FONT_PATH))  # same font, no bold variant

# ── Paths ──────────────────────────────────────────────────────────────────────
SCREENSHOTS_BASE = '/Users/memmem/git/sunjin-erp/docs/reports/screenshots'
OUTPUT_PATH = '/Users/memmem/git/sunjin-erp/docs/reports/streamwood_system_report.pdf'

# ── Page dimensions ────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4  # 595.28 x 841.89 points
MARGIN = 20 * mm
CONTENT_W = PAGE_W - 2 * MARGIN

# ── Styles ─────────────────────────────────────────────────────────────────────
def make_styles():
    styles = {}

    styles['cover_title'] = ParagraphStyle(
        'cover_title',
        fontName='KorFontBold',
        fontSize=28,
        leading=38,
        textColor=colors.HexColor('#1a237e'),
        alignment=TA_CENTER,
        spaceAfter=8,
    )
    styles['cover_subtitle'] = ParagraphStyle(
        'cover_subtitle',
        fontName='KorFont',
        fontSize=16,
        leading=22,
        textColor=colors.HexColor('#3949ab'),
        alignment=TA_CENTER,
        spaceAfter=6,
    )
    styles['cover_date'] = ParagraphStyle(
        'cover_date',
        fontName='KorFont',
        fontSize=12,
        leading=18,
        textColor=colors.HexColor('#546e7a'),
        alignment=TA_CENTER,
    )
    styles['toc_title'] = ParagraphStyle(
        'toc_title',
        fontName='KorFontBold',
        fontSize=20,
        leading=28,
        textColor=colors.HexColor('#1a237e'),
        alignment=TA_CENTER,
        spaceAfter=20,
    )
    styles['toc_item'] = ParagraphStyle(
        'toc_item',
        fontName='KorFont',
        fontSize=12,
        leading=22,
        textColor=colors.HexColor('#212121'),
        leftIndent=20,
    )
    styles['section_heading'] = ParagraphStyle(
        'section_heading',
        fontName='KorFontBold',
        fontSize=18,
        leading=26,
        textColor=colors.HexColor('#1a237e'),
        spaceAfter=10,
        spaceBefore=4,
    )
    styles['body_text'] = ParagraphStyle(
        'body_text',
        fontName='KorFont',
        fontSize=10,
        leading=16,
        textColor=colors.HexColor('#333333'),
        alignment=TA_JUSTIFY,
        spaceAfter=12,
    )
    styles['caption'] = ParagraphStyle(
        'caption',
        fontName='KorFont',
        fontSize=9,
        leading=14,
        textColor=colors.HexColor('#546e7a'),
        alignment=TA_CENTER,
        spaceBefore=4,
        spaceAfter=14,
    )
    return styles


def img_path(subdir, filename):
    return os.path.join(SCREENSHOTS_BASE, subdir, filename)


def add_screenshot(story, path, caption_text, styles, max_width=None, max_height=None):
    """Add a screenshot image with caption to the story."""
    if max_width is None:
        max_width = CONTENT_W
    if max_height is None:
        max_height = 180 * mm

    if not os.path.exists(path):
        story.append(Paragraph(f'[이미지 없음: {os.path.basename(path)}]', styles['caption']))
        return

    try:
        with PILImage.open(path) as pil_img:
            orig_w, orig_h = pil_img.size
    except Exception:
        story.append(Paragraph(f'[이미지 로드 오류: {os.path.basename(path)}]', styles['caption']))
        return

    # Convert pixels to points (assume 96 dpi screen captures)
    dpi = 96
    img_w_pt = orig_w * 72 / dpi
    img_h_pt = orig_h * 72 / dpi

    # Scale to fit within max_width x max_height
    scale = min(max_width / img_w_pt, max_height / img_h_pt, 1.0)
    final_w = img_w_pt * scale
    final_h = img_h_pt * scale

    img = Image(path, width=final_w, height=final_h)
    img.hAlign = 'CENTER'

    story.append(img)
    story.append(Paragraph(f'[{caption_text}]', styles['caption']))


def build_cover(story, styles):
    """Build cover page."""
    # Vertical centering via spacers
    story.append(Spacer(1, 80 * mm))

    # Decorative line top
    story.append(HRFlowable(
        width=CONTENT_W,
        thickness=3,
        color=colors.HexColor('#1a237e'),
        spaceAfter=16,
    ))

    story.append(Paragraph('streamwood', styles['cover_subtitle']))
    story.append(Paragraph('교회 관리 시스템', styles['cover_title']))
    story.append(Spacer(1, 8))
    story.append(Paragraph('주요 기능 화면 소개 보고서', styles['cover_subtitle']))

    story.append(HRFlowable(
        width=CONTENT_W,
        thickness=3,
        color=colors.HexColor('#1a237e'),
        spaceBefore=16,
        spaceAfter=20,
    ))

    story.append(Spacer(1, 16))
    story.append(Paragraph('2026년 2월 24일', styles['cover_date']))

    story.append(PageBreak())


def build_toc(story, styles):
    """Build table of contents page."""
    story.append(Paragraph('목  차', styles['toc_title']))
    story.append(HRFlowable(
        width=CONTENT_W,
        thickness=1,
        color=colors.HexColor('#3949ab'),
        spaceAfter=16,
    ))

    toc_items = [
        ('1', '처음 화면'),
        ('2', '교인 관리'),
        ('3', '출결 관리'),
        ('4', '보고'),
        ('5', '심방'),
        ('6', '교육'),
        ('7', '봉사'),
        ('8', '통계'),
        ('9', '일괄처리'),
        ('10', '문자'),
        ('11', '게시판'),
        ('12', '교구사역'),
        ('13', '프로그램 설정'),
    ]

    for num, title in toc_items:
        story.append(Paragraph(f'{num}.  {title}', styles['toc_item']))

    story.append(PageBreak())


def build_section(story, styles, number, title, description, screenshots):
    """
    Build one section page.
    screenshots: list of (subdir, filename, caption) tuples
    """
    # Section heading
    story.append(Paragraph(f'{number}. {title}', styles['section_heading']))
    story.append(HRFlowable(
        width=CONTENT_W,
        thickness=1.5,
        color=colors.HexColor('#3949ab'),
        spaceAfter=10,
    ))

    # Description
    story.append(Paragraph(description, styles['body_text']))
    story.append(Spacer(1, 4))

    # Screenshots: determine layout
    # For sections with 1 screenshot: full width
    # For 2 screenshots: side by side
    # For 3+ screenshots: arrange in rows of 2 (or 1 per row if tall)
    n = len(screenshots)

    if n == 0:
        pass
    elif n == 1:
        subdir, filename, caption = screenshots[0]
        add_screenshot(story, img_path(subdir, filename), caption, styles,
                       max_width=CONTENT_W, max_height=160 * mm)
    elif n == 2:
        # Two per row
        _add_screenshot_row(story, styles, screenshots, max_h=100 * mm)
    else:
        # Rows of 2
        pairs = [screenshots[i:i+2] for i in range(0, n, 2)]
        for pair in pairs:
            if len(pair) == 2:
                _add_screenshot_row(story, styles, pair, max_h=90 * mm)
            else:
                subdir, filename, caption = pair[0]
                add_screenshot(story, img_path(subdir, filename), caption, styles,
                               max_width=CONTENT_W, max_height=90 * mm)

    story.append(PageBreak())


def _add_screenshot_row(story, styles, pair, max_h=90 * mm):
    """Add two screenshots side by side using a Table."""
    cell_w = (CONTENT_W - 8 * mm) / 2  # 4mm gap each side

    cells = []
    for subdir, filename, caption in pair:
        path = img_path(subdir, filename)
        cell_content = []
        if os.path.exists(path):
            try:
                with PILImage.open(path) as pil_img:
                    orig_w, orig_h = pil_img.size
                dpi = 96
                img_w_pt = orig_w * 72 / dpi
                img_h_pt = orig_h * 72 / dpi
                scale = min(cell_w / img_w_pt, max_h / img_h_pt, 1.0)
                final_w = img_w_pt * scale
                final_h = img_h_pt * scale
                img = Image(path, width=final_w, height=final_h)
                img.hAlign = 'CENTER'
                cell_content.append(img)
            except Exception:
                cell_content.append(Paragraph(f'[오류]', styles['caption']))
        else:
            cell_content.append(Paragraph(f'[없음]', styles['caption']))
        cell_content.append(Paragraph(f'[{caption}]', styles['caption']))
        cells.append(cell_content)

    tbl = Table(
        [cells],
        colWidths=[cell_w, cell_w],
    )
    tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 6))


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title='streamwood 교회 관리 시스템 주요 기능 화면 소개 보고서',
        author='streamwood',
        subject='교회 관리 시스템 기능 소개',
    )

    styles = make_styles()
    story = []

    # ── Cover ──────────────────────────────────────────────────────────────────
    build_cover(story, styles)

    # ── TOC ───────────────────────────────────────────────────────────────────
    build_toc(story, styles)

    # ── Section 1: 처음 화면 ──────────────────────────────────────────────────
    build_section(
        story, styles,
        number='1', title='처음 화면',
        description=(
            '로그인 후 가장 먼저 표시되는 홈 화면으로, 교인 이름·아이디·핸드폰 번호로 빠르게 교인을 검색할 수 있는 '
            '검색창과 교인 등록·교인 검색·심방 등록·심방 조회·기도 제목·프로그램 설정 등 자주 사용하는 메뉴의 바로가기 '
            '아이콘이 제공됩니다. 하단에는 전체 메뉴, 업데이트 내역, 동영상 매뉴얼, A/S 지원 링크가 안내됩니다.'
        ),
        screenshots=[
            ('auth',  '01_login.png',   '로그인'),
            ('home',  '01_home.png',    '처음 화면'),
            ('home',  '02_sitemap.png', '사이트맵'),
            ('home',  '03_update.png',  '업데이트 내역'),
        ],
    )

    # ── Section 2: 교인 관리 ──────────────────────────────────────────────────
    build_section(
        story, styles,
        number='2', title='교인 관리',
        description=(
            '교인 정보를 등록·검색·조회·관리하는 핵심 모듈입니다. 교인 등록(3단계 마법사), 다양한 조건의 교인 검색, '
            '전체 교인 목록 조회, 그룹 관리, 저장된 검색조건 목록, 최근 등록된 교인 확인, 새가족 스마트 성도 앱 '
            '등록요청, 교인정보 수정요청 처리, 제적 처리된 교인 목록 등의 기능을 제공합니다.'
        ),
        screenshots=[
            ('person', '01_add.png',       '교인 등록'),
            ('person', '02_search.png',    '교인 검색'),
            ('person', '03_list.png',      '교인 목록'),
            ('person', '04_group.png',     '교인 그룹'),
            ('person', '05_condition.png', '검색조건 목록'),
            ('person', '06_recent.png',    '최근 등록 교인'),
            ('person', '07_newSaint.png',  '새가족 등록요청'),
            ('person', '08_request.png',   '교인정보 수정요청'),
            ('person', '09_deleted.png',   '제적 목록'),
        ],
    )

    # ── Section 3: 출결 관리 ──────────────────────────────────────────────────
    build_section(
        story, styles,
        number='3', title='출결 관리',
        description=(
            '교인의 예배 출석 여부를 기록하고 조회하는 모듈입니다. 연도·단기·예배별 필터로 출결 데이터를 검색하고, '
            '주간 단위 출결 관리, 결석자 조회, 출석 통계, QR/바코드 스캔 출결, 헌금 출결 기능을 제공합니다.'
        ),
        screenshots=[
            ('attendance', '01_manage.png',     '출결 관리'),
            ('attendance', '02_manageWeek.png',  '출결 관리(주간)'),
            ('attendance', '03_absence.png',     '결석자 조회'),
            ('attendance', '04_statistics.png',  '출석 통계'),
            ('attendance', '05_scan.png',        'QR/바코드 출결'),
            ('attendance', '06_cashScan.png',    '헌금 출결'),
        ],
    )

    # ── Section 4: 보고 ───────────────────────────────────────────────────────
    build_section(
        story, styles,
        number='4', title='보고',
        description=(
            '교역자 및 소그룹 리더의 사역 활동을 보고하고 조회하는 모듈입니다. 사역보고(개인·주간), 구역보고서, '
            '교회학교 보고서를 단계별 입력 폼(기본 정보 → 추가 정보 → 등록 완료)으로 등록하고, 기간·조직·담당자별 '
            '조건 검색으로 보고서를 조회할 수 있습니다.'
        ),
        screenshots=[
            ('report', '01_workAdd.png',       '사역보고 등록'),
            ('report', '02_workManage.png',    '사역보고 조회'),
            ('report', '03_workWeek.png',      '주간사역보고 조회'),
            ('report', '04_meetingAdd.png',    '구역보고서 등록'),
            ('report', '05_meetingManage.png', '구역보고서 조회'),
            ('report', '06_schoolAdd.png',     '교회학교 보고서 등록'),
            ('report', '07_schoolManage.png',  '교회학교 보고서 조회'),
        ],
    )

    # ── Section 5: 심방 ───────────────────────────────────────────────────────
    build_section(
        story, styles,
        number='5', title='심방',
        description=(
            '교인 심방을 등록하고 조회하는 기능을 제공합니다. 심방 등록 시 대상자, 심방일, 심방 구분, 심방 종류, '
            '심방자 정보를 단계별로 입력하며, 심방 조회에서는 대상자·심방자·조직·심방 구분·종류·기간·내용 등 다양한 '
            '조건으로 검색할 수 있습니다. 미심방 세대 검색을 통해 특정 기간 동안 심방받지 못한 세대를 확인할 수 있으며, '
            '기도 제목 기능으로 교인의 기도 제목을 등록하고 관리할 수 있습니다.'
        ),
        screenshots=[
            ('visit', '01_add.png',             '심방 등록'),
            ('visit', '02_manage.png',          '심방 조회'),
            ('visit', '03_nonvisitSearch.png',  '미심방 세대 검색'),
            ('visit', '04_prayTitle.png',       '기도 제목'),
        ],
    )

    # ── Section 6: 교육 ───────────────────────────────────────────────────────
    build_section(
        story, styles,
        number='6', title='교육',
        description=(
            '교인의 교육 이력을 등록하고 조회하는 기능을 제공합니다. 교육 등록 시 대상자, 교육일(시작~종료), 교육명, '
            '수료 여부를 단계별로 입력하며, 교육 조회에서는 등록된 교육 이력을 목록으로 확인하고 교인명·기간·조직·교육명 '
            '등의 조건으로 검색할 수 있습니다.'
        ),
        screenshots=[
            ('education', '01_add.png',    '교육 등록'),
            ('education', '02_manage.png', '교육 조회'),
        ],
    )

    # ── Section 7: 봉사 ───────────────────────────────────────────────────────
    build_section(
        story, styles,
        number='7', title='봉사',
        description=(
            '교회 봉사자를 등록하고 조회하는 기능을 제공합니다. 봉사자 등록 시 교인 이름, 임명일, 연도, 조직, 직책, '
            '활동 여부를 입력하여 저장하며, 봉사자 조회에서는 연도·조직·교인 이름·직책·활동 여부 등의 조건으로 검색하고 '
            '봉사자 목록을 테이블 형태로 확인할 수 있습니다.'
        ),
        screenshots=[
            ('serve', '01_add.png',    '봉사자 등록'),
            ('serve', '02_manage.png', '봉사자 조회'),
        ],
    )

    # ── Section 8: 통계 ───────────────────────────────────────────────────────
    build_section(
        story, styles,
        number='8', title='통계',
        description=(
            '교회 운영 전반에 걸친 다양한 통계를 제공합니다. 전체 통계(출석률 차트, 새신자 현황), 예배 통계, '
            '연간 월별 교인수 통계, 새신자 통계, 장년 통계, 심방 종류 통계, 월별 심방 통계, 접속 환경 통계를 '
            '시각화하여 제공합니다.'
        ),
        screenshots=[
            ('statistics', '01_personal.png',   '전체 통계'),
            ('statistics', '02_worship.png',     '예배 통계'),
            ('statistics', '03_yearMonth.png',   '연간 월별 교인수 통계'),
            ('statistics', '04_newBeliever.png', '새신자 통계'),
            ('statistics', '05_kyoku.png',       '장년 통계'),
            ('statistics', '06_visitKind.png',   '심방 종류 통계'),
            ('statistics', '07_visitMonth.png',  '월별 심방 통계'),
            ('statistics', '08_environment.png', '접속 환경 통계'),
        ],
    )

    # ── Section 9: 일괄처리 ───────────────────────────────────────────────────
    build_section(
        story, styles,
        number='9', title='일괄처리',
        description=(
            '엑셀 파일을 업로드하여 교인의 교적, 소속, 봉사, 직분, 교육, 사용자 데이터를 일괄로 입력하거나, '
            '가족 업데이트·나이 갱신·생일 갱신·소속 내역 복사 등 다양한 데이터 일괄 처리 작업을 실행할 수 있습니다.'
        ),
        screenshots=[
            ('batch', '01_import.png', '엑셀 데이터 입력'),
            ('batch', '02_once.png',   '일괄 데이터 처리'),
        ],
    )

    # ── Section 10: 문자 ─────────────────────────────────────────────────────
    build_section(
        story, styles,
        number='10', title='문자',
        description=(
            '교인에게 SMS/LMS 문자를 발송하고 발송 내역을 조회하는 메뉴입니다. 문자 서비스 신청 안내와 함께, '
            '서비스 가입 후 교적과 연동하여 문자를 발송할 수 있으며, 기간·발신번호·수신번호 등의 조건으로 '
            '발송 이력을 조회할 수 있습니다.'
        ),
        screenshots=[
            ('sms', '01_send.png',    '문자 발송'),
            ('sms', '02_history.png', '문자 발송 내역'),
        ],
    )

    # ── Section 11: 게시판 ────────────────────────────────────────────────────
    build_section(
        story, styles,
        number='11', title='게시판',
        description=(
            '교회 내 다양한 게시판을 통해 공지사항, 자유게시판, 경조/행사, 교회일정, 교인 기념일 검색, '
            '월별 생일자 달력, 개인 메모/다이어리 기능을 제공합니다. 경조/행사·교회일정·생일 달력은 월별 달력 '
            '형태로 표시되며, 날짜별 등록 및 조회가 가능합니다.'
        ),
        screenshots=[
            ('board', '01_notice.png',       '공지사항'),
            ('board', '02_free.png',         '자유게시판'),
            ('board', '03_event.png',        '경조/행사'),
            ('board', '04_churchEvent.png',  '교회일정'),
            ('board', '05_recent.png',       '교인 기념일 검색'),
            ('board', '06_birthCalendar.png','월별 기념일(생일자)'),
            ('board', '07_diary.png',        'My Memo/Diary'),
        ],
    )

    # ── Section 12: 교구사역 ──────────────────────────────────────────────────
    build_section(
        story, styles,
        number='12', title='교구사역',
        description=(
            '교구사역(구역) 운영을 지원하는 메뉴입니다. 구역의 기본 정보(구역명·목자·초원·평원·소속목원)를 조회하고, '
            '구역보고서 등록 및 조회, 목원의 은사를 등록·조회하는 기능을 제공합니다. 현재 베타 서비스로 운영 중입니다.'
        ),
        screenshots=[
            ('mokjang', '01_info.png',           '일반사항'),
            ('mokjang', '02_meetingAdd.png',     '구역보고서 등록'),
            ('mokjang', '03_meetingManage.png',  '구역보고서 조회'),
            ('mokjang', '04_eunsaAdd.png',       '목원은사 등록'),
            ('mokjang', '05_eunsaManage.png',    '목원은사 조회'),
        ],
    )

    # ── Section 13: 프로그램 설정 ─────────────────────────────────────────────
    build_section(
        story, styles,
        number='13', title='프로그램 설정',
        description=(
            '시스템 전반의 설정을 관리하는 메뉴입니다. 교회 기본 정보, 교인 검색 기준, 교육 과정, 항목 정의, '
            '사용자 계정 및 그룹별 메뉴 접근 권한을 관리할 수 있습니다. 관리자만 접근 가능하며, 전체 시스템 운영에 '
            '영향을 미치는 핵심 설정들을 포함합니다.'
        ),
        screenshots=[
            ('setting', '01_index.png', '설정 메인'),
            ('setting', '02_person.png','일반 설정'),
            ('setting', '03_church.png','교회 설정'),
            ('setting', '04_course.png','교육 설정'),
            ('setting', '05_item.png',  '항목 정의'),
            ('setting', '06_user.png',  '사용자 설정'),
            ('setting', '07_auth.png',  '사용자 그룹 권한'),
        ],
    )

    # ── Build ─────────────────────────────────────────────────────────────────
    doc.build(story)
    print(f'PDF saved: {OUTPUT_PATH}')


if __name__ == '__main__':
    build_pdf()

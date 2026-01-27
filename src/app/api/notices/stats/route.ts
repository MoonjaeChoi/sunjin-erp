// Generated: 2026-01-28 16:00:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db-direct';
import type { NoticeType, NoticeStatistics, NoticeStatisticsResponse } from '@/types/notice';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    let dateFilter = '';
    const dateParams: Record<string, string> = {};

    if (startDate) {
      dateFilter += ` AND TRUNC(n."created_at") >= TO_DATE(:startDate, 'YYYY-MM-DD')`;
      dateParams.startDate = startDate;
    }
    if (endDate) {
      dateFilter += ` AND TRUNC(n."created_at") <= TO_DATE(:endDate, 'YYYY-MM-DD')`;
      dateParams.endDate = endDate;
    }

    // 1. Total count
    const totalResult = await executeQuery<any>(
      `SELECT COUNT(*) AS TOTAL FROM NOTICE n WHERE n."deleted_at" IS NULL ${dateFilter}`,
      dateParams
    );
    const totalCount = parseInt(totalResult.rows[0]?.TOTAL || '0', 10);

    // 2. Count by type
    const typeCountResult = await executeQuery<any>(
      `SELECT TYPE, COUNT(*) AS CNT
       FROM NOTICE n
       WHERE n."deleted_at" IS NULL ${dateFilter}
       GROUP BY TYPE`,
      dateParams
    );

    const typeCount: Record<NoticeType, number> = {
      '공지': 0,
      '공유': 0,
      '지시': 0,
      '건의': 0,
      '자유': 0,
    };

    for (const row of typeCountResult.rows) {
      if (row.TYPE in typeCount) {
        typeCount[row.TYPE as NoticeType] = parseInt(row.CNT || '0', 10);
      }
    }

    // 3. Top viewed (limit 5)
    const topViewedResult = await executeQuery<any>(
      `SELECT
        n.ID, n.TITLE, n.TYPE, n.AUTHOR_ID, e.NAME AS AUTHOR_NAME,
        n.VIEW_COUNT, n."created_at", n."updated_at",
        (SELECT COUNT(*) FROM NOTICE_COMMENT nc WHERE nc.NOTICE_ID = n.ID AND nc."deleted_at" IS NULL) AS comment_count,
        (SELECT COUNT(*) FROM NOTICE_ATTACHMENT na WHERE na.NOTICE_ID = n.ID AND na."deleted_at" IS NULL) AS attachment_count
       FROM NOTICE n
       LEFT JOIN EMPLOYEE e ON e.ID = n.AUTHOR_ID AND e.DELETED_AT IS NULL
       WHERE n."deleted_at" IS NULL ${dateFilter}
       ORDER BY n.VIEW_COUNT DESC
       FETCH FIRST 5 ROWS ONLY`,
      dateParams
    );

    const topViewed = topViewedResult.rows.map((row: any) => ({
      id: row.ID,
      title: row.TITLE,
      type: row.TYPE as NoticeType,
      authorId: row.AUTHOR_ID,
      authorName: row.AUTHOR_NAME || '',
      viewCount: row.VIEW_COUNT || 0,
      commentCount: parseInt(row.COMMENT_COUNT || '0', 10),
      attachmentCount: parseInt(row.ATTACHMENT_COUNT || '0', 10),
      createdAt: row['created_at']?.toISOString?.() || row['created_at'],
      updatedAt: row['updated_at']?.toISOString?.() || row['updated_at'],
    }));

    // 4. Top commented (limit 5)
    const topCommentedResult = await executeQuery<any>(
      `SELECT
        n.ID, n.TITLE, n.TYPE, n.AUTHOR_ID, e.NAME AS AUTHOR_NAME,
        n.VIEW_COUNT, n."created_at", n."updated_at",
        (SELECT COUNT(*) FROM NOTICE_COMMENT nc WHERE nc.NOTICE_ID = n.ID AND nc."deleted_at" IS NULL) AS comment_count,
        (SELECT COUNT(*) FROM NOTICE_ATTACHMENT na WHERE na.NOTICE_ID = n.ID AND na."deleted_at" IS NULL) AS attachment_count
       FROM NOTICE n
       LEFT JOIN EMPLOYEE e ON e.ID = n.AUTHOR_ID AND e.DELETED_AT IS NULL
       WHERE n."deleted_at" IS NULL ${dateFilter}
       ORDER BY comment_count DESC
       FETCH FIRST 5 ROWS ONLY`,
      dateParams
    );

    const topCommented = topCommentedResult.rows.map((row: any) => ({
      id: row.ID,
      title: row.TITLE,
      type: row.TYPE as NoticeType,
      authorId: row.AUTHOR_ID,
      authorName: row.AUTHOR_NAME || '',
      viewCount: row.VIEW_COUNT || 0,
      commentCount: parseInt(row.COMMENT_COUNT || '0', 10),
      attachmentCount: parseInt(row.ATTACHMENT_COUNT || '0', 10),
      createdAt: row['created_at']?.toISOString?.() || row['created_at'],
      updatedAt: row['updated_at']?.toISOString?.() || row['updated_at'],
    }));

    // 5. Recent activity (last 7 days)
    const activityResult = await executeQuery<any>(
      `SELECT
        TO_CHAR(TRUNC(activity_date), 'YYYY-MM-DD') AS activity_date,
        SUM(notice_count) AS notice_count,
        SUM(comment_count) AS comment_count
       FROM (
         SELECT TRUNC(n."created_at") AS activity_date, 1 AS notice_count, 0 AS comment_count
         FROM NOTICE n WHERE n."deleted_at" IS NULL AND n."created_at" >= SYSDATE - 7
         UNION ALL
         SELECT TRUNC(c."created_at") AS activity_date, 0 AS notice_count, 1 AS comment_count
         FROM NOTICE_COMMENT c WHERE c."deleted_at" IS NULL AND c."created_at" >= SYSDATE - 7
       )
       GROUP BY TRUNC(activity_date)
       ORDER BY activity_date DESC`,
      {}
    );

    const recentActivity = activityResult.rows.map((row: any) => ({
      date: row.ACTIVITY_DATE,
      noticeCount: parseInt(row.NOTICE_COUNT || '0', 10),
      commentCount: parseInt(row.COMMENT_COUNT || '0', 10),
    }));

    const statistics: NoticeStatistics = {
      totalCount,
      typeCount,
      topViewed,
      topCommented,
      recentActivity,
    };

    return NextResponse.json<NoticeStatisticsResponse>({ data: statistics });
  } catch (error: any) {
    console.error('GET /api/notices/stats error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

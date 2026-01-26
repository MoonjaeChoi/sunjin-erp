// Generated: 2026-01-26 13:10:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';
import { InventoryListResponse } from '@/types/inventory';

export const dynamic = 'force-dynamic';

const SORT_MAP: Record<string, string> = {
  category: 'CATEGORY',
  model: 'MODEL',
  serialNumber: 'SERIAL_NUMBER',
  location: 'CURRENT_LOCATION',
  status: 'CURRENT_STATUS',
  purchaseDate: 'PURCHASE_DATE',
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. 인증 검증
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Query parameters 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10))
    );

    if (pageSize > 100) {
      return NextResponse.json(
        { error: 'Page size cannot exceed 100' },
        { status: 400 }
      );
    }

    // 필터: 카테고리
    const categoriesParam = searchParams.getAll('categories');
    const categories = categoriesParam
      .flatMap((c) => c.split(',').map((s) => s.trim()))
      .filter((c) => c.length > 0);

    // 필터: 상태
    const statusParam = searchParams.getAll('status');
    const statuses = statusParam
      .flatMap((s) => s.split(',').map((st) => st.trim()))
      .filter((s) => s.length > 0);

    // 검색: 위치
    const location = (searchParams.get('location') || '').trim();

    // 검색: 시리얼번호 또는 모델명
    const search = (searchParams.get('search') || '').trim();

    // 정렬
    const sortByParam = searchParams.get('sortBy') || 'category';
    const sortBy = sortByParam in SORT_MAP ? sortByParam : 'category';
    const order = (searchParams.get('order') || 'asc').toUpperCase();

    // 3. WHERE 절 동적 구성
    const whereClauses: string[] = ['i.DELETED_AT IS NULL'];
    const params: any = {};
    let paramIndex = 0;

    if (categories.length > 0) {
      const placeholders = categories
        .map((_, i) => `:category${paramIndex + i}`)
        .join(',');
      whereClauses.push(`i.CATEGORY IN (${placeholders})`);
      categories.forEach((c, i) => {
        params[`category${paramIndex + i}`] = c;
      });
      paramIndex += categories.length;
    }

    if (statuses.length > 0) {
      const placeholders = statuses
        .map((_, i) => `:status${paramIndex + i}`)
        .join(',');
      whereClauses.push(`i.CURRENT_STATUS IN (${placeholders})`);
      statuses.forEach((s, i) => {
        params[`status${paramIndex + i}`] = s;
      });
      paramIndex += statuses.length;
    }

    if (location) {
      whereClauses.push(
        `LOWER(i.CURRENT_LOCATION) LIKE LOWER(:location${paramIndex})`
      );
      params[`location${paramIndex}`] = `%${location}%`;
      paramIndex++;
    }

    if (search) {
      whereClauses.push(
        `(LOWER(i.SERIAL_NUMBER) LIKE LOWER(:search${paramIndex}) OR LOWER(i.MODEL) LIKE LOWER(:search${paramIndex}))`
      );
      params[`search${paramIndex}`] = `${search}%`;
      paramIndex++;
    }

    // 4. 데이터베이스 쿼리
    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      const offset = (page - 1) * pageSize;
      params.offset = offset;
      params.pageSize = pageSize;

      const sortColumn = SORT_MAP[sortBy] || 'CATEGORY';
      const query = `
        SELECT
          i.ID,
          i.CATEGORY,
          i.MODEL,
          i.SERIAL_NUMBER,
          i.PURCHASE_DATE,
          i.PURCHASE_FROM,
          i.CURRENT_LOCATION,
          i.CURRENT_STATUS,
          i.CREATED_AT,
          i.UPDATED_AT
        FROM INVENTORY i
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY i.${sortColumn} ${order}, i.MODEL ASC, i.ID ASC
        OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
      `;

      const countQuery = `
        SELECT COUNT(*) as TOTAL
        FROM INVENTORY i
        WHERE ${whereClauses.join(' AND ')}
      `;

      const countParams = { ...params };
      delete countParams.offset;
      delete countParams.pageSize;

      const [data, countResult] = await Promise.all([
        queryRunner.query(query, params),
        queryRunner.query(countQuery, countParams),
      ]);

      const total = parseInt(countResult[0]?.TOTAL || '0', 10);
      const totalPages = Math.ceil(total / pageSize);

      // 5. HATEOAS Links
      const baseUrl = new URL(request.url);
      baseUrl.searchParams.set('page', String(page));
      baseUrl.searchParams.set('pageSize', String(pageSize));

      const links: Record<string, string> = {};

      if (page > 1) {
        const prevUrl = new URL(baseUrl);
        prevUrl.searchParams.set('page', String(page - 1));
        links.prev = prevUrl.toString();

        const firstUrl = new URL(baseUrl);
        firstUrl.searchParams.set('page', '1');
        links.first = firstUrl.toString();
      }

      if (page < totalPages) {
        const nextUrl = new URL(baseUrl);
        nextUrl.searchParams.set('page', String(page + 1));
        links.next = nextUrl.toString();

        const lastUrl = new URL(baseUrl);
        lastUrl.searchParams.set('page', String(totalPages));
        links.last = lastUrl.toString();
      }

      // 6. 응답
      const response: InventoryListResponse = {
        data: data.map((row: any) => ({
          id: row.ID,
          category: row.CATEGORY,
          model: row.MODEL,
          serial_number: row.SERIAL_NUMBER,
          purchase_date: row.PURCHASE_DATE.toISOString().split('T')[0],
          purchase_from: row.PURCHASE_FROM,
          current_location: row.CURRENT_LOCATION,
          current_status: row.CURRENT_STATUS,
          created_at: row.CREATED_AT.toISOString(),
          updated_at: row.UPDATED_AT.toISOString(),
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
        _links: links,
      };

      return NextResponse.json(response, { status: 200 });
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('GET /api/inventory error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

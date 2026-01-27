// Generated: 2026-01-27 23:55:00 KST

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';

interface GenerateCodeResponse {
  code: string;
}

/**
 * POST /api/projects/generate-code
 * 프로젝트 코드 자동 생성 (PJT-YYYYMMDD-NNN 형식)
 * NNN은 ORACLE SEQUENCE에서 생성
 */
export async function POST(): Promise<NextResponse<GenerateCodeResponse | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. ORACLE SEQUENCE에서 다음 값 조회
    const result = await executeQuery(
      `SELECT PROJECT_CODE_SEQ.NEXTVAL AS seq FROM DUAL`
    );

    const seq = result.rows[0]?.SEQ || result.rows[0]?.seq || 0;

    // 2. 현재 날짜 (KST) 포맷팅
    const now = new Date();

    // KST (UTC+9) 시간대로 변환
    const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const year = kstDate.getUTCFullYear();
    const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getUTCDate()).padStart(2, '0');
    const yyyymmdd = `${year}${month}${day}`;

    // 3. 시퀀스 값을 3자리로 패딩
    const nnn = String(seq).padStart(3, '0');

    // 4. 코드 조합
    const code = `PJT-${yyyymmdd}-${nnn}`;

    return NextResponse.json({ code });
  } catch (error) {
    console.error('POST /api/projects/generate-code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

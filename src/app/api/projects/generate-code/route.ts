// Generated: 2026-01-25 16:15:00 KST

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDataSource } from '@/lib/db';

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

    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();

    try {
      await queryRunner.connect();

      // 1. ORACLE SEQUENCE에서 다음 값 조회
      const result = await queryRunner.query(
        `SELECT PROJECT_CODE_SEQ.NEXTVAL AS seq FROM DUAL`
      );

      const seq = result[0].SEQ;

      // 2. 현재 날짜 (KST) 포맷팅
      // Oracle의 SYSDATE를 사용하는 것이 더 정확하지만, 클라이언트 시간대 동기화를 위해 서버 시간 사용
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
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('POST /api/projects/generate-code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

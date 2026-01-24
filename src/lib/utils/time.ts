// Generated: 2026-01-24 23:30:00 KST

/**
 * 분 단위 숫자를 HH:MM 문자열로 변환
 * @param minutes 0~1439 범위의 분 단위 숫자
 * @returns "HH:MM" 형식 문자열
 */
export function minutesToTimeString(minutes: number): string {
  if (minutes < 0 || minutes > 1439) {
    throw new RangeError('minutes must be 0~1439');
  }
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * HH:MM 문자열을 분 단위 숫자로 변환
 * @param time "HH:MM" 형식 문자열
 * @returns 0~1439 범위의 분 단위 숫자
 */
export function timeStringToMinutes(time: string): number {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error('Invalid time format. Expected HH:MM');
  }
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    throw new RangeError('Invalid time value');
  }
  return h * 60 + m;
}

/**
 * 시간 겹침 여부 확인
 * @returns true if time ranges overlap
 */
export function isTimeOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

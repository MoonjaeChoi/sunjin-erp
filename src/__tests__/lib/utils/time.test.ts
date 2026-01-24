// Generated: 2026-01-24 23:30:00 KST

import {
  minutesToTimeString,
  timeStringToMinutes,
  isTimeOverlap,
} from '@/lib/utils/time';

describe('minutesToTimeString', () => {
  it('should convert 0 to "00:00"', () => {
    expect(minutesToTimeString(0)).toBe('00:00');
  });

  it('should convert 540 to "09:00"', () => {
    expect(minutesToTimeString(540)).toBe('09:00');
  });

  it('should convert 1439 to "23:59"', () => {
    expect(minutesToTimeString(1439)).toBe('23:59');
  });

  it('should convert 90 to "01:30"', () => {
    expect(minutesToTimeString(90)).toBe('01:30');
  });

  it('should convert 720 to "12:00"', () => {
    expect(minutesToTimeString(720)).toBe('12:00');
  });

  it('should throw RangeError for negative input', () => {
    expect(() => minutesToTimeString(-1)).toThrow(RangeError);
  });

  it('should throw RangeError for input > 1439', () => {
    expect(() => minutesToTimeString(1440)).toThrow(RangeError);
  });
});

describe('timeStringToMinutes', () => {
  it('should convert "09:00" to 540', () => {
    expect(timeStringToMinutes('09:00')).toBe(540);
  });

  it('should convert "00:00" to 0', () => {
    expect(timeStringToMinutes('00:00')).toBe(0);
  });

  it('should convert "23:59" to 1439', () => {
    expect(timeStringToMinutes('23:59')).toBe(1439);
  });

  it('should convert "12:30" to 750', () => {
    expect(timeStringToMinutes('12:30')).toBe(750);
  });

  it('should throw for invalid format (single digit)', () => {
    expect(() => timeStringToMinutes('9:00')).toThrow();
  });

  it('should throw for invalid format (no colon)', () => {
    expect(() => timeStringToMinutes('0900')).toThrow();
  });

  it('should throw for invalid hour (25:00)', () => {
    expect(() => timeStringToMinutes('25:00')).toThrow(RangeError);
  });

  it('should throw for invalid minute (12:60)', () => {
    expect(() => timeStringToMinutes('12:60')).toThrow(RangeError);
  });
});

describe('isTimeOverlap', () => {
  it('should return true for overlapping ranges', () => {
    expect(isTimeOverlap(540, 660, 600, 720)).toBe(true);
  });

  it('should return true for fully contained range', () => {
    expect(isTimeOverlap(480, 720, 540, 660)).toBe(true);
  });

  it('should return false for non-overlapping ranges', () => {
    expect(isTimeOverlap(540, 600, 660, 720)).toBe(false);
  });

  it('should return false for adjacent ranges (end === start)', () => {
    expect(isTimeOverlap(540, 600, 600, 720)).toBe(false);
  });

  it('should return true for identical ranges', () => {
    expect(isTimeOverlap(540, 660, 540, 660)).toBe(true);
  });
});

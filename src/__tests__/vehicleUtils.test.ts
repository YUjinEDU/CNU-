import { describe, it, expect } from 'vitest';
import { extractLastDigit, isRestricted, getTodayRestriction, getRestrictionMessage } from '../lib/vehicleUtils';

describe('extractLastDigit', () => {
  it('일반 번호판에서 마지막 숫자를 추출한다', () => {
    expect(extractLastDigit('대전 12가 3456')).toBe(6);
    expect(extractLastDigit('서울 34나 7890')).toBe(0);
    expect(extractLastDigit('12가 3457')).toBe(7);
  });

  it('숫자가 없는 경우 null을 반환한다', () => {
    expect(extractLastDigit('가나다')).toBe(null);
    expect(extractLastDigit('')).toBe(null);
  });
});

describe('isRestricted (2부제)', () => {
  it('홀수 날에 짝수 끝번호 차량은 제한된다', () => {
    const day13 = new Date('2026-04-13T00:00:00+09:00'); // 13일(홀수), 월요일
    expect(isRestricted('대전 12가 3452', day13)).toBe(true);  // 끝번호 2(짝수) → 제한
    expect(isRestricted('대전 12가 3450', day13)).toBe(true);  // 끝번호 0(짝수) → 제한
    expect(isRestricted('대전 12가 3456', day13)).toBe(true);  // 끝번호 6(짝수) → 제한
  });

  it('홀수 날에 홀수 끝번호 차량은 운행 가능하다', () => {
    const day13 = new Date('2026-04-13T00:00:00+09:00'); // 13일(홀수)
    expect(isRestricted('대전 12가 3451', day13)).toBe(false); // 끝번호 1(홀수) → 가능
    expect(isRestricted('대전 12가 3453', day13)).toBe(false); // 끝번호 3(홀수) → 가능
    expect(isRestricted('대전 12가 3459', day13)).toBe(false); // 끝번호 9(홀수) → 가능
  });

  it('짝수 날에 홀수 끝번호 차량은 제한된다', () => {
    const day14 = new Date('2026-04-14T00:00:00+09:00'); // 14일(짝수), 화요일
    expect(isRestricted('대전 12가 3451', day14)).toBe(true);  // 끝번호 1(홀수) → 제한
    expect(isRestricted('대전 12가 3453', day14)).toBe(true);  // 끝번호 3(홀수) → 제한
    expect(isRestricted('대전 12가 3457', day14)).toBe(true);  // 끝번호 7(홀수) → 제한
  });

  it('짝수 날에 짝수 끝번호 차량은 운행 가능하다', () => {
    const day14 = new Date('2026-04-14T00:00:00+09:00'); // 14일(짝수)
    expect(isRestricted('대전 12가 3452', day14)).toBe(false); // 끝번호 2(짝수) → 가능
    expect(isRestricted('대전 12가 3450', day14)).toBe(false); // 끝번호 0(짝수) → 가능
    expect(isRestricted('대전 12가 3458', day14)).toBe(false); // 끝번호 8(짝수) → 가능
  });

  it('주말에는 제한이 없다', () => {
    const saturday = new Date('2026-04-18T00:00:00+09:00'); // 토요일
    const sunday = new Date('2026-04-19T00:00:00+09:00');   // 일요일
    expect(isRestricted('대전 12가 3451', saturday)).toBe(false);
    expect(isRestricted('대전 12가 3452', saturday)).toBe(false);
    expect(isRestricted('대전 12가 3451', sunday)).toBe(false);
    expect(isRestricted('대전 12가 3452', sunday)).toBe(false);
  });
});

describe('getTodayRestriction (2부제)', () => {
  it('홀수 날에는 짝수 끝번호가 제한된다', () => {
    const day13 = new Date('2026-04-13T00:00:00+09:00');
    const result = getTodayRestriction(day13);
    expect(result.isOddDay).toBe(true);
    expect(result.restrictedDigits).toEqual([0, 2, 4, 6, 8]);
    expect(result.allowedDigits).toEqual([1, 3, 5, 7, 9]);
    expect(result.isWeekend).toBe(false);
  });

  it('짝수 날에는 홀수 끝번호가 제한된다', () => {
    const day14 = new Date('2026-04-14T00:00:00+09:00');
    const result = getTodayRestriction(day14);
    expect(result.isOddDay).toBe(false);
    expect(result.restrictedDigits).toEqual([1, 3, 5, 7, 9]);
    expect(result.allowedDigits).toEqual([0, 2, 4, 6, 8]);
  });

  it('주말에는 빈 제한 배열과 isWeekend=true를 반환한다', () => {
    const saturday = new Date('2026-04-18T00:00:00+09:00');
    const result = getTodayRestriction(saturday);
    expect(result.restrictedDigits).toEqual([]);
    expect(result.isWeekend).toBe(true);
  });
});

describe('getRestrictionMessage (2부제)', () => {
  it('운행 가능한 경우 canDrive=true', () => {
    const day13 = new Date('2026-04-13T00:00:00+09:00'); // 홀수 날
    const result = getRestrictionMessage('대전 12가 3451', day13); // 끝번호 1(홀수) → 가능
    expect(result.canDrive).toBe(true);
    expect(result.message).toContain('홀수');
  });

  it('운행 불가한 경우 canDrive=false', () => {
    const day13 = new Date('2026-04-13T00:00:00+09:00'); // 홀수 날
    const result = getRestrictionMessage('대전 12가 3452', day13); // 끝번호 2(짝수) → 제한
    expect(result.canDrive).toBe(false);
    expect(result.message).toContain('홀수');
  });

  it('주말에는 항상 canDrive=true', () => {
    const saturday = new Date('2026-04-18T00:00:00+09:00');
    const result = getRestrictionMessage('대전 12가 3452', saturday);
    expect(result.canDrive).toBe(true);
    expect(result.message).toContain('2부제');
  });
});

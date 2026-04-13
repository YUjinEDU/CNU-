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

describe('isRestricted', () => {
  it('월요일에 끝번호 1, 6 차량은 제한된다', () => {
    const monday = new Date('2026-04-13'); // 월요일
    expect(isRestricted('대전 12가 3451', monday)).toBe(true);
    expect(isRestricted('대전 12가 3456', monday)).toBe(true);
    expect(isRestricted('대전 12가 3452', monday)).toBe(false);
  });

  it('화요일에 끝번호 2, 7 차량은 제한된다', () => {
    const tuesday = new Date('2026-04-14');
    expect(isRestricted('대전 12가 3452', tuesday)).toBe(true);
    expect(isRestricted('대전 12가 3457', tuesday)).toBe(true);
    expect(isRestricted('대전 12가 3453', tuesday)).toBe(false);
  });

  it('수요일에 끝번호 3, 8 차량은 제한된다', () => {
    const wednesday = new Date('2026-04-15');
    expect(isRestricted('대전 12가 3453', wednesday)).toBe(true);
    expect(isRestricted('대전 12가 3458', wednesday)).toBe(true);
  });

  it('목요일에 끝번호 4, 9 차량은 제한된다', () => {
    const thursday = new Date('2026-04-16');
    expect(isRestricted('대전 12가 3454', thursday)).toBe(true);
    expect(isRestricted('대전 12가 3459', thursday)).toBe(true);
  });

  it('금요일에 끝번호 5, 0 차량은 제한된다', () => {
    const friday = new Date('2026-04-17');
    expect(isRestricted('대전 12가 3455', friday)).toBe(true);
    expect(isRestricted('대전 12가 3450', friday)).toBe(true);
  });

  it('주말에는 제한이 없다', () => {
    const saturday = new Date('2026-04-18');
    const sunday = new Date('2026-04-19');
    expect(isRestricted('대전 12가 3451', saturday)).toBe(false);
    expect(isRestricted('대전 12가 3451', sunday)).toBe(false);
  });
});

describe('getTodayRestriction', () => {
  it('평일에는 제한 숫자 2개를 반환한다', () => {
    const monday = new Date('2026-04-13');
    const result = getTodayRestriction(monday);
    expect(result.dayName).toBe('월요일');
    expect(result.restrictedDigits).toEqual([1, 6]);
    expect(result.isWeekend).toBe(false);
  });

  it('주말에는 빈 배열과 isWeekend=true를 반환한다', () => {
    const saturday = new Date('2026-04-18');
    const result = getTodayRestriction(saturday);
    expect(result.restrictedDigits).toEqual([]);
    expect(result.isWeekend).toBe(true);
  });
});

describe('getRestrictionMessage', () => {
  it('운행 가능한 경우 canDrive=true 메시지를 반환한다', () => {
    const monday = new Date('2026-04-13');
    const result = getRestrictionMessage('대전 12가 3452', monday); // 끝번호 2, 월요일은 1,6 제한
    expect(result.canDrive).toBe(true);
  });

  it('운행 불가한 경우 canDrive=false 메시지를 반환한다', () => {
    const monday = new Date('2026-04-13');
    const result = getRestrictionMessage('대전 12가 3451', monday); // 끝번호 1, 월요일 제한
    expect(result.canDrive).toBe(false);
    expect(result.message).toContain('1, 6');
  });
});

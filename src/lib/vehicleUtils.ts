/**
 * 충남대학교 차량 5부제 (주차 5부제) 검증 유틸리티.
 *
 * 5부제 규칙:
 * - 월요일: 끝번호 1, 6
 * - 화요일: 끝번호 2, 7
 * - 수요일: 끝번호 3, 8
 * - 목요일: 끝번호 4, 9
 * - 금요일: 끝번호 5, 0
 * - 주말: 제한 없음
 */

const RESTRICTED_DIGITS: Record<number, number[]> = {
  1: [1, 6],  // 월요일
  2: [2, 7],  // 화요일
  3: [3, 8],  // 수요일
  4: [4, 9],  // 목요일
  5: [5, 0],  // 금요일
};

/**
 * 차량 번호판에서 마지막 숫자를 추출.
 * "12가 3456" → 6
 * "서울 12가 3456" → 6
 */
export function extractLastDigit(plateNumber: string): number | null {
  const digits = plateNumber.replace(/\D/g, '');
  if (digits.length === 0) return null;
  return parseInt(digits[digits.length - 1], 10);
}

/**
 * 주어진 날짜에 해당 차량이 5부제에 걸리는지 확인.
 * @returns true = 운행 제한 (주차 불가), false = 운행 가능
 */
export function isRestricted(plateNumber: string, date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay(); // 0=일, 1=월, ..., 6=토

  // 주말은 제한 없음
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  const lastDigit = extractLastDigit(plateNumber);
  if (lastDigit === null) return false;

  const restricted = RESTRICTED_DIGITS[dayOfWeek];
  return restricted ? restricted.includes(lastDigit) : false;
}

/**
 * 오늘의 5부제 정보를 반환.
 */
export function getTodayRestriction(date: Date = new Date()): {
  dayName: string;
  restrictedDigits: number[];
  isWeekend: boolean;
} {
  const dayOfWeek = date.getDay();
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return {
    dayName: dayNames[dayOfWeek],
    restrictedDigits: isWeekend ? [] : (RESTRICTED_DIGITS[dayOfWeek] || []),
    isWeekend,
  };
}

/**
 * 5부제 상태 메시지 생성.
 */
export function getRestrictionMessage(plateNumber: string, date: Date = new Date()): {
  canDrive: boolean;
  message: string;
  description: string;
} {
  const { dayName, restrictedDigits, isWeekend } = getTodayRestriction(date);
  const dayOfMonth = date.getDate();

  if (isWeekend) {
    return {
      canDrive: true,
      message: `${dayName}은 5부제 적용 대상이 아닙니다.`,
      description: '주말에는 모든 차량 운행 가능',
    };
  }

  const restricted = isRestricted(plateNumber, date);
  const lastDigit = extractLastDigit(plateNumber);

  if (restricted) {
    return {
      canDrive: false,
      message: `오늘(${dayOfMonth}일, ${dayName})은 끝번호 ${restrictedDigits.join(', ')} 차량 주차 제한일입니다.`,
      description: `내 차량 끝번호 ${lastDigit} — 카풀 탑승을 권장합니다`,
    };
  }

  return {
    canDrive: true,
    message: `오늘(${dayOfMonth}일, ${dayName})은 끝번호 ${restrictedDigits.join(', ')} 차량 주차 제한일입니다.`,
    description: `내 차량 끝번호 ${lastDigit} — 운행 가능합니다`,
  };
}

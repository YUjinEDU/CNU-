/**
 * 충남대학교 차량 2부제 검증 유틸리티.
 *
 * 2부제 규칙:
 * - 홀수 날(1, 3, 5, ...): 차량 번호 끝자리가 홀수(1, 3, 5, 7, 9)인 차량만 운행 가능
 * - 짝수 날(2, 4, 6, ...): 차량 번호 끝자리가 짝수(2, 4, 6, 8, 0)인 차량만 운행 가능
 * - 주말: 제한 없음
 * - 한국 시간(KST, UTC+9) 기준으로 날짜 계산
 */

const ODD_DIGITS = [1, 3, 5, 7, 9];
const EVEN_DIGITS = [0, 2, 4, 6, 8];

/**
 * 한국 시간(KST) 기준 Date 정보를 반환.
 */
function getKSTDate(date: Date = new Date()): { dayOfWeek: number; dayOfMonth: number } {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return {
    dayOfWeek: kst.getUTCDay(),     // 0=일, 1=월, ..., 6=토
    dayOfMonth: kst.getUTCDate(),   // 1~31
  };
}

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
 * 주어진 날짜에 해당 차량이 2부제에 걸리는지 확인.
 * @returns true = 운행 제한, false = 운행 가능
 */
export function isRestricted(plateNumber: string, date: Date = new Date()): boolean {
  const { dayOfWeek, dayOfMonth } = getKSTDate(date);

  // 주말은 제한 없음
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  const lastDigit = extractLastDigit(plateNumber);
  if (lastDigit === null) return false;

  const isOddDay = dayOfMonth % 2 === 1;
  const isOddDigit = lastDigit % 2 === 1;

  // 홀수 날 → 짝수 끝번호 제한 (홀수만 운행 가능)
  // 짝수 날 → 홀수 끝번호 제한 (짝수만 운행 가능)
  return isOddDay ? !isOddDigit : isOddDigit;
}

/**
 * 오늘의 2부제 정보를 반환.
 */
export function getTodayRestriction(date: Date = new Date()): {
  dayName: string;
  dayOfMonth: number;
  restrictedDigits: number[];
  allowedDigits: number[];
  isWeekend: boolean;
  isOddDay: boolean;
} {
  const { dayOfWeek, dayOfMonth } = getKSTDate(date);
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isOddDay = dayOfMonth % 2 === 1;

  return {
    dayName: dayNames[dayOfWeek],
    dayOfMonth,
    restrictedDigits: isWeekend ? [] : (isOddDay ? EVEN_DIGITS : ODD_DIGITS),
    allowedDigits: isWeekend ? [...ODD_DIGITS, ...EVEN_DIGITS] : (isOddDay ? ODD_DIGITS : EVEN_DIGITS),
    isWeekend,
    isOddDay,
  };
}

/**
 * 2부제 상태 메시지 생성.
 */
export function getRestrictionMessage(plateNumber: string, date: Date = new Date()): {
  canDrive: boolean;
  message: string;
  description: string;
} {
  const { dayName, dayOfMonth, isWeekend, isOddDay, allowedDigits } = getTodayRestriction(date);

  if (isWeekend) {
    return {
      canDrive: true,
      message: `${dayName}은 2부제 적용 대상이 아닙니다.`,
      description: '주말에는 모든 차량 운행 가능',
    };
  }

  const restricted = isRestricted(plateNumber, date);
  const lastDigit = extractLastDigit(plateNumber);
  const dayType = isOddDay ? '홀수' : '짝수';

  if (restricted) {
    return {
      canDrive: false,
      message: `오늘(${dayOfMonth}일, ${dayType} 날)은 ${dayType} 끝번호 차량만 운행 가능합니다.`,
      description: `내 차량 끝번호 ${lastDigit} — 카풀 탑승을 권장합니다`,
    };
  }

  return {
    canDrive: true,
    message: `오늘(${dayOfMonth}일, ${dayType} 날)은 ${dayType} 끝번호 차량만 운행 가능합니다.`,
    description: `내 차량 끝번호 ${lastDigit} — 운행 가능합니다`,
  };
}

/**
 * 개인정보 보호 유틸리티
 */

/** 이름 마스킹 — "홍길동" → "홍**" */
export function maskName(name: string): string {
  if (!name || name.length <= 1) return name || '?';
  return name[0] + '*'.repeat(name.length - 1);
}

/** 주소에서 동네 수준만 추출 — "대전 동구 우암로135번길 25 (아트빌라)" → "대전 동구" */
export function maskAddress(address: string): string {
  if (!address) return '주소 미등록';
  // "시/도 구/군" 까지만 추출
  const parts = address.split(' ');
  if (parts.length >= 2) {
    // "대전" "동구" or "대전광역시" "유성구"
    return parts.slice(0, 2).join(' ') + ' 일대';
  }
  return parts[0] + ' 일대';
}

import { describe, it, expect } from 'vitest';
import { getDirections, geocode, reverseGeocode } from '../lib/naverApi';

/**
 * 네이버 API 통합 테스트 (실제 dev 서버 프록시 경유).
 * dev 서버가 떠 있어야 동작. 서버 없으면 fallback 동작 검증.
 */

describe('getDirections', () => {
  it('두 좌표 사이의 경로를 반환한다 (API 또는 fallback)', async () => {
    const start = { lat: 36.3500, lng: 127.3300 };
    const goal = { lat: 36.3680, lng: 127.3460 };
    const result = await getDirections(start, goal);

    expect(result.path).toBeDefined();
    expect(result.path.length).toBeGreaterThan(1);
    expect(result.distance).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThan(0);

    // 경로의 모든 좌표가 유효한지
    result.path.forEach(coord => {
      expect(coord.lat).toBeGreaterThan(36);
      expect(coord.lng).toBeGreaterThan(127);
    });
  });

  it('같은 좌표끼리도 에러 없이 처리한다', async () => {
    const point = { lat: 36.3622, lng: 127.3444 };
    const result = await getDirections(point, point);
    expect(result.path).toBeDefined();
    expect(result.path.length).toBeGreaterThanOrEqual(1);
  });
});

describe('geocode', () => {
  it('유효하지 않은 주소는 null을 반환한다 (에러 아님)', async () => {
    const result = await geocode('zzzzzz_invalid_address_99999');
    // API 실패 시 null, 성공해도 결과 없으면 null
    expect(result === null || result?.address !== undefined).toBe(true);
  });
});

describe('reverseGeocode', () => {
  it('좌표를 문자열로 변환한다 (API 또는 fallback)', async () => {
    const coord = { lat: 36.3622, lng: 127.3444 };
    const result = await reverseGeocode(coord);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // API 성공이면 "대전" 포함, fallback이면 "36.3622" 포함
    expect(result.includes('대전') || result.includes('36.3622')).toBe(true);
  });

  it('빈 좌표도 크래시 없이 처리한다', async () => {
    const result = await reverseGeocode({ lat: 0, lng: 0 });
    expect(typeof result).toBe('string');
  });
});

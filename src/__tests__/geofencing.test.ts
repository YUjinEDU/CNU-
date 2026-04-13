import { describe, it, expect } from 'vitest';
import { hasArrived, remainingDistance, formatDistance, estimateArrivalMinutes } from '../lib/geofencing';

describe('hasArrived', () => {
  it('100m 이내이면 도착으로 판정한다', () => {
    const current = { lat: 36.3622, lng: 127.3444 };
    const target = { lat: 36.3623, lng: 127.3445 }; // ~15m 거리
    expect(hasArrived(current, target)).toBe(true);
  });

  it('100m 초과이면 미도착으로 판정한다', () => {
    const current = { lat: 36.3622, lng: 127.3444 };
    const target = { lat: 36.3650, lng: 127.3470 }; // ~400m 거리
    expect(hasArrived(current, target)).toBe(false);
  });

  it('커스텀 반경을 사용할 수 있다', () => {
    const current = { lat: 36.3622, lng: 127.3444 };
    const target = { lat: 36.3650, lng: 127.3470 };
    expect(hasArrived(current, target, 1)).toBe(true); // 1km 반경
  });

  it('같은 좌표는 항상 도착이다', () => {
    const point = { lat: 36.3622, lng: 127.3444 };
    expect(hasArrived(point, point)).toBe(true);
  });
});

describe('remainingDistance', () => {
  it('같은 지점의 남은 거리는 0이다', () => {
    const p = { lat: 36.3622, lng: 127.3444 };
    expect(remainingDistance(p, p)).toBe(0);
  });

  it('가까운 두 점의 거리는 미터 단위로 반환한다', () => {
    const a = { lat: 36.3622, lng: 127.3444 };
    const b = { lat: 36.3632, lng: 127.3454 };
    const dist = remainingDistance(a, b);
    expect(dist).toBeGreaterThan(50);
    expect(dist).toBeLessThan(300);
  });
});

describe('formatDistance', () => {
  it('1000m 미만은 m 단위로 표시한다', () => {
    expect(formatDistance(500)).toBe('500m');
    expect(formatDistance(99)).toBe('99m');
  });

  it('1000m 이상은 km 단위로 표시한다', () => {
    expect(formatDistance(1000)).toBe('1.0km');
    expect(formatDistance(2500)).toBe('2.5km');
  });
});

describe('estimateArrivalMinutes', () => {
  it('1km를 30km/h로 이동하면 2분이다', () => {
    expect(estimateArrivalMinutes(1000, 30)).toBe(2);
  });

  it('500m를 30km/h로 이동하면 최소 1분이다', () => {
    expect(estimateArrivalMinutes(500, 30)).toBe(1);
  });

  it('5km를 30km/h로 이동하면 10분이다', () => {
    expect(estimateArrivalMinutes(5000, 30)).toBe(10);
  });
});

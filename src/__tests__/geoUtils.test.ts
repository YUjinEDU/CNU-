import { describe, it, expect } from 'vitest';
import { getDistance, isRouteIntersectingCircle, findClosestPointOnRoute } from '../lib/geoUtils';

describe('getDistance', () => {
  it('같은 지점 사이의 거리는 0이다', () => {
    const p = { lat: 36.3622, lng: 127.3444 };
    expect(getDistance(p, p)).toBe(0);
  });

  it('충남대 정문~유성온천역 거리는 약 1~3km이다', () => {
    const cnu = { lat: 36.3622, lng: 127.3444 };
    const yuseong = { lat: 36.3550, lng: 127.3400 };
    const dist = getDistance(cnu, yuseong);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(3);
  });

  it('먼 거리 (대전~서울)는 약 140~160km이다', () => {
    const daejeon = { lat: 36.35, lng: 127.38 };
    const seoul = { lat: 37.56, lng: 126.97 };
    const dist = getDistance(daejeon, seoul);
    expect(dist).toBeGreaterThan(130);
    expect(dist).toBeLessThan(170);
  });
});

describe('isRouteIntersectingCircle', () => {
  const sampleRoute = [
    { lat: 36.3500, lng: 127.3300 },
    { lat: 36.3550, lng: 127.3350 },
    { lat: 36.3600, lng: 127.3400 },
    { lat: 36.3650, lng: 127.3450 },
  ];

  it('경로 위의 점은 교차한다', () => {
    const center = { lat: 36.3550, lng: 127.3350 };
    expect(isRouteIntersectingCircle(sampleRoute, center, 0.5)).toBe(true);
  });

  it('경로에서 먼 점은 교차하지 않는다', () => {
    const farPoint = { lat: 36.4000, lng: 127.4000 };
    expect(isRouteIntersectingCircle(sampleRoute, farPoint, 0.5)).toBe(false);
  });

  it('반경이 충분히 크면 먼 점도 교차한다', () => {
    const farPoint = { lat: 36.4000, lng: 127.4000 };
    expect(isRouteIntersectingCircle(sampleRoute, farPoint, 10)).toBe(true);
  });

  it('빈 경로는 교차하지 않는다', () => {
    const center = { lat: 36.3550, lng: 127.3350 };
    expect(isRouteIntersectingCircle([], center, 1)).toBe(false);
  });
});

describe('findClosestPointOnRoute', () => {
  const sampleRoute = [
    { lat: 36.3500, lng: 127.3300 },
    { lat: 36.3600, lng: 127.3400 },
    { lat: 36.3700, lng: 127.3500 },
  ];

  it('경로 시작점 근처의 가장 가까운 점을 찾는다', () => {
    const point = { lat: 36.3510, lng: 127.3290 };
    const closest = findClosestPointOnRoute(sampleRoute, point);
    expect(closest.lat).toBeCloseTo(36.35, 1);
    expect(closest.lng).toBeCloseTo(127.33, 1);
  });

  it('경로 중간점 근처의 가장 가까운 점을 찾는다', () => {
    const point = { lat: 36.3600, lng: 127.3350 };
    const closest = findClosestPointOnRoute(sampleRoute, point);
    // 경로 중간 어딘가에 있어야 함
    expect(closest.lat).toBeGreaterThan(36.3500);
    expect(closest.lat).toBeLessThan(36.3700);
  });

  it('빈 경로에서는 fallback 좌표를 반환한다', () => {
    const point = { lat: 36.35, lng: 127.34 };
    const closest = findClosestPointOnRoute([], point);
    // findClosestPointOnRoute는 path[0]을 기본값으로 사용 — 빈 배열이면 undefined
    expect(closest).toBeDefined();
  });
});

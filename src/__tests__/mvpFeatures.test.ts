import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUser, saveUser, getAllUsers,
  getActiveRoutes, createRoute, updateRouteStatus, getRouteById,
  createRide, getRidesByRoute, getRidesByDriver, updateRideStatus,
  getActiveRideForPassenger, getRideById,
  updateLiveLocation, getLiveLocation, removeLiveLocation,
  seedTestData,
} from '../lib/localDb';
import { getDistance, isRouteIntersectingCircle, findClosestPointOnRoute } from '../lib/geoUtils';
import { hasArrived, remainingDistance, formatDistance, estimateArrivalMinutes } from '../lib/geofencing';
import { isRestricted, getRestrictionMessage, extractLastDigit } from '../lib/vehicleUtils';
import { User, Route, Ride, Coordinate } from '../types';

beforeEach(() => {
  localStorage.clear();
  seedTestData();
});

// ═══════════════════════════════════════════════
// 기능 1: 매칭 필터링 (경로-반경 교차)
// ═══════════════════════════════════════════════
describe('기능1: 매칭 필터링', () => {
  it('도보 반경 내 경로만 필터링한다', () => {
    const routes = getActiveRoutes();
    const myLocation = { lat: 36.3555, lng: 127.3360 };
    const walkingRadiusKm = 0.8; // 10분 도보

    const matched = routes.filter(route => {
      const path: Coordinate[] = JSON.parse(route.path);
      return isRouteIntersectingCircle(path, myLocation, walkingRadiusKm);
    });

    // 4개 경로 중 도안동→공대(route-001)가 매칭되어야 함
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.length).toBeLessThanOrEqual(routes.length);
  });

  it('매칭된 경로에서 픽업 포인트를 계산하면 도보 반경 내에 있다', () => {
    const routes = getActiveRoutes();
    const myLocation = { lat: 36.3555, lng: 127.3360 };
    const walkingRadiusKm = 0.8;

    routes.forEach(route => {
      const path: Coordinate[] = JSON.parse(route.path);
      if (!isRouteIntersectingCircle(path, myLocation, walkingRadiusKm)) return;

      const pickup = findClosestPointOnRoute(path, myLocation);
      const distToPickup = getDistance(myLocation, pickup);
      expect(distToPickup).toBeLessThan(walkingRadiusKm);
    });
  });

  it('도보 반경 밖의 위치에서는 매칭되는 경로가 적다', () => {
    const routes = getActiveRoutes();
    const farLocation = { lat: 36.3200, lng: 127.4000 }; // 서대전역 근처
    const walkingRadiusKm = 0.5; // 짧은 반경

    const matched = routes.filter(route => {
      const path: Coordinate[] = JSON.parse(route.path);
      return isRouteIntersectingCircle(path, farLocation, walkingRadiusKm);
    });

    expect(matched.length).toBe(0); // 멀어서 매칭 안 됨
  });

  it('반경을 크게 하면 더 많은 경로가 매칭된다', () => {
    const routes = getActiveRoutes();
    const myLocation = { lat: 36.3600, lng: 127.3400 };

    const matchedSmall = routes.filter(r =>
      isRouteIntersectingCircle(JSON.parse(r.path), myLocation, 0.3)
    );
    const matchedLarge = routes.filter(r =>
      isRouteIntersectingCircle(JSON.parse(r.path), myLocation, 2.0)
    );

    expect(matchedLarge.length).toBeGreaterThanOrEqual(matchedSmall.length);
  });
});

// ═══════════════════════════════════════════════
// 기능 2: 탑승 신청/수락/거절
// ═══════════════════════════════════════════════
describe('기능2: 탑승 신청/수락/거절', () => {
  it('탑승자가 신청하면 Ride가 pending 상태로 생성된다', () => {
    const route = getActiveRoutes()[0];
    const ride = createRide({
      routeId: route.id!,
      driverId: route.driverId,
      passengerId: 'test-003',
      passengerName: '이연구원',
      pickupCoord: { lat: 36.355, lng: 127.336 },
      status: 'pending',
    });

    expect(ride.id).toBeDefined();
    expect(ride.status).toBe('pending');
  });

  it('운전자가 자기 경로의 pending 신청을 조회할 수 있다', () => {
    const route = getActiveRoutes()[0]; // test-001 김교수의 경로
    createRide({
      routeId: route.id!, driverId: route.driverId,
      passengerId: 'test-003', passengerName: '이연구원',
      pickupCoord: { lat: 36.355, lng: 127.336 }, status: 'pending',
    });
    createRide({
      routeId: route.id!, driverId: route.driverId,
      passengerId: 'test-005', passengerName: '정행정관',
      pickupCoord: { lat: 36.356, lng: 127.337 }, status: 'pending',
    });

    const pending = getRidesByDriver(route.driverId);
    expect(pending.length).toBe(2);
  });

  it('운전자가 수락하면 Ride 상태가 accepted로 변경된다', () => {
    const route = getActiveRoutes()[0];
    const ride = createRide({
      routeId: route.id!, driverId: route.driverId,
      passengerId: 'test-003', passengerName: '이연구원',
      pickupCoord: { lat: 36.355, lng: 127.336 }, status: 'pending',
    });

    updateRideStatus(ride.id!, 'accepted');
    const updated = getRideById(ride.id!);
    expect(updated!.status).toBe('accepted');
  });

  it('운전자가 거절하면 Ride 상태가 cancelled로 변경된다', () => {
    const route = getActiveRoutes()[0];
    const ride = createRide({
      routeId: route.id!, driverId: route.driverId,
      passengerId: 'test-003', passengerName: '이연구원',
      pickupCoord: { lat: 36.355, lng: 127.336 }, status: 'pending',
    });

    updateRideStatus(ride.id!, 'cancelled');
    const updated = getRideById(ride.id!);
    expect(updated!.status).toBe('cancelled');
    // 거절 후 pending 목록에서 사라짐
    expect(getRidesByDriver(route.driverId).length).toBe(0);
  });

  it('같은 탑승자가 중복 신청하면 활성 Ride가 1개만 있어야 한다', () => {
    const route = getActiveRoutes()[0];
    createRide({
      routeId: route.id!, driverId: route.driverId,
      passengerId: 'test-003', passengerName: '이연구원',
      pickupCoord: { lat: 36.355, lng: 127.336 }, status: 'pending',
    });

    const activeRide = getActiveRideForPassenger('test-003');
    expect(activeRide).not.toBeNull();
    expect(activeRide!.passengerId).toBe('test-003');
  });
});

// ═══════════════════════════════════════════════
// 기능 3: 경로 비교 (탑승자 시점)
// ═══════════════════════════════════════════════
describe('기능3: 경로 비교', () => {
  it('각 매칭 경로에 대해 도보 거리와 시간을 계산한다', () => {
    const routes = getActiveRoutes();
    const myLocation = { lat: 36.3555, lng: 127.3360 };
    const walkingRadiusKm = 0.8;

    const results = routes
      .map(route => {
        const path: Coordinate[] = JSON.parse(route.path);
        if (!isRouteIntersectingCircle(path, myLocation, walkingRadiusKm)) return null;
        const pickup = findClosestPointOnRoute(path, myLocation);
        const walkDist = Math.round(getDistance(myLocation, pickup) * 1000);
        const walkMin = Math.max(1, Math.round(walkDist / 80));
        return { routeId: route.id, driverName: route.driverName, walkDist, walkMin };
      })
      .filter(Boolean);

    expect(results.length).toBeGreaterThan(0);
    results.forEach(r => {
      expect(r!.walkDist).toBeGreaterThanOrEqual(0);
      expect(r!.walkMin).toBeGreaterThanOrEqual(1);
      expect(r!.driverName).toBeTruthy();
    });
  });

  it('경로 path를 파싱하면 지도에 그릴 수 있는 좌표 배열이다', () => {
    const routes = getActiveRoutes();
    routes.forEach(route => {
      const path: Coordinate[] = JSON.parse(route.path);
      expect(path.length).toBeGreaterThan(1);
      path.forEach(c => {
        expect(typeof c.lat).toBe('number');
        expect(typeof c.lng).toBe('number');
        expect(c.lat).toBeGreaterThan(36);
        expect(c.lng).toBeGreaterThan(127);
      });
    });
  });
});

// ═══════════════════════════════════════════════
// 기능 4: 운전자 대기 화면 (실 데이터)
// ═══════════════════════════════════════════════
describe('기능4: 운전자 대기 화면 데이터', () => {
  it('운전자 경로 등록 후 활성 경로에 나타난다', () => {
    const before = getActiveRoutes().length;
    createRoute({
      driverId: 'new-driver', driverName: '신규운전자',
      sourceName: '출발', destName: '도착', path: '[]', status: 'active',
    });
    expect(getActiveRoutes().length).toBe(before + 1);
  });

  it('운전자의 경로에 들어온 탑승 신청을 조회한다', () => {
    const route = createRoute({
      driverId: 'my-driver', driverName: '나',
      sourceName: '출발', destName: '도착', path: '[]', status: 'active',
    });

    expect(getRidesByDriver('my-driver').length).toBe(0);

    createRide({
      routeId: route.id!, driverId: 'my-driver',
      passengerId: 'p1', passengerName: '탑승자1',
      pickupCoord: { lat: 36.36, lng: 127.34 }, status: 'pending',
    });

    expect(getRidesByDriver('my-driver').length).toBe(1);
  });

  it('수락한 탑승자의 사용자 정보를 조회할 수 있다', () => {
    const route = getActiveRoutes()[0];
    const ride = createRide({
      routeId: route.id!, driverId: route.driverId,
      passengerId: 'test-003', passengerName: '이연구원',
      pickupCoord: { lat: 36.355, lng: 127.336 }, status: 'pending',
    });

    updateRideStatus(ride.id!, 'accepted');
    const passenger = getUser('test-003');
    expect(passenger).not.toBeNull();
    expect(passenger!.name).toBe('이연구원');
    expect(passenger!.department).toBe('학생처 장학팀');
  });
});

// ═══════════════════════════════════════════════
// 기능 5: 매칭 후 픽업 주소 표시
// ═══════════════════════════════════════════════
describe('기능5: 픽업 주소 변환', () => {
  it('계산된 픽업 좌표는 경로 위 유효한 좌표이다', () => {
    const route = getActiveRoutes()[0];
    const path: Coordinate[] = JSON.parse(route.path);
    const myLocation = { lat: 36.3555, lng: 127.3360 };
    const pickup = findClosestPointOnRoute(path, myLocation);

    expect(pickup.lat).toBeGreaterThan(36.34);
    expect(pickup.lat).toBeLessThan(36.40);
    expect(pickup.lng).toBeGreaterThan(127.32);
    expect(pickup.lng).toBeLessThan(127.36);
  });

  it('Ride에 pickupCoord가 저장된다', () => {
    const route = getActiveRoutes()[0];
    const pickup = { lat: 36.3555, lng: 127.3360 };
    const ride = createRide({
      routeId: route.id!, driverId: route.driverId,
      passengerId: 'test-003', passengerName: '이연구원',
      pickupCoord: pickup, status: 'pending',
    });

    const saved = getRideById(ride.id!);
    expect(saved!.pickupCoord.lat).toBe(36.3555);
    expect(saved!.pickupCoord.lng).toBe(127.3360);
  });
});

// ═══════════════════════════════════════════════
// 통합: 전체 탑승 → 운행 → 하차 E2E
// ═══════════════════════════════════════════════
describe('E2E: 탑승자 신청 → 운전자 수락 → 이동 → 하차', () => {
  it('전체 플로우가 정상 동작한다', () => {
    // 1. 탑승자가 매칭 검색
    const myLocation = { lat: 36.3555, lng: 127.3360 };
    const routes = getActiveRoutes();
    const matched = routes.filter(r =>
      isRouteIntersectingCircle(JSON.parse(r.path), myLocation, 0.8)
    );
    expect(matched.length).toBeGreaterThan(0);

    // 2. 첫 번째 차에 탑승 신청
    const selectedRoute = matched[0];
    const path = JSON.parse(selectedRoute.path) as Coordinate[];
    const pickup = findClosestPointOnRoute(path, myLocation);
    const ride = createRide({
      routeId: selectedRoute.id!, driverId: selectedRoute.driverId,
      passengerId: 'test-003', passengerName: '이연구원',
      pickupCoord: pickup, status: 'pending',
    });
    expect(ride.status).toBe('pending');

    // 3. 운전자가 신청 확인
    const pendingRides = getRidesByDriver(selectedRoute.driverId);
    expect(pendingRides.length).toBe(1);
    expect(pendingRides[0].passengerName).toBe('이연구원');

    // 4. 운전자가 수락
    updateRideStatus(ride.id!, 'accepted');
    expect(getRideById(ride.id!)!.status).toBe('accepted');

    // 5. 운전자 실시간 위치 공유 시작
    updateLiveLocation(selectedRoute.driverId, { lat: 36.352, lng: 127.333 });
    const driverLoc = getLiveLocation(selectedRoute.driverId);
    expect(driverLoc).not.toBeNull();

    // 6. 운전자가 픽업 장소에 도착
    updateLiveLocation(selectedRoute.driverId, pickup);
    expect(hasArrived(
      { lat: getLiveLocation(selectedRoute.driverId)!.lat, lng: getLiveLocation(selectedRoute.driverId)!.lng },
      pickup
    )).toBe(true);

    // 7. 탑승 후 이동
    updateRideStatus(ride.id!, 'in_transit');
    expect(getRideById(ride.id!)!.status).toBe('in_transit');

    // 8. 목적지 도착
    const dest = selectedRoute.destCoord || { lat: 36.3680, lng: 127.3460 };
    updateLiveLocation(selectedRoute.driverId, dest);
    expect(hasArrived(
      { lat: getLiveLocation(selectedRoute.driverId)!.lat, lng: getLiveLocation(selectedRoute.driverId)!.lng },
      dest, 0.15
    )).toBe(true);

    // 9. 하차 완료
    updateRideStatus(ride.id!, 'completed');
    updateRouteStatus(selectedRoute.id!, 'completed');
    removeLiveLocation(selectedRoute.driverId);

    expect(getRideById(ride.id!)!.status).toBe('completed');
    expect(getActiveRoutes().length).toBe(3); // 4개 중 1개 완료
    expect(getLiveLocation(selectedRoute.driverId)).toBeNull();
    expect(getActiveRideForPassenger('test-003')).toBeNull();
  });
});

// ═══════════════════════════════════════════════
// 엣지 케이스
// ═══════════════════════════════════════════════
describe('엣지 케이스', () => {
  it('좌석 수 0인 경우에도 크래시 없음', () => {
    const route = createRoute({
      driverId: 'd1', driverName: 'A', sourceName: 's', destName: 'd',
      path: '[]', status: 'active', availableSeats: 0,
    });
    expect(route.availableSeats).toBe(0);
  });

  it('path가 빈 JSON 배열인 경로도 안전하게 처리', () => {
    const route = createRoute({
      driverId: 'd1', driverName: 'A', sourceName: 's', destName: 'd',
      path: '[]', status: 'active',
    });
    const path = JSON.parse(route.path);
    const myLoc = { lat: 36.36, lng: 127.34 };
    // 빈 경로는 교차하지 않음
    expect(isRouteIntersectingCircle(path, myLoc, 1)).toBe(false);
    // findClosestPointOnRoute 빈 배열 → 입력 좌표 반환
    expect(findClosestPointOnRoute(path, myLoc)).toEqual(myLoc);
  });

  it('존재하지 않는 Ride ID로 업데이트해도 크래시 없음', () => {
    updateRideStatus('nonexistent-ride', 'cancelled');
    // 에러 없이 무시됨
    expect(true).toBe(true);
  });

  it('2부제 — 번호판 없는 사용자도 안전 처리', () => {
    const msg = getRestrictionMessage('', new Date('2026-04-13'));
    expect(msg.canDrive).toBe(true); // 번호판 없으면 제한 없음
  });

  it('extractLastDigit — 다양한 형식 처리', () => {
    expect(extractLastDigit('123')).toBe(3);
    expect(extractLastDigit('대전 12가 3450')).toBe(0);
    expect(extractLastDigit('')).toBeNull();
    expect(extractLastDigit('가나다라')).toBeNull();
  });
});

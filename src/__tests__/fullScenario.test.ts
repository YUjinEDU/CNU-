import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUser, saveUser, getAllUsers,
  getActiveRoutes, createRoute, updateRouteStatus, getRouteById,
  createRide, getRidesByRoute,
  updateLiveLocation, getLiveLocation, removeLiveLocation,
  seedTestData,
} from '../lib/localDb';
import { getDistance, isRouteIntersectingCircle, findClosestPointOnRoute } from '../lib/geoUtils';
import { hasArrived, remainingDistance, formatDistance, estimateArrivalMinutes } from '../lib/geofencing';
import { isRestricted, getRestrictionMessage } from '../lib/vehicleUtils';
import { User, Coordinate } from '../types';

beforeEach(() => {
  localStorage.clear();
});

describe('시나리오 A: 운전자가 동승자를 모집하는 경우', () => {
  it('1. 운전자 가입 → 2. 경로 등록 → 3. 매칭 대기 → 4. 탑승자 매칭 → 5. 픽업 이동 → 6. 도착 감지 → 7. 운행 종료', () => {
    // 1. 운전자 가입
    const driver: User = {
      uid: 'driver-kim',
      name: '김교수',
      employeeNumber: '2020-00101',
      department: '공과대학',
      role: 'driver',
      isVerified: true,
      vehicle: { plateNumber: '대전 12가 3457', model: '그랜저', color: '화이트', seatCapacity: 4 },
      savedAddresses: [
        { name: '도안동 트리풀시티', lat: 36.3500, lng: 127.3300 },
        { name: '충남대학교 공과대학', lat: 36.3680, lng: 127.3460 },
      ],
      createdAt: new Date().toISOString(),
    };
    saveUser(driver);
    expect(getUser('driver-kim')).not.toBeNull();

    // 5부제 확인 (끝번호 7, 화요일 제한)
    const tuesday = new Date('2026-04-14');
    expect(isRestricted(driver.vehicle!.plateNumber, tuesday)).toBe(true);
    const monday = new Date('2026-04-13');
    expect(isRestricted(driver.vehicle!.plateNumber, monday)).toBe(false);

    // 2. 경로 등록
    const routePath: Coordinate[] = [
      { lat: 36.3500, lng: 127.3300 },
      { lat: 36.3550, lng: 127.3350 },
      { lat: 36.3600, lng: 127.3400 },
      { lat: 36.3650, lng: 127.3440 },
      { lat: 36.3680, lng: 127.3460 },
    ];
    const route = createRoute({
      driverId: 'driver-kim',
      driverName: '김교수',
      vehicle: driver.vehicle,
      sourceName: '도안동 트리풀시티',
      sourceCoord: { lat: 36.3500, lng: 127.3300 },
      destName: '충남대학교 공과대학',
      destCoord: { lat: 36.3680, lng: 127.3460 },
      path: JSON.stringify(routePath),
      status: 'active',
      departureTime: '08:30',
      availableSeats: 3,
    });
    expect(route.id).toBeDefined();

    // 3. 매칭 대기 — 활성 경로 확인
    const activeRoutes = getActiveRoutes();
    expect(activeRoutes.length).toBe(1);
    expect(activeRoutes[0].driverName).toBe('김교수');

    // 4. 탑승자의 도보 반경과 경로 교차 확인
    const passengerCenter = { lat: 36.3555, lng: 127.3360 };
    const walkingRadiusKm = 0.5; // 500m
    const intersects = isRouteIntersectingCircle(routePath, passengerCenter, walkingRadiusKm);
    expect(intersects).toBe(true);

    // 최적 픽업 포인트 계산
    const pickup = findClosestPointOnRoute(routePath, passengerCenter);
    expect(pickup.lat).toBeGreaterThan(36.35);
    expect(pickup.lng).toBeGreaterThan(127.33);

    // 5. 운전자 실시간 위치 공유
    updateLiveLocation('driver-kim', { lat: 36.3520, lng: 127.3320 }, 45, 30);
    const loc = getLiveLocation('driver-kim');
    expect(loc).not.toBeNull();
    expect(loc!.lat).toBe(36.3520);

    // 6. 픽업 장소 도착 감지
    const nearPickup = { lat: pickup.lat + 0.0005, lng: pickup.lng + 0.0005 };
    expect(hasArrived(nearPickup, pickup)).toBe(true);

    const farFromPickup = { lat: 36.3400, lng: 127.3200 };
    expect(hasArrived(farFromPickup, pickup)).toBe(false);

    // 남은 거리 표시
    const dist = remainingDistance(farFromPickup, pickup);
    expect(dist).toBeGreaterThan(500);
    expect(formatDistance(dist)).toContain('km');

    // ETA 계산
    const eta = estimateArrivalMinutes(dist);
    expect(eta).toBeGreaterThan(0);

    // 7. 운행 종료
    updateRouteStatus(route.id!, 'completed');
    expect(getActiveRoutes().length).toBe(0);
    removeLiveLocation('driver-kim');
    expect(getLiveLocation('driver-kim')).toBeNull();
  });
});

describe('시나리오 B: 탑승자가 카풀을 요청하는 경우', () => {
  it('1. 탑승자 가입 → 2. 검색 → 3. 매칭 가능 차량 필터 → 4. 탑승 신청 → 5. 운전자 위치 추적 → 6. 탑승 → 7. 하차', () => {
    seedTestData();

    // 1. 탑승자 가입
    const passenger: User = {
      uid: 'passenger-lee',
      name: '이탑승자',
      department: '학생처',
      role: 'passenger',
      isVerified: true,
      savedAddresses: [
        { name: '유성온천역', lat: 36.3555, lng: 127.3360 },
        { name: '충남대학교 대학본부', lat: 36.3672, lng: 127.3430 },
      ],
      createdAt: new Date().toISOString(),
    };
    saveUser(passenger);

    // 2. 활성 경로 검색
    const routes = getActiveRoutes();
    expect(routes.length).toBeGreaterThan(0);

    // 3. 도보 반경 내 경로 필터링
    const myLocation = { lat: 36.3555, lng: 127.3360 };
    const walkingRadiusKm = 0.8; // 800m (10분 도보)

    const matchingRoutes = routes.filter(route => {
      const path: Coordinate[] = JSON.parse(route.path);
      return isRouteIntersectingCircle(path, myLocation, walkingRadiusKm);
    });
    expect(matchingRoutes.length).toBeGreaterThan(0);

    // 4. 첫 번째 매칭 경로 선택 → 픽업 포인트 계산
    const selectedRoute = matchingRoutes[0];
    const path: Coordinate[] = JSON.parse(selectedRoute.path);
    const pickupPoint = findClosestPointOnRoute(path, myLocation);

    // 픽업 포인트가 도보 반경 내인지
    const distToPickup = getDistance(myLocation, pickupPoint);
    expect(distToPickup).toBeLessThan(walkingRadiusKm);

    // 탑승 신청
    const ride = createRide({
      routeId: selectedRoute.id!,
      driverId: selectedRoute.driverId,
      passengerId: 'passenger-lee',
      passengerName: '이탑승자',
      pickupCoord: pickupPoint,
      pickupName: '계산된 픽업 포인트',
      status: 'pending',
    });
    expect(ride.id).toBeDefined();
    expect(getRidesByRoute(selectedRoute.id!).length).toBe(1);

    // 5. 운전자 실시간 위치 추적
    updateLiveLocation(selectedRoute.driverId, { lat: 36.3530, lng: 127.3340 });
    const driverLoc = getLiveLocation(selectedRoute.driverId);
    expect(driverLoc).not.toBeNull();

    // 남은 거리
    const remaining = remainingDistance(
      { lat: driverLoc!.lat, lng: driverLoc!.lng },
      pickupPoint
    );
    expect(remaining).toBeGreaterThan(0);
    expect(formatDistance(remaining)).toBeTruthy();

    // 6. 운전자가 픽업 장소에 도착
    updateLiveLocation(selectedRoute.driverId, pickupPoint);
    const arrivedLoc = getLiveLocation(selectedRoute.driverId);
    expect(hasArrived(
      { lat: arrivedLoc!.lat, lng: arrivedLoc!.lng },
      pickupPoint
    )).toBe(true);

    // 7. 목적지 도착 확인
    const destination = selectedRoute.destCoord || { lat: 36.3680, lng: 127.3460 };
    updateLiveLocation(selectedRoute.driverId, destination);
    const finalLoc = getLiveLocation(selectedRoute.driverId);
    expect(hasArrived(
      { lat: finalLoc!.lat, lng: finalLoc!.lng },
      destination,
      0.15
    )).toBe(true);

    // 정리
    removeLiveLocation(selectedRoute.driverId);
    updateRouteStatus(selectedRoute.id!, 'completed');
  });
});

describe('시나리오 C: 5부제 + 화면 전환 통합', () => {
  it('5부제 걸린 차량은 운전 불가, 탑승만 가능', () => {
    const msg = getRestrictionMessage('대전 12가 3451', new Date('2026-04-13')); // 월요일, 끝번호1
    expect(msg.canDrive).toBe(false);
    expect(msg.message).toContain('1, 6');

    // 같은 날 끝번호 2 차량은 운행 가능
    const msg2 = getRestrictionMessage('대전 12가 3452', new Date('2026-04-13'));
    expect(msg2.canDrive).toBe(true);
  });

  it('시드 데이터의 모든 사용자가 유효하다', () => {
    seedTestData();
    const users = getAllUsers();
    expect(users.length).toBe(10);

    users.forEach(user => {
      expect(user.uid).toBeTruthy();
      expect(user.name).toBeTruthy();
      expect(user.department).toBeTruthy();
      expect(['driver', 'passenger', 'both']).toContain(user.role);
      if (user.role === 'driver' || user.role === 'both') {
        expect(user.vehicle).toBeDefined();
        expect(user.vehicle!.plateNumber).toBeTruthy();
      }
      if (user.savedAddresses) {
        user.savedAddresses.forEach(addr => {
          expect(addr.name).toBeTruthy();
          expect(addr.lat).not.toBe(0);
          expect(addr.lng).not.toBe(0);
        });
      }
    });
  });

  it('시드 데이터의 모든 경로가 유효하다', () => {
    seedTestData();
    const routes = getActiveRoutes();
    expect(routes.length).toBe(4);

    routes.forEach(route => {
      expect(route.driverId).toBeTruthy();
      expect(route.driverName).toBeTruthy();
      const path: Coordinate[] = JSON.parse(route.path);
      expect(path.length).toBeGreaterThan(1);
      path.forEach(coord => {
        expect(coord.lat).toBeGreaterThan(36);
        expect(coord.lng).toBeGreaterThan(127);
      });
    });
  });
});

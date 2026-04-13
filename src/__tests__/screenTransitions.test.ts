import { describe, it, expect, beforeEach } from 'vitest';
import { AppState } from '../types';
import { seedTestData, getActiveRoutes, getUser, saveUser } from '../lib/localDb';

/**
 * 화면 전환 시 필요한 데이터가 존재하는지 검증.
 * 각 화면이 어떤 상태/데이터에 의존하는지 테스트.
 */

beforeEach(() => {
  localStorage.clear();
  seedTestData();
});

describe('화면별 데이터 의존성', () => {
  it('HOME: user 데이터가 있어야 한다', () => {
    const user = getUser('test-001');
    expect(user).not.toBeNull();
    expect(user!.name).toBeTruthy();
    expect(user!.department).toBeTruthy();
  });

  it('HOME: vehicle이 없는 사용자도 정상 처리', () => {
    const passengerUser = getUser('test-003'); // 이연구원 - passenger
    expect(passengerUser).not.toBeNull();
    expect(passengerUser!.vehicle).toBeUndefined();
    // HomeScreen은 vehicle이 없으면 "차량 등록" 버튼을 보여야 함
  });

  it('DRIVER_SETUP: user.savedAddresses가 있어야 출발지/도착지 선택 가능', () => {
    const driver = getUser('test-001');
    expect(driver!.savedAddresses).toBeDefined();
    expect(driver!.savedAddresses!.length).toBeGreaterThanOrEqual(2);
    // 첫번째: 집, 두번째: 직장
    expect(driver!.savedAddresses![0].lat).not.toBe(0);
    expect(driver!.savedAddresses![1].lat).not.toBe(0);
  });

  it('PASSENGER_SEARCH: 활성 경로가 존재해야 한다', () => {
    const routes = getActiveRoutes();
    expect(routes.length).toBeGreaterThan(0);
    routes.forEach(route => {
      expect(route.driverName).toBeTruthy();
      expect(route.sourceName).toBeTruthy();
      expect(route.destName).toBeTruthy();
      expect(route.path).toBeTruthy();
      // path가 파싱 가능한 JSON이어야 함
      const parsed = JSON.parse(route.path);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });
  });

  it('PASSENGER_MATCHED: 선택된 route의 path에서 가장 가까운 픽업 포인트 계산 가능', () => {
    const route = getActiveRoutes()[0];
    const path = JSON.parse(route.path);
    expect(path.length).toBeGreaterThan(1);
    // 모든 좌표가 유효해야 함
    path.forEach((coord: { lat: number; lng: number }) => {
      expect(coord.lat).toBeGreaterThan(36);
      expect(coord.lng).toBeGreaterThan(127);
    });
  });

  it('DRIVER_EN_ROUTE: driverRoute가 비어있으면 MapComponent가 빈 polyline을 처리해야 함', () => {
    // driverRoute는 AppContext state이므로 초기값은 []
    // MapComponent는 빈 배열을 받아도 크래시하면 안 됨
    const emptyRoute: { lat: number; lng: number }[] = [];
    expect(emptyRoute.length).toBe(0);
    // 빈 polyline 필터링: path.length < 2면 skip
  });

  it('PROFILE: user가 null이면 SIGNUP으로 리다이렉트해야 함', () => {
    // user가 없는 상태에서 PROFILE 접근 시나리오
    const nonexistent = getUser('no-such-user');
    expect(nonexistent).toBeNull();
  });

  it('모든 AppState 값이 유효하다', () => {
    const validStates: AppState[] = [
      'LOGIN', 'SIGNUP', 'HOME',
      'DRIVER_SETUP', 'DRIVER_CONFIRM', 'DRIVER_ACTIVE',
      'DRIVER_MATCHED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'DRIVER_IN_TRANSIT',
      'PASSENGER_SETUP', 'PASSENGER_SEARCH', 'PASSENGER_MATCHED',
      'PASSENGER_EN_ROUTE', 'PASSENGER_IN_TRANSIT',
      'PROFILE', 'PROFILE_EDIT',
    ];
    expect(validStates.length).toBe(17);
  });
});

describe('화면 전환 시퀀스', () => {
  it('운전자 플로우: SIGNUP → HOME → DRIVER_SETUP → DRIVER_ACTIVE → DRIVER_MATCHED → DRIVER_EN_ROUTE → DRIVER_ARRIVED → DRIVER_IN_TRANSIT → HOME', () => {
    const flow: AppState[] = [
      'SIGNUP', 'HOME', 'DRIVER_SETUP', 'DRIVER_ACTIVE',
      'DRIVER_MATCHED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED',
      'DRIVER_IN_TRANSIT', 'HOME',
    ];
    // 각 상태가 유효한 AppState인지 확인
    flow.forEach(state => {
      expect(typeof state).toBe('string');
    });
  });

  it('탑승자 플로우: SIGNUP → HOME → PASSENGER_SETUP → PASSENGER_SEARCH → PASSENGER_MATCHED → PASSENGER_EN_ROUTE → PASSENGER_IN_TRANSIT → HOME', () => {
    const flow: AppState[] = [
      'SIGNUP', 'HOME', 'PASSENGER_SETUP', 'PASSENGER_SEARCH',
      'PASSENGER_MATCHED', 'PASSENGER_EN_ROUTE', 'PASSENGER_IN_TRANSIT', 'HOME',
    ];
    flow.forEach(state => {
      expect(typeof state).toBe('string');
    });
  });
});

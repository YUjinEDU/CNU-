import { describe, it, expect, beforeEach } from 'vitest';
import { getUser, saveUser, getAllUsers, getActiveRoutes, createRoute, updateRouteStatus, seedTestData, updateLiveLocation, getLiveLocation, removeLiveLocation } from '../lib/localDb';
import { User } from '../types';

// 매 테스트 전 localStorage 초기화
beforeEach(() => {
  localStorage.clear();
});

describe('User CRUD', () => {
  const testUser: User = {
    uid: 'test-uid-1',
    name: '테스트유저',
    department: '공과대학',
    role: 'driver',
    isVerified: true,
    createdAt: new Date().toISOString(),
  };

  it('사용자를 저장하고 조회할 수 있다', () => {
    saveUser(testUser);
    const found = getUser('test-uid-1');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('테스트유저');
  });

  it('존재하지 않는 사용자는 null을 반환한다', () => {
    expect(getUser('nonexistent')).toBeNull();
  });

  it('같은 uid로 저장하면 업데이트된다', () => {
    saveUser(testUser);
    saveUser({ ...testUser, name: '수정된이름' });
    const found = getUser('test-uid-1');
    expect(found!.name).toBe('수정된이름');
    expect(getAllUsers()).toHaveLength(1); // 중복 생성 아님
  });

  it('getAllUsers로 전체 사용자를 조회한다', () => {
    saveUser(testUser);
    saveUser({ ...testUser, uid: 'test-uid-2', name: '유저2' });
    expect(getAllUsers()).toHaveLength(2);
  });
});

describe('Route CRUD', () => {
  it('경로를 생성하면 id가 자동 할당된다', () => {
    const route = createRoute({
      driverId: 'driver-1',
      driverName: '김운전',
      sourceName: '출발지',
      destName: '도착지',
      path: '[]',
      status: 'active',
    });
    expect(route.id).toBeDefined();
    expect(route.id!.length).toBeGreaterThan(5);
  });

  it('활성 경로만 필터링한다', () => {
    createRoute({ driverId: 'd1', driverName: 'A', sourceName: 's', destName: 'd', path: '[]', status: 'active' });
    createRoute({ driverId: 'd2', driverName: 'B', sourceName: 's', destName: 'd', path: '[]', status: 'active' });
    createRoute({ driverId: 'd3', driverName: 'C', sourceName: 's', destName: 'd', path: '[]', status: 'completed' });

    expect(getActiveRoutes()).toHaveLength(2);
  });

  it('경로 상태를 업데이트할 수 있다', () => {
    const route = createRoute({ driverId: 'd1', driverName: 'A', sourceName: 's', destName: 'd', path: '[]', status: 'active' });
    updateRouteStatus(route.id!, 'completed');
    expect(getActiveRoutes()).toHaveLength(0);
  });
});

describe('Live Locations', () => {
  it('위치를 저장하고 조회할 수 있다', () => {
    updateLiveLocation('user-1', { lat: 36.36, lng: 127.34 }, 90, 30);
    const loc = getLiveLocation('user-1');
    expect(loc).not.toBeNull();
    expect(loc!.lat).toBe(36.36);
    expect(loc!.lng).toBe(127.34);
  });

  it('위치를 삭제할 수 있다', () => {
    updateLiveLocation('user-1', { lat: 36.36, lng: 127.34 });
    removeLiveLocation('user-1');
    expect(getLiveLocation('user-1')).toBeNull();
  });

  it('존재하지 않는 사용자의 위치는 null이다', () => {
    expect(getLiveLocation('nonexistent')).toBeNull();
  });
});

describe('seedTestData', () => {
  it('처음 호출 시 테스트 데이터를 생성한다', () => {
    seedTestData();
    expect(getAllUsers().length).toBe(10);
    expect(getActiveRoutes().length).toBe(4);
  });

  it('이미 데이터가 있으면 중복 생성하지 않는다', () => {
    seedTestData();
    seedTestData(); // 두 번 호출
    expect(getAllUsers().length).toBe(10); // 여전히 10명
  });
});

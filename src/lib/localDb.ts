/**
 * localStorage 기반 로컬 데이터베이스.
 * Firebase 없이 동작하며, 같은 브라우저 내에서 데이터 유지.
 */
import { User, Route, Ride, Coordinate, LiveLocation } from '../types';

const KEYS = {
  users: 'cnu-users',
  routes: 'cnu-routes',
  rides: 'cnu-rides',
  locations: 'cnu-locations',
} as const;

// ── 유틸 ──

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Users ──

export function getUser(uid: string): User | null {
  const users = read<User>(KEYS.users);
  return users.find(u => u.uid === uid) || null;
}

export function saveUser(user: User): void {
  const users = read<User>(KEYS.users);
  const idx = users.findIndex(u => u.uid === user.uid);
  if (idx >= 0) {
    users[idx] = { ...user, createdAt: users[idx].createdAt };
  } else {
    users.push({ ...user, createdAt: new Date().toISOString() });
  }
  write(KEYS.users, users);
}

export function getAllUsers(): User[] {
  return read<User>(KEYS.users);
}

// ── Routes ──

export function getActiveRoutes(): Route[] {
  return read<Route>(KEYS.routes).filter(r => r.status === 'active');
}

export function getRouteById(id: string): Route | null {
  return read<Route>(KEYS.routes).find(r => r.id === id) || null;
}

export function createRoute(route: Omit<Route, 'id' | 'createdAt'>): Route {
  const routes = read<Route>(KEYS.routes);
  const newRoute: Route = {
    ...route,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  routes.push(newRoute);
  write(KEYS.routes, routes);
  return newRoute;
}

export function updateRouteStatus(id: string, status: Route['status']): void {
  const routes = read<Route>(KEYS.routes);
  const idx = routes.findIndex(r => r.id === id);
  if (idx >= 0) {
    routes[idx] = { ...routes[idx], status };
    write(KEYS.routes, routes);
  }
}

// ── Rides ──

export function createRide(ride: Omit<Ride, 'id' | 'createdAt'>): Ride {
  const rides = read<Ride>(KEYS.rides);
  const newRide: Ride = {
    ...ride,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  rides.push(newRide);
  write(KEYS.rides, rides);
  return newRide;
}

export function getRidesByRoute(routeId: string): Ride[] {
  return read<Ride>(KEYS.rides).filter(r => r.routeId === routeId);
}

export function getRidesByDriver(driverId: string): Ride[] {
  return read<Ride>(KEYS.rides).filter(r => r.driverId === driverId && r.status === 'pending');
}

export function getRideById(id: string): Ride | null {
  return read<Ride>(KEYS.rides).find(r => r.id === id) || null;
}

export function updateRideStatus(id: string, status: Ride['status']): void {
  const rides = read<Ride>(KEYS.rides);
  const idx = rides.findIndex(r => r.id === id);
  if (idx >= 0) {
    rides[idx] = { ...rides[idx], status };
    write(KEYS.rides, rides);
  }
}

export function getActiveRideForPassenger(passengerId: string): Ride | null {
  return read<Ride>(KEYS.rides).find(r =>
    r.passengerId === passengerId && !['completed', 'cancelled'].includes(r.status)
  ) || null;
}

// ── Live Locations (in-memory + localStorage) ──

export function updateLiveLocation(uid: string, position: Coordinate, heading?: number | null, speed?: number | null): void {
  const locations: Record<string, LiveLocation> = JSON.parse(localStorage.getItem(KEYS.locations) || '{}');
  locations[uid] = {
    uid,
    lat: position.lat,
    lng: position.lng,
    heading: heading ?? undefined,
    speed: speed ?? undefined,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(KEYS.locations, JSON.stringify(locations));
}

export function getLiveLocation(uid: string): LiveLocation | null {
  const locations: Record<string, LiveLocation> = JSON.parse(localStorage.getItem(KEYS.locations) || '{}');
  return locations[uid] || null;
}

export function removeLiveLocation(uid: string): void {
  const locations: Record<string, LiveLocation> = JSON.parse(localStorage.getItem(KEYS.locations) || '{}');
  delete locations[uid];
  localStorage.setItem(KEYS.locations, JSON.stringify(locations));
}

// ── 테스트 데이터 시드 ──

export function seedTestData(): void {
  // 테스트 유저가 이미 있으면 스킵 (일반 유저와 별개로 체크)
  const existing = read<User>(KEYS.users);
  if (existing.some(u => u.uid.startsWith('test-'))) return;

  const testUsers: User[] = [
    { uid: 'test-001', name: '김교수', employeeNumber: '2020-00101', department: '공과대학 컴퓨터공학과', role: 'driver', isVerified: true, vehicle: { plateNumber: '대전 12가 3457', model: '그랜저', color: '화이트', seatCapacity: 4 }, savedAddresses: [{ name: '대전 유성구 도안동 트리풀시티', lat: 36.3500, lng: 127.3300 }, { name: '충남대학교 공과대학 권역', lat: 36.3680, lng: 127.3460 }], createdAt: new Date().toISOString() },
    { uid: 'test-002', name: '박주무관', employeeNumber: '2019-00205', department: '자연과학대학 행정실', role: 'driver', isVerified: true, vehicle: { plateNumber: '대전 34나 7890', model: '투싼', color: '은색', seatCapacity: 5 }, savedAddresses: [{ name: '대전 서구 둔산동 타임월드', lat: 36.3510, lng: 127.3780 }, { name: '충남대학교 자연과학대학 권역', lat: 36.3675, lng: 127.3450 }], createdAt: new Date().toISOString() },
    { uid: 'test-003', name: '이연구원', employeeNumber: '2022-00312', department: '학생처 장학팀', role: 'passenger', isVerified: true, savedAddresses: [{ name: '대전 유성구 봉명동 유성온천역', lat: 36.3550, lng: 127.3400 }, { name: '충남대학교 대학본부 권역', lat: 36.3672, lng: 127.3430 }], createdAt: new Date().toISOString() },
    { uid: 'test-004', name: '최조교', employeeNumber: '2023-00418', department: '농업생명과학대학 식물자원학과', role: 'both', isVerified: true, vehicle: { plateNumber: '대전 56다 1234', model: '아반떼', color: '검정', seatCapacity: 4 }, savedAddresses: [{ name: '대전 유성구 궁동 충대앞', lat: 36.3620, lng: 127.3500 }, { name: '충남대학교 농생대 권역', lat: 36.3690, lng: 127.3400 }], createdAt: new Date().toISOString() },
    { uid: 'test-005', name: '정행정관', employeeNumber: '2018-00520', department: '의과대학 교학팀', role: 'passenger', isVerified: true, savedAddresses: [{ name: '대전 중구 대흥동 서대전역', lat: 36.3230, lng: 127.4040 }, { name: '충남대학교 대학본부 권역', lat: 36.3672, lng: 127.3430 }], createdAt: new Date().toISOString() },
    { uid: 'test-006', name: '한기사', employeeNumber: '2021-00615', department: '공과대학 전기공학과', role: 'driver', isVerified: true, vehicle: { plateNumber: '대전 78라 5678', model: '쏘나타', color: '파랑', seatCapacity: 4 }, savedAddresses: [{ name: '대전 유성구 반석동', lat: 36.3880, lng: 127.3200 }, { name: '충남대학교 공과대학 권역', lat: 36.3680, lng: 127.3460 }], createdAt: new Date().toISOString() },
    { uid: 'test-007', name: '윤사서', employeeNumber: '2020-00708', department: '중앙도서관 자료실', role: 'passenger', isVerified: true, savedAddresses: [{ name: '대전 서구 관저동', lat: 36.3350, lng: 127.3350 }, { name: '충남대학교 대학본부 권역', lat: 36.3672, lng: 127.3430 }], createdAt: new Date().toISOString() },
    { uid: 'test-008', name: '송교수', employeeNumber: '2017-00803', department: '자연과학대학 물리학과', role: 'both', isVerified: true, vehicle: { plateNumber: '대전 90마 9012', model: 'K5', color: '회색', seatCapacity: 4 }, savedAddresses: [{ name: '세종시 나성동', lat: 36.5000, lng: 127.0000 }, { name: '충남대학교 자연과학대학 권역', lat: 36.3675, lng: 127.3450 }], createdAt: new Date().toISOString() },
    { uid: 'test-009', name: '강직원', employeeNumber: '2024-00910', department: '대학본부 총무과', role: 'passenger', isVerified: true, savedAddresses: [{ name: '대전 동구 판암동', lat: 36.3400, lng: 127.4500 }, { name: '충남대학교 대학본부 권역', lat: 36.3672, lng: 127.3430 }], createdAt: new Date().toISOString() },
    { uid: 'test-010', name: '조교수', employeeNumber: '2019-01005', department: '농업생명과학대학 원예학과', role: 'driver', isVerified: true, vehicle: { plateNumber: '대전 23바 3456', model: 'EV6', color: '초록', seatCapacity: 4 }, savedAddresses: [{ name: '대전 유성구 신성동', lat: 36.3750, lng: 127.3550 }, { name: '충남대학교 농생대 권역', lat: 36.3690, lng: 127.3400 }], createdAt: new Date().toISOString() },
  ];

  const testRoutes: Route[] = [
    { id: 'route-001', driverId: 'test-001', driverName: '김교수', vehicle: testUsers[0].vehicle, departureTime: '08:30', availableSeats: 3, sourceName: '대전 유성구 도안동 트리풀시티', sourceCoord: { lat: 36.3500, lng: 127.3300 }, destName: '충남대학교 공과대학 권역', destCoord: { lat: 36.3680, lng: 127.3460 }, path: JSON.stringify([{lat:36.3500,lng:127.3300},{lat:36.3530,lng:127.3330},{lat:36.3550,lng:127.3360},{lat:36.3580,lng:127.3390},{lat:36.3610,lng:127.3410},{lat:36.3640,lng:127.3430},{lat:36.3660,lng:127.3445},{lat:36.3680,lng:127.3460}]), status: 'active', createdAt: new Date().toISOString() },
    { id: 'route-002', driverId: 'test-002', driverName: '박주무관', vehicle: testUsers[1].vehicle, departureTime: '09:00', availableSeats: 4, sourceName: '대전 서구 둔산동 타임월드', sourceCoord: { lat: 36.3510, lng: 127.3780 }, destName: '충남대학교 자연과학대학 권역', destCoord: { lat: 36.3675, lng: 127.3450 }, path: JSON.stringify([{lat:36.3510,lng:127.3780},{lat:36.3530,lng:127.3700},{lat:36.3560,lng:127.3620},{lat:36.3590,lng:127.3550},{lat:36.3620,lng:127.3500},{lat:36.3650,lng:127.3470},{lat:36.3675,lng:127.3450}]), status: 'active', createdAt: new Date().toISOString() },
    { id: 'route-003', driverId: 'test-006', driverName: '한기사', vehicle: testUsers[5].vehicle, departureTime: '08:00', availableSeats: 3, sourceName: '대전 유성구 반석동', sourceCoord: { lat: 36.3880, lng: 127.3200 }, destName: '충남대학교 공과대학 권역', destCoord: { lat: 36.3680, lng: 127.3460 }, path: JSON.stringify([{lat:36.3880,lng:127.3200},{lat:36.3830,lng:127.3260},{lat:36.3780,lng:127.3320},{lat:36.3740,lng:127.3370},{lat:36.3710,lng:127.3410},{lat:36.3680,lng:127.3460}]), status: 'active', createdAt: new Date().toISOString() },
    { id: 'route-004', driverId: 'test-010', driverName: '조교수', vehicle: testUsers[9].vehicle, departureTime: '08:45', availableSeats: 3, sourceName: '대전 유성구 신성동', sourceCoord: { lat: 36.3750, lng: 127.3550 }, destName: '충남대학교 농생대 권역', destCoord: { lat: 36.3690, lng: 127.3400 }, path: JSON.stringify([{lat:36.3750,lng:127.3550},{lat:36.3740,lng:127.3510},{lat:36.3720,lng:127.3470},{lat:36.3710,lng:127.3440},{lat:36.3700,lng:127.3420},{lat:36.3690,lng:127.3400}]), status: 'active', createdAt: new Date().toISOString() },
  ];

  write(KEYS.users, testUsers);
  write(KEYS.routes, testRoutes);
  console.log('🌱 테스트 데이터 시드 완료: 사용자 10명, 경로 4개');
}

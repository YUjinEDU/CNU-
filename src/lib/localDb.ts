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

import testData from '../data/testUsers.json';

export function seedTestData(): void {
  const existing = read<User>(KEYS.users);
  if (existing.some(u => u.uid.startsWith('test-'))) return;

  const now = new Date().toISOString();

  const testUsers: User[] = testData.users.map(u => ({
    ...u,
    role: u.role as User['role'],
    createdAt: now,
  }));

  const testRoutes: Route[] = testData.routes.map(r => {
    const driver = testUsers.find(u => u.uid === r.driverId);
    return {
      ...r,
      vehicle: driver?.vehicle,
      status: r.status as Route['status'],
      path: JSON.stringify(r.path.map(([lat, lng]) => ({ lat, lng }))),
      createdAt: now,
    };
  });

  // 기존 유저 유지하면서 테스트 유저 추가
  write(KEYS.users, [...existing, ...testUsers]);

  const existingRoutes = read<Route>(KEYS.routes);
  write(KEYS.routes, [...existingRoutes, ...testRoutes]);
}

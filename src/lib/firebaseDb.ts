import { db } from '../firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  query, where, onSnapshot,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { User, Route, Ride, Coordinate, LiveLocation } from '../types';

// ── Users ──

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}

export async function saveUser(user: User): Promise<void> {
  await setDoc(doc(db, 'users', user.uid), user, { merge: true });
}

export async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => d.data() as User);
}

// ── Routes ──

export async function getActiveRoutes(): Promise<Route[]> {
  const q = query(collection(db, 'routes'), where('status', '==', 'active'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as Route));
}

export async function getRouteById(id: string): Promise<Route | null> {
  const snap = await getDoc(doc(db, 'routes', id));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as Route) : null;
}

export async function createRoute(route: Omit<Route, 'id' | 'createdAt'>): Promise<Route> {
  const docRef = await addDoc(collection(db, 'routes'), {
    ...route,
    createdAt: new Date().toISOString(),
  });
  return { ...route, id: docRef.id, createdAt: new Date().toISOString() };
}

export async function updateRouteStatus(id: string, status: Route['status']): Promise<void> {
  await updateDoc(doc(db, 'routes', id), { status });
}

export function subscribeToActiveRoutes(callback: (routes: Route[]) => void): Unsubscribe {
  const q = query(collection(db, 'routes'), where('status', '==', 'active'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as Route)));
  });
}

// ── Rides ──

export async function createRide(ride: Omit<Ride, 'id' | 'createdAt'>): Promise<Ride> {
  const docRef = await addDoc(collection(db, 'rides'), {
    ...ride,
    createdAt: new Date().toISOString(),
  });
  return { ...ride, id: docRef.id, createdAt: new Date().toISOString() };
}

export async function getRideById(id: string): Promise<Ride | null> {
  const snap = await getDoc(doc(db, 'rides', id));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as Ride) : null;
}

export async function updateRideStatus(id: string, status: Ride['status']): Promise<void> {
  await updateDoc(doc(db, 'rides', id), { status });
}

export function subscribeToRidesByDriver(
  driverId: string,
  callback: (rides: Ride[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'rides'),
    where('driverId', '==', driverId),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as Ride)));
  });
}

export function subscribeToRide(
  rideId: string,
  callback: (ride: Ride | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'rides', rideId), snap => {
    callback(snap.exists() ? ({ ...snap.data(), id: snap.id } as Ride) : null);
  });
}

// ── Live Locations (localStorage — GPS 기능 보류) ──

export function updateLiveLocation(
  uid: string,
  position: Coordinate,
  heading?: number | null,
  speed?: number | null
): void {
  const locations: Record<string, LiveLocation> = JSON.parse(
    localStorage.getItem('cnu-locations') || '{}'
  );
  locations[uid] = {
    uid,
    lat: position.lat,
    lng: position.lng,
    heading: heading ?? undefined,
    speed: speed ?? undefined,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem('cnu-locations', JSON.stringify(locations));
}

export function getLiveLocation(uid: string): LiveLocation | null {
  const locations: Record<string, LiveLocation> = JSON.parse(
    localStorage.getItem('cnu-locations') || '{}'
  );
  return locations[uid] || null;
}

export function removeLiveLocation(uid: string): void {
  const locations: Record<string, LiveLocation> = JSON.parse(
    localStorage.getItem('cnu-locations') || '{}'
  );
  delete locations[uid];
  localStorage.setItem('cnu-locations', JSON.stringify(locations));
}

import { db } from '../firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  query, where, onSnapshot, runTransaction, writeBatch, increment,
  orderBy, limit,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import type { User, Route, Ride, Coordinate, LiveLocation } from '../types';

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

export async function updateRideField(id: string, data: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(db, 'rides', id), data);
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

// ── Matching v2 ──

export async function confirmRide(rideId: string, role: 'driver' | 'passenger'): Promise<'confirming' | 'confirmed'> {
  return await runTransaction(db, async (transaction) => {
    const rideRef = doc(db, 'rides', rideId);
    const rideSnap = await transaction.get(rideRef);
    if (!rideSnap.exists()) throw new Error('Ride not found');
    const ride = rideSnap.data();

    const updateData: Record<string, unknown> = {};
    if (role === 'driver') {
      updateData.driverConfirmed = true;
    } else {
      updateData.passengerConfirmed = true;
    }

    const otherConfirmed = role === 'driver' ? ride.passengerConfirmed : ride.driverConfirmed;
    const newStatus = otherConfirmed ? 'confirmed' : 'confirming';
    updateData.status = newStatus;
    transaction.update(rideRef, updateData);
    return newStatus as 'confirming' | 'confirmed';
  });
}

export async function completeRide(rideId: string, driverId: string, passengerId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'rides', rideId), {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
  batch.update(doc(db, 'users', driverId), {
    'stats.totalRides': increment(1),
    'stats.driveCount': increment(1),
  });
  batch.update(doc(db, 'users', passengerId), {
    'stats.totalRides': increment(1),
    'stats.rideCount': increment(1),
  });
  await batch.commit();
}

export async function cancelRide(
  rideId: string,
  cancelledBy: 'driver' | 'passenger',
  cancellerUid: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'rides', rideId), {
    status: 'cancelled',
    cancelledBy,
  });
  batch.update(doc(db, 'users', cancellerUid), {
    'stats.cancelCount': increment(1),
  });
  await batch.commit();
}

export async function rejectRide(rideId: string): Promise<void> {
  await updateDoc(doc(db, 'rides', rideId), { status: 'rejected' });
}

export async function acceptRide(rideId: string, routeId: string): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const routeRef = doc(db, 'routes', routeId);
    const routeSnap = await transaction.get(routeRef);
    if (!routeSnap.exists()) throw new Error('Route not found');
    const route = routeSnap.data();
    if ((route.availableSeats ?? 0) <= 0) throw new Error('좌석이 없습니다');

    transaction.update(doc(db, 'rides', rideId), { status: 'accepted' });
    transaction.update(routeRef, { availableSeats: (route.availableSeats ?? 1) - 1 });
  });
}

export async function getRideHistory(uid: string): Promise<Ride[]> {
  const asDriver = query(
    collection(db, 'rides'),
    where('driverId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const asPassenger = query(
    collection(db, 'rides'),
    where('passengerId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const [driverSnap, passengerSnap] = await Promise.all([
    getDocs(asDriver),
    getDocs(asPassenger),
  ]);
  const rides = [
    ...driverSnap.docs.map(d => ({ ...d.data(), id: d.id } as Ride)),
    ...passengerSnap.docs.map(d => ({ ...d.data(), id: d.id } as Ride)),
  ];
  const unique = [...new Map(rides.map(r => [r.id, r])).values()];
  return unique.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export async function hasActiveRide(passengerId: string): Promise<boolean> {
  const activeStatuses = ['pending', 'accepted', 'confirming', 'confirmed'];
  for (const status of activeStatuses) {
    const q = query(
      collection(db, 'rides'),
      where('passengerId', '==', passengerId),
      where('status', '==', status)
    );
    const snap = await getDocs(q);
    if (!snap.empty) return true;
  }
  return false;
}

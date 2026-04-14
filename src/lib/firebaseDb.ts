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

  // route 취소 시 연관 pending/active ride도 일괄 취소
  if (status === 'cancelled') {
    const activeStatuses = ['pending', 'accepted', 'confirming', 'confirmed'];
    for (const s of activeStatuses) {
      const q = query(collection(db, 'rides'), where('routeId', '==', id), where('status', '==', s));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await updateDoc(doc(db, 'rides', d.id), { status: 'cancelled', cancelledBy: 'driver' });
      }
    }
  }
}

export function subscribeToActiveRoutes(callback: (routes: Route[]) => void): Unsubscribe {
  const q = query(collection(db, 'routes'), where('status', '==', 'active'));
  return onSnapshot(q, snap => {
    const now = Date.now();
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24시간
    const routes = snap.docs
      .map(d => ({ ...d.data(), id: d.id } as Route))
      .filter(r => {
        const age = now - new Date(r.createdAt).getTime();
        if (age > MAX_AGE) {
          // 24시간 지난 route 자동 취소 (비동기, fire-and-forget)
          updateRouteStatus(r.id!, 'cancelled');
          return false;
        }
        return true;
      });
    callback(routes);
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
  // ride 정보를 먼저 읽어서 좌석 복원 여부 판단
  const rideSnap = await getDoc(doc(db, 'rides', rideId));
  const rideData = rideSnap.exists() ? rideSnap.data() : null;

  const batch = writeBatch(db);
  batch.update(doc(db, 'rides', rideId), {
    status: 'cancelled',
    cancelledBy,
  });
  // 합의 단계(confirming/confirmed) 이후 취소만 카운팅
  if (rideData && ['confirming', 'confirmed'].includes(rideData.status)) {
    batch.update(doc(db, 'users', cancellerUid), {
      'stats.cancelCount': increment(1),
    });
  }
  // accepted 이후 취소면 좌석 복원
  if (rideData && ['accepted', 'confirming', 'confirmed'].includes(rideData.status) && rideData.routeId) {
    batch.update(doc(db, 'routes', rideData.routeId), {
      availableSeats: increment(1),
      status: 'active', // matched였으면 다시 active로
    });
  }
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

// ── 활성 상태 복원 ──

export async function getMyActiveRoute(uid: string): Promise<Route | null> {
  const q = query(
    collection(db, 'routes'),
    where('driverId', '==', uid),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...d.data(), id: d.id } as Route;
}

export async function getMyActiveRide(uid: string): Promise<Ride | null> {
  const activeStatuses = ['pending', 'accepted', 'confirming', 'confirmed'];
  // 탑승자로서
  for (const status of activeStatuses) {
    const q = query(
      collection(db, 'rides'),
      where('passengerId', '==', uid),
      where('status', '==', status)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { ...d.data(), id: d.id } as Ride;
    }
  }
  // 운전자로서
  for (const status of activeStatuses) {
    if (status === 'pending') continue; // 운전자의 pending은 아직 수락 전
    const q = query(
      collection(db, 'rides'),
      where('driverId', '==', uid),
      where('status', '==', status)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { ...d.data(), id: d.id } as Ride;
    }
  }
  return null;
}

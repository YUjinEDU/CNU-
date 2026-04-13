import { db } from '../firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Coordinate, LiveLocation } from '../types';

const LOCATIONS_COLLECTION = 'liveLocations';

/**
 * 현재 사용자의 실시간 위치를 Firestore에 업데이트.
 * 운전자가 이동 중일 때 주기적으로 호출.
 */
export async function updateLocation(
  uid: string,
  position: Coordinate,
  heading?: number | null,
  speed?: number | null
): Promise<void> {
  await setDoc(doc(db, LOCATIONS_COLLECTION, uid), {
    uid,
    lat: position.lat,
    lng: position.lng,
    heading: heading ?? null,
    speed: speed ?? null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 특정 사용자의 실시간 위치를 구독.
 * 탑승자가 운전자 위치를 실시간으로 확인할 때 사용.
 * @returns unsubscribe 함수
 */
export function subscribeToLocation(
  uid: string,
  onUpdate: (location: LiveLocation | null) => void
): () => void {
  return onSnapshot(doc(db, LOCATIONS_COLLECTION, uid), (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as LiveLocation);
    } else {
      onUpdate(null);
    }
  });
}

/**
 * 위치 공유 종료 시 Firestore에서 위치 데이터 삭제.
 */
export async function removeLocation(uid: string): Promise<void> {
  await deleteDoc(doc(db, LOCATIONS_COLLECTION, uid));
}

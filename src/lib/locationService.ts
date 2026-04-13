import { Coordinate, LiveLocation } from '../types';
import { updateLiveLocation, getLiveLocation, removeLiveLocation } from './localDb';

/**
 * 현재 사용자의 실시간 위치를 localStorage에 업데이트.
 */
export function updateLocation(
  uid: string,
  position: Coordinate,
  heading?: number | null,
  speed?: number | null
): void {
  updateLiveLocation(uid, position, heading, speed);
}

/**
 * 특정 사용자의 실시간 위치를 가져오기.
 * (localStorage 기반이므로 같은 브라우저에서만 동작)
 */
export function subscribeToLocation(
  uid: string,
  onUpdate: (location: LiveLocation | null) => void
): () => void {
  // 폴링으로 위치 업데이트 확인 (1초 간격)
  const interval = setInterval(() => {
    onUpdate(getLiveLocation(uid));
  }, 1000);

  return () => clearInterval(interval);
}

/**
 * 위치 공유 종료 시 localStorage에서 위치 데이터 삭제.
 */
export function removeLocation(uid: string): void {
  removeLiveLocation(uid);
}

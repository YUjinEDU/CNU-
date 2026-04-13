import { Coordinate } from '../types';
import { getDistance } from './geoUtils';

/** 도착 판정 반경 (km) */
const ARRIVAL_THRESHOLD_KM = 0.1; // 100m

/**
 * 현재 위치가 목표 지점에 도착했는지 판정.
 * @param current 현재 GPS 좌표
 * @param target 목표 지점 좌표 (픽업 포인트 또는 도착지)
 * @param thresholdKm 도착 판정 반경 (기본 100m)
 * @returns true면 도착으로 판정
 */
export function hasArrived(
  current: Coordinate,
  target: Coordinate,
  thresholdKm: number = ARRIVAL_THRESHOLD_KM
): boolean {
  return getDistance(current, target) <= thresholdKm;
}

/**
 * 현재 위치에서 목표 지점까지의 남은 거리 (미터).
 */
export function remainingDistance(current: Coordinate, target: Coordinate): number {
  return Math.round(getDistance(current, target) * 1000);
}

/**
 * 남은 거리를 사람이 읽기 좋은 형태로 변환.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 예상 도착 시간 계산 (분).
 * @param distanceMeters 남은 거리 (미터)
 * @param speedKmh 평균 속도 (km/h, 기본 시내 주행 30km/h)
 */
export function estimateArrivalMinutes(
  distanceMeters: number,
  speedKmh: number = 30
): number {
  const hours = (distanceMeters / 1000) / speedKmh;
  return Math.max(1, Math.round(hours * 60));
}

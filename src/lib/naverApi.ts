import { Coordinate } from '../types';

const API_BASE = '/api/naver';

/**
 * 두 좌표 사이의 직선 경로를 보간하여 생성 (API fallback용).
 */
function interpolatePath(start: Coordinate, goal: Coordinate, steps = 8): Coordinate[] {
  const path: Coordinate[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    path.push({
      lat: start.lat + (goal.lat - start.lat) * t,
      lng: start.lng + (goal.lng - start.lng) * t,
    });
  }
  return path;
}

/**
 * Haversine 거리 계산 (km)
 */
function haversineKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * 경로 계산. 네이버 Directions 5 API 호출, 실패 시 직선 보간 fallback.
 */
export async function getDirections(
  start: Coordinate,
  goal: Coordinate
): Promise<{ path: Coordinate[]; duration: number; distance: number }> {
  try {
    const params = new URLSearchParams({
      start: `${start.lng},${start.lat}`,
      goal: `${goal.lng},${goal.lat}`,
      option: 'trafast',
    });

    const response = await fetch(`${API_BASE}/directions?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const route = data.route?.trafast?.[0];
    if (!route) throw new Error('No route found');

    return {
      path: route.path.map(([lng, lat]: [number, number]) => ({ lat, lng })),
      duration: route.summary.duration,
      distance: route.summary.distance,
    };
  } catch (err) {
    console.warn('Directions API fallback (직선 보간):', err);
    const distKm = haversineKm(start, goal);
    return {
      path: interpolatePath(start, goal),
      duration: Math.round(distKm / 30 * 60 * 1000), // 30km/h 가정
      distance: Math.round(distKm * 1000),
    };
  }
}

/**
 * 주소→좌표 변환. 실패 시 null 반환 (크래시 없음).
 */
export async function geocode(
  query: string
): Promise<{ address: string; lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({ query });
    const response = await fetch(`${API_BASE}/geocode?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const item = data.addresses?.[0];
    if (!item) return null;

    return {
      address: item.roadAddress || item.jibunAddress || query,
      lat: parseFloat(item.y),
      lng: parseFloat(item.x),
    };
  } catch (err) {
    console.warn('Geocoding API 실패:', err);
    return null;
  }
}

/**
 * 좌표→주소 변환. 실패 시 좌표 문자열 반환 (크래시 없음).
 */
export async function reverseGeocode(
  coord: Coordinate
): Promise<string> {
  try {
    const params = new URLSearchParams({
      coords: `${coord.lng},${coord.lat}`,
      output: 'json',
      orders: 'roadaddr,addr',
    });

    const response = await fetch(`${API_BASE}/reverse-geocode?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const result = data.results?.[0];
    if (!result) return `${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`;

    const { region, land } = result;
    const parts = [
      region?.area1?.name,
      region?.area2?.name,
      region?.area3?.name,
      land?.name,
      land?.number1,
    ].filter(Boolean);

    return parts.join(' ') || `${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`;
  } catch (err) {
    console.warn('Reverse Geocoding fallback:', err);
    return `${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`;
  }
}

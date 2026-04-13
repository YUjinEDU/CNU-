import { Coordinate } from '../types';

const API_BASE = '/api/naver';

/**
 * Calculate driving route between two coordinates using Naver Directions 5 API.
 * Calls go through Vite dev proxy → Naver API (keeps Client Secret server-side).
 */
export async function getDirections(
  start: Coordinate,
  goal: Coordinate
): Promise<{ path: Coordinate[]; duration: number; distance: number }> {
  const params = new URLSearchParams({
    start: `${start.lng},${start.lat}`,
    goal: `${goal.lng},${goal.lat}`,
    option: 'trafast',
  });

  const response = await fetch(`${API_BASE}/directions?${params}`);
  if (!response.ok) {
    throw new Error(`Directions API error: ${response.status}`);
  }

  const data = await response.json();
  const route = data.route?.trafast?.[0];

  if (!route) {
    throw new Error('No route found');
  }

  const path: Coordinate[] = route.path.map(([lng, lat]: [number, number]) => ({
    lat,
    lng,
  }));

  return {
    path,
    duration: route.summary.duration,   // milliseconds
    distance: route.summary.distance,   // meters
  };
}

/**
 * Geocode an address string to coordinates using Naver Geocoding API.
 */
export async function geocode(
  query: string
): Promise<{ address: string; lat: number; lng: number } | null> {
  const params = new URLSearchParams({ query });
  const response = await fetch(`${API_BASE}/geocode?${params}`);

  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`);
  }

  const data = await response.json();
  const item = data.addresses?.[0];

  if (!item) return null;

  return {
    address: item.roadAddress || item.jibunAddress || query,
    lat: parseFloat(item.y),
    lng: parseFloat(item.x),
  };
}

/**
 * Reverse geocode coordinates to an address string.
 */
export async function reverseGeocode(
  coord: Coordinate
): Promise<string | null> {
  const params = new URLSearchParams({
    coords: `${coord.lng},${coord.lat}`,
    output: 'json',
    orders: 'roadaddr,addr',
  });

  const response = await fetch(`${API_BASE}/reverse-geocode?${params}`);
  if (!response.ok) return null;

  const data = await response.json();
  const result = data.results?.[0];
  if (!result) return null;

  const { region, land } = result;
  const parts = [
    region?.area1?.name,
    region?.area2?.name,
    region?.area3?.name,
    land?.name,
    land?.number1,
  ].filter(Boolean);

  return parts.join(' ');
}

import { Coordinate } from './types';

/**
 * Haversine formula to calculate distance between two points in km
 */
export function getDistance(p1: Coordinate, p2: Coordinate): number {
  const R = 6371; // Earth radius in km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate the shortest distance from a point to a line segment
 */
export function distToSegment(p: Coordinate, v: Coordinate, w: Coordinate): number {
  const l2 = Math.pow(getDistance(v, w), 2);
  if (l2 === 0) return getDistance(p, v);
  let t = ((p.lat - v.lat) * (w.lat - v.lat) + (p.lng - v.lng) * (w.lng - v.lng)) / l2;
  t = Math.max(0, Math.min(1, t));
  return getDistance(p, {
    lat: v.lat + t * (w.lat - v.lat),
    lng: v.lng + t * (w.lng - v.lng)
  });
}

/**
 * Check if a route (polyline) passes through a circle (center + radius)
 */
export function isRouteIntersectingCircle(path: Coordinate[], center: Coordinate, radiusKm: number): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    if (distToSegment(center, path[i], path[i + 1]) <= radiusKm) {
      return true;
    }
  }
  return false;
}

/**
 * Find the closest point on a route to a given point
 */
export function findClosestPointOnRoute(path: Coordinate[], point: Coordinate): Coordinate {
  let minDoc = Infinity;
  let closest = path[0];
  
  for (let i = 0; i < path.length - 1; i++) {
    const v = path[i];
    const w = path[i+1];
    const l2 = Math.pow(getDistance(v, w), 2);
    let t = ((point.lat - v.lat) * (w.lat - v.lat) + (point.lng - v.lng) * (w.lng - v.lng)) / l2;
    t = Math.max(0, Math.min(1, t));
    const pOnSeg = {
      lat: v.lat + t * (w.lat - v.lat),
      lng: v.lng + t * (w.lng - v.lng)
    };
    const d = getDistance(point, pOnSeg);
    if (d < minDoc) {
      minDoc = d;
      closest = pOnSeg;
    }
  }
  return closest;
}

import React, { useRef, useEffect, useCallback } from 'react';
import { Coordinate } from '../types';
import { useNaverMaps } from '../hooks/useNaverMaps';
import { getDirections } from '../lib/naverApi';

const CNU_CENTER = { lat: 36.3622, lng: 127.3444 };

interface MapComponentProps {
  center?: Coordinate;
  markers?: Coordinate[];
  polylines?: Coordinate[][];
  circles?: { center: Coordinate; radius: number; color?: string }[];
  zoom?: number;
  originCoord?: Coordinate;
  destCoord?: Coordinate;
  onRouteCalculated?: (path: Coordinate[]) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center = CNU_CENTER,
  markers = [],
  polylines = [],
  circles = [],
  zoom = 14,
  originCoord,
  destCoord,
  onRouteCalculated,
}) => {
  const { isLoaded, error } = useNaverMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);
  const overlaysRef = useRef<Array<naver.maps.Marker | naver.maps.Polyline | naver.maps.Circle>>([]);

  // 매번 새 DOM이면 map을 새로 생성
  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    mapRef.current = null;

    try {
      mapRef.current = new naver.maps.Map(containerRef.current, {
        center: new naver.maps.LatLng(center.lat, center.lng),
        zoom,
        zoomControl: true,
        zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT },
        mapTypeControl: false,
        scaleControl: false,
        logoControl: true,
        mapDataControl: false,
      });
    } catch (err) {
      console.warn('Map init failed:', err);
    }

    return () => {
      try {
        overlaysRef.current.forEach(o => o.setMap(null));
      } catch { /* ignore */ }
      overlaysRef.current = [];
      mapRef.current = null;
    };
  }, [isLoaded]);

  // Update center/zoom
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setCenter(new naver.maps.LatLng(center.lat, center.lng));
    mapRef.current.setZoom(zoom);
  }, [center.lat, center.lng, zoom]);

  // Clear all overlays
  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach(o => o.setMap(null));
    overlaysRef.current = [];
  }, []);

  // Draw markers, polylines, circles
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    clearOverlays();
    const map = mapRef.current;
    try {

    markers.forEach(coord => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(coord.lat, coord.lng),
        map,
      });
      overlaysRef.current.push(marker);
    });

    polylines.forEach(path => {
      if (path.length < 2) return;
      const polyline = new naver.maps.Polyline({
        map,
        path: path.map(p => new naver.maps.LatLng(p.lat, p.lng)),
        strokeColor: '#003E7A',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
      });
      overlaysRef.current.push(polyline);
    });

    circles.forEach(c => {
      const circle = new naver.maps.Circle({
        map,
        center: new naver.maps.LatLng(c.center.lat, c.center.lng),
        radius: c.radius,
        fillColor: c.color || '#3b82f6',
        fillOpacity: 0.15,
        strokeColor: c.color || '#3b82f6',
        strokeOpacity: 0.6,
        strokeWeight: 2,
      });
      overlaysRef.current.push(circle);
    });
    } catch (err) {
      console.warn('Map overlay error:', err);
    }
  }, [isLoaded, markers, polylines, circles, clearOverlays]);

  // Fetch route when origin/dest coords change
  useEffect(() => {
    if (!originCoord || !destCoord) return;
    getDirections(originCoord, destCoord)
      .then(({ path }) => onRouteCalculated?.(path))
      .catch((err) => console.warn('Route calculation failed:', err));
  }, [originCoord?.lat, originCoord?.lng, destCoord?.lat, destCoord?.lng]);

  if (error || !import.meta.env.VITE_NAVER_CLIENT_ID) {
    return (
      <div className="w-full h-full bg-slate-200 flex items-center justify-center flex-col p-4 text-center">
        <p className="text-slate-500 font-medium mb-2">네이버 지도 API 키가 필요합니다.</p>
        <p className="text-xs text-slate-400">.env 파일에 VITE_NAVER_CLIENT_ID를 설정해주세요.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
};

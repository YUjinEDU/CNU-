import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Coordinate } from '../types';
import { useNaverMaps } from '../hooks/useNaverMaps';
import { getDirections } from '../lib/naverApi';
import { markNaverMapDiagnostic } from '../lib/naverMapDiagnostics';
import { isNaverMapsRuntimeReady } from '../lib/naverMapsRuntime';

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
  const overlaysRef = useRef<Array<{ setMap: (map: null) => void }>>([]);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map — 성공해야만 mapReady=true
  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;
    if (!isNaverMapsRuntimeReady(typeof naver !== 'undefined' ? naver : undefined)) {
      markNaverMapDiagnostic('map-init-failed', '네이버 지도 런타임 불완전 초기화');
      setMapReady(false);
      return;
    }
    mapRef.current = null;
    setMapReady(false);
    let idleListener: object | null = null;
    let tilesLoadedListener: object | null = null;

    try {
      const map = new naver.maps.Map(containerRef.current, {
        center: new naver.maps.LatLng(center.lat, center.lng),
        zoom,
        zoomControl: true,
        zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT },
        mapTypeControl: false,
        scaleControl: false,
        logoControl: true,
        mapDataControl: false,
      });
      mapRef.current = map;
      markNaverMapDiagnostic('map-created', { center, zoom });
      idleListener = naver.maps.Event.addListener(map, 'idle', () => {
        markNaverMapDiagnostic('idle');
      });
      tilesLoadedListener = naver.maps.Event.addListener(map, 'tilesloaded', () => {
        markNaverMapDiagnostic('tilesloaded');
      });
      // 100ms 후에 Map이 정상 동작하면 ready
      setTimeout(() => {
        if (mapRef.current) setMapReady(true);
      }, 100);
    } catch (err) {
      markNaverMapDiagnostic('map-init-failed', err instanceof Error ? err.message : 'unknown');
      setMapReady(false);
    }

    return () => {
      if (idleListener) naver.maps.Event.removeListener(idleListener);
      if (tilesLoadedListener) naver.maps.Event.removeListener(tilesLoadedListener);
      overlaysRef.current.forEach(o => { try { o.setMap(null); } catch {} });
      overlaysRef.current = [];
      mapRef.current = null;
      setMapReady(false);
    };
  }, [isLoaded]);

  // Update center/zoom
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    try {
      mapRef.current.setCenter(new naver.maps.LatLng(center.lat, center.lng));
      mapRef.current.setZoom(zoom);
    } catch {}
  }, [center.lat, center.lng, zoom, mapReady]);

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach(o => { try { o.setMap(null); } catch {} });
    overlaysRef.current = [];
  }, []);

  // Draw overlays — mapReady가 아니면 절대 실행 안 함
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (!isNaverMapsRuntimeReady(typeof naver !== 'undefined' ? naver : undefined)) return;
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
      console.warn('Map overlay error (ignored):', err);
      // 오버레이 실패해도 앱은 크래시하지 않음
    }
  }, [mapReady, markers, polylines, circles, clearOverlays]);

  // Route calculation
  useEffect(() => {
    if (!originCoord || !destCoord) return;
    getDirections(originCoord, destCoord)
      .then(({ path }) => onRouteCalculated?.(path))
      .catch((err) => console.warn('Route calculation failed:', err));
  }, [originCoord?.lat, originCoord?.lng, destCoord?.lat, destCoord?.lng]);

  if (error || !import.meta.env.VITE_NAVER_CLIENT_ID) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center flex-col p-4 text-center rounded-xl border-2 border-dashed border-slate-300">
        <div className="text-3xl mb-2">🗺️</div>
        <p className="text-slate-500 font-medium text-sm mb-1">지도 로딩 대기 중</p>
        <p className="text-[10px] text-slate-400 max-w-[200px]">
          {error || 'NCP 콘솔에서 Web 서비스 URL 반영까지 최대 10분 소요'}
        </p>
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

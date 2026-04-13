import { useState, useEffect, useCallback, useRef } from 'react';
import { Coordinate } from '../types';

interface GeolocationState {
  position: Coordinate | null;
  heading: number | null;
  speed: number | null;
  error: string | null;
  isTracking: boolean;
}

/**
 * GPS 위치 추적 훅.
 * startTracking()을 호출하면 watchPosition으로 실시간 추적 시작.
 * stopTracking()으로 중지.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    heading: null,
    speed: null,
    error: null,
    isTracking: false,
  });
  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'GPS를 지원하지 않는 브라우저입니다.' }));
      return;
    }

    setState(prev => ({ ...prev, isTracking: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState(prev => ({
          ...prev,
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          error: null,
        }));
      },
      (err) => {
        setState(prev => ({
          ...prev,
          error: err.code === 1
            ? '위치 권한이 거부되었습니다. 설정에서 허용해주세요.'
            : '위치를 가져올 수 없습니다.',
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { ...state, startTracking, stopTracking };
}

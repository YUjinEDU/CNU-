import { useEffect, useSyncExternalStore } from 'react';
import {
  getNaverMapsLoaderSnapshot,
  loadNaverMapsSdk,
  subscribeToNaverMapsLoader,
} from '../lib/naverMapsLoader';
import { markNaverMapDiagnostic } from '../lib/naverMapDiagnostics';

export function useNaverMaps() {
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
  const snapshot = useSyncExternalStore(
    subscribeToNaverMapsLoader,
    getNaverMapsLoaderSnapshot,
    getNaverMapsLoaderSnapshot,
  );

  useEffect(() => {
    if (!clientId) {
      return;
    }
    loadNaverMapsSdk(clientId)
      .then(() => {
        markNaverMapDiagnostic('sdk-loaded');
      })
      .catch((err) => {
        markNaverMapDiagnostic('sdk-load-failed', err instanceof Error ? err.message : 'unknown');
      });
  }, [clientId]);

  return {
    isLoaded: snapshot.result === 'ok',
    error: clientId ? snapshot.error : 'VITE_NAVER_CLIENT_ID 미설정',
  };
}

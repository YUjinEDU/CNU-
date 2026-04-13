import { useState, useEffect } from 'react';

let loadPromise: Promise<void> | null = null;

function loadNaverMapsScript(clientId: string): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof naver !== 'undefined' && naver.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Naver Maps SDK'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useNaverMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setError('VITE_NAVER_CLIENT_ID가 설정되지 않았습니다.');
      return;
    }

    loadNaverMapsScript(clientId)
      .then(() => setIsLoaded(true))
      .catch((err) => setError(err.message));
  }, [clientId]);

  return { isLoaded, error };
}

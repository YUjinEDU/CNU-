import { useState, useEffect } from 'react';

let loadPromise: Promise<boolean> | null = null;

function loadNaverMapsScript(clientId: string): Promise<boolean> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    if (typeof naver !== 'undefined' && naver.maps) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => {
      // SDK 로드 후 인증 실패 여부 체크 (500ms 대기)
      setTimeout(() => {
        const ok = typeof naver !== 'undefined' && naver.maps && naver.maps.Map;
        resolve(!!ok);
      }, 500);
    };
    script.onerror = () => {
      loadPromise = null;
      resolve(false);
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
      .then((ok) => {
        if (ok) {
          setIsLoaded(true);
        } else {
          setError('네이버 지도 인증 실패 — NCP 콘솔에서 Web 서비스 URL을 확인하세요.');
        }
      });
  }, [clientId]);

  return { isLoaded, error };
}

import { useState, useEffect } from 'react';

let loadResult = 'pending' as string; // 'pending' | 'ok' | 'fail'

// SDK 크래시 글로벌 차단
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.filename?.includes('maps.js') || e.message?.includes('capitalize') || e.message?.includes('forEach')) {
      e.preventDefault();
      loadResult = 'fail';
    }
  });
}

export function useNaverMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;

  useEffect(() => {
    if (!clientId) { setError('VITE_NAVER_CLIENT_ID 미설정'); return; }
    if (loadResult === 'ok') { setIsLoaded(true); return; }
    if (loadResult === 'fail') { setError('네이버 지도 인증 실패'); return; }

    // SDK가 이미 로드되어 있고 인증도 성공한 경우
    if (typeof naver !== 'undefined' && naver.maps?.Map && loadResult !== 'fail') {
      loadResult = 'ok';
      setIsLoaded(true);
      return;
    }

    // SDK 스크립트 로드
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => {
      // 3초 대기 — 인증 실패 에러가 글로벌 핸들러에 잡히는지 확인
      setTimeout(() => {
        if (loadResult === 'fail') {
          setError('네이버 Dynamic Map 인증 실패 — NCP URL 반영 대기 중');
        } else {
          loadResult = 'ok';
          setIsLoaded(true);
        }
      }, 3000);
    };
    script.onerror = () => {
      loadResult = 'fail';
      setError('네이버 지도 SDK 로드 실패');
    };
    document.head.appendChild(script);
  }, [clientId]);

  return { isLoaded, error };
}

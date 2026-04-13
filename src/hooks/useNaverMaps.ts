import { useState, useEffect } from 'react';

let loadResult: 'pending' | 'ok' | 'fail' = 'pending';
let authFailed = false;

// SDK의 인증 실패 에러를 글로벌 에러 핸들러로 캐치
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.filename?.includes('maps.js') || e.message?.includes('capitalize') || e.message?.includes('forEach')) {
      e.preventDefault(); // 콘솔 에러 억제
      authFailed = true;
    }
  });
}

function loadScript(clientId: string): Promise<boolean> {
  if (loadResult !== 'pending') return Promise.resolve(loadResult === 'ok');

  return new Promise((resolve) => {
    if (typeof naver !== 'undefined' && naver.maps?.Map && !authFailed) {
      loadResult = 'ok';
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => {
      // 2초 대기해서 인증 실패 에러가 발생하는지 확인
      setTimeout(() => {
        if (authFailed) {
          loadResult = 'fail';
          resolve(false);
        } else {
          loadResult = 'ok';
          resolve(true);
        }
      }, 2000);
    };
    script.onerror = () => {
      loadResult = 'fail';
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

export function useNaverMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setError('VITE_NAVER_CLIENT_ID 미설정');
      return;
    }
    if (loadResult === 'ok') { setIsLoaded(true); return; }
    if (loadResult === 'fail') { setError('네이버 지도 인증 실패'); return; }

    loadScript(clientId).then((ok) => {
      if (ok) setIsLoaded(true);
      else setError('네이버 지도 인증 실패 — NCP 콘솔에서 Web URL 확인 (반영 최대 10분)');
    });
  }, [clientId]);

  return { isLoaded, error };
}

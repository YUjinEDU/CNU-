import { useState, useEffect } from 'react';

let loadResult: 'pending' | 'ok' | 'auth-fail' = 'pending';

function loadNaverMapsScript(clientId: string): Promise<'ok' | 'auth-fail'> {
  if (loadResult !== 'pending') return Promise.resolve(loadResult);

  return new Promise((resolve) => {
    // SDK 인증 실패 메시지를 콘솔에서 가로채기
    const origWarn = console.warn;
    const origError = console.error;
    let authFailed = false;

    const checkAuth = (...args: unknown[]) => {
      const msg = args.join(' ');
      if (msg.includes('인증이 실패') || msg.includes('Authentication Failed')) {
        authFailed = true;
      }
    };

    // 네이버 SDK는 console.warn 또는 콘솔에 직접 출력
    console.warn = (...args) => { checkAuth(...args); origWarn.apply(console, args); };
    console.error = (...args) => { checkAuth(...args); origError.apply(console, args); };

    if (typeof naver !== 'undefined' && naver.maps) {
      console.warn = origWarn;
      console.error = origError;
      loadResult = 'ok';
      resolve('ok');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => {
      // 인증 실패 감지까지 1초 대기
      setTimeout(() => {
        console.warn = origWarn;
        console.error = origError;
        loadResult = authFailed ? 'auth-fail' : 'ok';
        resolve(loadResult);
      }, 1000);
    };
    script.onerror = () => {
      console.warn = origWarn;
      console.error = origError;
      loadResult = 'auth-fail';
      resolve('auth-fail');
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
    loadNaverMapsScript(clientId).then((result) => {
      if (result === 'ok') {
        setIsLoaded(true);
      } else {
        setError('네이버 지도 인증 실패 — NCP URL 반영까지 최대 10분 소요');
      }
    });
  }, [clientId]);

  return { isLoaded, error };
}

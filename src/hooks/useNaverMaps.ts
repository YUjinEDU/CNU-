import { useState, useEffect } from 'react';

let loadResult = 'pending' as string;
let authFailed = false;

// SDK 크래시 글로벌 차단
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.filename?.includes('maps.js') || e.message?.includes('capitalize') || e.message?.includes('forEach')) {
      e.preventDefault();
      authFailed = true;
    }
  });

  // SDK가 console.log/warn으로 "인증이 실패" 메시지를 출력하므로 패치해서 감지
  const origLog = console.log.bind(console);
  const origWarn = console.warn.bind(console);
  const check = (...args: unknown[]) => {
    const msg = args.map(String).join(' ');
    if (msg.includes('인증이 실패') || msg.includes('Authentication Failed')) {
      authFailed = true;
    }
  };
  console.log = (...args: unknown[]) => { check(...args); origLog(...args); };
  console.warn = (...args: unknown[]) => { check(...args); origWarn(...args); };
}

export function useNaverMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;

  useEffect(() => {
    if (!clientId) { setError('VITE_NAVER_CLIENT_ID 미설정'); return; }
    if (loadResult === 'ok') { setIsLoaded(true); return; }
    if (loadResult === 'fail') { setError('네이버 지도 인증 실패'); return; }

    if (typeof naver !== 'undefined' && naver.maps?.Map && !authFailed) {
      loadResult = 'ok';
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        if (authFailed) {
          loadResult = 'fail';
          setError('네이버 Dynamic Map 인증 실패 — NCP URL 반영 대기 중 (최대 30분)');
        } else {
          loadResult = 'ok';
          setIsLoaded(true);
        }
      }, 2000);
    };
    script.onerror = () => {
      loadResult = 'fail';
      setError('네이버 지도 SDK 로드 실패');
    };
    document.head.appendChild(script);
  }, [clientId]);

  return { isLoaded, error };
}

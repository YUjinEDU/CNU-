import { useState, useEffect } from 'react';

let loadResult: 'pending' | 'ok' | 'fail' = 'pending';

// SDK 에러 글로벌 차단 (인증 실패 시 SDK 내부 크래시 방지)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.filename?.includes('maps.js') || e.message?.includes('capitalize') || e.message?.includes('forEach')) {
      e.preventDefault();
    }
  });
}

/**
 * Geocoding API 프록시가 동작하는지로 NCP 인증 상태를 판단.
 * 이 API는 Vite 프록시를 통해 Client ID + Secret으로 호출하므로
 * Dynamic Map과 다른 경로지만, NCP 앱 자체의 활성화 여부는 확인 가능.
 */
async function preflightCheck(): Promise<boolean> {
  try {
    const res = await fetch('/api/naver/geocode?query=test');
    return res.ok;
  } catch {
    return false;
  }
}

function loadScript(clientId: string): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => {
      // 인증 성공 여부를 3초 대기 후 판단 (SDK 내부 에러 발생 여부)
      setTimeout(() => {
        try {
          // 간단한 LatLng 생성으로 SDK 동작 확인
          const test = new naver.maps.LatLng(36.36, 127.34);
          if (test.lat() > 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        } catch {
          resolve(false);
        }
      }, 3000);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
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

    (async () => {
      // 1단계: NCP API 자체가 동작하는지 확인
      const apiOk = await preflightCheck();
      if (!apiOk) {
        loadResult = 'fail';
        setError('네이버 API 연결 실패 — 서버 프록시 확인 필요');
        return;
      }

      // 2단계: SDK 로드 + 동작 확인
      if (typeof naver !== 'undefined' && naver.maps?.LatLng) {
        loadResult = 'ok';
        setIsLoaded(true);
        return;
      }

      const ok = await loadScript(clientId);
      loadResult = ok ? 'ok' : 'fail';
      if (ok) {
        setIsLoaded(true);
      } else {
        setError('네이버 Dynamic Map 인증 실패 — NCP Web URL 반영 대기 중 (최대 30분)');
      }
    })();
  }, [clientId]);

  return { isLoaded, error };
}

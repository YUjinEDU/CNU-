import { useState, useEffect } from 'react';

let loadResult = 'pending' as string;

// SDK 내부 크래시 차단
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.filename?.includes('maps.js') || e.message?.includes('capitalize') || e.message?.includes('forEach')) {
      e.preventDefault();
      loadResult = 'fail';
    }
  });
}

/**
 * SDK 로드 후 실제로 Map이 렌더링 가능한지 테스트.
 * 숨겨진 div에 Map을 생성하고, 500ms 후 타일이 로드되는지 확인.
 */
function testMapWorks(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const div = document.createElement('div');
      div.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;opacity:0';
      document.body.appendChild(div);

      new naver.maps.Map(div, {
        center: new naver.maps.LatLng(36.36, 127.34),
        zoom: 10,
      });

      // 2초 후 loadResult가 fail이면 인증 실패
      setTimeout(() => {
        try { document.body.removeChild(div); } catch {}
        resolve(loadResult !== 'fail');
      }, 2000);
    } catch {
      resolve(false);
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

    // SDK 이미 로드 + 이전에 성공한 경우
    if (typeof naver !== 'undefined' && naver.maps?.Map && loadResult === 'ok') {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => {
      // 실제 Map 생성 테스트
      testMapWorks().then((ok) => {
        if (ok) {
          loadResult = 'ok';
          setIsLoaded(true);
        } else {
          loadResult = 'fail';
          setError('네이버 Dynamic Map 인증 실패 — NCP URL 반영 대기 중');
        }
      });
    };
    script.onerror = () => {
      loadResult = 'fail';
      setError('네이버 지도 SDK 로드 실패');
    };
    document.head.appendChild(script);
  }, [clientId]);

  return { isLoaded, error };
}

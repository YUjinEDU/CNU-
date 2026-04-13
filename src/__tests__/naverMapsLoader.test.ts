import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getNaverMapsLoaderSnapshot,
  getNaverMapsLoaderState,
  loadNaverMapsSdk,
  resetNaverMapsLoaderForTests,
  subscribeToNaverMapsLoader,
} from '../lib/naverMapsLoader';

describe('naverMapsLoader', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    resetNaverMapsLoaderForTests();
    vi.unstubAllGlobals();
    delete (globalThis as typeof globalThis & { naver?: unknown }).naver;
  });

  it('StrictMode에서도 SDK script를 한 번만 추가한다', async () => {
    const first = loadNaverMapsSdk('client-id');
    const second = loadNaverMapsSdk('client-id');

    expect(first).toBe(second);
    expect(document.querySelectorAll('script[data-testid="naver-maps-sdk"]').length).toBe(1);

    const script = document.querySelector('script[data-testid="naver-maps-sdk"]');
    vi.stubGlobal('naver', {
      maps: {
        Map: class {
          constructor() {}
        },
        LatLng: class {
          constructor(public lat: number, public lng: number) {}
        },
      },
    });
    script?.dispatchEvent(new Event('load'));

    await expect(first).resolves.toBeUndefined();
    expect(getNaverMapsLoaderState()).toEqual({
      result: 'ok',
      error: null,
    });
  });

  it('script 로드 실패는 reject하고 fail 상태로 남긴다', async () => {
    const pending = loadNaverMapsSdk('client-id');
    const script = document.querySelector('script[data-testid="naver-maps-sdk"]');
    script?.dispatchEvent(new Event('error'));

    await expect(pending).rejects.toThrow('네이버 지도 SDK 로드 실패');
    expect(getNaverMapsLoaderState()).toEqual({
      result: 'fail',
      error: '네이버 지도 SDK 로드 실패',
    });
  });

  it('이미 로드된 후 인증 실패가 발생해도 구독자에게 상태 변경을 알린다', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToNaverMapsLoader(listener);
    const pending = loadNaverMapsSdk('client-id');
    const script = document.querySelector('script[data-testid="naver-maps-sdk"]');

    vi.stubGlobal('naver', {
      maps: {
        Map: class {
          constructor() {}
        },
        LatLng: class {
          constructor(public lat: number, public lng: number) {}
        },
      },
    });
    script?.dispatchEvent(new Event('load'));
    await expect(pending).resolves.toBeUndefined();

    window.dispatchEvent(
      new ErrorEvent('error', {
        message: 'Authentication Failed',
        filename: 'https://oapi.map.naver.com/openapi/v3/maps.js',
      }),
    );

    expect(listener).toHaveBeenCalled();
    expect(getNaverMapsLoaderSnapshot()).toEqual({
      result: 'fail',
      error: '네이버 Dynamic Map 인증 실패',
    });
    unsubscribe();
  });

  it('네이버 SDK가 내부 서버 오류를 로그하면 fail 상태로 전환한다', async () => {
    const pending = loadNaverMapsSdk('client-id');
    const script = document.querySelector('script[data-testid="naver-maps-sdk"]');

    vi.stubGlobal('naver', {
      maps: {
        Map: class {
          constructor() {}
        },
        LatLng: class {
          constructor(public lat: number, public lng: number) {}
        },
      },
    });
    script?.dispatchEvent(new Event('load'));
    await expect(pending).resolves.toBeUndefined();

    console.error('NAVER Maps JavaScript API v3 잠시 후에 다시 요청해 주세요. Error Code / Error Message: 500 / Internal Server Error');

    expect(getNaverMapsLoaderSnapshot()).toEqual({
      result: 'fail',
      error: '네이버 지도 서버 응답 오류',
    });
  });

  it('console.info 인증 실패 로그도 fail 상태로 전환한다', async () => {
    const pending = loadNaverMapsSdk('client-id');
    const script = document.querySelector('script[data-testid="naver-maps-sdk"]');

    vi.stubGlobal('naver', {
      maps: {
        Map: class {
          constructor() {}
        },
        LatLng: class {
          constructor(public lat: number, public lng: number) {}
        },
      },
    });
    script?.dispatchEvent(new Event('load'));
    await expect(pending).resolves.toBeUndefined();

    console.info('NAVER Maps JavaScript API v3 네이버 지도 Open API 인증이 실패하였습니다. 클라이언트 아이디와 웹 서비스 URL을 확인해 주세요.');

    expect(getNaverMapsLoaderSnapshot()).toEqual({
      result: 'fail',
      error: '네이버 Dynamic Map 인증 실패',
    });
  });

  it('SDK 내부 Size 크래시도 fail 상태로 전환한다', async () => {
    const pending = loadNaverMapsSdk('client-id');
    const script = document.querySelector('script[data-testid="naver-maps-sdk"]');

    vi.stubGlobal('naver', {
      maps: {
        Map: class {
          constructor() {}
        },
        LatLng: class {
          constructor(public lat: number, public lng: number) {}
        },
      },
    });
    script?.dispatchEvent(new Event('load'));
    await expect(pending).resolves.toBeUndefined();

    window.dispatchEvent(
      new ErrorEvent('error', {
        message: "Cannot read properties of null (reading 'Size')",
        filename: 'https://oapi.map.naver.com/openapi/v3/maps.js',
      }),
    );

    expect(getNaverMapsLoaderSnapshot()).toEqual({
      result: 'fail',
      error: '네이버 지도 서버 응답 오류',
    });
  });

  it('snapshot은 상태가 안 바뀌면 같은 참조를 반환한다', async () => {
    const first = getNaverMapsLoaderSnapshot();
    const second = getNaverMapsLoaderSnapshot();

    expect(second).toBe(first);

    const pending = loadNaverMapsSdk('client-id');
    const script = document.querySelector('script[data-testid="naver-maps-sdk"]');

    vi.stubGlobal('naver', {
      maps: {
        Map: class {
          constructor() {}
        },
        LatLng: class {
          constructor(public lat: number, public lng: number) {}
        },
      },
    });
    script?.dispatchEvent(new Event('load'));
    await expect(pending).resolves.toBeUndefined();

    const third = getNaverMapsLoaderSnapshot();
    expect(third).not.toBe(first);
    expect(getNaverMapsLoaderSnapshot()).toBe(third);
  });
});

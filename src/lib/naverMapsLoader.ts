const SDK_URL = 'https://oapi.map.naver.com/openapi/v3/maps.js';
const SCRIPT_TEST_ID = 'naver-maps-sdk';
const AUTH_FAILURE_MESSAGE = '네이버 Dynamic Map 인증 실패';
const SDK_SERVER_FAILURE_MESSAGE = '네이버 지도 서버 응답 오류';
const SDK_LOAD_FAILURE_MESSAGE = '네이버 지도 SDK 로드 실패';
const SDK_INIT_FAILURE_MESSAGE = '네이버 지도 SDK 초기화 실패';

type LoadResult = 'pending' | 'ok' | 'fail';
type LoaderSnapshot = { result: LoadResult; error: string | null };

let loadResult: LoadResult = 'pending';
let loadError: string | null = null;
let snapshot: LoaderSnapshot = { result: 'pending', error: null };
let loadPromise: Promise<void> | null = null;
let listenersRegistered = false;
const subscribers = new Set<() => void>();

let originalConsoleError: typeof console.error | null = null;
let originalConsoleWarn: typeof console.warn | null = null;
let originalConsoleLog: typeof console.log | null = null;
let originalConsoleInfo: typeof console.info | null = null;

function isAuthFailureText(text: string) {
  return /Authentication Failed|인증이 실패하였습니다/i.test(text);
}

function isServerFailureText(text: string) {
  return /잠시 후에 다시 요청해 주세요|500\s*\/\s*Internal Server Error|내부 서버 오류/i.test(text);
}

function isSdkCrashText(text: string) {
  return /forEach|capitalize|isArray|Size|Marker|Event|Cannot read properties of null/i.test(text);
}

function markFailed(message = AUTH_FAILURE_MESSAGE) {
  loadResult = 'fail';
  loadError = message;
  snapshot = { result: loadResult, error: loadError };
  subscribers.forEach((listener) => listener());
}

function markLoaded() {
  loadResult = 'ok';
  loadError = null;
  snapshot = { result: loadResult, error: loadError };
  subscribers.forEach((listener) => listener());
}

function inspectConsoleArgs(args: unknown[]) {
  const joined = args
    .map((arg) => (typeof arg === 'string' ? arg : arg instanceof Error ? arg.message : ''))
    .join(' ');

  if (isAuthFailureText(joined)) {
    markFailed(AUTH_FAILURE_MESSAGE);
    return;
  }

  if (isServerFailureText(joined)) {
    markFailed(SDK_SERVER_FAILURE_MESSAGE);
  }
}

function patchConsoleMethod<K extends 'error' | 'warn' | 'log' | 'info'>(
  method: K,
  original: typeof console.error,
) {
  console[method] = ((...args: unknown[]) => {
    inspectConsoleArgs(args);
    original(...args);
  }) as typeof console[K];
}

function windowErrorHandler(event: Event) {
  const errorEvent = event as ErrorEvent;
  const message = errorEvent.message || '';
  const filename = errorEvent.filename || '';

  if (isAuthFailureText(message)) {
    errorEvent.preventDefault?.();
    markFailed(AUTH_FAILURE_MESSAGE);
    return;
  }

  if (isServerFailureText(message)) {
    errorEvent.preventDefault?.();
    markFailed(SDK_SERVER_FAILURE_MESSAGE);
    return;
  }

  if (filename.includes('maps.js') && isSdkCrashText(message)) {
    errorEvent.preventDefault?.();
    markFailed(loadError || SDK_SERVER_FAILURE_MESSAGE);
  }
}

function ensureGlobalGuards() {
  if (listenersRegistered || typeof window === 'undefined') return;

  window.addEventListener('error', windowErrorHandler, true);

  originalConsoleError = console.error.bind(console);
  originalConsoleWarn = console.warn.bind(console);
  originalConsoleLog = console.log.bind(console);
  originalConsoleInfo = console.info.bind(console);

  patchConsoleMethod('error', originalConsoleError);
  patchConsoleMethod('warn', originalConsoleWarn);
  patchConsoleMethod('log', originalConsoleLog);
  patchConsoleMethod('info', originalConsoleInfo);

  listenersRegistered = true;
}

function getOrCreateSdkScript(clientId: string) {
  const existing = document.querySelector<HTMLScriptElement>(`script[data-testid="${SCRIPT_TEST_ID}"]`);
  if (existing) return existing;

  const script = document.createElement('script');
  script.src = `${SDK_URL}?ncpClientId=${clientId}`;
  script.async = true;
  script.dataset.testid = SCRIPT_TEST_ID;
  document.head.appendChild(script);
  return script;
}

export function loadNaverMapsSdk(clientId: string): Promise<void> {
  if (!clientId) {
    markFailed('VITE_NAVER_CLIENT_ID 미설정');
    return Promise.reject(new Error('VITE_NAVER_CLIENT_ID 미설정'));
  }

  if (loadResult === 'ok') {
    return Promise.resolve();
  }

  if (loadResult === 'fail') {
    return Promise.reject(new Error(loadError || AUTH_FAILURE_MESSAGE));
  }

  if (loadPromise) {
    return loadPromise;
  }

  ensureGlobalGuards();

  loadPromise = new Promise((resolve, reject) => {
    const fail = (message: string) => {
      markFailed(message);
      loadPromise = null;
      reject(new Error(message));
    };

    const succeed = () => {
      markLoaded();
      resolve();
    };

    if (typeof naver !== 'undefined' && naver.maps?.Map) {
      succeed();
      return;
    }

    const script = getOrCreateSdkScript(clientId);

    const onLoad = () => {
      script.dataset.loaded = 'true';
      if (typeof naver === 'undefined' || !naver.maps?.Map) {
        fail(SDK_INIT_FAILURE_MESSAGE);
        return;
      }
      succeed();
    };

    const onError = () => {
      fail(SDK_LOAD_FAILURE_MESSAGE);
    };

    if (script.dataset.loaded === 'true') {
      queueMicrotask(onLoad);
      return;
    }

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
  });

  return loadPromise;
}

export function getNaverMapsLoaderState() {
  return {
    result: loadResult,
    error: loadError,
  };
}

export function subscribeToNaverMapsLoader(listener: () => void) {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

export function getNaverMapsLoaderSnapshot(): LoaderSnapshot {
  return snapshot;
}

export function resetNaverMapsLoaderForTests() {
  loadResult = 'pending';
  loadError = null;
  snapshot = { result: 'pending', error: null };
  loadPromise = null;
  subscribers.clear();

  if (listenersRegistered && typeof window !== 'undefined') {
    window.removeEventListener('error', windowErrorHandler, true);
    listenersRegistered = false;
  }

  if (originalConsoleError) console.error = originalConsoleError;
  if (originalConsoleWarn) console.warn = originalConsoleWarn;
  if (originalConsoleLog) console.log = originalConsoleLog;
  if (originalConsoleInfo) console.info = originalConsoleInfo;

  originalConsoleError = null;
  originalConsoleWarn = null;
  originalConsoleLog = null;
  originalConsoleInfo = null;
}

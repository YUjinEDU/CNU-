import { describe, expect, it } from 'vitest';
import { isNaverMapsRuntimeReady } from '../lib/naverMapsRuntime';

describe('isNaverMapsRuntimeReady', () => {
  it('지도 구성요소가 모두 있으면 true를 반환한다', () => {
    expect(isNaverMapsRuntimeReady({
      maps: {
        Map: class {},
        LatLng: class {},
        Marker: class {},
        Polyline: class {},
        Circle: class {},
        Event: { addListener() {}, removeListener() {} },
        Position: { TOP_RIGHT: 1 },
      },
    })).toBe(true);
  });

  it('부분 초기화된 SDK면 false를 반환한다', () => {
    expect(isNaverMapsRuntimeReady({
      maps: {
        Map: class {},
        LatLng: class {},
        Event: null,
      },
    })).toBe(false);
  });
});

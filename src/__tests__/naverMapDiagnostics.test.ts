import { beforeEach, describe, expect, it } from 'vitest';
import {
  getNaverMapDiagnostics,
  markNaverMapDiagnostic,
  resetNaverMapDiagnosticsForTests,
} from '../lib/naverMapDiagnostics';

describe('naverMapDiagnostics', () => {
  beforeEach(() => {
    resetNaverMapDiagnosticsForTests();
  });

  it('단계별 진단 정보를 누적 저장한다', () => {
    markNaverMapDiagnostic('sdk-loaded');
    markNaverMapDiagnostic('map-created', { zoom: 14 });
    markNaverMapDiagnostic('tilesloaded');

    const diagnostics = getNaverMapDiagnostics();

    expect(diagnostics.lastStage).toBe('tilesloaded');
    expect(diagnostics.stages).toEqual(['sdk-loaded', 'map-created', 'tilesloaded']);
    expect(diagnostics.stageDetails['map-created']).toEqual({ zoom: 14 });
    expect(typeof diagnostics.timestamps['tilesloaded']).toBe('number');
  });
});

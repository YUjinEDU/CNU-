type NaverMapStage =
  | 'sdk-loaded'
  | 'sdk-load-failed'
  | 'map-created'
  | 'map-init-failed'
  | 'idle'
  | 'tilesloaded';

type StageDetails = Partial<Record<NaverMapStage, unknown>>;
type StageTimestamps = Partial<Record<NaverMapStage, number>>;

export interface NaverMapDiagnostics {
  lastStage: NaverMapStage | null;
  stages: NaverMapStage[];
  stageDetails: StageDetails;
  timestamps: StageTimestamps;
}

const initialDiagnostics = (): NaverMapDiagnostics => ({
  lastStage: null,
  stages: [],
  stageDetails: {},
  timestamps: {},
});

let diagnostics = initialDiagnostics();

function syncWindowDiagnostics() {
  if (typeof window === 'undefined') return;
  window.__naverMapDiagnostics = diagnostics;
}

export function markNaverMapDiagnostic(stage: NaverMapStage, detail?: unknown) {
  diagnostics = {
    lastStage: stage,
    stages: diagnostics.stages.includes(stage) ? diagnostics.stages : [...diagnostics.stages, stage],
    stageDetails: detail === undefined ? diagnostics.stageDetails : { ...diagnostics.stageDetails, [stage]: detail },
    timestamps: { ...diagnostics.timestamps, [stage]: Date.now() },
  };

  syncWindowDiagnostics();

  if (import.meta.env.DEV) {
    console.info('[naver-map]', stage, detail ?? '');
  }
}

export function getNaverMapDiagnostics() {
  return diagnostics;
}

export function resetNaverMapDiagnosticsForTests() {
  diagnostics = initialDiagnostics();
  syncWindowDiagnostics();
}

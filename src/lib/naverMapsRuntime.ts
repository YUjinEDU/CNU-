type NaverLike = {
  maps?: {
    Map?: unknown;
    LatLng?: unknown;
    Marker?: unknown;
    Polyline?: unknown;
    Circle?: unknown;
    Event?: {
      addListener?: unknown;
      removeListener?: unknown;
    } | null;
    Position?: {
      TOP_RIGHT?: unknown;
    } | null;
  } | null;
} | undefined;

export function isNaverMapsRuntimeReady(naverLike: NaverLike) {
  const maps = naverLike?.maps;

  return Boolean(
    maps?.Map &&
      maps?.LatLng &&
      maps?.Marker &&
      maps?.Polyline &&
      maps?.Circle &&
      maps?.Position?.TOP_RIGHT !== undefined &&
      maps?.Event?.addListener &&
      maps?.Event?.removeListener,
  );
}

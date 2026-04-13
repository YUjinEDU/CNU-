// Naver Maps JS SDK v3 type declarations
declare namespace naver.maps {
  class Map {
    constructor(element: HTMLElement, options?: MapOptions);
    setCenter(latlng: LatLng): void;
    setZoom(zoom: number): void;
    getCenter(): LatLng;
    getZoom(): number;
    fitBounds(bounds: LatLngBounds, margin?: number): void;
    panTo(latlng: LatLng, transitionOptions?: object): void;
  }

  interface MapOptions {
    center?: LatLng;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    disableKineticPan?: boolean;
    zoomControl?: boolean;
    zoomControlOptions?: { position: number };
    mapTypeControl?: boolean;
    scaleControl?: boolean;
    logoControl?: boolean;
    mapDataControl?: boolean;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
    x: number;
    y: number;
  }

  class LatLngBounds {
    constructor(sw: LatLng, ne: LatLng);
    extend(latlng: LatLng): LatLngBounds;
    getCenter(): LatLng;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(latlng: LatLng): void;
    getPosition(): LatLng;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
    icon?: MarkerIcon | string;
    title?: string;
    zIndex?: number;
  }

  interface MarkerIcon {
    content?: string;
    size?: Size;
    anchor?: Point;
    origin?: Point;
    url?: string;
  }

  class Polyline {
    constructor(options: PolylineOptions);
    setMap(map: Map | null): void;
    getPath(): LatLng[];
    setPath(path: LatLng[]): void;
  }

  interface PolylineOptions {
    map?: Map;
    path: LatLng[];
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    strokeLineCap?: string;
    strokeLineJoin?: string;
  }

  class Circle {
    constructor(options: CircleOptions);
    setMap(map: Map | null): void;
    setCenter(latlng: LatLng): void;
    setRadius(radius: number): void;
  }

  interface CircleOptions {
    map?: Map;
    center: LatLng;
    radius: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
  }

  class Size {
    constructor(width: number, height: number);
    width: number;
    height: number;
  }

  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  namespace Event {
    function addListener(target: object, type: string, listener: Function): object;
    function removeListener(listener: object): void;
  }

  const Position: {
    TOP_LEFT: number;
    TOP_CENTER: number;
    TOP_RIGHT: number;
    RIGHT_CENTER: number;
    BOTTOM_RIGHT: number;
    BOTTOM_CENTER: number;
    BOTTOM_LEFT: number;
    LEFT_CENTER: number;
  };
}

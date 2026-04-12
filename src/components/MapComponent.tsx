import React from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, Circle } from '@react-google-maps/api';
import { Coordinate } from '../types';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 36.3622, // CNU general area
  lng: 127.3444
};

interface MapComponentProps {
  center?: Coordinate;
  markers?: Coordinate[];
  polylines?: Coordinate[][];
  circles?: { center: Coordinate; radius: number }[];
  zoom?: number;
}

export const MapComponent: React.FC<MapComponentProps> = ({ 
  center = defaultCenter, 
  markers = [], 
  polylines = [], 
  circles = [],
  zoom = 14
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-full bg-slate-200 flex items-center justify-center flex-col p-4 text-center">
        <p className="text-slate-500 font-medium mb-2">Google Maps API Key가 필요합니다.</p>
        <p className="text-xs text-slate-400">.env 파일에 VITE_GOOGLE_MAPS_API_KEY를 설정해주세요.</p>
      </div>
    );
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      {markers.map((marker, index) => (
        <Marker key={`marker-${index}`} position={marker} />
      ))}
      
      {polylines.map((path, index) => (
        <Polyline 
          key={`poly-${index}`} 
          path={path} 
          options={{ strokeColor: '#003E7A', strokeOpacity: 0.8, strokeWeight: 5 }} 
        />
      ))}

      {circles.map((circle, index) => (
        <Circle
          key={`circle-${index}`}
          center={circle.center}
          radius={circle.radius}
          options={{
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />
      ))}
    </GoogleMap>
  ) : (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
    </div>
  );
};

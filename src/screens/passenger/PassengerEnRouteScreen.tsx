import { useMemo, useEffect, useState } from 'react';
import { Car, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Coordinate, LiveLocation } from '../../types';
import { findClosestPointOnRoute, safeParseRoutePath } from '../../lib/geoUtils';
import { remainingDistance, formatDistance, estimateArrivalMinutes } from '../../lib/geofencing';
import { subscribeToLocation } from '../../lib/locationService';
import { MapComponent } from '../../components/MapComponent';
import { useApp } from '../../contexts/AppContext';

export function PassengerEnRouteScreen() {
  const { setState, pickupPoint, selectedRoute } = useApp();
  const passengerSearchCenter = pickupPoint || { lat: 36.355, lng: 127.345 };
  const [driverLocation, setDriverLocation] = useState<Coordinate | null>(null);

  const calculatedPickup = useMemo(() => {
    const routeToUse = safeParseRoutePath(selectedRoute?.path);
    return findClosestPointOnRoute(routeToUse, passengerSearchCenter);
  }, [selectedRoute, passengerSearchCenter]);

  // Subscribe to driver's real-time location
  useEffect(() => {
    if (!selectedRoute?.driverId) return;
    const unsubscribe = subscribeToLocation(selectedRoute.driverId, (loc: LiveLocation | null) => {
      if (loc) setDriverLocation({ lat: loc.lat, lng: loc.lng });
    });
    return unsubscribe;
  }, [selectedRoute?.driverId]);

  const distToPickup = driverLocation ? remainingDistance(driverLocation, calculatedPickup) : null;
  const etaMinutes = distToPickup ? estimateArrivalMinutes(distToPickup) : null;

  const mapMarkers = useMemo(() => {
    const m = [calculatedPickup];
    if (driverLocation) m.push(driverLocation);
    return m;
  }, [calculatedPickup, driverLocation]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-[calc(100vh-160px)]"
    >
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-slate-200">
          <MapComponent
            polylines={[safeParseRoutePath(selectedRoute?.path)]}
            markers={mapMarkers}
            center={driverLocation || calculatedPickup}
            zoom={15}
          />
        </div>

        <div className="relative z-10 p-6 space-y-4">
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-lg flex items-center gap-4">
            <div className="relative">
              <div className="bg-blue-100 p-3 rounded-full">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              {driverLocation && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface-variant">
                {driverLocation ? '운전자가 오고 있습니다' : '운전자 위치 확인 중...'}
              </p>
              <p className="text-lg font-extrabold text-primary-container">
                {etaMinutes ? `도착까지 약 ${etaMinutes}분` : '잠시만 기다려주세요'}
              </p>
            </div>
            {distToPickup !== null && (
              <div className="text-right">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">거리</p>
                <p className="text-lg font-bold text-primary-container">{formatDistance(distToPickup)}</p>
              </div>
            )}
          </div>

          {selectedRoute?.vehicle && (
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">차량 정보</p>
              <p className="text-2xl font-black text-primary-container tracking-wider text-center">
                {selectedRoute.vehicle.plateNumber}
              </p>
              <p className="text-sm text-on-surface-variant text-center mt-1">
                {selectedRoute.vehicle.color} {selectedRoute.vehicle.model}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <button
          onClick={() => setState('PASSENGER_IN_TRANSIT')}
          className="w-full h-24 bg-[#2E7D32] text-white rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <CheckCircle className="w-8 h-8" />
          <div className="text-center">
            <h3 className="text-xl font-extrabold tracking-tight">차량 탑승 완료</h3>
            <p className="text-xs font-medium opacity-80 mt-1">차량에 탑승하셨다면 눌러주세요</p>
          </div>
        </button>
      </div>
    </motion.div>
  );
}

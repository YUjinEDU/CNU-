import { useMemo, useEffect, useRef } from 'react';
import { Navigation, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { findClosestPointOnRoute } from '../../lib/geoUtils';
import { hasArrived, remainingDistance, formatDistance, estimateArrivalMinutes } from '../../lib/geofencing';
// import { updateLocation } from '../../lib/locationService';  // GPS 비활성화
// import { useGeolocation } from '../../hooks/useGeolocation';  // GPS 비활성화
// import { MapComponent } from '../../components/MapComponent';  // 지도 비활성화
import { useApp } from '../../contexts/AppContext';

export function DriverEnRouteScreen() {
  const { user, setState, driverRoute } = useApp();
  // GPS 비활성화 — 수동 도착 알림으로 전환
  // const { position, heading, speed, startTracking, stopTracking, isTracking } = useGeolocation();
  const position = null;
  const isTracking = false;
  const passengerSearchCenter = { lat: 36.355, lng: 127.345 };

  const calculatedPickup = useMemo(() => {
    const routeToUse = driverRoute.length > 0 ? driverRoute : [];
    return findClosestPointOnRoute(routeToUse, passengerSearchCenter);
  }, [driverRoute]);

  // GPS 비활성화 — 수동 도착 알림으로 전환
  // useEffect(() => {
  //   startTracking();
  //   return () => stopTracking();
  // }, [startTracking, stopTracking]);

  // GPS 비활성화 — 수동 도착 알림으로 전환
  // const lastUpdateRef = useRef(0);
  // useEffect(() => {
  //   if (!position || !user) return;
  //   const now = Date.now();
  //   if (now - lastUpdateRef.current < 5000) return;
  //   lastUpdateRef.current = now;
  //   updateLocation(localUid, position, heading, speed);
  // }, [position, user, heading, speed]);

  // GPS 비활성화 — 수동 도착 알림으로 전환
  // useEffect(() => {
  //   if (!position) return;
  //   if (hasArrived(position, calculatedPickup)) {
  //     setState('DRIVER_ARRIVED');
  //   }
  // }, [position, calculatedPickup, setState]);

  const distToPickup = position ? remainingDistance(position, calculatedPickup) : null;
  const etaMinutes = distToPickup ? estimateArrivalMinutes(distToPickup) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-[calc(100vh-160px)]"
    >
      <div className="flex-1 relative">
        {/* 지도 비활성화 — 교수님 요청
        <div className="absolute inset-0 bg-slate-200">
          <MapComponent
            polylines={driverRoute.length > 0 ? [driverRoute] : []}
            markers={[calculatedPickup, ...(position ? [position] : [])]}
            center={position || calculatedPickup}
            zoom={15}
          />
        </div>
        */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-slate-100" />

        <div className="relative z-10 p-6 space-y-4">
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-lg flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Navigation className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface-variant">픽업 장소로 이동 중</p>
              <p className="text-lg font-extrabold text-primary-container">
                {distToPickup !== null ? `${formatDistance(distToPickup)} 남음` : '위치 확인 중...'}
              </p>
            </div>
            {etaMinutes && (
              <div className="text-right">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">ETA</p>
                <p className="text-lg font-bold text-primary-container">{etaMinutes}분</p>
              </div>
            )}
          </div>

          {!isTracking && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
              <p className="text-xs font-medium text-amber-700">GPS가 비활성화 상태입니다. 위치 권한을 확인해주세요.</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <button
          onClick={() => setState('DRIVER_ARRIVED')}
          className="w-full h-24 bg-[#2E7D32] text-white rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <MapPin className="w-8 h-8" />
          <div className="text-center">
            <h3 className="text-xl font-extrabold tracking-tight">📍 픽업 장소 도착</h3>
            <p className="text-xs font-medium opacity-80 mt-1">도착 알림 전송하기</p>
          </div>
        </button>
      </div>
    </motion.div>
  );
}

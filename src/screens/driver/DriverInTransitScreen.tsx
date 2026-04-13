import { useEffect, useRef } from 'react';
import { Car } from 'lucide-react';
import { motion } from 'motion/react';
import { hasArrived, remainingDistance, formatDistance, estimateArrivalMinutes } from '../../lib/geofencing';
import { updateLocation, removeLocation } from '../../lib/locationService';
// import { useGeolocation } from '../../hooks/useGeolocation';  // GPS 비활성화
// import { MapComponent } from '../../components/MapComponent';  // 지도 비활성화
import { useApp } from '../../contexts/AppContext';

export function DriverInTransitScreen() {
  const { user, setState, driverRoute, driverDestCoord } = useApp();
  // GPS 비활성화 — 수동 도착 알림으로 전환
  // const { position, heading, speed, startTracking, stopTracking } = useGeolocation();
  const position = null;

  const destination = driverDestCoord || { lat: 36.36, lng: 127.36 };

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
  //   if (hasArrived(position, destination, 0.15)) {
  //     handleComplete();
  //   }
  // }, [position, destination]);

  const handleComplete = async () => {
    // GPS 비활성화 — removeLocation 주석처리
    // await removeLocation(user?.uid ?? '');
    setState('HOME');
  };

  const distToDest = position ? remainingDistance(position, destination) : null;
  const eta = distToDest ? estimateArrivalMinutes(distToDest) : null;

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
            markers={[destination, ...(position ? [position] : [])]}
            center={position || destination}
            zoom={14}
          />
        </div>
        */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-50 to-slate-100" />

        <div className="relative z-10 p-6 space-y-6">
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-lg flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface-variant">목적지로 이동 중</p>
              <p className="text-lg font-extrabold text-primary-container">
                {distToDest !== null ? `${formatDistance(distToDest)} 남음` : '위치 확인 중...'}
              </p>
            </div>
            {eta && (
              <div className="text-right">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">ETA</p>
                <p className="text-lg font-bold text-primary-container">{eta}분</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <button
          onClick={handleComplete}
          className="w-full h-20 bg-primary-container text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all font-bold text-lg"
        >
          운행 종료 및 하차
        </button>
      </div>
    </motion.div>
  );
}

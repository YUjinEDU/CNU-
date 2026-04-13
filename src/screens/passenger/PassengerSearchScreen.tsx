import { useMemo, useState } from 'react';
import { MapPin, Hand, Clock, Car, Users, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Coordinate, Route } from '../../types';
import { isRouteIntersectingCircle, findClosestPointOnRoute, getDistance } from '../../lib/geoUtils';
import { createRide } from '../../lib/localDb';
import { MapComponent } from '../../components/MapComponent';
import { useApp } from '../../contexts/AppContext';

export function PassengerSearchScreen() {
  const { setState, availableRoutes, setSelectedRoute, pickupPoint, walkingRadius, localUid, user, setCurrentRide } = useApp();
  const [previewRoute, setPreviewRoute] = useState<Route | null>(null);

  const passengerCenter = pickupPoint || { lat: 36.355, lng: 127.345 };
  const walkingRadiusKm = walkingRadius * 0.08; // 약 80m/분

  // 도보 반경 내 경로만 필터링
  const matchedRoutes = useMemo(() => {
    return availableRoutes
      .map(route => {
        const path: Coordinate[] = JSON.parse(route.path);
        const intersects = isRouteIntersectingCircle(path, passengerCenter, walkingRadiusKm);
        if (!intersects) return null;
        const pickup = findClosestPointOnRoute(path, passengerCenter);
        const walkDist = Math.round(getDistance(passengerCenter, pickup) * 1000);
        const walkMin = Math.max(1, Math.round(walkDist / 80));
        return { route, pickup, walkDist, walkMin };
      })
      .filter(Boolean) as { route: Route; pickup: Coordinate; walkDist: number; walkMin: number }[];
  }, [availableRoutes, passengerCenter, walkingRadiusKm]);

  const handleApply = (route: Route, pickup: Coordinate) => {
    if (!user) return;
    const ride = createRide({
      routeId: route.id!,
      driverId: route.driverId,
      passengerId: localUid,
      passengerName: user.name,
      pickupCoord: pickup,
      status: 'pending',
    });
    setCurrentRide(ride);
    setSelectedRoute(route);
    setState('PASSENGER_MATCHED');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-[calc(100vh-160px)]"
    >
      {/* 경로 미리보기 지도 */}
      <AnimatePresence>
        {previewRoute && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 250 }}
            exit={{ height: 0 }}
            className="relative bg-slate-200 overflow-hidden"
          >
            <MapComponent
              center={passengerCenter}
              zoom={14}
              polylines={[JSON.parse(previewRoute.path)]}
              circles={[{ center: passengerCenter, radius: walkingRadius * 80, color: '#3b82f6' }]}
              markers={[findClosestPointOnRoute(JSON.parse(previewRoute.path), passengerCenter)]}
            />
            <button
              onClick={() => setPreviewRoute(null)}
              className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-6 space-y-4 pb-32 flex-1 overflow-y-auto">
        <div className="px-2">
          <h2 className="text-2xl font-extrabold text-primary-container">검색 결과</h2>
          <p className="text-on-surface-variant text-sm font-medium">
            도보 {walkingRadius}분 이내 • {matchedRoutes.length}대 매칭
          </p>
        </div>

        {matchedRoutes.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-on-surface-variant font-medium">도보 반경 내 이용 가능한 차량이 없습니다.</p>
            <p className="text-xs text-slate-400">도보 시간을 늘리거나 다른 시간대를 검색해보세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matchedRoutes.map(({ route, pickup, walkMin }) => (
              <article
                key={route.id}
                className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* 헤더: 운전자 정보 + 출발시간 */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">{route.driverName}</h3>
                      <p className="text-xs text-on-surface-variant">{route.sourceName} → {route.destName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-primary-container block">{route.departureTime}</span>
                      <span className="text-[8px] font-medium text-on-surface-variant uppercase">출발</span>
                    </div>
                  </div>

                  {/* 차량 + 도보 정보 */}
                  <div className="flex items-center gap-3 text-xs">
                    {route.vehicle && (
                      <span className="bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        {route.vehicle.color} {route.vehicle.model}
                      </span>
                    )}
                    <span className="bg-blue-50 text-primary-container px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                      <Hand className="w-3 h-3" />
                      도보 {walkMin}분
                    </span>
                    {route.availableSeats && (
                      <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {route.availableSeats}석
                      </span>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewRoute(previewRoute?.id === route.id ? null : route)}
                      className="flex-1 bg-slate-100 text-on-surface py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <MapPin className="w-4 h-4" />
                      경로 보기
                    </button>
                    <button
                      onClick={() => handleApply(route, pickup)}
                      className="flex-1 bg-primary-container text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      탑승 신청
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

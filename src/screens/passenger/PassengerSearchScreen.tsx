import { useState, useMemo } from 'react';
import { Hand, Clock, Car, Users, ArrowRight, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Route } from '../../types';
import { createRide, hasActiveRide } from '../../lib/firebaseDb';
import { getDistance } from '../../lib/geoUtils';
import { useApp } from '../../contexts/AppContext';

export function PassengerSearchScreen() {
  const { setState, availableRoutes, setSelectedRoute, pickupPoint, user, setCurrentRide, searchMode } = useApp();
  const [applying, setApplying] = useState<string | null>(null);
  const isReturn = searchMode === 'return';

  // 출근: 내 집 ↔ 운전자 출발지(sourceCoord) 거리순
  // 퇴근: 내 집 ↔ 운전자 도착지(destCoord) 거리순
  const sortedRoutes = useMemo(() => {
    return [...availableRoutes].sort((a, b) => {
      if (pickupPoint) {
        const coordA = isReturn ? a.destCoord : a.sourceCoord;
        const coordB = isReturn ? b.destCoord : b.sourceCoord;
        if (coordA && coordB) {
          const distA = getDistance(pickupPoint, coordA);
          const distB = getDistance(pickupPoint, coordB);
          if (Math.abs(distA - distB) > 0.1) return distA - distB;
        }
      }
      return (a.departureTime ?? '').localeCompare(b.departureTime ?? '');
    });
  }, [availableRoutes, pickupPoint, isReturn]);

  const handleApply = async (route: Route) => {
    if (!user || !route.id) return;
    setApplying(route.id);
    try {
      const active = await hasActiveRide(user.uid);
      if (active) {
        alert('이미 진행 중인 카풀이 있습니다. 기존 건을 취소 후 신청해주세요.');
        return;
      }
      // Firestore는 undefined 필드를 거부하므로 조건부 포함
      const rideData: Record<string, any> = {
        routeId: route.id,
        driverId: route.driverId,
        driverName: route.driverName,
        passengerId: user.uid,
        passengerName: user.name,
        pickupCoord: route.sourceCoord ?? { lat: 36.3694, lng: 127.3448 },
        passengerDepartureAddress: user.savedAddresses?.[0]?.name ?? '',
        passengerDestBuilding: user.savedAddresses?.[1]?.name ?? '',
        status: 'pending',
      };
      if (pickupPoint) rideData.passengerDepartureCoord = pickupPoint;
      const ride = await createRide(rideData as any);
      setCurrentRide(ride);
      setSelectedRoute(route);
      setState('PASSENGER_MATCHED');
    } catch (e: unknown) {
      const err = e as { message?: string };
      alert(err.message || '신청 중 오류가 발생했습니다.');
    } finally {
      setApplying(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 space-y-4 pb-32"
    >
      <div className="px-2">
        <h2 className="text-2xl font-extrabold text-primary-container">검색 결과</h2>
        <p className="text-on-surface-variant text-sm font-medium">
          {pickupPoint ? (isReturn ? '내 집 방향 기준 거리순' : '내 출발지 기준 거리순') : '출발시간 빠른 순'} · {sortedRoutes.length}대
        </p>
      </div>

      {sortedRoutes.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-on-surface-variant font-medium">현재 이용 가능한 카풀이 없습니다.</p>
          <p className="text-xs text-slate-400">잠시 후 다시 확인해보세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRoutes.map(route => {
            const compareCoord = isReturn ? route.destCoord : route.sourceCoord;
            const distKm = pickupPoint && compareCoord
              ? getDistance(pickupPoint, compareCoord)
              : null;
            const distText = distKm !== null
              ? distKm < 1
                ? `${Math.round(distKm * 1000)}m`
                : `${distKm.toFixed(1)}km`
              : null;

            return (
              <article
                key={route.id}
                className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">{route.driverName}</h3>
                      <p className="text-xs text-on-surface-variant">
                        {route.sourceName} → {route.destName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-primary-container block">{route.departureTime}</span>
                      <span className="text-[8px] font-medium text-on-surface-variant uppercase">출발</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    {route.vehicle && (
                      <span className="bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        {route.vehicle.color} {route.vehicle.model}
                      </span>
                    )}
                    <span className="bg-blue-50 text-primary-container px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                      <Hand className="w-3 h-3" />
                      탑승 가능
                    </span>
                    {route.availableSeats && (
                      <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {route.availableSeats}석
                      </span>
                    )}
                    {route.departureTime && (
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {route.departureTime}
                      </span>
                    )}
                    {distText && (
                      <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                        <MapPin className="w-3 h-3" />
                        {isReturn ? '집 방향' : '출발지까지'} {distText}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleApply(route)}
                    disabled={applying === route.id}
                    className="w-full bg-primary-container text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {applying === route.id ? '신청 중...' : '탑승 신청'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

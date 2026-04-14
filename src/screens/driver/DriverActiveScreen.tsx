import { useState, useEffect, useMemo } from 'react';
import { UserCheck, Bell, Check, X, MapPin, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { Ride } from '../../types';
import { subscribeToRidesByDriver, acceptRide, rejectRide, updateRouteStatus, getRouteById } from '../../lib/firebaseDb';
import { sendSystemMessage } from '../../lib/chatService';
import { getDistance } from '../../lib/geoUtils';
import { useApp } from '../../contexts/AppContext';
import { showToast } from '../../components/Toast';
import { showConfirm } from '../../components/ConfirmModal';

export function DriverActiveScreen() {
  const { setState, user, driverSource, driverDest, setCurrentRide, driverSourceCoord, currentRoute, clearActiveCarpool } = useApp();
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [remainingSeats, setRemainingSeats] = useState<number>(currentRoute?.availableSeats ?? 0);

  // 실시간 탑승 신청 구독
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToRidesByDriver(user.uid, setPendingRides);
    return unsubscribe;
  }, [user?.uid]);

  // 좌석 수 실시간 갱신 + 0이면 자동 마감
  useEffect(() => {
    if (!currentRoute?.id) return;
    const interval = setInterval(async () => {
      const route = await getRouteById(currentRoute.id!);
      if (route) {
        setRemainingSeats(route.availableSeats ?? 0);
        if ((route.availableSeats ?? 0) <= 0 && route.status === 'active') {
          await updateRouteStatus(currentRoute.id!, 'matched');
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentRoute?.id]);

  const handleAccept = async (ride: Ride) => {
    if (!ride.id) return;
    try {
      await acceptRide(ride.id, ride.routeId);
      await sendSystemMessage(ride.id, '운전자가 탑승을 수락했습니다. 채팅으로 픽업 장소를 정해주세요!');
      setCurrentRide({ ...ride, status: 'accepted' });
      setState('DRIVER_MATCHED');
    } catch (e: any) {
      showToast(e.message || '수락 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleReject = async (ride: Ride) => {
    if (!ride.id) return;
    try {
      await rejectRide(ride.id);
      await sendSystemMessage(ride.id, '운전자가 탑승 신청을 거절했습니다.');
    } catch (e: any) {
      showToast(e.message || '거절 중 오류가 발생했습니다.', 'error');
    }
  };

  const sortedRides = useMemo(() => {
    if (!driverSourceCoord) return pendingRides;
    return [...pendingRides].sort((a, b) => {
      const distA = a.passengerDepartureCoord
        ? getDistance(driverSourceCoord, a.passengerDepartureCoord) : Infinity;
      const distB = b.passengerDepartureCoord
        ? getDistance(driverSourceCoord, b.passengerDepartureCoord) : Infinity;
      return distA - distB;
    });
  }, [pendingRides, driverSourceCoord]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 space-y-4 pb-32"
    >
      {/* 상태 배너 */}
      <div className="bg-primary-container text-white p-5 rounded-xl shadow-2xl flex items-center gap-4 border border-white/10">
        <div className="bg-white/20 p-2 rounded-full">
          <UserCheck className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm opacity-80">매칭 대기 중 · 잔여석 {remainingSeats}석</p>
          <p className="text-base font-semibold">
            {remainingSeats > 0 ? '탑승 신청을 기다리는 중입니다...' : '좌석이 마감되었습니다'}
          </p>
        </div>
      </div>

      {/* 경로 정보 */}
      <div className="bg-white p-5 rounded-xl shadow-md space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary-container"></div>
            <div className="w-0.5 h-8 bg-slate-200"></div>
            <div className="w-2 h-2 rounded-full border-2 border-primary-container"></div>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">출발</p>
              <p className="font-semibold text-on-surface">{driverSource || '출발지'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">도착</p>
              <p className="font-semibold text-on-surface">{driverDest || '도착지'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 탑승 신청 목록 */}
      {sortedRides.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-on-surface-variant font-medium">아직 탑승 신청이 없습니다</p>
          <p className="text-xs text-slate-400">승객이 신청하면 바로 알림이 표시됩니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-bold text-on-surface">탑승 신청 {sortedRides.length}건</p>
          </div>
          {sortedRides.map(ride => (
            <div key={ride.id} className="bg-white p-4 rounded-xl shadow-md border border-orange-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
                  <span className="font-bold text-primary-container">{(ride.passengerName ?? '?')[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface">{ride.passengerName}</p>
                  <p className="text-xs text-on-surface-variant">탑승 신청</p>
                </div>
              </div>

              {/* 상세 정보 — 동네 수준만 표시 */}
              <div className="space-y-1.5 mb-3">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-600">
                    {ride.passengerDepartureAddress || '주소 미등록'}
                  </p>
                </div>
                {driverSourceCoord && ride.passengerDepartureCoord && (
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <span className="text-xs font-semibold text-green-600">
                      약 {getDistance(driverSourceCoord, ride.passengerDepartureCoord).toFixed(1)}km
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-container shrink-0" />
                  <p className="text-xs text-slate-600">
                    목적지: {ride.passengerDestBuilding || '미등록'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(ride)}
                  className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" /> 거절
                </button>
                {remainingSeats > 0 ? (
                  <button
                    onClick={() => handleAccept(ride)}
                    className="flex-1 bg-[#2E7D32] text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" /> 수락
                  </button>
                ) : (
                  <span className="flex-1 bg-slate-200 text-slate-500 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center">
                    좌석 마감
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 운행 취소 */}
      <button
        onClick={async () => {
          if (!(await showConfirm('운행을 취소하시겠습니까?'))) return;
          if (currentRoute?.id) {
            try { await updateRouteStatus(currentRoute.id, 'cancelled'); } catch (e: any) {
              showToast(e.message || '운행 취소 중 오류가 발생했습니다.', 'error');
            }
          }
          clearActiveCarpool();
          setState('HOME');
        }}
        className="w-full py-3 text-red-500 font-bold text-sm"
      >
        운행 취소
      </button>
    </motion.div>
  );
}

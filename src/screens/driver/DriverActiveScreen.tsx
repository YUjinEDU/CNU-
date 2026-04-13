import { useState, useEffect } from 'react';
import { UserCheck, Bell, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Ride } from '../../types';
import { subscribeToRidesByDriver, updateRideStatus } from '../../lib/firebaseDb';
import { useApp } from '../../contexts/AppContext';

export function DriverActiveScreen() {
  const { setState, user, driverSource, driverDest, setCurrentRide } = useApp();
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);

  // 실시간 탑승 신청 구독
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToRidesByDriver(user.uid, setPendingRides);
    return unsubscribe;
  }, [user?.uid]);

  const handleAccept = async (ride: Ride) => {
    if (!ride.id) return;
    await updateRideStatus(ride.id, 'accepted');
    setCurrentRide({ ...ride, status: 'accepted' });
    setState('DRIVER_MATCHED');
  };

  const handleReject = async (rideId: string) => {
    await updateRideStatus(rideId, 'cancelled');
  };

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
          <p className="text-sm opacity-80">매칭 대기 중</p>
          <p className="text-base font-semibold">탑승 신청을 기다리는 중입니다...</p>
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
      {pendingRides.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-on-surface-variant font-medium">아직 탑승 신청이 없습니다</p>
          <p className="text-xs text-slate-400">승객이 신청하면 바로 알림이 표시됩니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-bold text-on-surface">탑승 신청 {pendingRides.length}건</p>
          </div>
          {pendingRides.map(ride => (
            <div key={ride.id} className="bg-white p-4 rounded-xl shadow-md border border-orange-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
                  <span className="font-bold text-primary-container">{ride.passengerName[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface">{ride.passengerName}</p>
                  <p className="text-xs text-on-surface-variant">탑승 신청</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(ride.id!)}
                  className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" /> 거절
                </button>
                <button
                  onClick={() => handleAccept(ride)}
                  className="flex-1 bg-[#2E7D32] text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> 수락
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

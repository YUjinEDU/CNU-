import { useMemo } from 'react';
import { UserCheck, Bell, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { MapComponent } from '../../components/MapComponent';
import { getRidesByDriver, updateRideStatus, getUser } from '../../lib/localDb';
import { useApp } from '../../contexts/AppContext';

export function DriverActiveScreen() {
  const { setState, driverRoute, localUid, user, driverSource, driverDest, setCurrentRide } = useApp();

  // 대기 중인 탑승 신청 조회
  const pendingRides = useMemo(() => {
    return getRidesByDriver(localUid).map(ride => {
      const passenger = getUser(ride.passengerId);
      return { ...ride, passenger };
    });
  }, [localUid]);

  const handleAccept = (rideId: string) => {
    updateRideStatus(rideId, 'accepted');
    const matched = pendingRides.find(r => r.id === rideId);
    if (matched) {
      setCurrentRide({ ...matched, status: 'accepted' });
    }
    setState('DRIVER_MATCHED');
  };

  const handleReject = (rideId: string) => {
    updateRideStatus(rideId, 'cancelled');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-[calc(100vh-160px)]"
    >
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-slate-200">
          <MapComponent polylines={driverRoute.length > 0 ? [driverRoute] : []} />
        </div>

        <div className="relative z-10 p-6 space-y-4">
          {/* 상태 배너 */}
          <div className="bg-primary-container text-white p-5 rounded-xl shadow-2xl flex items-center gap-4 border border-white/10">
            <div className="bg-white/20 p-2 rounded-full">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm opacity-80">매칭 대기 중</p>
              <p className="text-base font-semibold">경로상에 탑승자를 찾고 있습니다...</p>
            </div>
          </div>

          {/* 경로 정보 — 실제 데이터 */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-lg space-y-3">
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
          {pendingRides.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-500" />
                <p className="text-sm font-bold text-on-surface">탑승 신청 {pendingRides.length}건</p>
              </div>
              {pendingRides.map(ride => (
                <div key={ride.id} className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-orange-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-primary-container" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-on-surface">{ride.passengerName}</p>
                      <p className="text-xs text-on-surface-variant">{ride.passenger?.department || ''}</p>
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
                      onClick={() => handleAccept(ride.id!)}
                      className="flex-1 bg-[#2E7D32] text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" /> 수락
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

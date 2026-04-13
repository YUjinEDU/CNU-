import { useEffect, useState } from 'react';
import { BadgeCheck, MessageCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { subscribeToRide } from '../../lib/firebaseDb';
import { useApp } from '../../contexts/AppContext';

export function PassengerMatchedScreen() {
  const { setState, currentRide, selectedRoute, setCurrentRide } = useApp();
  const [rideStatus, setRideStatus] = useState(currentRide?.status || 'pending');

  // 실시간 탑승 상태 구독
  useEffect(() => {
    if (!currentRide?.id) return;
    const unsubscribe = subscribeToRide(currentRide.id, ride => {
      if (ride) {
        setRideStatus(ride.status);
        setCurrentRide(ride);
      }
    });
    return unsubscribe;
  }, [currentRide?.id]);

  const isAccepted = rideStatus === 'accepted';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-6 py-8 space-y-6 pb-32"
    >
      <div className="text-center space-y-2 mb-4">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
          isAccepted ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-primary-container'
        }`}>
          {isAccepted
            ? <BadgeCheck className="w-10 h-10" />
            : <Clock className="w-10 h-10 animate-pulse" />
          }
        </div>
        <h2 className="text-2xl font-extrabold text-primary-container tracking-tight">
          {isAccepted ? '탑승이 수락되었습니다!' : '탑승 신청 완료'}
        </h2>
        <p className="text-on-surface-variant">
          {isAccepted
            ? '채팅으로 픽업 위치를 정해보세요.'
            : '운전자가 신청을 확인하고 있습니다...'}
        </p>
      </div>

      {/* 경로 정보 */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-md space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary-container">
              {(selectedRoute?.driverName || '?')[0]}
            </span>
          </div>
          <div>
            <p className="font-bold text-on-surface">{selectedRoute?.driverName}</p>
            <p className="text-xs text-on-surface-variant">
              {selectedRoute?.sourceName} → {selectedRoute?.destName}
            </p>
          </div>
          {selectedRoute?.departureTime && (
            <div className="ml-auto text-right">
              <span className="text-lg font-black text-primary-container">{selectedRoute.departureTime}</span>
              <p className="text-[8px] text-on-surface-variant uppercase">출발</p>
            </div>
          )}
        </div>
      </div>

      {/* 수락된 경우: 채팅 버튼 */}
      {isAccepted && (
        <button
          onClick={() => setState('CHAT')}
          className="w-full bg-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <MessageCircle className="w-6 h-6" />
          채팅으로 픽업 위치 정하기
        </button>
      )}

      {/* 대기 중 */}
      {!isAccepted && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-amber-700 font-medium text-sm">운전자 수락 대기 중...</p>
          <p className="text-amber-600 text-xs mt-1">수락되면 채팅 버튼이 나타납니다</p>
        </div>
      )}
    </motion.div>
  );
}

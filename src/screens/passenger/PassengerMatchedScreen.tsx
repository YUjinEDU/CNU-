import { useEffect, useState } from 'react';
import { BadgeCheck, MessageCircle, Clock, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { subscribeToRide, cancelRide } from '../../lib/firebaseDb';
import { useApp } from '../../contexts/AppContext';

export function PassengerMatchedScreen() {
  const { setState, currentRide, selectedRoute, setCurrentRide, user, clearActiveCarpool } = useApp();
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

  // 터미널 상태 자동 이동
  useEffect(() => {
    if (rideStatus === 'rejected') {
      alert('운전자가 신청을 거절했습니다.');
      clearActiveCarpool();
      setState('HOME');
    }
    if (rideStatus === 'cancelled') {
      alert('매칭이 취소되었습니다.');
      clearActiveCarpool();
      setState('HOME');
    }
    if (rideStatus === 'completed') {
      alert('카풀이 완료되었습니다!');
      clearActiveCarpool();
      setState('HOME');
    }
  }, [rideStatus]);

  const showChat = ['accepted', 'confirming', 'confirmed'].includes(rideStatus);

  const [showArrivalPopup, setShowArrivalPopup] = useState(false);
  const driverArrived = currentRide?.driverArrived;
  useEffect(() => {
    if (driverArrived) setShowArrivalPopup(true);
  }, [driverArrived]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-6 py-8 space-y-6 pb-32"
    >
      {/* 운전자 도착 팝업 */}
      {showArrivalPopup && (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-green-500 text-white p-2 rounded-full animate-bounce">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-green-800 text-sm">운전자가 약속 장소에 도착했습니다!</p>
            <p className="text-xs text-green-600">빠르게 만나러 가주세요</p>
          </div>
          <button onClick={() => setShowArrivalPopup(false)} className="text-green-600 font-bold text-xs px-3 py-1.5 bg-green-100 rounded-full">확인</button>
        </div>
      )}

      <div className="text-center space-y-2 mb-4">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
          showChat ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-primary-container'
        }`}>
          {showChat
            ? <BadgeCheck className="w-10 h-10" />
            : <Clock className="w-10 h-10 animate-pulse" />
          }
        </div>
        <h2 className="text-2xl font-extrabold text-primary-container tracking-tight">
          {showChat ? '탑승이 수락되었습니다!' : '탑승 신청 완료'}
        </h2>
        <p className="text-on-surface-variant">
          {showChat
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
              <p className="text-[10px] text-on-surface-variant uppercase">출발</p>
            </div>
          )}
        </div>
      </div>

      {/* 수락된 경우: 채팅 버튼 */}
      {showChat && (
        <button
          onClick={() => setState('CHAT')}
          className="w-full bg-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <MessageCircle className="w-6 h-6" />
          채팅으로 픽업 위치 정하기
        </button>
      )}

      {/* 대기 중 */}
      {!showChat && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-amber-700 font-medium text-sm">운전자 수락 대기 중...</p>
          <p className="text-amber-600 text-xs mt-1">수락되면 채팅 버튼이 나타납니다</p>
        </div>
      )}

      {/* 신청 취소 버튼 (pending 상태에서만) */}
      {rideStatus === 'pending' && (
        <button
          onClick={async () => {
            if (!currentRide?.id) return;
            if (!confirm('탑승 신청을 취소하시겠습니까?')) return;
            try {
              await cancelRide(currentRide.id, 'passenger', user?.uid ?? '');
              clearActiveCarpool();
              setState('HOME');
            } catch (e: any) {
              alert(e.message || '취소 중 오류가 발생했습니다.');
            }
          }}
          className="w-full py-4 text-red-500 font-bold text-sm border border-red-200 rounded-xl"
        >
          신청 취소
        </button>
      )}
    </motion.div>
  );
}

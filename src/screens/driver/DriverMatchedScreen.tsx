import { CheckCircle, MessageCircle, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { subscribeToRide } from '../../lib/firebaseDb';

export function DriverMatchedScreen() {
  const { setState, currentRide, setCurrentRide, clearActiveCarpool } = useApp();
  const [liveRide, setLiveRide] = useState(currentRide);

  useEffect(() => {
    if (!currentRide?.id) return;
    const unsubscribe = subscribeToRide(currentRide.id, ride => {
      if (ride) {
        setLiveRide(ride);
        setCurrentRide(ride);
      }
    });
    return unsubscribe;
  }, [currentRide?.id, setCurrentRide]);

  useEffect(() => {
    if (liveRide?.status === 'cancelled' || liveRide?.status === 'completed') {
      clearActiveCarpool();
      setState('HOME');
    }
  }, [liveRide?.status, setState]);

  const [showArrivalPopup, setShowArrivalPopup] = useState(false);
  const passengerArrived = liveRide?.passengerArrived;
  useEffect(() => {
    if (passengerArrived) setShowArrivalPopup(true);
  }, [passengerArrived]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-6 py-8 space-y-6 pb-32"
    >
      {/* 탑승자 도착 팝업 */}
      {showArrivalPopup && (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-green-500 text-white p-2 rounded-full animate-bounce">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-green-800 text-sm">탑승자가 약속 장소에 도착했습니다!</p>
            <p className="text-xs text-green-600">빠르게 만나러 가주세요</p>
          </div>
          <button onClick={() => setShowArrivalPopup(false)} className="text-green-600 font-bold text-xs px-3 py-1.5 bg-green-100 rounded-full">확인</button>
        </div>
      )}

      <div className="text-center space-y-2 mb-8">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">탑승자가 매칭되었습니다!</h2>
        <p className="text-on-surface-variant">채팅으로 픽업 위치를 조율해보세요.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-lg border border-primary-container/10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-container">
              {(liveRide?.passengerName || '?')[0]}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary-container">
              {liveRide?.passengerName || '탑승자'}
            </h3>
            <p className="text-sm text-on-surface-variant">탑승 신청 수락됨</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setState('CHAT')}
          className="w-full bg-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <MessageCircle className="w-6 h-6" />
          채팅으로 픽업 위치 정하기
        </button>
      </div>
    </motion.div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageCircle, MapPin, Car } from 'lucide-react';
import { motion } from 'motion/react';
import { sendMessage, subscribeToMessages, sendSystemMessage, ChatMessage } from '../lib/chatService';
import { subscribeToRide, confirmRide, cancelRide, completeRide, updateRideField, updateRouteStatus } from '../lib/firebaseDb';
import { useApp } from '../contexts/AppContext';
import { showToast } from './Toast';
import { showConfirm } from './ConfirmModal';

export function ChatRoom() {
  const { user, currentRide, setCurrentRide, setState, clearActiveCarpool, selectedRoute } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [liveRide, setLiveRide] = useState(currentRide);
  const bottomRef = useRef<HTMLDivElement>(null);

  const rideId = currentRide?.id;

  useEffect(() => {
    if (!rideId) return;
    const unsubscribe = subscribeToMessages(rideId, setMessages);
    return unsubscribe;
  }, [rideId]);

  useEffect(() => {
    if (!rideId) return;
    const unsubscribe = subscribeToRide(rideId, (ride) => {
      if (ride) {
        setLiveRide(ride);
        setCurrentRide(ride);
      }
    });
    return unsubscribe;
  }, [rideId]);

  useEffect(() => {
    if (!liveRide) return;
    if (liveRide.status === 'cancelled') {
      const who = liveRide.cancelledBy === 'driver' ? '운전자' : '탑승자';
      showToast(`${who}가 매칭을 취소했습니다.`, 'error');
      clearActiveCarpool();
      setState('HOME');
    }
    if (liveRide.status === 'rejected') {
      showToast('운전자가 신청을 거절했습니다.', 'error');
      clearActiveCarpool();
      setState('HOME');
    }
    if (liveRide.status === 'completed') {
      showToast('카풀이 완료되었습니다!', 'success');
      clearActiveCarpool();
      setState('HOME');
    }
  }, [liveRide?.status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const myRole: 'driver' | 'passenger' = liveRide?.driverId === user?.uid ? 'driver' : 'passenger';
  const iConfirmed = myRole === 'driver' ? liveRide?.driverConfirmed : liveRide?.passengerConfirmed;
  const otherArrived = myRole === 'driver' ? liveRide?.passengerArrived : liveRide?.driverArrived;
  const iArrived = myRole === 'driver' ? liveRide?.driverArrived : liveRide?.passengerArrived;
  const iBoarded = myRole === 'driver' ? liveRide?.driverBoarded : liveRide?.passengerBoarded;
  const otherBoarded = myRole === 'driver' ? liveRide?.passengerBoarded : liveRide?.driverBoarded;
  const status = liveRide?.status;
  const [showArrivalPopup, setShowArrivalPopup] = useState(false);

  // 상대방 도착 감지 → 팝업
  useEffect(() => {
    if (otherArrived) setShowArrivalPopup(true);
  }, [otherArrived]);

  // 상대방 탑승 감지 → 팝업
  const [showBoardedPopup, setShowBoardedPopup] = useState(false);
  useEffect(() => {
    if (otherBoarded) setShowBoardedPopup(true);
  }, [otherBoarded]);

  const handleConfirm = async () => {
    if (!rideId || !user) return;
    try {
      const newStatus = await confirmRide(rideId, myRole);
      if (newStatus === 'confirmed') {
        await sendSystemMessage(rideId, '양쪽 모두 합의 완료! 매칭이 확정되었습니다.');
      } else {
        await sendSystemMessage(rideId, `${user.name}님이 합의를 확정했습니다. 상대방의 확정을 기다립니다.`);
      }
    } catch (e: any) {
      showToast(e.message || '확정 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleCancel = async () => {
    if (!rideId || !user || !liveRide) return;
    if (!(await showConfirm('정말 매칭을 취소하시겠습니까?'))) return;
    try {
      await cancelRide(rideId, myRole, user.uid);
      await sendSystemMessage(rideId, `${user.name}님이 매칭을 취소했습니다.`);
      clearActiveCarpool();
      setState('HOME');
    } catch (e: any) {
      showToast(e.message || '취소 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleArrived = async () => {
    if (!rideId || !user) return;
    try {
      const field = myRole === 'driver' ? 'driverArrived' : 'passengerArrived';
      await updateRideField(rideId, { [field]: true });
      await sendSystemMessage(rideId, `${user.name}님이 약속 장소에 도착했습니다!`);
    } catch (e: any) {
      showToast(e.message || '도착 알림 전송 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleBoarded = async () => {
    if (!rideId || !user) return;
    try {
      const field = myRole === 'driver' ? 'driverBoarded' : 'passengerBoarded';
      await updateRideField(rideId, { [field]: true });
      await sendSystemMessage(rideId, `${user.name}님이 차량에 탑승했습니다!`);
    } catch (e: any) {
      showToast(e.message || '탑승 알림 전송 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleComplete = async () => {
    if (!rideId || !liveRide) return;
    if (!(await showConfirm('카풀을 완료하시겠습니까?'))) return;
    try {
      await completeRide(rideId, liveRide.driverId, liveRide.passengerId);
      // route는 active 유지 — 복수 탑승자 지원. 운전자가 직접 "운행 종료"로 닫음.
      await sendSystemMessage(rideId, '카풀이 완료되었습니다. 이용해 주셔서 감사합니다!');
      clearActiveCarpool();
      setState('HOME');
    } catch (e: any) {
      showToast(e.message || '완료 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !rideId || !user || isSending) return;
    const text = input.trim();
    setInput('');
    setIsSending(true);
    try {
      await sendMessage(rideId, user.uid, user.name, text);
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    if (currentRide?.driverId === user?.uid) {
      setState('DRIVER_MATCHED');
    } else {
      setState('PASSENGER_MATCHED');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-[calc(100dvh-64px)]"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-slate-100 shadow-sm">
        <button onClick={handleBack} className="p-2 rounded-full bg-surface-container-lowest">
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-container" />
          <div>
            <p className="font-bold text-on-surface text-sm">픽업 위치 조율</p>
            <p className="text-xs text-on-surface-variant">만날 장소를 채팅으로 정하세요</p>
          </div>
        </div>
      </div>

      {/* 상대방 도착 팝업 */}
      {showArrivalPopup && (
        <div className="px-4 py-3 bg-green-50 border-b border-green-200 flex items-center gap-3">
          <div className="bg-green-500 text-white p-2 rounded-full animate-bounce">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-green-800 text-sm">
              {myRole === 'driver' ? '탑승자' : '운전자'}가 약속 장소에 도착했습니다!
            </p>
            <p className="text-xs text-green-600">빠르게 만나러 가주세요</p>
          </div>
          <button
            onClick={() => setShowArrivalPopup(false)}
            className="text-green-600 font-bold text-xs px-3 py-1.5 bg-green-100 rounded-full"
          >
            확인
          </button>
        </div>
      )}

      {/* 상대방 탑승 팝업 */}
      {showBoardedPopup && (
        <div className="px-4 py-3 bg-orange-50 border-b border-orange-200 flex items-center gap-3">
          <div className="bg-orange-500 text-white p-2 rounded-full animate-bounce">
            <Car className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-orange-800 text-sm">
              {myRole === 'driver' ? '탑승자' : '운전자'}가 차량에 탑승했습니다!
            </p>
          </div>
          <button
            onClick={() => setShowBoardedPopup(false)}
            className="text-orange-600 font-bold text-xs px-3 py-1.5 bg-orange-100 rounded-full"
          >
            확인
          </button>
        </div>
      )}

      {/* 차량 상세 카드 — 매칭 확정 후 탑승자에게만 */}
      {status === 'confirmed' && myRole === 'passenger' && selectedRoute?.vehicle && (
        <div className="px-4 py-3 bg-slate-800 text-white border-b border-slate-700">
          <p className="text-[10px] font-bold text-slate-400 mb-2">매칭된 차량 정보</p>
          <div className="flex items-center gap-4">
            <Car className="w-8 h-8 text-blue-400 shrink-0" />
            <div className="flex-1">
              <p className="text-lg font-black tracking-wider">{selectedRoute.vehicle.plateNumber}</p>
              <p className="text-sm text-slate-300">
                {selectedRoute.vehicle.color} {selectedRoute.vehicle.model}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400">운전자</p>
              <p className="font-bold">{selectedRoute.driverName}</p>
            </div>
          </div>
        </div>
      )}

      {/* 상단 액션 바 */}
      {status && status !== 'completed' && status !== 'cancelled' && status !== 'rejected' && status !== 'pending' && (
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 shadow-sm">
          {/* 상태 표시 */}
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              status === 'accepted' ? 'bg-blue-50 text-blue-700' :
              status === 'confirming' ? 'bg-amber-50 text-amber-700' :
              status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {status === 'accepted' && '채팅 중 — 픽업 장소를 정해주세요'}
              {status === 'confirming' && (iConfirmed ? '상대방 확정 대기 중...' : '상대방이 합의를 확정했습니다!')}
              {status === 'confirmed' && '매칭 확정 완료'}
            </span>
            <button
              onClick={handleCancel}
              className="text-red-500 text-[11px] font-bold"
            >
              취소
            </button>
          </div>
          {/* 액션 버튼 */}
          <div className="flex gap-2">
            {(status === 'accepted' || (status === 'confirming' && !iConfirmed)) && (
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 bg-[#2E7D32] text-white rounded-xl text-sm font-bold active:scale-95 transition-all"
              >
                합의 완료 ✓
              </button>
            )}
            {status === 'confirmed' && (
              <>
                <button
                  onClick={handleArrived}
                  disabled={!!iArrived}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all ${
                    iArrived
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {iArrived ? '도착 완료 ✓' : '도착했어요 📍'}
                </button>
                <button
                  onClick={handleBoarded}
                  disabled={!!iBoarded}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all ${
                    iBoarded
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {iBoarded ? '탑승 완료 ✓' : '탑승했어요 🚗'}
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 py-2.5 bg-primary-container text-white rounded-xl text-sm font-bold active:scale-95 transition-all"
                >
                  하차 완료
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">채팅을 시작해 픽업 위치를 정해보세요!</p>
          </div>
        )}
        {messages.map(msg => {
          // System message — centered notification style
          if (msg.senderId === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="bg-slate-100 text-slate-600 text-xs font-medium px-4 py-2 rounded-full max-w-[85%] text-center">
                  {msg.text}
                </div>
              </div>
            );
          }
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isMe && (
                  <p className="text-xs text-on-surface-variant font-medium ml-1">{msg.senderName}</p>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                    isMe
                      ? 'bg-primary-container text-white rounded-br-sm'
                      : 'bg-white text-on-surface rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <p className="text-[10px] text-on-surface-variant mx-1">
                  {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="shrink-0 px-4 py-3 bg-white border-t border-slate-100 safe-area-bottom">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1 px-4 py-3 bg-surface-container-lowest rounded-full text-on-surface font-medium focus:ring-2 focus:ring-primary-container outline-none text-sm"
            placeholder="메시지를 입력하세요..."
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              input.trim() && !isSending
                ? 'bg-primary-container text-white active:scale-95'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

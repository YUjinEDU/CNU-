import { useState } from 'react';
import { Car, Users, Calendar, Rocket, Hand, AlertTriangle, MessageCircle, Clock, CheckCircle, HelpCircle, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { getRestrictionMessage } from '../lib/vehicleUtils';

export function HomeScreen() {
  const { user, setState, currentRoute, currentRide, selectedRoute, clearActiveCarpool } = useApp();

  const [showGuide, setShowGuide] = useState(false);
  const plateNumber = user?.vehicle?.plateNumber || '';
  const restriction = getRestrictionMessage(plateNumber);

  // 진행 중인 카풀 상태 판단
  const hasActiveRoute = currentRoute && currentRoute.status === 'active';
  const rideStatus = currentRide?.status;
  const isDriverForRide = currentRide?.driverId === user?.uid;
  const hasActiveRide = rideStatus && !['completed', 'cancelled', 'rejected'].includes(rideStatus);

  const handleResume = () => {
    if (hasActiveRide) {
      if (rideStatus === 'pending' && !isDriverForRide) {
        setState('PASSENGER_MATCHED');
      } else if (rideStatus === 'pending' && isDriverForRide) {
        setState('DRIVER_ACTIVE');
      } else {
        setState('CHAT');
      }
    } else if (hasActiveRoute) {
      setState('DRIVER_ACTIVE');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-6 space-y-6 pb-32"
    >
      {/* Identity Card */}
      <section className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_8px_24px_rgba(0,40,83,0.06)]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-primary-container tracking-tight mb-1">{user?.name}</h2>
            <p className="text-sm text-on-surface-variant font-medium">{user?.department}</p>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="bg-blue-50 text-primary-container p-2 rounded-full"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
        {user?.vehicle ? (
          <div className="bg-surface-container-low rounded-lg p-3 flex items-center gap-3">
            <Car className="text-primary-container w-5 h-5" />
            <div className="text-xs">
              <p className="text-on-surface-variant">등록 차량</p>
              <p className="font-bold text-on-surface">
                {user.vehicle.plateNumber} ({user.vehicle.model} {user.vehicle.color})
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setState('PROFILE_EDIT')}
            className="w-full bg-surface-container-low rounded-lg p-3 flex items-center gap-3 text-left"
          >
            <Car className="text-on-surface-variant w-5 h-5" />
            <span className="text-xs font-medium text-on-surface-variant">차량 정보를 등록해주세요</span>
          </button>
        )}
      </section>

      {/* 진행 중인 카풀 배너 */}
      {hasActiveRide && (
        <button
          onClick={handleResume}
          className="w-full bg-green-50 border-2 border-green-300 rounded-xl p-5 flex items-center gap-4 active:scale-[0.98] transition-all"
        >
          <div className="bg-green-500 text-white p-3 rounded-full">
            {rideStatus === 'pending' ? (
              <Clock className="w-6 h-6" />
            ) : rideStatus === 'confirmed' ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <MessageCircle className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-green-800">
              {rideStatus === 'pending' && !isDriverForRide && '탑승 신청 대기 중'}
              {rideStatus === 'pending' && isDriverForRide && '탑승 신청 수신'}
              {rideStatus === 'accepted' && '채팅 진행 중'}
              {rideStatus === 'confirming' && '합의 확정 대기 중'}
              {rideStatus === 'confirmed' && '매칭 확정 — 이동 중'}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {isDriverForRide
                ? `탑승자: ${currentRide?.passengerName}`
                : `운전자: ${selectedRoute?.driverName || currentRide?.driverName || '확인 중'}`
              }
            </p>
          </div>
          <span className="text-green-600 font-bold text-sm">이동 →</span>
        </button>
      )}

      {/* 운행 등록 중 배너 (ride 없이 route만 있을 때) */}
      {hasActiveRoute && !hasActiveRide && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5 space-y-3">
          <button
            onClick={() => setState('DRIVER_ACTIVE')}
            className="w-full flex items-center gap-4 active:scale-[0.98] transition-all"
          >
            <div className="bg-primary-container text-white p-3 rounded-full">
              <Car className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-blue-800">운행 모집 중</p>
              <p className="text-xs text-blue-600 mt-1">
                {currentRoute.sourceName} → {currentRoute.destName}
                {currentRoute.departureTime && ` · ${currentRoute.departureTime} 출발`}
              </p>
            </div>
            <span className="text-blue-600 font-bold text-sm">보기 →</span>
          </button>
          <button
            onClick={async () => {
              if (!confirm('운행 모집을 취소하시겠습니까?')) return;
              if (currentRoute.id) {
                try {
                  const { updateRouteStatus } = await import('../lib/firebaseDb');
                  await updateRouteStatus(currentRoute.id, 'cancelled');
                } catch {}
              }
              clearActiveCarpool();
            }}
            className="w-full py-2 text-red-500 font-bold text-xs border border-red-200 rounded-lg"
          >
            운행 모집 취소
          </button>
        </div>
      )}

      {/* 2부제 Banner */}
      {plateNumber ? (
        <div className={`px-5 py-4 rounded-xl flex items-center gap-4 border-l-4 ${
          restriction.canDrive
            ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#2e7d32]'
            : 'bg-red-50 text-red-700 border-red-600'
        }`}>
          <div className={`p-2 rounded-lg text-white ${restriction.canDrive ? 'bg-[#2e7d32]' : 'bg-red-600'}`}>
            {restriction.canDrive ? <Calendar className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">{restriction.message}</p>
            <p className="text-[11px] opacity-80 mt-0.5">{restriction.description}</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 text-amber-700 px-5 py-4 rounded-xl flex items-center gap-4 border-l-4 border-amber-500">
          <div className="bg-amber-500 text-white p-2 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">차량 번호가 등록되지 않았습니다.</p>
            <p className="text-[11px] opacity-80 mt-0.5">프로필에서 차량 정보를 등록하면 2부제를 자동 확인합니다.</p>
          </div>
        </div>
      )}

      {/* Action Grid */}
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setState('DRIVER_SETUP')}
          disabled={(plateNumber !== '' && !restriction.canDrive) || !!hasActiveRoute || !!hasActiveRide}
          className={`group relative p-6 rounded-xl flex flex-col items-start gap-4 shadow-lg overflow-hidden transition-all ${
            (plateNumber && !restriction.canDrive) || hasActiveRoute || hasActiveRide
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-primary-container text-white active:scale-[0.98]'
          }`}
        >
          <Rocket className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
          <div className={`p-2 rounded-lg ${(plateNumber && !restriction.canDrive) || hasActiveRoute || hasActiveRide ? 'bg-slate-400/20' : 'bg-white/20'}`}>
            <Car className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">🚗 출근길 빈자리 나눔 (운행)</h3>
            <p className={`text-sm mt-1 ${(plateNumber && !restriction.canDrive) || hasActiveRoute || hasActiveRide ? 'text-slate-400' : 'text-blue-100/80'}`}>
              {hasActiveRoute || hasActiveRide
                ? '이미 진행 중인 카풀이 있습니다'
                : plateNumber && !restriction.canDrive
                  ? '오늘은 2부제 적용으로 운행이 불가합니다'
                  : '같은 방향 동료와 함께 출근하기'}
            </p>
          </div>
        </button>

        <button
          onClick={() => setState('PASSENGER_SETUP')}
          disabled={!!hasActiveRide}
          className={`group relative border-2 p-6 rounded-xl flex flex-col items-start gap-4 shadow-md overflow-hidden active:scale-[0.98] transition-all ${
            hasActiveRide
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-surface-container-lowest border-primary-container/20 text-primary-container'
          }`}
        >
          <Hand className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 group-hover:scale-110 transition-transform" />
          <div className={`p-2 rounded-lg ${hasActiveRide ? 'bg-slate-200' : 'bg-primary-container/5'}`}>
            <Users className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">🙋‍♂️ 카풀 탑승 신청 (탑승)</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              {hasActiveRide ? '이미 진행 중인 카풀이 있습니다' : '캠퍼스 권역별 운행 차량 찾기'}
            </p>
          </div>
        </button>
      </div>

      {/* 사용 가이드 모달 */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-6" onClick={() => setShowGuide(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-lg font-extrabold text-primary-container">CNU 카풀 이용 가이드</h3>
              <button onClick={() => setShowGuide(false)} className="p-1.5 rounded-full bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="px-5 pb-6 space-y-5">
              {/* 운전자 가이드 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary-container" />
                  <p className="font-bold text-on-surface">운전자라면</p>
                </div>
                <div className="space-y-2 ml-7">
                  <div className="flex items-start gap-2">
                    <span className="bg-primary-container text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p className="text-sm text-on-surface-variant">하단 <b>"운전"</b> 탭 또는 홈의 운행 버튼을 눌러 출발지, 도착지, 출발 시간을 등록하세요.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-primary-container text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="text-sm text-on-surface-variant">탑승 신청이 오면 신청자의 출발지와 목적지를 확인하고 <b>수락</b>하세요.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-primary-container text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p className="text-sm text-on-surface-variant"><b>채팅</b>으로 만날 장소와 시간을 조율하고, 양쪽 모두 <b>"합의 완료"</b>를 누르면 매칭이 확정됩니다.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-primary-container text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">4</span>
                    <p className="text-sm text-on-surface-variant">약속 장소에 도착하면 <b>"도착했어요"</b>, 탑승하면 <b>"탑승했어요"</b>, 도착하면 <b>"하차 완료"</b>를 눌러주세요.</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* 탑승자 가이드 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-container" />
                  <p className="font-bold text-on-surface">탑승자라면</p>
                </div>
                <div className="space-y-2 ml-7">
                  <div className="flex items-start gap-2">
                    <span className="bg-green-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p className="text-sm text-on-surface-variant">하단 <b>"탑승"</b> 탭을 눌러 출발지와 목적지 권역을 선택하세요.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-green-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="text-sm text-on-surface-variant">가까운 운전자 리스트에서 원하는 운전자에게 <b>"탑승 신청"</b>하세요.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-green-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p className="text-sm text-on-surface-variant">운전자가 수락하면 <b>채팅</b>이 열립니다. 만날 장소를 정하고 <b>"합의 완료"</b>를 누르세요.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-green-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">4</span>
                    <p className="text-sm text-on-surface-variant">도착/탑승/하차 버튼으로 상태를 알려주세요. 어느 단계에서든 <b>취소</b>할 수 있습니다.</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 mb-1">참고</p>
                <p className="text-xs text-amber-700">2부제 적용일에는 해당 차량의 운행 등록이 제한됩니다. 카풀 탑승은 언제든 가능합니다.</p>
              </div>

              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-3 bg-primary-container text-white rounded-xl font-bold text-sm active:scale-95 transition-all"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

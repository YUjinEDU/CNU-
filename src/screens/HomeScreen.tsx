import { useEffect } from 'react';
import { Car, Users, Calendar, Rocket, Hand, AlertTriangle, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { getRouteById } from '../lib/firebaseDb';
import { getRestrictionMessage } from '../lib/vehicleUtils';
import { showConfirm } from '../components/ConfirmModal';

export function HomeScreen() {
  const { user, setState, currentRoute, currentRide, selectedRoute, clearActiveCarpool, availableRoutes, setCurrentRoute } = useApp();

  const plateNumber = user?.vehicle?.plateNumber || '';
  const restriction = getRestrictionMessage(plateNumber);

  // 홈 진입 시 currentRoute가 더 이상 active가 아니면 정리
  useEffect(() => {
    if (!currentRoute?.id) return;
    getRouteById(currentRoute.id).then(route => {
      if (!route || route.status !== 'active') {
        setCurrentRoute(null);
      }
    });
  }, [currentRoute?.id]);

  // 진행 중인 카풀 상태 판단
  const myActiveRoutes = availableRoutes.filter(r => r.driverId === user?.uid);
  const hasActiveRoute = myActiveRoutes.length > 0;
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
          {user?.isAdmin && (
            <button
              onClick={() => setState('ADMIN')}
              className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-[10px] font-bold"
            >
              관리자
            </button>
          )}
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

      {/* 내 운행 리스트 (여러 개 가능) */}
      {hasActiveRoute && !hasActiveRide && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-on-surface-variant px-1">내 운행 {myActiveRoutes.length}건</p>
          {myActiveRoutes
            .sort((a, b) => (a.departureDate ?? '').localeCompare(b.departureDate ?? ''))
            .map(route => (
            <div key={route.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <button
                onClick={() => { setCurrentRoute(route); setState('DRIVER_ACTIVE'); }}
                className="flex-1 flex items-center gap-3 active:scale-[0.98] transition-all"
              >
                <div className="bg-primary-container text-white p-2 rounded-full">
                  <Car className="w-4 h-4" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-blue-800 text-sm">
                    {route.departureDate?.slice(5).replace('-', '/')} · {route.departureTime}
                  </p>
                  <p className="text-[10px] text-blue-600">
                    {route.sourceName} → {route.destName} · {route.availableSeats ?? 0}석
                  </p>
                </div>
                <span className="text-blue-500 text-xs font-bold">보기→</span>
              </button>
              <button
                onClick={async () => {
                  if (!(await showConfirm(`${route.departureDate?.slice(5).replace('-', '/')} 운행을 취소하시겠습니까?`))) return;
                  if (route.id) {
                    try {
                      const { updateRouteStatus } = await import('../lib/firebaseDb');
                      await updateRouteStatus(route.id, 'cancelled');
                    } catch {}
                  }
                }}
                className="text-red-400 text-[10px] font-bold px-2 py-1 shrink-0"
              >
                취소
              </button>
            </div>
          ))}
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
      ) : (user?.role === 'driver' || user?.role === 'both') ? (
        <div className="bg-amber-50 text-amber-700 px-5 py-4 rounded-xl flex items-center gap-4 border-l-4 border-amber-500">
          <div className="bg-amber-500 text-white p-2 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">차량 번호가 등록되지 않았습니다.</p>
            <p className="text-[11px] opacity-80 mt-0.5">프로필에서 차량 정보를 등록하면 2부제를 자동 확인합니다.</p>
          </div>
        </div>
      ) : null}

      {/* 현재 모집 현황 — 자기 route 제외 + 좌석 있는 것만 */}
      {(() => {
        const othersRoutes = availableRoutes.filter(r => r.driverId !== user?.uid && (r.availableSeats ?? 1) > 0);
        return othersRoutes.length > 0 ? (
          <div className="bg-blue-50 rounded-xl px-5 py-3 flex items-center justify-center gap-4">
            <span className="text-sm font-bold text-primary-container">
              현재 <span className="text-lg">{othersRoutes.length}</span>대 카풀 모집 중
            </span>
            <span className="text-xs text-blue-500 animate-pulse">실시간</span>
          </div>
        ) : null;
      })()}

      {/* Action Grid */}
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setState('DRIVER_SETUP')}
          disabled={!!hasActiveRide}
          className={`group relative p-6 rounded-xl flex flex-col items-start gap-4 shadow-lg overflow-hidden transition-all ${
            hasActiveRide
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-primary-container text-white active:scale-[0.98]'
          }`}
        >
          <Rocket className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
          <div className={`p-2 rounded-lg ${hasActiveRide ? 'bg-slate-400/20' : 'bg-white/20'}`}>
            <Car className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">🚗 빈자리 나눔 (운행)</h3>
            <p className={`text-sm mt-1 ${hasActiveRide ? 'text-slate-400' : 'text-blue-100/80'}`}>
              {hasActiveRide
                ? '매칭 진행 중에는 새 운행을 등록할 수 없습니다'
                : hasActiveRoute
                  ? '추가 날짜 운행 등록하기'
                  : '같은 방향 동료와 함께 이동하기'}
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
    </motion.div>
  );
}

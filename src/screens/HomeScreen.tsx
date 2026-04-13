import { Car, Users, BadgeCheck, Calendar, Rocket, Hand, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { getRestrictionMessage } from '../lib/vehicleUtils';

export function HomeScreen() {
  const { user, setState } = useApp();

  const plateNumber = user?.vehicle?.plateNumber || '';
  const restriction = getRestrictionMessage(plateNumber);

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
          <span className="bg-blue-50 text-primary-container text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
            <BadgeCheck className="w-3 h-3 fill-current" />
            SSO 인증 완료
          </span>
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

      {/* 5부제 Banner */}
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
            <p className="text-[11px] opacity-80 mt-0.5">프로필에서 차량 정보를 등록하면 5부제를 자동 확인합니다.</p>
          </div>
        </div>
      )}

      {/* Action Grid */}
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setState('DRIVER_SETUP')}
          disabled={plateNumber !== '' && !restriction.canDrive}
          className={`group relative p-6 rounded-xl flex flex-col items-start gap-4 shadow-lg overflow-hidden transition-all ${
            plateNumber && !restriction.canDrive
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-primary-container text-white active:scale-[0.98]'
          }`}
        >
          <Rocket className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
          <div className={`p-2 rounded-lg ${plateNumber && !restriction.canDrive ? 'bg-slate-400/20' : 'bg-white/20'}`}>
            <Car className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">🚗 출근길 빈자리 나눔 (운행)</h3>
            <p className={`text-sm mt-1 ${plateNumber && !restriction.canDrive ? 'text-slate-400' : 'text-blue-100/80'}`}>
              {plateNumber && !restriction.canDrive
                ? '오늘은 5부제 적용으로 운행이 불가합니다'
                : '연구실 동료 및 교직원과 함께 출근하기'}
            </p>
          </div>
        </button>

        <button
          onClick={() => setState('PASSENGER_SETUP')}
          className="group relative bg-surface-container-lowest border-2 border-primary-container/20 text-primary-container p-6 rounded-xl flex flex-col items-start gap-4 shadow-md overflow-hidden active:scale-[0.98] transition-all"
        >
          <Hand className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 group-hover:scale-110 transition-transform" />
          <div className="bg-primary-container/5 p-2 rounded-lg">
            <Users className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">🙋‍♂️ 카풀 탑승 신청 (탑승)</h3>
            <p className="text-sm text-on-surface-variant mt-1">캠퍼스 권역별 운행 차량 찾기</p>
          </div>
        </button>
      </div>
    </motion.div>
  );
}

import { UserCheck, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { MapComponent } from '../../components/MapComponent';
import { useApp } from '../../contexts/AppContext';

export function DriverActiveScreen() {
  const { setState, driverRoute } = useApp();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-[calc(100vh-160px)]"
    >
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-slate-200">
          <MapComponent polylines={[driverRoute.length > 0 ? driverRoute : []]} />
        </div>

        <div className="relative z-10 p-6 space-y-6">
          <div className="bg-primary-container text-white p-5 rounded-xl shadow-2xl flex items-center gap-4 border border-white/10">
            <div className="bg-white/20 p-2 rounded-full">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm opacity-80">매칭 대기 중</p>
              <p className="text-base font-semibold">경로상에 탑승자를 찾고 있습니다...</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="inline-block px-3 py-1 bg-blue-50 text-primary-container text-[10px] font-bold rounded-full uppercase tracking-wider">Active Route</span>
                <h2 className="text-xl font-extrabold text-primary-container tracking-tight">공과대학 정문 권역</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Est. Arrival</p>
                <p className="text-lg font-bold text-primary-container">08:45 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                <div className="w-0.5 h-8 bg-slate-200"></div>
                <div className="w-2 h-2 rounded-full border-2 border-primary-container"></div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Departure</p>
                  <p className="font-semibold text-on-surface">도안동 트리풀시티</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Destination</p>
                  <p className="font-semibold text-on-surface">공과대학 1호관</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <button
          onClick={() => setState('DRIVER_MATCHED')}
          className="w-full h-16 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all font-bold"
        >
          <Search className="w-5 h-5" />
          (테스트) 탑승자 매칭 시뮬레이션
        </button>
      </div>
    </motion.div>
  );
}

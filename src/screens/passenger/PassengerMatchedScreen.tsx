import { useMemo } from 'react';
import { BadgeCheck, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { findClosestPointOnRoute } from '../../lib/geoUtils';
import { MapComponent } from '../../components/MapComponent';
import { useApp } from '../../contexts/AppContext';

export function PassengerMatchedScreen() {
  const { setState, walkingRadius, pickupPoint, selectedRoute } = useApp();
  const passengerSearchCenter = pickupPoint || { lat: 36.355, lng: 127.345 };
  const passengerRadiusMeters = walkingRadius * 80;

  const routePath = useMemo(() => {
    return selectedRoute?.path ? JSON.parse(selectedRoute.path) : [];
  }, [selectedRoute]);

  const calculatedPickup = useMemo(() => {
    return findClosestPointOnRoute(routePath, passengerSearchCenter);
  }, [routePath, passengerSearchCenter]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col min-h-[calc(100vh-160px)]"
    >
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-slate-200">
          <MapComponent
            polylines={routePath.length > 0 ? [routePath] : []}
            circles={[{ center: passengerSearchCenter, radius: passengerRadiusMeters }]}
            markers={[calculatedPickup]}
            center={calculatedPickup}
            zoom={15}
          />
        </div>

        <div className="relative z-10 p-6 space-y-6">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                <img src="https://picsum.photos/seed/driver/100/100" alt="Driver" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-primary-container rounded-full text-[10px] font-bold mb-1">
                  <BadgeCheck className="w-3 h-3 fill-current" />
                  SSO 인증 완료
                </div>
                <h2 className="text-2xl font-extrabold text-primary-container tracking-tight">최적의 픽업 포인트를 찾았습니다</h2>
              </div>
            </div>

            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
              운전자의 실제 경로와 탑승자의 이동 가능 반경({walkingRadius}분)을 분석한 결과, <strong>가장 가까운 지점</strong>을 픽업지로 선정했습니다.
            </p>

            <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4">
              <div className="bg-primary-container w-10 h-10 rounded-lg flex items-center justify-center text-white">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase">계산된 픽업 좌표</p>
                <p className="text-sm font-bold text-primary-container">{calculatedPickup.lat.toFixed(4)}, {calculatedPickup.lng.toFixed(4)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <button
          onClick={() => setState('PASSENGER_EN_ROUTE')}
          className="w-full bg-primary-container text-white py-5 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          이 차에 탑승 신청
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

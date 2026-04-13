import { useMemo, useState, useEffect } from 'react';
import { CheckCircle, Phone, MapPin, Clock, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { findClosestPointOnRoute } from '../../lib/geoUtils';
import { reverseGeocode } from '../../lib/naverApi';
import { useApp } from '../../contexts/AppContext';

export function DriverMatchedScreen() {
  const { setState, driverRoute } = useApp();
  const passengerSearchCenter = { lat: 36.355, lng: 127.345 };
  const [pickupAddress, setPickupAddress] = useState('픽업 위치 확인 중...');

  const calculatedPickup = useMemo(() => {
    const routeToUse = driverRoute.length > 0 ? driverRoute : [];
    return findClosestPointOnRoute(routeToUse, passengerSearchCenter);
  }, [driverRoute]);

  useEffect(() => {
    reverseGeocode(calculatedPickup).then(setPickupAddress);
  }, [calculatedPickup]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-6 py-8 space-y-6 pb-32"
    >
      <div className="text-center space-y-2 mb-8">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">탑승자가 매칭되었습니다!</h2>
        <p className="text-on-surface-variant">경로 상에 있는 교직원과 함께 출근합니다.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-lg border border-primary-container/10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-container/20">
            <img src="https://picsum.photos/seed/passenger/150/150" alt="Passenger" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary-container">이*민 주무관</h3>
            <p className="text-sm text-on-surface-variant">학생처 장학팀</p>
          </div>
          <div className="ml-auto">
            <button className="w-10 h-10 rounded-full bg-blue-50 text-primary-container flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 bg-surface-container-low p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary-container mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">픽업 장소</p>
              <p className="font-semibold text-on-surface">{pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary-container mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">예상 픽업 시간</p>
              <p className="font-semibold text-on-surface">08:35 AM (약 5분 후)</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setState('DRIVER_EN_ROUTE')}
        className="w-full bg-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <Navigation className="w-6 h-6" />
        픽업 장소로 이동하기
      </button>
    </motion.div>
  );
}

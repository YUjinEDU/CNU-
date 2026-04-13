import { useMemo } from 'react';
import { Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { findClosestPointOnRoute, safeParseRoutePath } from '../../lib/geoUtils';
import { MapComponent } from '../../components/MapComponent';
import { useApp } from '../../contexts/AppContext';

export function PassengerInTransitScreen() {
  const { setState, pickupPoint, selectedRoute } = useApp();
  const passengerSearchCenter = pickupPoint || { lat: 36.355, lng: 127.345 };

  const calculatedPickup = useMemo(() => {
    const routeToUse = safeParseRoutePath(selectedRoute?.path);
    return findClosestPointOnRoute(routeToUse, passengerSearchCenter);
  }, [selectedRoute, passengerSearchCenter]);

  const destName = selectedRoute?.destName || '목적지';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-[calc(100vh-160px)]"
    >
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-slate-200">
          <MapComponent
            polylines={[safeParseRoutePath(selectedRoute?.path)]}
            markers={[calculatedPickup]}
            center={calculatedPickup}
            zoom={14}
          />
        </div>

        <div className="relative z-10 p-6 space-y-6">
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-lg flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Navigation className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface-variant">목적지로 이동 중</p>
              <p className="text-lg font-extrabold text-primary-container">{destName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <button
          onClick={() => setState('HOME')}
          className="w-full h-20 bg-primary-container text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all font-bold text-lg"
        >
          하차 완료
        </button>
      </div>
    </motion.div>
  );
}

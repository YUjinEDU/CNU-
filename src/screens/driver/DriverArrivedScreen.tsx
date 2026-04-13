import { useMemo } from 'react';
import { Bell, Phone, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { getUser } from '../../lib/localDb';
import { useApp } from '../../contexts/AppContext';

export function DriverArrivedScreen() {
  const { setState, currentRide } = useApp();

  const passengerUser = useMemo(() => {
    return currentRide ? getUser(currentRide.passengerId) : null;
  }, [currentRide]);

  const name = passengerUser?.name || currentRide?.passengerName || '탑승자';
  const dept = passengerUser?.department || '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-6 py-8 space-y-6 pb-32 flex flex-col min-h-[calc(100vh-160px)]"
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 relative">
          <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping"></div>
          <Bell className="w-16 h-16" />
        </div>
        <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">탑승자에게 도착을 알렸습니다</h2>
        <p className="text-on-surface-variant text-lg">비상등을 켜고 잠시 대기해 주세요.</p>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm w-full mt-8 border border-primary-container/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-container">{name[0]}</span>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-primary-container">{name}</h3>
              {dept && <p className="text-sm text-on-surface-variant">{dept}</p>}
            </div>
            {passengerUser?.phone && (
              <a href={`tel:${passengerUser.phone}`} className="ml-auto w-10 h-10 rounded-full bg-blue-50 text-primary-container flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setState('DRIVER_IN_TRANSIT')}
        className="w-full bg-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <CheckCircle className="w-6 h-6" />
        탑승자가 승차했습니다 (출발)
      </button>
    </motion.div>
  );
}

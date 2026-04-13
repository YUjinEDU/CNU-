import { useEffect, useState } from 'react';
import { Car, MapPin, Building2, ChevronDown, Clock, Minus, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { createRoute } from '../../lib/firebaseDb';
import { useApp } from '../../contexts/AppContext';

export function DriverSetupScreen() {
  const {
    user, setState,
    driverSource, setDriverSource, driverDest, setDriverDest,
    driverSourceCoord, setDriverSourceCoord, driverDestCoord, setDriverDestCoord,
    setDriverRoute, setCurrentRoute,
  } = useApp();

  const [availableSeats, setAvailableSeats] = useState(
    user?.vehicle?.seatCapacity ? user.vehicle.seatCapacity - 1 : 3
  );
  const [departureHour, setDepartureHour] = useState(8);
  const [departureMinute, setDepartureMinute] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!driverSource && user?.savedAddresses?.[0]) {
      const addr = user.savedAddresses[0];
      setDriverSource(addr.name);
      if (addr.lat !== 0) setDriverSourceCoord({ lat: addr.lat, lng: addr.lng });
    }
    if (!driverDest && user?.savedAddresses?.[1]) {
      const addr = user.savedAddresses[1];
      setDriverDest(addr.name);
      if (addr.lat !== 0) setDriverDestCoord({ lat: addr.lat, lng: addr.lng });
    }
  }, [user]);

  const departureTimeStr = `${String(departureHour).padStart(2, '0')}:${String(departureMinute).padStart(2, '0')}`;
  const canStart = !!driverSource && !!driverDest && !isSubmitting;

  const handleStartRoute = async () => {
    if (!canStart || !user) return;
    setIsSubmitting(true);
    try {
      setDriverRoute([]);
      const route = await createRoute({
        driverId: user.uid,
        driverName: user.name,
        vehicle: user.vehicle,
        sourceName: driverSource,
        sourceCoord: driverSourceCoord ?? undefined,
        destName: driverDest,
        destCoord: driverDestCoord ?? undefined,
        path: JSON.stringify([]),
        status: 'active',
        availableSeats,
        departureTime: departureTimeStr,
      });
      setCurrentRoute(route);
      setState('DRIVER_ACTIVE');
    } catch (e: any) {
      alert(e.message || '운행 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 py-8 space-y-8 pb-32"
    >
      <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">운행 등록하기</h2>

      <div className="space-y-6">
        {/* 출발지 */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">출발지</label>
          {user?.savedAddresses && user.savedAddresses.length > 0 ? (
            <div className="relative flex items-center">
              <MapPin className="absolute left-4 w-5 h-5 text-primary-container" />
              <select
                value={driverSource}
                onChange={e => {
                  const addr = user?.savedAddresses?.find(a => a.name === e.target.value);
                  setDriverSource(e.target.value);
                  if (addr && addr.lat !== 0) setDriverSourceCoord({ lat: addr.lat, lng: addr.lng });
                }}
                className="w-full bg-surface-container-lowest rounded-xl pl-12 pr-4 py-4 text-on-surface font-semibold shadow-sm appearance-none outline-none"
              >
                <option value="" disabled>출발지 선택</option>
                {user?.savedAddresses?.map((addr, idx) => (
                  <option key={idx} value={addr.name}>{addr.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 w-5 h-5 text-outline pointer-events-none" />
            </div>
          ) : (
            <input
              type="text"
              value={driverSource}
              onChange={e => setDriverSource(e.target.value)}
              className="w-full px-4 py-4 bg-surface-container-lowest rounded-xl text-on-surface font-semibold shadow-sm outline-none focus:ring-2 focus:ring-primary-container"
              placeholder="출발지 주소 입력"
            />
          )}
        </div>

        {/* 도착지 */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">도착지</label>
          {user?.savedAddresses && user.savedAddresses.length > 1 ? (
            <div className="relative flex items-center">
              <Building2 className="absolute left-4 w-5 h-5 text-primary-container" />
              <select
                value={driverDest}
                onChange={e => {
                  const addr = user?.savedAddresses?.find(a => a.name === e.target.value);
                  setDriverDest(e.target.value);
                  if (addr && addr.lat !== 0) setDriverDestCoord({ lat: addr.lat, lng: addr.lng });
                }}
                className="w-full bg-surface-container-lowest rounded-xl pl-12 pr-4 py-4 text-on-surface font-semibold shadow-sm appearance-none outline-none"
              >
                <option value="" disabled>도착지 선택</option>
                {user?.savedAddresses?.map((addr, idx) => (
                  <option key={idx} value={addr.name}>{addr.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 w-5 h-5 text-outline pointer-events-none" />
            </div>
          ) : (
            <input
              type="text"
              value={driverDest}
              onChange={e => setDriverDest(e.target.value)}
              className="w-full px-4 py-4 bg-surface-container-lowest rounded-xl text-on-surface font-semibold shadow-sm outline-none focus:ring-2 focus:ring-primary-container"
              placeholder="도착지 주소 입력"
            />
          )}
        </div>

        {/* 출발 시간 + 좌석 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">출발 시간</label>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-container flex-shrink-0" />
              <select
                value={departureHour}
                onChange={e => setDepartureHour(parseInt(e.target.value))}
                className="bg-transparent text-xl font-bold text-primary-container outline-none appearance-none"
              >
                {Array.from({ length: 14 }, (_, i) => i + 6).map(h => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                ))}
              </select>
              <span className="text-xl font-bold text-primary-container">:</span>
              <select
                value={departureMinute}
                onChange={e => setDepartureMinute(parseInt(e.target.value))}
                className="bg-transparent text-xl font-bold text-primary-container outline-none appearance-none"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">잔여 좌석</label>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setAvailableSeats(Math.max(1, availableSeats - 1))}
                className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xl font-bold text-primary-container">{availableSeats}</span>
              <button
                onClick={() => setAvailableSeats(Math.min(6, availableSeats + 1))}
                className="w-8 h-8 rounded-full border border-primary-container bg-primary-container/10 flex items-center justify-center text-primary-container"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleStartRoute}
        disabled={!canStart}
        className={`w-full py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${
          canStart
            ? 'bg-[#2E7D32] text-white active:scale-95'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
      >
        <Car className="w-6 h-6 fill-current" />
        {isSubmitting ? '등록 중...' : '동승자 모집 시작'}
      </button>
    </motion.div>
  );
}

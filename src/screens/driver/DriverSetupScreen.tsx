import { useEffect, useMemo, useState } from 'react';
import { Car, MapPin, Building2, ChevronDown, Clock, Minus, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Route } from '../../types';
import { isRouteIntersectingCircle } from '../../lib/geoUtils';
import { MapComponent } from '../../components/MapComponent';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useApp } from '../../contexts/AppContext';

export function DriverSetupScreen() {
  const {
    user, setState,
    driverSource, setDriverSource, driverDest, setDriverDest,
    driverRoute, setDriverRoute,
    driverSourceCoord, setDriverSourceCoord, driverDestCoord, setDriverDestCoord,
  } = useApp();

  const [availableSeats, setAvailableSeats] = useState(user?.vehicle?.seatCapacity ? user.vehicle.seatCapacity - 1 : 3);
  const [departureHour, setDepartureHour] = useState(8);
  const [departureMinute, setDepartureMinute] = useState(30);

  useEffect(() => {
    if (!driverSource && user?.savedAddresses?.[0]) {
      const addr = user.savedAddresses[0];
      setDriverSource(addr.name);
      setDriverSourceCoord({ lat: addr.lat, lng: addr.lng });
    }
    if (!driverDest && user?.savedAddresses?.[1]) {
      const addr = user.savedAddresses[1];
      setDriverDest(addr.name);
      setDriverDestCoord({ lat: addr.lat, lng: addr.lng });
    }
  }, [user]);

  const mockPassengers = useMemo(() => {
    const passengers = [
      { center: { lat: 36.355, lng: 127.345 }, radius: 400 },
      { center: { lat: 36.368, lng: 127.340 }, radius: 800 },
      { center: { lat: 36.350, lng: 127.350 }, radius: 300 },
    ];
    const routeToUse = driverRoute.length > 0 ? driverRoute : [];
    return passengers.map(p => ({
      ...p,
      color: routeToUse.length > 0 && isRouteIntersectingCircle(routeToUse, p.center, p.radius / 1000) ? '#22c55e' : '#94a3b8'
    }));
  }, [driverRoute]);

  const departureTimeStr = `${String(departureHour).padStart(2, '0')}:${String(departureMinute).padStart(2, '0')}`;

  const handleStartRoute = async () => {
    if (!driverSource || !driverDest || driverRoute.length === 0) {
      alert('출발지, 도착지를 선택하고 경로가 계산될 때까지 기다려주세요.');
      return;
    }
    if (!user) return;

    const newRoute: Route = {
      driverId: user.uid,
      driverName: user.name,
      vehicle: user.vehicle,
      sourceName: driverSource,
      sourceCoord: driverSourceCoord ?? undefined,
      destName: driverDest,
      destCoord: driverDestCoord ?? undefined,
      path: JSON.stringify(driverRoute),
      status: 'active',
      availableSeats,
      departureTime: departureTimeStr,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'routes'), newRoute);
      setState('DRIVER_ACTIVE');
    } catch (error) {
      console.error("Error creating route:", error);
      alert("경로 등록 중 오류가 발생했습니다.");
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
        <div className="space-y-2">
          <div className="rounded-xl overflow-hidden h-48 bg-slate-200 relative">
            <MapComponent
              originCoord={driverSourceCoord ?? undefined}
              destCoord={driverDestCoord ?? undefined}
              onRouteCalculated={setDriverRoute}
              polylines={driverRoute.length > 0 ? [driverRoute] : []}
              circles={mockPassengers}
            />
          </div>
          <div className="flex items-center justify-end gap-3 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500/20 border-2 border-green-500"></div>
              <span className="text-[10px] font-bold text-on-surface-variant">매칭 가능 탑승자</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-400/20 border-2 border-slate-400"></div>
              <span className="text-[10px] font-bold text-on-surface-variant">경로 외 탑승자</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">출발지</label>
            <div className="relative flex items-center">
              <MapPin className="absolute left-4 w-5 h-5 text-primary-container" />
              <select
                value={driverSource}
                onChange={(e) => {
                  const addr = user?.savedAddresses?.find(a => a.name === e.target.value);
                  setDriverSource(e.target.value);
                  if (addr) setDriverSourceCoord({ lat: addr.lat, lng: addr.lng });
                }}
                className="w-full bg-surface-container-lowest border border-transparent rounded-xl pl-12 pr-4 py-4 text-on-surface font-semibold shadow-sm appearance-none outline-none"
              >
                <option value="" disabled>출발지 선택</option>
                {user?.savedAddresses?.map((addr, idx) => (
                  <option key={idx} value={addr.name}>{addr.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 w-5 h-5 text-outline pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">도착지</label>
            <div className="relative flex items-center">
              <Building2 className="absolute left-4 w-5 h-5 text-primary-container" />
              <select
                value={driverDest}
                onChange={(e) => {
                  const addr = user?.savedAddresses?.find(a => a.name === e.target.value);
                  setDriverDest(e.target.value);
                  if (addr) setDriverDestCoord({ lat: addr.lat, lng: addr.lng });
                }}
                className="w-full bg-surface-container-lowest border border-transparent rounded-xl pl-12 pr-4 py-4 text-on-surface font-semibold shadow-sm appearance-none outline-none"
              >
                <option value="" disabled>도착지 선택</option>
                {user?.savedAddresses?.map((addr, idx) => (
                  <option key={idx} value={addr.name}>{addr.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 w-5 h-5 text-outline pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">출발 예정 시간</label>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-container flex-shrink-0" />
              <select
                value={departureHour}
                onChange={(e) => setDepartureHour(parseInt(e.target.value))}
                className="bg-transparent text-xl font-bold text-primary-container outline-none appearance-none"
              >
                {Array.from({ length: 14 }, (_, i) => i + 6).map(h => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                ))}
              </select>
              <span className="text-xl font-bold text-primary-container">:</span>
              <select
                value={departureMinute}
                onChange={(e) => setDepartureMinute(parseInt(e.target.value))}
                className="bg-transparent text-xl font-bold text-primary-container outline-none appearance-none"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">잔여 좌석 수</label>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setAvailableSeats(Math.max(1, availableSeats - 1))}
                className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-outline"
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
        className="w-full bg-[#2E7D32] text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <Car className="w-6 h-6 fill-current" />
        동승자 모집 시작
      </button>
    </motion.div>
  );
}

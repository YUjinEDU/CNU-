import { useEffect, useState } from 'react';
import { Car, MapPin, Building2, ChevronDown, Clock, Minus, Plus } from 'lucide-react';
import Picker from 'react-mobile-picker';
import { DayPicker } from 'react-day-picker';
import { ko } from 'date-fns/locale';
import { format, addDays } from 'date-fns';
import 'react-day-picker/style.css';
import { motion } from 'motion/react';
import { createRoute } from '../../lib/firebaseDb';
import { useApp } from '../../contexts/AppContext';
import { showToast } from '../../components/Toast';
import { isRestricted } from '../../lib/vehicleUtils';

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
  const [departureDates, setDepartureDates] = useState<Date[]>([new Date()]);
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
  const canStart = !!driverSource && !!driverDest && !isSubmitting && departureDates.length > 0;

  const handleStartRoute = async () => {
    if (!canStart || !user) return;
    if (departureDates.length === 0) {
      showToast('출발 날짜를 선택해주세요.', 'info');
      return;
    }
    setIsSubmitting(true);
    try {
      setDriverRoute([]);
      let lastRoute = null;
      for (const date of departureDates) {
        const routeData: Record<string, any> = {
          driverId: user.uid,
          driverName: user.name,
          vehicle: user.vehicle,
          sourceName: driverSource,
          destName: driverDest,
          path: JSON.stringify([]),
          status: 'active',
          availableSeats,
          departureTime: departureTimeStr,
          departureDate: format(date, 'yyyy-MM-dd'),
        };
        if (driverSourceCoord) routeData.sourceCoord = driverSourceCoord;
        if (driverDestCoord) routeData.destCoord = driverDestCoord;
        lastRoute = await createRoute(routeData as any);
      }
      showToast(`${departureDates.length}일 운행이 등록되었습니다!`, 'success');
      if (lastRoute) setCurrentRoute(lastRoute);
      setState('HOME');
    } catch (e: any) {
      showToast(e.message || '운행 등록 중 오류가 발생했습니다.', 'error');
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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">운행 등록하기</h2>
        <button onClick={() => setState('HOME')} className="text-primary-container text-sm font-bold bg-blue-50 px-4 py-2 rounded-full">
          취소
        </button>
      </div>

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

        {/* 출발 날짜 (복수 선택) */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-bold text-on-surface-variant">출발 날짜 (복수 선택 가능)</label>
            <span className="text-sm font-bold text-primary-container">
              {departureDates.length}일 선택
            </span>
          </div>
          {/* 빠른 선택 칩 — 토글 방식 */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6].map(offset => {
              const d = addDays(new Date(), offset);
              const dateStr = format(d, 'yyyy-MM-dd');
              const label = offset === 0 ? '오늘' : offset === 1 ? '내일' : offset === 2 ? '모레' : format(d, 'M/d(EEE)', { locale: ko });
              const isSelected = departureDates.some(sd => format(sd, 'yyyy-MM-dd') === dateStr);
              const plate = user?.vehicle?.plateNumber || '';
              const restricted = plate ? isRestricted(plate, d) : false;
              const toggle = () => {
                if (restricted) return;
                if (isSelected) {
                  setDepartureDates(prev => prev.filter(sd => format(sd, 'yyyy-MM-dd') !== dateStr));
                } else {
                  setDepartureDates(prev => [...prev, d]);
                }
              };
              return (
                <button key={offset} onClick={toggle}
                  disabled={restricted}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-bold transition-all ${
                    restricted
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                      : isSelected
                        ? 'bg-primary-container text-white shadow-md'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                  {label} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
          {/* @ts-ignore react-day-picker mode type */}
          <DayPicker
            mode="multiple"
            selected={departureDates}
            onSelect={(dates) => dates && setDepartureDates(dates)}
            locale={ko}
            disabled={(date: Date) => {
              if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
              if (date > addDays(new Date(), 14)) return true;
              const plate = user?.vehicle?.plateNumber || '';
              if (plate && isRestricted(plate, date)) return true;
              return false;
            }}
            className="mx-auto"
          />
          {/* 선택된 날짜 요약 */}
          {departureDates.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {departureDates
                .sort((a, b) => a.getTime() - b.getTime())
                .map(d => (
                  <span key={format(d, 'yyyy-MM-dd')} className="bg-primary-container/10 text-primary-container text-xs font-bold px-2.5 py-1 rounded-full">
                    {format(d, 'M/d(EEE)', { locale: ko })}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* 출발 시간 — iOS 휠 피커 */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary-container" />
            <label className="text-[10px] font-bold text-on-surface-variant">출발 시간</label>
            <span className="ml-auto text-lg font-black text-primary-container tabular-nums">
              {departureTimeStr}
            </span>
          </div>
          <div className="h-[160px] overflow-hidden rounded-xl bg-slate-50">
            <Picker
              value={{ hour: String(departureHour).padStart(2, '0'), minute: String(departureMinute).padStart(2, '0') }}
              onChange={(val) => {
                setDepartureHour(parseInt(val.hour));
                setDepartureMinute(parseInt(val.minute));
              }}
              wheelMode="natural"
              height={160}
              itemHeight={40}
            >
              {/* @ts-ignore react-mobile-picker type issue */}
              <Picker.Column name="hour">
                {Array.from({ length: 14 }, (_, i) => i + 6).map(h => (
                  <Picker.Item key={h} value={String(h).padStart(2, '0')}>
                    {({ selected }) => (
                      <span className={`text-lg tabular-nums ${selected ? 'font-black text-primary-container' : 'font-medium text-slate-400'}`}>
                        {String(h).padStart(2, '0')}시
                      </span>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
              {/* @ts-ignore react-mobile-picker type issue */}
              <Picker.Column name="minute">
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                  <Picker.Item key={m} value={String(m).padStart(2, '0')}>
                    {({ selected }) => (
                      <span className={`text-lg tabular-nums ${selected ? 'font-black text-primary-container' : 'font-medium text-slate-400'}`}>
                        {String(m).padStart(2, '0')}분
                      </span>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
            </Picker>
          </div>
        </div>

        {/* 잔여 좌석 */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
          <label className="text-[10px] font-bold text-on-surface-variant mb-4 block">탑승 가능 인원</label>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setAvailableSeats(Math.max(1, availableSeats - 1))}
              className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center active:scale-90 transition-all"
            >
              <Minus className="w-5 h-5 text-slate-500" />
            </button>
            <div className="text-center">
              <span className="text-4xl font-black text-primary-container">{availableSeats}</span>
              <p className="text-xs text-on-surface-variant font-bold mt-1">명</p>
            </div>
            <button
              onClick={() => setAvailableSeats(Math.min(6, availableSeats + 1))}
              className="w-12 h-12 rounded-full border-2 border-primary-container bg-primary-container/10 flex items-center justify-center text-primary-container active:scale-90 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
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
        {isSubmitting ? '등록 중...' : departureDates.length > 1 ? `${departureDates.length}일 운행 한번에 등록` : '동승자 모집 시작'}
      </button>
    </motion.div>
  );
}

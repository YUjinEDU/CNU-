import { useState } from 'react';
import { Search, Building, FlaskConical, Building2, Tractor, MapPin, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Coordinate } from '../../types';
import { AddressSearch } from '../../components/AddressSearch';
import { useApp } from '../../contexts/AppContext';
import { showToast } from '../../components/Toast';

export function PassengerSetupScreen() {
  const { user, setState, setPickupPoint, setSearchMode, setSearchDate } = useApp();

  // 출발지
  const firstAddr = user?.savedAddresses?.[0];
  const hasValidCoord = firstAddr && firstAddr.lat !== 0 && firstAddr.lng !== 0;
  const [pickupLocation, setPickupLocation] = useState(firstAddr?.name || '');
  const [pickupCoords, setPickupCoords] = useState<Coordinate | null>(
    hasValidCoord ? { lat: firstAddr.lat, lng: firstAddr.lng } : null
  );

  // 날짜
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // 목적지 권역
  const [destinationZone, setDestinationZone] = useState('');

  const zones = [
    { id: 'eng', name: '공과대학 권역', icon: Building, desc: '1, 2, 3호관 주변' },
    { id: 'sci', name: '자연과학대학 권역', icon: FlaskConical, desc: '기초과학관 주변' },
    { id: 'hq', name: '대학본부 권역', icon: Building2, desc: '중앙도서관 방면' },
    { id: 'agri', name: '농생대 권역', icon: Tractor, desc: '실험농장 주변' },
    { id: 'other', name: '기타', icon: MapPin, desc: '기타 지역' },
  ];

  const handleSearch = () => {
    if (!destinationZone) {
      showToast('목적지 권역을 선택해주세요.', 'info');
      return;
    }
    if (pickupCoords) {
      setPickupPoint(pickupCoords);
    }
    setSearchMode('commute');
    setSearchDate(selectedDate);
    setState('PASSENGER_SEARCH');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 py-8 space-y-6 pb-32"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">카풀 검색</h2>
        <button onClick={() => setState('HOME')} className="text-primary-container text-sm font-bold bg-blue-50 px-4 py-2 rounded-full">
          취소
        </button>
      </div>

      {/* 날짜 선택 */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-container" />
            <label className="text-[10px] font-bold text-on-surface-variant">날짜 선택</label>
          </div>
          <span className="text-sm font-bold text-primary-container">
            {format(new Date(selectedDate + 'T00:00:00'), 'M월 d일 (EEE)', { locale: ko })}
          </span>
        </div>
        <div className="flex gap-2 mb-3 flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6].map(offset => {
            const d = addDays(new Date(), offset);
            const dateStr = format(d, 'yyyy-MM-dd');
            const label = offset === 0 ? '오늘' : offset === 1 ? '내일' : offset === 2 ? '모레' : format(d, 'M/d(EEE)', { locale: ko });
            return (
              <button key={offset} onClick={() => setSelectedDate(dateStr)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedDate === dateStr ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-500'}`}>
                {label}
              </button>
            );
          })}
        </div>
        <DayPicker
          mode="single"
          selected={new Date(selectedDate + 'T00:00:00')}
          onSelect={(d) => d && setSelectedDate(format(d, 'yyyy-MM-dd'))}
          locale={ko}
          disabled={{ before: new Date(), after: addDays(new Date(), 14) }}
          className="mx-auto"
        />
      </div>

      {/* 출발지 */}
      <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm">
        <label className="text-[10px] font-bold text-on-surface-variant mb-3 block">출발지</label>
        <AddressSearch
          value={pickupLocation}
          onAddressSelected={(result) => {
            setPickupLocation(result.name);
            if (result.lat !== 0) setPickupCoords({ lat: result.lat, lng: result.lng });
          }}
          placeholder="출발지 주소 검색 (카카오 우편번호)"
        />
        {pickupLocation && (
          <p className="text-xs text-green-600 font-medium mt-2">{pickupLocation}</p>
        )}
      </div>

      {/* 목적지 권역 */}
      <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm">
        <label className="text-[10px] font-bold text-on-surface-variant mb-4 block">목적지 권역</label>
        <div className="grid grid-cols-2 gap-3">
          {zones.map(zone => (
            <button
              key={zone.id}
              onClick={() => setDestinationZone(zone.name)}
              className={`flex flex-col items-start p-4 rounded-lg transition-all ${destinationZone === zone.name ? 'bg-primary-container text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-primary-container/10'}`}
            >
              <zone.icon className="w-5 h-5 mb-2" />
              <span className="font-bold text-sm">{zone.name}</span>
              <span className="text-[10px] opacity-70">{zone.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSearch}
        disabled={!destinationZone}
        className={`w-full py-5 rounded-xl text-lg font-bold shadow-xl flex items-center justify-center gap-3 transition-all ${
          destinationZone
            ? 'bg-primary-container text-white active:scale-95'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
      >
        <Search className="w-6 h-6" />
        카풀 검색하기
      </button>
    </motion.div>
  );
}

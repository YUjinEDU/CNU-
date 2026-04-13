import { useState } from 'react';
import { Search, Building, FlaskConical, Building2, Tractor } from 'lucide-react';
import { motion } from 'motion/react';
import { Coordinate } from '../../types';
import { AddressAutocomplete } from '../../components/AddressAutocomplete';
import { useApp } from '../../contexts/AppContext';

export function PassengerSetupScreen() {
  const { user, setState, walkingRadius, setWalkingRadius, setPickupPoint } = useApp();
  const [pickupLocation, setPickupLocation] = useState(user?.savedAddresses?.[0]?.name || '');
  const [pickupCoords, setPickupCoords] = useState<Coordinate | null>(
    user?.savedAddresses?.[0] ? { lat: user.savedAddresses[0].lat, lng: user.savedAddresses[0].lng } : null
  );
  const [destinationZone, setDestinationZone] = useState('');

  const handleSearch = () => {
    if (!pickupLocation || !destinationZone) {
      alert('픽업 지역과 목적지 권역을 선택해주세요.');
      return;
    }
    setPickupPoint(pickupCoords);
    setState('PASSENGER_SEARCH');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 py-8 space-y-8 pb-32"
    >
      <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">카풀 검색하기</h2>

      <div className="space-y-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">희망 픽업 지역 검색</label>
          <AddressAutocomplete
            value={pickupLocation}
            onChange={setPickupLocation}
            onPlaceSelected={(place) => {
              setPickupLocation(place.name);
              setPickupCoords({ lat: place.lat, lng: place.lng });
            }}
            placeholder="주변 지역 검색"
          />
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 block">목적지 권역 선택</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'eng', name: '공과대학 권역', icon: Building, desc: '1, 2, 3호관 주변' },
              { id: 'sci', name: '자연과학대학 권역', icon: FlaskConical, desc: '기초과학관 주변' },
              { id: 'hq', name: '대학본부 권역', icon: Building2, desc: '중앙도서관 방면' },
              { id: 'agri', name: '농생대 권역', icon: Tractor, desc: '실험농장 주변' },
            ].map(zone => (
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

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm text-center space-y-6">
          <h3 className="text-xl font-extrabold text-primary-container">🏃‍♂️ 나는 최대 몇 분까지 걸어갈 수 있나요?</h3>
          <div className="space-y-4">
            <div className="flex justify-between px-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${walkingRadius === 5 ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-400'}`}>5분</span>
              <span className="text-2xl font-black text-primary-container tracking-tighter">{walkingRadius}분</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${walkingRadius === 15 ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-400'}`}>15분</span>
            </div>
            <input
              type="range"
              min="5" max="15" step="1"
              value={walkingRadius}
              onChange={(e) => setWalkingRadius(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-full appearance-none accent-primary-container"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSearch}
        className="w-full py-5 bg-primary-container text-white rounded-xl text-lg font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <Search className="w-6 h-6" />
        내 주변 동승 차량 찾기
      </button>
    </motion.div>
  );
}

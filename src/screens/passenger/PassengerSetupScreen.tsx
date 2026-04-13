import { useState } from 'react';
import { Search, Building, FlaskConical, Building2, Tractor } from 'lucide-react';
import { motion } from 'motion/react';
import { Coordinate } from '../../types';
import { MapComponent } from '../../components/MapComponent';
import { AddressSearch } from '../../components/AddressSearch';
import { useApp } from '../../contexts/AppContext';

export function PassengerSetupScreen() {
  const { user, setState, walkingRadius, setWalkingRadius, setPickupPoint } = useApp();
  const firstAddr = user?.savedAddresses?.[0];
  const hasValidCoord = firstAddr && firstAddr.lat !== 0 && firstAddr.lng !== 0;
  const [pickupLocation, setPickupLocation] = useState(firstAddr?.name || '');
  const [pickupCoords, setPickupCoords] = useState<Coordinate | null>(
    hasValidCoord ? { lat: firstAddr.lat, lng: firstAddr.lng } : null
  );
  const [destinationZone, setDestinationZone] = useState('');

  const walkingRadiusMeters = walkingRadius * 80; // 약 80m/분

  const handleSearch = () => {
    if (!pickupCoords || !destinationZone) {
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
      className="px-6 py-8 space-y-6 pb-32"
    >
      <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">카풀 검색하기</h2>

      {/* 지도 — 내 위치 + 도보 반경 원 */}
      {pickupCoords && (
        <div className="rounded-xl overflow-hidden h-48 bg-slate-200">
          <MapComponent
            center={pickupCoords}
            zoom={15}
            markers={[pickupCoords]}
            circles={[{ center: pickupCoords, radius: walkingRadiusMeters, color: '#3b82f6' }]}
          />
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">내 출발 위치</label>
          <AddressSearch
            value={pickupLocation}
            onAddressSelected={(result) => {
              setPickupLocation(result.name);
              if (result.lat !== 0) setPickupCoords({ lat: result.lat, lng: result.lng });
            }}
            placeholder="집 주소 검색 (카카오 우편번호)"
          />
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm">
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

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm text-center space-y-4">
          <h3 className="text-lg font-extrabold text-primary-container">🏃‍♂️ 최대 도보 시간</h3>
          <div className="flex justify-between px-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${walkingRadius === 5 ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-400'}`}>5분</span>
            <span className="text-2xl font-black text-primary-container">{walkingRadius}분</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${walkingRadius === 15 ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-400'}`}>15분</span>
          </div>
          <input
            type="range" min="5" max="15" step="1"
            value={walkingRadius}
            onChange={(e) => setWalkingRadius(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-full appearance-none accent-primary-container"
          />
          <p className="text-xs text-on-surface-variant">약 {walkingRadiusMeters}m 반경</p>
        </div>
      </div>

      <button
        onClick={handleSearch}
        disabled={!pickupCoords || !destinationZone}
        className={`w-full py-5 rounded-xl text-lg font-bold shadow-xl flex items-center justify-center gap-3 transition-all ${
          pickupCoords && destinationZone
            ? 'bg-primary-container text-white active:scale-95'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
      >
        <Search className="w-6 h-6" />
        내 주변 동승 차량 찾기
      </button>
    </motion.div>
  );
}

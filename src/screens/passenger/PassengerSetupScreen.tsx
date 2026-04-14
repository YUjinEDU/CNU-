import { useState } from 'react';
import { Search, Building, FlaskConical, Building2, Tractor, MapPin, ArrowRightLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Coordinate } from '../../types';
// import { MapComponent } from '../../components/MapComponent';  // 지도 비활성화
import { AddressSearch } from '../../components/AddressSearch';
import { CampusBuildingSelector } from '../../components/CampusBuildingSelector';
import { useApp } from '../../contexts/AppContext';
import { showToast } from '../../components/Toast';

export function PassengerSetupScreen() {
  const { user, setState, setPickupPoint, setSearchMode } = useApp();

  // 출퇴근 모드
  const [mode, setMode] = useState<'commute' | 'return'>('commute');

  // 집 주소 (savedAddresses[0])
  const firstAddr = user?.savedAddresses?.[0];
  const hasValidCoord = firstAddr && firstAddr.lat !== 0 && firstAddr.lng !== 0;
  const [homeLocation, setHomeLocation] = useState(firstAddr?.name || '');
  const [homeCoords, setHomeCoords] = useState<Coordinate | null>(
    hasValidCoord ? { lat: firstAddr.lat, lng: firstAddr.lng } : null
  );

  // 캠퍼스 권역
  const [campusZone, setCampusZone] = useState('');

  const zones = [
    { id: 'eng', name: '공과대학 권역', icon: Building, desc: '1, 2, 3호관 주변' },
    { id: 'sci', name: '자연과학대학 권역', icon: FlaskConical, desc: '기초과학관 주변' },
    { id: 'hq', name: '대학본부 권역', icon: Building2, desc: '중앙도서관 방면' },
    { id: 'agri', name: '농생대 권역', icon: Tractor, desc: '실험농장 주변' },
    { id: 'other', name: '기타', icon: MapPin, desc: '캠퍼스 외 지역' },
  ];

  const handleSearch = () => {
    if (!campusZone) {
      showToast('캠퍼스 권역을 선택해주세요.', 'info');
      return;
    }
    // 양쪽 모두 집 좌표를 기준으로 정렬 (출근: sourceCoord, 퇴근: destCoord)
    if (homeCoords) {
      setPickupPoint(homeCoords);
    }
    setSearchMode(mode);
    setState('PASSENGER_SEARCH');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 py-8 space-y-6 pb-32"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">카풀 검색하기</h2>
        <button onClick={() => setState('HOME')} className="text-primary-container text-sm font-bold bg-blue-50 px-4 py-2 rounded-full">
          취소
        </button>
      </div>

      {/* 출근/퇴근 토글 */}
      <div className="flex bg-surface-container-lowest rounded-xl p-1.5 shadow-sm">
        <button
          onClick={() => setMode('commute')}
          className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
            mode === 'commute' ? 'bg-primary-container text-white shadow-md' : 'text-on-surface-variant'
          }`}
        >
          🌅 출근 (집 → 학교)
        </button>
        <button
          onClick={() => setMode('return')}
          className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
            mode === 'return' ? 'bg-primary-container text-white shadow-md' : 'text-on-surface-variant'
          }`}
        >
          🌆 퇴근 (학교 → 집)
        </button>
      </div>

      <div className="space-y-6">
        {/* 출발지 */}
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">
            {mode === 'commute' ? '내 출발 위치 (집)' : '출발 위치 (캠퍼스)'}
          </label>
          {mode === 'commute' ? (
            <>
              <AddressSearch
                value={homeLocation}
                onAddressSelected={(result) => {
                  setHomeLocation(result.name);
                  if (result.lat !== 0) setHomeCoords({ lat: result.lat, lng: result.lng });
                }}
                placeholder="집 주소 검색 (카카오 우편번호)"
              />
              {homeLocation && (
                <p className="text-xs text-green-600 font-medium mt-2">{homeLocation}</p>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {zones.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => setCampusZone(zone.name)}
                  className={`flex flex-col items-start p-4 rounded-lg transition-all ${campusZone === zone.name ? 'bg-primary-container text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-primary-container/10'}`}
                >
                  <zone.icon className="w-5 h-5 mb-2" />
                  <span className="font-bold text-sm">{zone.name}</span>
                  <span className="text-[10px] opacity-70">{zone.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 목적지 */}
        <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 block">
            {mode === 'commute' ? '목적지 (캠퍼스 권역)' : '목적지 (집 방향)'}
          </label>
          {mode === 'commute' ? (
            <div className="grid grid-cols-2 gap-3">
              {zones.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => setCampusZone(zone.name)}
                  className={`flex flex-col items-start p-4 rounded-lg transition-all ${campusZone === zone.name ? 'bg-primary-container text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-primary-container/10'}`}
                >
                  <zone.icon className="w-5 h-5 mb-2" />
                  <span className="font-bold text-sm">{zone.name}</span>
                  <span className="text-[10px] opacity-70">{zone.desc}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <AddressSearch
                value={homeLocation}
                onAddressSelected={(result) => {
                  setHomeLocation(result.name);
                  if (result.lat !== 0) setHomeCoords({ lat: result.lat, lng: result.lng });
                }}
                placeholder="집 주소 검색 (카카오 우편번호)"
              />
              {homeLocation && (
                <p className="text-xs text-green-600 font-medium mt-2">{homeLocation}</p>
              )}
            </>
          )}
        </div>
      </div>

      <button
        onClick={handleSearch}
        disabled={!campusZone}
        className={`w-full py-5 rounded-xl text-lg font-bold shadow-xl flex items-center justify-center gap-3 transition-all ${
          campusZone
            ? 'bg-primary-container text-white active:scale-95'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
      >
        <Search className="w-6 h-6" />
        {mode === 'commute' ? '출근 카풀 찾기' : '퇴근 카풀 찾기'}
      </button>
    </motion.div>
  );
}

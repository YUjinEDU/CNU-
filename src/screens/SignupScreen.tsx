import { useState } from 'react';
import { School, Car, Home, Building2, Hash } from 'lucide-react';
import { motion } from 'motion/react';
import { User, SavedAddress, Vehicle } from '../types';
// createdAt을 로컬에서 생성
import { AddressSearch } from '../components/AddressSearch';
import { CampusBuildingSelector } from '../components/CampusBuildingSelector';
import { saveUser } from '../lib/localDb';
import { useApp } from '../contexts/AppContext';

export function SignupScreen() {
  const { setUser, setState, localUid } = useApp();
  const [name, setName] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [dept, setDept] = useState('');
  const [role, setRole] = useState<'driver' | 'passenger' | 'both'>('both');
  const [homeAddr, setHomeAddr] = useState<SavedAddress>({ name: '', lat: 0, lng: 0 });
  const [workAddr, setWorkAddr] = useState<SavedAddress>({ name: '', lat: 0, lng: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 차량 정보
  const [plateNumber, setPlateNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');

  const handleSignup = async () => {
    if (!name || !dept) {
      alert('이름과 소속을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);

    const addresses: SavedAddress[] = [];
    if (homeAddr.name) addresses.push(homeAddr);
    if (workAddr.name) addresses.push(workAddr);

    const vehicle: Vehicle | undefined = plateNumber
      ? { plateNumber, model: carModel, color: carColor, seatCapacity: 4 }
      : undefined;

    const newUser: User = {
      uid: localUid,
      name,
      employeeNumber: employeeNumber || undefined,
      department: dept,
      role,
      isVerified: true,
      savedAddresses: addresses.length > 0 ? addresses : undefined,
      vehicle,
      createdAt: new Date().toISOString()
    };

    try {
      saveUser(newUser);
      setUser(newUser);
      setState('HOME');
    } catch (error) {
      console.error("Error saving user:", error);
      alert("가입 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 py-12 space-y-8 pb-32"
    >
      <div className="text-center space-y-2">
        <School className="w-16 h-16 text-primary-container mx-auto" />
        <h2 className="text-3xl font-black text-primary-container tracking-tight">CNU 카풀 시작하기</h2>
        <p className="text-on-surface-variant">정보를 입력하면 바로 시작할 수 있어요.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">이름 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-4 bg-surface-container-lowest border-none rounded-xl text-on-surface font-semibold shadow-sm focus:ring-2 focus:ring-primary-container"
            placeholder="예: 홍길동"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">교번 *</label>
          <div className="relative flex items-center">
            <Hash className="absolute left-4 w-5 h-5 text-primary-container" />
            <input
              type="text"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-none rounded-xl text-on-surface font-semibold shadow-sm focus:ring-2 focus:ring-primary-container"
              placeholder="예: 2024-12345"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">소속 부서/학과 *</label>
          <input
            type="text"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="w-full px-4 py-4 bg-surface-container-lowest border-none rounded-xl text-on-surface font-semibold shadow-sm focus:ring-2 focus:ring-primary-container"
            placeholder="예: 공과대학 컴퓨터공학과"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">주 이용 목적</label>
          <div className="grid grid-cols-3 gap-2">
            {(['passenger', 'driver', 'both'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`py-3 rounded-xl font-bold text-sm transition-colors ${role === r ? 'bg-primary-container text-white' : 'bg-surface-container-lowest text-on-surface-variant'}`}
              >
                {r === 'passenger' ? '탑승' : r === 'driver' ? '운전' : '둘 다'}
              </button>
            ))}
          </div>
        </div>

        {(role === 'driver' || role === 'both') && (
          <div className="space-y-4 bg-blue-50/50 p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-5 h-5 text-primary-container" />
              <label className="text-xs font-bold text-primary-container uppercase tracking-widest">차량 정보</label>
            </div>
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              className="w-full px-4 py-3 bg-white border-none rounded-xl text-on-surface font-semibold shadow-sm focus:ring-2 focus:ring-primary-container"
              placeholder="차량 번호 (예: 대전 12가 3456)"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                className="px-4 py-3 bg-white border-none rounded-xl text-on-surface font-semibold shadow-sm focus:ring-2 focus:ring-primary-container"
                placeholder="차종 (예: 그랜저)"
              />
              <input
                type="text"
                value={carColor}
                onChange={(e) => setCarColor(e.target.value)}
                className="px-4 py-3 bg-white border-none rounded-xl text-on-surface font-semibold shadow-sm focus:ring-2 focus:ring-primary-container"
                placeholder="색상 (예: 화이트)"
              />
            </div>
          </div>
        )}

        <div className="space-y-5">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">주소 저장</label>

          <div className="space-y-2">
            <div className="flex items-center gap-2 ml-1">
              <Home className="w-4 h-4 text-primary-container" />
              <span className="text-sm font-bold text-on-surface">집</span>
            </div>
            <AddressSearch
              value={homeAddr.name}
              onAddressSelected={(result) => setHomeAddr({ name: result.name, lat: result.lat, lng: result.lng })}
              placeholder="집 주소를 검색해주세요"
            />
            {homeAddr.lat !== 0 && (
              <p className="text-[10px] text-green-600 font-medium ml-1">✓ 주소 확인 완료</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 ml-1">
              <Building2 className="w-4 h-4 text-primary-container" />
              <span className="text-sm font-bold text-on-surface">직장 (캠퍼스 건물)</span>
            </div>
            <CampusBuildingSelector
              value={workAddr.name}
              onBuildingSelected={(building) => setWorkAddr({ name: building.name, lat: building.lat, lng: building.lng })}
              placeholder="캠퍼스 권역을 선택해주세요"
            />
            {workAddr.lat !== 0 && (
              <p className="text-[10px] text-green-600 font-medium ml-1">✓ {workAddr.name}</p>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleSignup}
        disabled={!name || !dept || isSubmitting}
        className={`w-full py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${
          name && dept && !isSubmitting
            ? 'bg-primary-container text-white active:scale-95'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
      >
        {isSubmitting ? '저장 중...' : '시작하기'}
      </button>
    </motion.div>
  );
}

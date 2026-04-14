import { useState } from 'react';
import { Plus, ArrowLeft, Car } from 'lucide-react';
import { motion } from 'motion/react';
import { SavedAddress } from '../types';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { saveUser } from '../lib/firebaseDb';
import { useApp } from '../contexts/AppContext';
import { showToast } from '../components/Toast';

export function ProfileEditScreen() {
  const { user, setUser, setState } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [plateNumber, setPlateNumber] = useState(user?.vehicle?.plateNumber || '');
  const [carModel, setCarModel] = useState(user?.vehicle?.model || '');
  const [carColor, setCarColor] = useState(user?.vehicle?.color || '');
  const [addresses, setAddresses] = useState<SavedAddress[]>(user?.savedAddresses || [{ name: '', lat: 0, lng: 0 }]);

  const handleAddAddress = () => setAddresses([...addresses, { name: '', lat: 0, lng: 0 }]);
  const handleAddressChange = (idx: number, place: { name: string; lat: number; lng: number }) => {
    const newAddrs = [...addresses];
    newAddrs[idx] = place;
    setAddresses(newAddrs);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('이름을 입력해주세요.', 'info');
      return;
    }
    if (!user) return;

    const vehicle = plateNumber ? {
      plateNumber,
      model: carModel,
      color: carColor,
      seatCapacity: user.vehicle?.seatCapacity ?? 4,
    } : user.vehicle;

    const updatedUser = {
      ...user,
      name: name.trim(),
      department: department.trim(),
      vehicle,
      savedAddresses: addresses.filter(a => a.name),
    };

    try {
      await saveUser(updatedUser);
      setUser(updatedUser);
      showToast('프로필이 저장되었습니다.', 'success');
      setState('PROFILE');
    } catch (error) {
      showToast('프로필 업데이트 중 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-5 pt-6 space-y-6 pb-32"
    >
      <div className="flex items-center gap-4">
        <button onClick={() => setState('PROFILE')} className="p-2 bg-surface-container-lowest rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <h2 className="text-2xl font-extrabold text-primary-container tracking-tight">프로필 수정</h2>
      </div>

      {/* 기본 정보 */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm space-y-4">
        <p className="text-[10px] font-bold text-on-surface-variant">기본 정보</p>
        <div>
          <label className="text-xs text-on-surface-variant font-medium mb-1 block">이름</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 rounded-xl text-on-surface font-semibold outline-none focus:ring-2 focus:ring-primary-container"
          />
        </div>
        <div>
          <label className="text-xs text-on-surface-variant font-medium mb-1 block">소속</label>
          <input
            type="text"
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 rounded-xl text-on-surface font-semibold outline-none focus:ring-2 focus:ring-primary-container"
          />
        </div>
      </div>

      {/* 차량 정보 */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-primary-container" />
          <p className="text-[10px] font-bold text-on-surface-variant">차량 정보</p>
        </div>
        <div>
          <label className="text-xs text-on-surface-variant font-medium mb-1 block">차량 번호</label>
          <input
            type="text"
            value={plateNumber}
            onChange={e => setPlateNumber(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 rounded-xl text-on-surface font-semibold outline-none focus:ring-2 focus:ring-primary-container"
            placeholder="예: 대전 12가 3456"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-on-surface-variant font-medium mb-1 block">차종</label>
            <input
              type="text"
              value={carModel}
              onChange={e => setCarModel(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl text-on-surface font-semibold outline-none focus:ring-2 focus:ring-primary-container"
              placeholder="예: 그랜저"
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant font-medium mb-1 block">색상</label>
            <input
              type="text"
              value={carColor}
              onChange={e => setCarColor(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl text-on-surface font-semibold outline-none focus:ring-2 focus:ring-primary-container"
              placeholder="예: 화이트"
            />
          </div>
        </div>
      </div>

      {/* 주소 */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-bold text-on-surface-variant">자주 가는 주소</p>
          <button onClick={handleAddAddress} className="text-primary-container text-xs font-bold flex items-center gap-1">
            <Plus className="w-3 h-3" /> 추가
          </button>
        </div>
        {addresses.map((addr, idx) => (
          <AddressAutocomplete
            key={idx}
            value={addr.name}
            onChange={(val) => {
              const newAddrs = [...addresses];
              newAddrs[idx] = { ...newAddrs[idx], name: val };
              setAddresses(newAddrs);
            }}
            onPlaceSelected={(place) => handleAddressChange(idx, place)}
          />
        ))}
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        저장하기
      </button>
    </motion.div>
  );
}

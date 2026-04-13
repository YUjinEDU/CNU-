import { useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { SavedAddress } from '../types';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { saveUser } from '../lib/localDb';
import { useApp } from '../contexts/AppContext';

export function ProfileEditScreen() {
  const { user, setUser, setState, localUid } = useApp();
  const [addresses, setAddresses] = useState<SavedAddress[]>(user?.savedAddresses || [{ name: '', lat: 0, lng: 0 }]);

  const handleAddAddress = () => setAddresses([...addresses, { name: '', lat: 0, lng: 0 }]);
  const handleAddressChange = (idx: number, place: { name: string; lat: number; lng: number }) => {
    const newAddrs = [...addresses];
    newAddrs[idx] = place;
    setAddresses(newAddrs);
  };

  const handleSave = async () => {
    if (addresses.some(a => !a.name)) {
      alert('모든 주소를 입력해주세요.');
      return;
    }
    if (!user) return;

    const updatedUser = {
      ...user,
      savedAddresses: addresses
    };

    try {
      saveUser(updatedUser);
      setUser(updatedUser);
      setState('PROFILE');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("프로필 업데이트 중 오류가 발생했습니다.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-5 pt-6 space-y-8 pb-32"
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setState('PROFILE')} className="p-2 bg-surface-container-lowest rounded-full shadow-sm">
          <ArrowRight className="w-6 h-6 rotate-180 text-on-surface" />
        </button>
        <h2 className="text-2xl font-extrabold text-primary-container tracking-tight">프로필 수정</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">자주 가는 주소</label>
            <button
              onClick={handleAddAddress}
              className="text-primary-container text-xs font-bold flex items-center gap-1"
            >
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
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all mt-8"
      >
        저장하기
      </button>
    </motion.div>
  );
}

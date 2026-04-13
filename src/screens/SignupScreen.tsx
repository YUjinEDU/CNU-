import { useState } from 'react';
import { School, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { User, SavedAddress } from '../types';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useApp } from '../contexts/AppContext';

export function SignupScreen() {
  const { setUser, setState } = useApp();
  const [name, setName] = useState(auth.currentUser?.displayName || '');
  const [dept, setDept] = useState('');
  const [role, setRole] = useState<'driver' | 'passenger' | 'both'>('passenger');
  const [addresses, setAddresses] = useState<SavedAddress[]>([{ name: '', lat: 0, lng: 0 }]);

  const handleAddAddress = () => setAddresses([...addresses, { name: '', lat: 0, lng: 0 }]);
  const handleAddressChange = (idx: number, place: { name: string; lat: number; lng: number }) => {
    const newAddrs = [...addresses];
    newAddrs[idx] = place;
    setAddresses(newAddrs);
  };

  const handleSignup = async () => {
    if (!name || !dept || addresses.some(a => !a.name)) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    if (!auth.currentUser) return;

    const newUser: User = {
      uid: auth.currentUser.uid,
      name,
      department: dept,
      role,
      isVerified: true,
      savedAddresses: addresses,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), newUser);
      setUser(newUser);
      setState('HOME');
    } catch (error) {
      console.error("Error saving user:", error);
      alert("회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 py-12 space-y-8"
    >
      <div className="text-center space-y-2">
        <School className="w-16 h-16 text-primary-container mx-auto" />
        <h2 className="text-3xl font-black text-primary-container tracking-tight">CNU 카풀 시작하기</h2>
        <p className="text-on-surface-variant">교직원 인증을 위해 정보를 입력해주세요.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-4 bg-surface-container-lowest border-none rounded-xl text-on-surface font-semibold shadow-sm focus:ring-2 focus:ring-primary-container"
            placeholder="예: 홍길동"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">소속 부서/학과</label>
          <input
            type="text"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="w-full px-4 py-4 bg-surface-container-lowest border-none rounded-xl text-on-surface font-semibold shadow-sm focus:ring-2 focus:ring-primary-container"
            placeholder="예: 공과대학 행정실"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">주 이용 목적</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setRole('passenger')}
              className={`py-3 rounded-xl font-bold text-sm transition-colors ${role === 'passenger' ? 'bg-primary-container text-white' : 'bg-surface-container-lowest text-on-surface-variant'}`}
            >탑승</button>
            <button
              onClick={() => setRole('driver')}
              className={`py-3 rounded-xl font-bold text-sm transition-colors ${role === 'driver' ? 'bg-primary-container text-white' : 'bg-surface-container-lowest text-on-surface-variant'}`}
            >운전</button>
            <button
              onClick={() => setRole('both')}
              className={`py-3 rounded-xl font-bold text-sm transition-colors ${role === 'both' ? 'bg-primary-container text-white' : 'bg-surface-container-lowest text-on-surface-variant'}`}
            >둘 다</button>
          </div>
        </div>

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
        onClick={handleSignup}
        className="w-full bg-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        가입 완료 및 시작하기
      </button>
    </motion.div>
  );
}

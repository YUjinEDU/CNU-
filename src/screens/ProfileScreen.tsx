import React from 'react';
import { MapPin, Car, Settings, LogOut, ChevronRight, BadgeCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';

export function ProfileScreen() {
  const { user, setUser, setState } = useApp();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-6 space-y-6 pb-32"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">내 정보</h2>
        <button
          onClick={() => setState('PROFILE_EDIT')}
          className="text-primary-container font-bold text-sm bg-blue-50 px-4 py-2 rounded-full"
        >
          프로필 수정
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex items-center gap-5">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary-container/10">
          <img src="https://picsum.photos/seed/faculty/100/100" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-primary-container">{user?.name}</h3>
          <p className="text-on-surface-variant font-medium">{user?.department}</p>
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-primary-container rounded-full text-[10px] font-bold mt-2">
            <BadgeCheck className="w-3 h-3 fill-current" />
            SSO 인증 완료
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest ml-1">자주 가는 주소</h4>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm space-y-4">
          {user?.savedAddresses?.map((addr, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-4">
                <div className="bg-primary-container/10 p-3 rounded-full">
                  <MapPin className="w-5 h-5 text-primary-container" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">주소 {idx + 1}</p>
                  <p className="font-bold text-on-surface">{typeof addr === 'string' ? addr : addr.name}</p>
                </div>
              </div>
              {idx < (user.savedAddresses?.length || 0) - 1 && <div className="w-full h-px bg-slate-100"></div>}
            </React.Fragment>
          ))}
          {(!user?.savedAddresses || user.savedAddresses.length === 0) && (
            <p className="text-on-surface-variant text-sm text-center py-4">등록된 주소가 없습니다.</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest ml-1">차량 정보</h4>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary-container/10 p-3 rounded-full">
              <Car className="w-6 h-6 text-primary-container" />
            </div>
            <div>
              <p className="font-bold text-on-surface">12가 3456</p>
              <p className="text-xs text-on-surface-variant">그랜저 하이브리드 (화이트)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest ml-1">이용 기록</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-black text-primary-container mb-1">12</p>
            <p className="text-xs font-bold text-on-surface-variant">운행 횟수</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-black text-primary-container mb-1">5</p>
            <p className="text-xs font-bold text-on-surface-variant">탑승 횟수</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <button className="w-full bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between text-on-surface font-bold shadow-sm">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-on-surface-variant" />
            설정
          </div>
          <ChevronRight className="w-5 h-5 text-outline" />
        </button>
        <button
          onClick={() => {
            setUser(null);
            setState('SIGNUP');
          }}
          className="w-full bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between text-red-500 font-bold shadow-sm"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            로그아웃
          </div>
        </button>
      </div>
    </motion.div>
  );
}

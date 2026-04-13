import { Home as HomeIcon, Car, Users, User as UserIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function BottomNav() {
  const { state, setState } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-2 pb-8 bg-white/80 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,40,83,0.08)] rounded-t-2xl">
      <button onClick={() => setState('HOME')} className={`flex flex-col items-center justify-center px-5 py-2 transition-all ${state === 'HOME' ? 'text-primary-container bg-blue-50 rounded-xl' : 'text-slate-400'}`}>
        <HomeIcon className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-1">홈</span>
      </button>
      <button onClick={() => setState('DRIVER_SETUP')} className={`flex flex-col items-center justify-center px-5 py-2 transition-all ${state.startsWith('DRIVER') ? 'text-primary-container bg-blue-50 rounded-xl' : 'text-slate-400'}`}>
        <Car className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-1">운전</span>
      </button>
      <button onClick={() => setState('PASSENGER_SETUP')} className={`flex flex-col items-center justify-center px-5 py-2 transition-all ${state.startsWith('PASSENGER') ? 'text-primary-container bg-blue-50 rounded-xl' : 'text-slate-400'}`}>
        <Users className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-1">탑승</span>
      </button>
      <button onClick={() => setState('PROFILE')} className={`flex flex-col items-center justify-center px-5 py-2 transition-all ${state === 'PROFILE' ? 'text-primary-container bg-blue-50 rounded-xl' : 'text-slate-400'}`}>
        <UserIcon className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-1">내 정보</span>
      </button>
    </nav>
  );
}

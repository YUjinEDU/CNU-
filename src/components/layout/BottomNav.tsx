import { Home as HomeIcon, Car, Users, User as UserIcon, MessageCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function BottomNav() {
  const { state, setState, currentRide, currentRoute, user } = useApp();

  const rideStatus = currentRide?.status;
  const hasActiveRide = rideStatus && !['completed', 'cancelled', 'rejected'].includes(rideStatus);
  const hasActiveRoute = currentRoute && currentRoute.status === 'active';
  const showChatTab = hasActiveRide && rideStatus !== 'pending';
  const isDriverForRide = currentRide?.driverId === user?.uid;

  const handleDriverTab = () => {
    if (hasActiveRide && isDriverForRide && rideStatus !== 'pending') {
      setState('DRIVER_MATCHED');
    } else if (hasActiveRoute) {
      setState('DRIVER_ACTIVE');
    } else {
      setState('DRIVER_SETUP');
    }
  };

  const handlePassengerTab = () => {
    if (hasActiveRide && !isDriverForRide) {
      setState('PASSENGER_MATCHED');
    } else {
      setState('PASSENGER_SETUP');
    }
  };

  const isDriverActive = state.startsWith('DRIVER');
  const isPassengerActive = state.startsWith('PASSENGER');
  const isChatActive = state === 'CHAT';

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-2 pb-8 bg-white/80 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,40,83,0.08)] rounded-t-2xl">
      <button onClick={() => setState('HOME')} className={`flex flex-col items-center justify-center px-4 py-2 transition-all ${state === 'HOME' ? 'text-primary-container bg-blue-50 rounded-xl' : 'text-slate-400'}`}>
        <HomeIcon className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-1">홈</span>
      </button>
      <button onClick={handleDriverTab} className={`flex flex-col items-center justify-center px-4 py-2 transition-all relative ${isDriverActive ? 'text-primary-container bg-blue-50 rounded-xl' : 'text-slate-400'}`}>
        <Car className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-1">운전</span>
        {hasActiveRoute && !isDriverActive && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full" />
        )}
      </button>
      {showChatTab && (
        <button onClick={() => setState('CHAT')} className={`flex flex-col items-center justify-center px-4 py-2 transition-all relative ${isChatActive ? 'text-green-600 bg-green-50 rounded-xl' : 'text-slate-400'}`}>
          <MessageCircle className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">채팅</span>
          {!isChatActive && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          )}
        </button>
      )}
      <button onClick={handlePassengerTab} className={`flex flex-col items-center justify-center px-4 py-2 transition-all relative ${isPassengerActive ? 'text-primary-container bg-blue-50 rounded-xl' : 'text-slate-400'}`}>
        <Users className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-1">탑승</span>
        {hasActiveRide && !isDriverForRide && !isPassengerActive && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full" />
        )}
      </button>
      <button onClick={() => setState('PROFILE')} className={`flex flex-col items-center justify-center px-4 py-2 transition-all ${state === 'PROFILE' || state === 'PROFILE_EDIT' ? 'text-primary-container bg-blue-50 rounded-xl' : 'text-slate-400'}`}>
        <UserIcon className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-1">내 정보</span>
      </button>
    </nav>
  );
}

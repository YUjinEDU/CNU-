import { AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './contexts/AppContext';
import { TopAppBar } from './components/layout/TopAppBar';
import { BottomNav } from './components/layout/BottomNav';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProfileEditScreen } from './screens/ProfileEditScreen';
import { DriverSetupScreen } from './screens/driver/DriverSetupScreen';
import { DriverActiveScreen } from './screens/driver/DriverActiveScreen';
import { DriverMatchedScreen } from './screens/driver/DriverMatchedScreen';
import { DriverEnRouteScreen } from './screens/driver/DriverEnRouteScreen';
import { DriverArrivedScreen } from './screens/driver/DriverArrivedScreen';
import { DriverInTransitScreen } from './screens/driver/DriverInTransitScreen';
import { PassengerSetupScreen } from './screens/passenger/PassengerSetupScreen';
import { PassengerSearchScreen } from './screens/passenger/PassengerSearchScreen';
import { PassengerMatchedScreen } from './screens/passenger/PassengerMatchedScreen';
import { PassengerEnRouteScreen } from './screens/passenger/PassengerEnRouteScreen';
import { PassengerInTransitScreen } from './screens/passenger/PassengerInTransitScreen';

function AppContent() {
  const { state, isAuthReady } = useApp();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-container"></div>
      </div>
    );
  }

  const showChrome = state !== 'SIGNUP' && state !== 'LOGIN';

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {showChrome && <TopAppBar title={state === 'HOME' ? "CNU 교직원 카풀" : "카풀 서비스"} />}

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {state === 'LOGIN' && <LoginScreen key="login" />}
          {state === 'SIGNUP' && <SignupScreen key="signup" />}
          {state === 'HOME' && <HomeScreen key="home" />}
          {state === 'DRIVER_SETUP' && <DriverSetupScreen key="driver-setup" />}
          {state === 'DRIVER_ACTIVE' && <DriverActiveScreen key="driver-active" />}
          {state === 'DRIVER_MATCHED' && <DriverMatchedScreen key="driver-matched" />}
          {state === 'DRIVER_EN_ROUTE' && <DriverEnRouteScreen key="driver-en-route" />}
          {state === 'DRIVER_ARRIVED' && <DriverArrivedScreen key="driver-arrived" />}
          {state === 'DRIVER_IN_TRANSIT' && <DriverInTransitScreen key="driver-in-transit" />}
          {state === 'PASSENGER_SETUP' && <PassengerSetupScreen key="passenger-setup" />}
          {state === 'PASSENGER_SEARCH' && <PassengerSearchScreen key="passenger-search" />}
          {state === 'PASSENGER_MATCHED' && <PassengerMatchedScreen key="passenger-matched" />}
          {state === 'PASSENGER_EN_ROUTE' && <PassengerEnRouteScreen key="passenger-en-route" />}
          {state === 'PASSENGER_IN_TRANSIT' && <PassengerInTransitScreen key="passenger-in-transit" />}
          {state === 'PROFILE' && <ProfileScreen key="profile" />}
          {state === 'PROFILE_EDIT' && <ProfileEditScreen key="profile-edit" />}
        </AnimatePresence>
      </main>

      {showChrome && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

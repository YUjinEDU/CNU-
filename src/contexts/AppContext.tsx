import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, User, Route, Ride, Coordinate } from '../types';
import { getUser, getActiveRoutes, seedTestData } from '../lib/localDb';

// 로컬 UID
function getLocalUid(): string {
  const KEY = 'cnu-carpool-uid';
  let uid = localStorage.getItem(KEY);
  if (!uid) {
    uid = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(KEY, uid);
  }
  return uid;
}

interface AppContextType {
  state: AppState;
  setState: (state: AppState) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthReady: boolean;
  localUid: string;
  walkingRadius: number;
  setWalkingRadius: (radius: number) => void;
  selectedRoute: Route | null;
  setSelectedRoute: (route: Route | null) => void;
  pickupPoint: Coordinate | null;
  setPickupPoint: (point: Coordinate | null) => void;
  availableRoutes: Route[];
  refreshRoutes: () => void;
  currentRide: Ride | null;
  setCurrentRide: (ride: Ride | null) => void;
  currentRoute: Route | null;
  setCurrentRoute: (route: Route | null) => void;
  driverSource: string;
  setDriverSource: (source: string) => void;
  driverDest: string;
  setDriverDest: (dest: string) => void;
  driverRoute: Coordinate[];
  setDriverRoute: (route: Coordinate[]) => void;
  driverSourceCoord: Coordinate | null;
  setDriverSourceCoord: (coord: Coordinate | null) => void;
  driverDestCoord: Coordinate | null;
  setDriverDestCoord: (coord: Coordinate | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const localUid = getLocalUid();
  const [walkingRadius, setWalkingRadius] = useState(10);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [pickupPoint, setPickupPoint] = useState<Coordinate | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [driverSource, setDriverSource] = useState('');
  const [driverDest, setDriverDest] = useState('');
  const [driverRoute, setDriverRoute] = useState<Coordinate[]>([]);
  const [driverSourceCoord, setDriverSourceCoord] = useState<Coordinate | null>(null);
  const [driverDestCoord, setDriverDestCoord] = useState<Coordinate | null>(null);

  const refreshRoutes = () => setAvailableRoutes(getActiveRoutes());

  // 초기화: 테스트 데이터 시드 + 기존 사용자 확인
  useEffect(() => {
    seedTestData();
    const existingUser = getUser(localUid);
    if (existingUser) {
      setUser(existingUser);
    } else {
      // 데모: 프로필 없으면 첫 번째 테스트 유저로 자동 로그인
      const demoUser = getUser('test-001');
      if (demoUser) {
        localStorage.setItem('cnu-carpool-uid', demoUser.uid);
        setUser(demoUser);
      }
    }
    setState('HOME');
    setAvailableRoutes(getActiveRoutes());
    setIsAuthReady(true);
  }, [localUid]);

  return (
    <AppContext.Provider value={{
      state, setState,
      user, setUser,
      isAuthReady,
      localUid,
      walkingRadius, setWalkingRadius,
      selectedRoute, setSelectedRoute,
      pickupPoint, setPickupPoint,
      availableRoutes, refreshRoutes,
      currentRide, setCurrentRide,
      currentRoute, setCurrentRoute,
      driverSource, setDriverSource,
      driverDest, setDriverDest,
      driverRoute, setDriverRoute,
      driverSourceCoord, setDriverSourceCoord,
      driverDestCoord, setDriverDestCoord,
    }}>
      {children}
    </AppContext.Provider>
  );
}

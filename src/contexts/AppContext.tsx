import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, User, Route, Ride, Coordinate } from '../types';
import { getCurrentEmployeeId } from '../lib/authService';
import { getUser, subscribeToActiveRoutes } from '../lib/firebaseDb';

interface AppContextType {
  state: AppState;
  setState: (state: AppState) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthReady: boolean;
  walkingRadius: number;
  setWalkingRadius: (radius: number) => void;
  selectedRoute: Route | null;
  setSelectedRoute: (route: Route | null) => void;
  pickupPoint: Coordinate | null;
  setPickupPoint: (point: Coordinate | null) => void;
  availableRoutes: Route[];
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

  // 세션 복구: 로그인 유지
  useEffect(() => {
    async function init() {
      const employeeId = getCurrentEmployeeId();
      if (employeeId) {
        const existingUser = await getUser(employeeId);
        if (existingUser) {
          setUser(existingUser);
          setState('HOME');
        } else {
          setState('LOGIN');
        }
      } else {
        setState('LOGIN');
      }
      setIsAuthReady(true);
    }
    init();
  }, []);

  // 실시간 경로 구독
  useEffect(() => {
    const unsubscribe = subscribeToActiveRoutes(setAvailableRoutes);
    return unsubscribe;
  }, []);

  return (
    <AppContext.Provider value={{
      state, setState,
      user, setUser,
      isAuthReady,
      walkingRadius, setWalkingRadius,
      selectedRoute, setSelectedRoute,
      pickupPoint, setPickupPoint,
      availableRoutes,
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

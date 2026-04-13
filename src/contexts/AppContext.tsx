import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, User, Route, Coordinate, SavedAddress } from '../types';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore';

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
  const [driverSource, setDriverSource] = useState('');
  const [driverDest, setDriverDest] = useState('');
  const [driverRoute, setDriverRoute] = useState<Coordinate[]>([]);
  const [driverSourceCoord, setDriverSourceCoord] = useState<Coordinate | null>(null);
  const [driverDestCoord, setDriverDestCoord] = useState<Coordinate | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
          setState('HOME');
        } else {
          setState('SIGNUP');
        }
      } else {
        setUser(null);
        setState('LOGIN');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    const q = query(collection(db, 'routes'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const routesData = snapshot.docs.map(d => ({
        ...d.data(),
        id: d.id
      })) as Route[];
      setAvailableRoutes(routesData);
    });
    return () => unsubscribe();
  }, [isAuthReady, user]);

  return (
    <AppContext.Provider value={{
      state, setState,
      user, setUser,
      isAuthReady,
      walkingRadius, setWalkingRadius,
      selectedRoute, setSelectedRoute,
      pickupPoint, setPickupPoint,
      availableRoutes,
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

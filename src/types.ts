export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Route {
  id: string;
  driverName: string;
  vehicleInfo: string;
  plateNumber: string;
  path: Coordinate[];
  departureTime: string;
  sourceName: string;
  destName: string;
}

export interface User {
  id: string;
  name: string;
  role: 'driver' | 'passenger';
  department: string;
  isVerified: boolean;
}

export type AppState = 
  | 'HOME' 
  | 'DRIVER_SETUP' 
  | 'DRIVER_CONFIRM' 
  | 'DRIVER_ACTIVE' 
  | 'DRIVER_MATCHED'
  | 'DRIVER_EN_ROUTE'
  | 'PASSENGER_SETUP' 
  | 'PASSENGER_SEARCH' 
  | 'PASSENGER_MATCHED'
  | 'PROFILE';

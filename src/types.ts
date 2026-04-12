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
  savedAddresses?: string[];
}

export type AppState = 
  | 'SIGNUP'
  | 'HOME' 
  | 'DRIVER_SETUP' 
  | 'DRIVER_CONFIRM' 
  | 'DRIVER_ACTIVE' 
  | 'DRIVER_MATCHED'
  | 'DRIVER_EN_ROUTE'
  | 'DRIVER_ARRIVED'
  | 'DRIVER_IN_TRANSIT'
  | 'PASSENGER_SETUP' 
  | 'PASSENGER_SEARCH' 
  | 'PASSENGER_MATCHED'
  | 'PASSENGER_EN_ROUTE'
  | 'PASSENGER_IN_TRANSIT'
  | 'PROFILE'
  | 'PROFILE_EDIT';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface SavedAddress {
  name: string;
  lat: number;
  lng: number;
}

export interface User {
  uid: string;
  name: string;
  department: string;
  role: 'driver' | 'passenger' | 'both';
  isVerified: boolean;
  savedAddresses?: SavedAddress[];
  createdAt: any;
}

export interface Route {
  id?: string;
  driverId: string;
  driverName: string;
  vehicleInfo?: string;
  plateNumber?: string;
  departureTime?: string;
  sourceName: string;
  destName: string;
  path: string; // JSON stringified Coordinate[]
  status: 'active' | 'matched' | 'completed' | 'cancelled';
  createdAt: any;
}

export interface Ride {
  id?: string;
  routeId: string;
  passengerId: string;
  passengerName: string;
  pickupLat: number;
  pickupLng: number;
  status: 'pending' | 'accepted' | 'en_route' | 'in_transit' | 'completed' | 'cancelled';
  createdAt: any;
}

export type AppState = 
  | 'LOGIN'
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

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface SavedAddress {
  name: string;
  lat: number;
  lng: number;
}

export interface Vehicle {
  plateNumber: string;       // "12가 3456"
  model: string;             // "그랜저 하이브리드"
  color: string;             // "화이트"
  seatCapacity: number;      // 4
}

export interface User {
  uid: string;
  name: string;
  employeeNumber?: string;  // 교번
  department: string;
  role: 'driver' | 'passenger' | 'both';
  isVerified: boolean;
  savedAddresses?: SavedAddress[];
  vehicle?: Vehicle;
  phone?: string;
  createdAt: any;
}

export interface Route {
  id?: string;
  driverId: string;
  driverName: string;
  vehicle?: Vehicle;
  departureTime?: string;
  availableSeats?: number;
  sourceName: string;
  sourceCoord?: Coordinate;
  destName: string;
  destCoord?: Coordinate;
  path: string; // JSON stringified Coordinate[]
  status: 'active' | 'matched' | 'completed' | 'cancelled';
  createdAt: any;
}

export interface Ride {
  id?: string;
  routeId: string;
  driverId: string;
  passengerId: string;
  passengerName: string;
  pickupCoord: Coordinate;
  pickupName?: string;
  status: 'pending' | 'accepted' | 'pickup_negotiation' | 'en_route' | 'in_transit' | 'completed' | 'cancelled';
  createdAt: any;
}

export interface LiveLocation {
  uid: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt: any;
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

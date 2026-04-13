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

export interface UserStats {
  totalRides: number;
  driveCount: number;
  rideCount: number;
  cancelCount: number;
}

export interface User {
  uid: string;
  name: string;
  employeeNumber?: string;  // 교번
  passwordHash?: string;    // SHA-256 해시
  department: string;
  role: 'driver' | 'passenger' | 'both';
  isVerified: boolean;
  savedAddresses?: SavedAddress[];
  vehicle?: Vehicle;
  phone?: string;
  stats?: UserStats;
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
  driverName?: string;
  pickupCoord: Coordinate;
  pickupName?: string;
  status: 'pending' | 'accepted' | 'pickup_negotiation' | 'en_route' | 'in_transit' | 'confirming' | 'confirmed' | 'completed' | 'rejected' | 'cancelled';
  driverConfirmed?: boolean;
  passengerConfirmed?: boolean;
  cancelledBy?: 'driver' | 'passenger';
  driverArrived?: boolean;
  passengerArrived?: boolean;
  driverBoarded?: boolean;
  passengerBoarded?: boolean;
  passengerDepartureAddress?: string;
  passengerDepartureCoord?: Coordinate;
  passengerDestBuilding?: string;
  completedAt?: string;
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
  | 'PROFILE_EDIT'
  | 'CHAT';

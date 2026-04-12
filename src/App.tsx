import React, { useState, useEffect, useMemo } from 'react';
import { 
  School, 
  User as UserIcon, 
  Bell, 
  Menu, 
  Car, 
  Users, 
  Home as HomeIcon, 
  BadgeCheck, 
  Calendar, 
  Rocket, 
  Hand, 
  MapPin, 
  Search, 
  ChevronDown, 
  Clock, 
  Minus, 
  Plus, 
  Info, 
  ArrowRight, 
  Map as MapIcon,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Leaf,
  Gavel,
  Microscope,
  Building2,
  Stethoscope,
  Tractor,
  FlaskConical,
  Building,
  ChevronRight,
  MessageCircle,
  UserCheck,
  Navigation,
  AlertTriangle,
  Phone,
  X,
  Settings,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, User, Route, Coordinate } from './types';
import { isRouteIntersectingCircle, findClosestPointOnRoute } from './lib/geoUtils';
import { MapComponent } from './components/MapComponent';

// Mock Data
const MOCK_USER: User = {
  id: 'u1',
  name: '김철수 교수',
  role: 'driver',
  department: '스마트데이터 연구실',
  isVerified: true,
  savedAddresses: ['도안동 트리풀시티', '공과대학 1호관', '유성온천역 3번 출구']
};

const MOCK_ROUTES: Route[] = [
  {
    id: 'r1',
    driverName: '김*진 교수',
    vehicleInfo: '제네시스 G80',
    plateNumber: '12가 34**',
    departureTime: '08:25',
    sourceName: '도안동',
    destName: '공과대학 권역',
    path: [
      { lat: 36.33, lng: 127.33 },
      { lat: 36.34, lng: 127.34 },
      { lat: 36.35, lng: 127.35 },
      { lat: 36.36, lng: 127.36 },
    ]
  },
  {
    id: 'r2',
    driverName: '이*혁 주무관',
    vehicleInfo: '싼타페 화이트',
    plateNumber: '56고 92**',
    departureTime: '08:35',
    sourceName: '유성온천역',
    destName: '자연과학대학 권역',
    path: [
      { lat: 36.35, lng: 127.34 },
      { lat: 36.355, lng: 127.345 },
      { lat: 36.36, lng: 127.35 },
    ]
  }
];

export default function App() {
  const [state, setState] = useState<AppState>('SIGNUP');
  const [user, setUser] = useState<User | null>(null);
  const [walkingRadius, setWalkingRadius] = useState(10); // minutes
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [pickupPoint, setPickupPoint] = useState<Coordinate | null>(null);
  
  // Driver states
  const [driverSource, setDriverSource] = useState('');
  const [driverDest, setDriverDest] = useState('');
  const [driverRoute, setDriverRoute] = useState<Coordinate[]>([]);

  useEffect(() => {
    // For demo purposes, we can skip signup if user is already "logged in"
    // But here we want to show the signup flow
  }, []);

  // Layout Components
  const TopAppBar = ({ title = "CNU 교직원 카풀" }) => (
    <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 bg-white/80 backdrop-blur-xl z-50 shadow-[0_8px_24px_rgba(0,40,83,0.06)]">
      <div className="flex items-center gap-3">
        <School className="text-primary-container w-6 h-6" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Chungnam National University</span>
          <h1 className="text-lg font-bold tracking-tight font-headline text-primary-container">{title}</h1>
        </div>
      </div>
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container/10">
        <img 
          src="https://picsum.photos/seed/faculty/100/100" 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
      </div>
    </header>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-2 pb-8 bg-white/80 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,40,83,0.08)] rounded-t-2xl">
      <button onClick={() => setState('HOME')} className={`flex flex-col items-center justify-center px-5 py-2 transition-all ${state === 'HOME' ? 'text-primary-container bg-blue-50 rounded-xl' : 'text-slate-400'}`}>
        <HomeIcon className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-1">홈</span>
      </button>
      <button onClick={() => setState('DRIVER_SETUP')} className={`flex flex-col items-center justify-center px-5 py-2 transition-all ${state.startsWith('DRIVER') ? 'text-primary-container bg-blue-50 rounded-xl' : 'text-slate-400'}`}>
        <Car className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-1">운전</span>
      </button>
      <button onClick={() => setState('PASSENGER_SETUP')} className={`flex flex-col items-center justify-center px-5 py-2 transition-all ${state.startsWith('PASSENGER') ? 'text-primary-container bg-blue-50 rounded-xl' : 'text-slate-400'}`}>
        <Users className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-1">탑승</span>
      </button>
      <button onClick={() => setState('PROFILE')} className={`flex flex-col items-center justify-center px-5 py-2 transition-all ${state === 'PROFILE' ? 'text-primary-container bg-blue-50 rounded-xl' : 'text-slate-400'}`}>
        <UserIcon className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-1">내 정보</span>
      </button>
    </nav>
  );

  // Screen Components
  const SignupScreen = () => {
    const [name, setName] = useState('');
    const [dept, setDept] = useState('');
    const [addresses, setAddresses] = useState<string[]>(['']);

    const handleAddAddress = () => setAddresses([...addresses, '']);
    const handleAddressChange = (idx: number, val: string) => {
      const newAddrs = [...addresses];
      newAddrs[idx] = val;
      setAddresses(newAddrs);
    };

    const handleSignup = () => {
      if (!name || !dept || addresses.some(a => !a)) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
      setUser({
        id: 'u' + Math.random().toString(36).substr(2, 9),
        name,
        department: dept,
        role: 'passenger',
        isVerified: true,
        savedAddresses: addresses
      });
      setState('HOME');
    };

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="px-6 py-12 space-y-8"
      >
        <div className="text-center space-y-2">
          <School className="w-16 h-16 text-primary-container mx-auto" />
          <h2 className="text-3xl font-black text-primary-container tracking-tight">CNU 카풀 시작하기</h2>
          <p className="text-on-surface-variant">교직원 인증을 위해 정보를 입력해주세요.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">이름</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-4 bg-surface-container-lowest border-none rounded-xl text-on-surface font-semibold shadow-sm focus:ring-2 focus:ring-primary-container"
              placeholder="예: 홍길동"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">소속 부서/학과</label>
            <input 
              type="text"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full px-4 py-4 bg-surface-container-lowest border-none rounded-xl text-on-surface font-semibold shadow-sm focus:ring-2 focus:ring-primary-container"
              placeholder="예: 공과대학 행정실"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">자주 가는 주소</label>
              <button 
                onClick={handleAddAddress}
                className="text-primary-container text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> 추가
              </button>
            </div>
            {addresses.map((addr, idx) => (
              <div key={idx} className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-container" />
                <input 
                  type="text"
                  value={addr}
                  onChange={(e) => handleAddressChange(idx, e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-none rounded-xl text-on-surface font-semibold shadow-sm focus:ring-2 focus:ring-primary-container"
                  placeholder="예: 도안동 트리풀시티"
                />
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSignup}
          className="w-full bg-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          가입 완료 및 시작하기
        </button>
      </motion.div>
    );
  };

  const HomeScreen = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="px-5 pt-6 space-y-6 pb-32"
    >
      {/* Identity Card */}
      <section className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_8px_24px_rgba(0,40,83,0.06)]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-primary-container tracking-tight mb-1">{user?.name}</h2>
            <p className="text-sm text-on-surface-variant font-medium">{user?.department}</p>
          </div>
          <span className="bg-blue-50 text-primary-container text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
            <BadgeCheck className="w-3 h-3 fill-current" />
            SSO 인증 완료
          </span>
        </div>
        <div className="bg-surface-container-low rounded-lg p-3 flex items-center gap-3">
          <Car className="text-primary-container w-5 h-5" />
          <div className="text-xs">
            <p className="text-on-surface-variant">등록 차량</p>
            <p className="font-bold text-on-surface">12가 3456 (그랜저 하이브리드)</p>
          </div>
        </div>
      </section>

      {/* 2-bu-je Banner */}
      <div className="bg-[#e8f5e9] text-[#2e7d32] px-5 py-4 rounded-xl flex items-center gap-4 border-l-4 border-[#2e7d32]">
        <div className="bg-[#2e7d32] text-white p-2 rounded-lg">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">오늘(13일)은 홀수 차량 운행 날입니다.</p>
          <p className="text-[11px] opacity-80 mt-0.5">교직원 주차 5부제 정책 준수</p>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setState('DRIVER_SETUP')}
          className="group relative bg-primary-container text-white p-6 rounded-xl flex flex-col items-start gap-4 shadow-lg overflow-hidden"
        >
          <Rocket className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
          <div className="bg-white/20 p-2 rounded-lg">
            <Car className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">🚗 출근길 빈자리 나눔 (운행)</h3>
            <p className="text-sm text-blue-100/80 mt-1">연구실 동료 및 교직원과 함께 출근하기</p>
          </div>
        </button>

        <button 
          onClick={() => setState('PASSENGER_SETUP')}
          className="group relative bg-surface-container-lowest border-2 border-primary-container/20 text-primary-container p-6 rounded-xl flex flex-col items-start gap-4 shadow-md overflow-hidden"
        >
          <Hand className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 group-hover:scale-110 transition-transform" />
          <div className="bg-primary-container/5 p-2 rounded-lg">
            <Users className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">🙋‍♂️ 카풀 탑승 신청 (탑승)</h3>
            <p className="text-sm text-on-surface-variant mt-1">캠퍼스 권역별 운행 차량 찾기</p>
          </div>
        </button>
      </div>
    </motion.div>
  );

  const DriverSetupScreen = () => {
    useEffect(() => {
      if (!driverSource && user?.savedAddresses?.[0]) setDriverSource(user.savedAddresses[0]);
      if (!driverDest && user?.savedAddresses?.[1]) setDriverDest(user.savedAddresses[1]);
    }, [user]);

    const mockPassengers = useMemo(() => {
      const passengers = [
        { center: { lat: 36.355, lng: 127.345 }, radius: 400 }, // 5 min walk (400m)
        { center: { lat: 36.368, lng: 127.340 }, radius: 800 }, // 10 min walk (800m)
        { center: { lat: 36.350, lng: 127.350 }, radius: 300 }, // 3 min walk
      ];

      const routeToUse = driverRoute.length > 0 ? driverRoute : MOCK_ROUTES[0].path;

      return passengers.map(p => {
        const isIntersecting = isRouteIntersectingCircle(routeToUse, p.center, p.radius / 1000);
        return {
          ...p,
          color: isIntersecting ? '#22c55e' : '#94a3b8' // Green if overlapping, slate if not
        };
      });
    }, [driverRoute]);

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="px-6 py-8 space-y-8 pb-32"
      >
        <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">운행 등록하기</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="rounded-xl overflow-hidden h-48 bg-slate-200 relative">
              <MapComponent 
                origin={driverSource}
                destination={driverDest}
                onRouteCalculated={setDriverRoute}
                circles={mockPassengers}
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500/20 border-2 border-green-500"></div>
                <span className="text-[10px] font-bold text-on-surface-variant">매칭 가능 탑승자</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-400/20 border-2 border-slate-400"></div>
                <span className="text-[10px] font-bold text-on-surface-variant">경로 외 탑승자</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">출발지</label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-4 w-5 h-5 text-primary-container" />
                <select 
                  value={driverSource}
                  onChange={(e) => setDriverSource(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-transparent rounded-xl pl-12 pr-4 py-4 text-on-surface font-semibold shadow-sm appearance-none outline-none"
                >
                  <option value="" disabled>출발지 선택</option>
                  {user?.savedAddresses?.map((addr, idx) => (
                    <option key={idx} value={addr}>{addr}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 w-5 h-5 text-outline pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">도착지</label>
              <div className="relative flex items-center">
                <Building2 className="absolute left-4 w-5 h-5 text-primary-container" />
                <select 
                  value={driverDest}
                  onChange={(e) => setDriverDest(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-transparent rounded-xl pl-12 pr-4 py-4 text-on-surface font-semibold shadow-sm appearance-none outline-none"
                >
                  <option value="" disabled>도착지 선택</option>
                  {user?.savedAddresses?.map((addr, idx) => (
                    <option key={idx} value={addr}>{addr}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 w-5 h-5 text-outline pointer-events-none" />
              </div>
            </div>
          </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">출발 예정 시간</label>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary-container" />
              <span className="text-xl font-bold text-primary-container">08:30 AM</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">잔여 좌석 수</label>
            <div className="flex items-center justify-between">
              <button className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-outline"><Minus className="w-4 h-4" /></button>
              <span className="text-xl font-bold text-primary-container">3</span>
              <button className="w-8 h-8 rounded-full border border-primary-container bg-primary-container/10 flex items-center justify-center text-primary-container"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setState('DRIVER_ACTIVE')}
        className="w-full bg-[#2E7D32] text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <Car className="w-6 h-6 fill-current" />
        동승자 모집 시작
      </button>
    </motion.div>
  );
};

  const DriverActiveScreen = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col min-h-[calc(100vh-160px)]"
    >
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-slate-200">
          <MapComponent polylines={[driverRoute.length > 0 ? driverRoute : MOCK_ROUTES[0].path]} />
        </div>
        
        <div className="relative z-10 p-6 space-y-6">
          <div className="bg-primary-container text-white p-5 rounded-xl shadow-2xl flex items-center gap-4 border border-white/10">
            <div className="bg-white/20 p-2 rounded-full">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm opacity-80">매칭 대기 중</p>
              <p className="text-base font-semibold">경로상에 탑승자를 찾고 있습니다...</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="inline-block px-3 py-1 bg-blue-50 text-primary-container text-[10px] font-bold rounded-full uppercase tracking-wider">Active Route</span>
                <h2 className="text-xl font-extrabold text-primary-container tracking-tight">공과대학 정문 권역</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Est. Arrival</p>
                <p className="text-lg font-bold text-primary-container">08:45 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                <div className="w-0.5 h-8 bg-slate-200"></div>
                <div className="w-2 h-2 rounded-full border-2 border-primary-container"></div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Departure</p>
                  <p className="font-semibold text-on-surface">도안동 트리풀시티</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Destination</p>
                  <p className="font-semibold text-on-surface">공과대학 1호관</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <button 
          onClick={() => setState('DRIVER_MATCHED')}
          className="w-full h-16 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all font-bold"
        >
          <Search className="w-5 h-5" />
          (테스트) 탑승자 매칭 시뮬레이션
        </button>
      </div>
    </motion.div>
  );

  const DriverMatchedScreen = () => {
    const passengerSearchCenter = { lat: 36.355, lng: 127.345 };
    const calculatedPickup = useMemo(() => {
      const routeToUse = driverRoute.length > 0 ? driverRoute : MOCK_ROUTES[0].path;
      return findClosestPointOnRoute(routeToUse, passengerSearchCenter);
    }, [driverRoute]);

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="px-6 py-8 space-y-6 pb-32"
      >
        <div className="text-center space-y-2 mb-8">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">탑승자가 매칭되었습니다!</h2>
          <p className="text-on-surface-variant">경로 상에 있는 교직원과 함께 출근합니다.</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-lg border border-primary-container/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-container/20">
              <img src="https://picsum.photos/seed/passenger/150/150" alt="Passenger" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary-container">이*민 주무관</h3>
              <p className="text-sm text-on-surface-variant">학생처 장학팀</p>
            </div>
            <div className="ml-auto">
              <button className="w-10 h-10 rounded-full bg-blue-50 text-primary-container flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 bg-surface-container-low p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary-container mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">계산된 픽업 좌표</p>
                <p className="font-semibold text-on-surface">{calculatedPickup.lat.toFixed(4)}, {calculatedPickup.lng.toFixed(4)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary-container mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">예상 픽업 시간</p>
                <p className="font-semibold text-on-surface">08:35 AM (약 5분 후)</p>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setState('DRIVER_EN_ROUTE')}
          className="w-full bg-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Navigation className="w-6 h-6" />
          픽업 장소로 이동하기
        </button>
      </motion.div>
    );
  };

  const DriverEnRouteScreen = () => {
    const passengerSearchCenter = { lat: 36.355, lng: 127.345 };
    const calculatedPickup = useMemo(() => {
      const routeToUse = driverRoute.length > 0 ? driverRoute : MOCK_ROUTES[0].path;
      return findClosestPointOnRoute(routeToUse, passengerSearchCenter);
    }, [driverRoute]);

    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex flex-col min-h-[calc(100vh-160px)]"
      >
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-slate-200">
            <MapComponent 
              polylines={[driverRoute.length > 0 ? driverRoute : MOCK_ROUTES[0].path]} 
              markers={[calculatedPickup]}
              center={calculatedPickup}
              zoom={15}
            />
          </div>
          
          <div className="relative z-10 p-6 space-y-6">
            <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-lg flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Navigation className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-on-surface-variant">픽업 장소로 이동 중</p>
                <p className="text-lg font-extrabold text-primary-container">계산된 픽업 위치</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
          <button 
            onClick={() => setState('DRIVER_ARRIVED')}
            className="w-full h-24 bg-[#2E7D32] text-white rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <MapPin className="w-8 h-8" />
            <div className="text-center">
              <h3 className="text-xl font-extrabold tracking-tight">📍 픽업 장소 도착</h3>
              <p className="text-xs font-medium opacity-80 mt-1">도착 알림 전송하기</p>
            </div>
          </button>
        </div>
      </motion.div>
    );
  };

  const DriverArrivedScreen = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="px-6 py-8 space-y-6 pb-32 flex flex-col min-h-[calc(100vh-160px)]"
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 relative">
          <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping"></div>
          <Bell className="w-16 h-16" />
        </div>
        <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">탑승자에게 도착을 알렸습니다</h2>
        <p className="text-on-surface-variant text-lg">비상등을 켜고 잠시 대기해 주세요.</p>
        
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm w-full mt-8 border border-primary-container/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container/20">
              <img src="https://picsum.photos/seed/passenger/150/150" alt="Passenger" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-primary-container">이*민 주무관</h3>
              <p className="text-sm text-on-surface-variant">학생처 장학팀</p>
            </div>
            <button className="ml-auto w-10 h-10 rounded-full bg-blue-50 text-primary-container flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setState('DRIVER_IN_TRANSIT')}
        className="w-full bg-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <CheckCircle className="w-6 h-6" />
        탑승자가 승차했습니다 (출발)
      </button>
    </motion.div>
  );

  const DriverInTransitScreen = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col min-h-[calc(100vh-160px)]"
    >
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-slate-200">
          <MapComponent 
            polylines={[driverRoute.length > 0 ? driverRoute : MOCK_ROUTES[0].path]} 
            markers={[{ lat: 36.36, lng: 127.36 }]} // Mock destination
            center={{ lat: 36.355, lng: 127.35 }}
            zoom={14}
          />
        </div>
        
        <div className="relative z-10 p-6 space-y-6">
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-lg flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface-variant">목적지로 이동 중</p>
              <p className="text-lg font-extrabold text-primary-container">공과대학 1호관</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <button 
          onClick={() => setState('HOME')}
          className="w-full h-20 bg-primary-container text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all font-bold text-lg"
        >
          운행 종료 및 하차
        </button>
      </div>
    </motion.div>
  );

  const PassengerSetupScreen = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="px-6 py-8 space-y-8 pb-32"
    >
      <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">카풀 검색하기</h2>
      
      <div className="space-y-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">희망 픽업 지역 검색</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-container" />
            <input 
              className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg text-on-surface font-semibold text-lg focus:ring-2 focus:ring-primary-container" 
              placeholder="주변 지역 검색" 
              defaultValue={user?.savedAddresses?.[0] || "유성온천역 3번 출구"}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 block">목적지 권역 선택</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'eng', name: '공과대학 권역', icon: Building, desc: '1, 2, 3호관 주변' },
              { id: 'sci', name: '자연과학대학 권역', icon: FlaskConical, desc: '기초과학관 주변' },
              { id: 'hq', name: '대학본부 권역', icon: Building2, desc: '중앙도서관 방면' },
              { id: 'agri', name: '농생대 권역', icon: Tractor, desc: '실험농장 주변' },
            ].map(zone => (
              <button key={zone.id} className="flex flex-col items-start p-4 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-primary-container hover:text-white transition-all">
                <zone.icon className="w-5 h-5 mb-2" />
                <span className="font-bold text-sm">{zone.name}</span>
                <span className="text-[10px] opacity-70">{zone.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm text-center space-y-6">
          <h3 className="text-xl font-extrabold text-primary-container">🏃‍♂️ 나는 최대 몇 분까지 걸어갈 수 있나요?</h3>
          <div className="space-y-4">
            <div className="flex justify-between px-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${walkingRadius === 5 ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-400'}`}>5분</span>
              <span className="text-2xl font-black text-primary-container tracking-tighter">{walkingRadius}분</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${walkingRadius === 15 ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-400'}`}>15분</span>
            </div>
            <input 
              type="range" 
              min="5" max="15" step="1" 
              value={walkingRadius} 
              onChange={(e) => setWalkingRadius(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-full appearance-none accent-primary-container" 
            />
          </div>
        </div>
      </div>

      <button 
        onClick={() => setState('PASSENGER_SEARCH')}
        className="w-full py-5 bg-primary-container text-white rounded-xl text-lg font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <Search className="w-6 h-6" />
        내 주변 동승 차량 찾기
      </button>
    </motion.div>
  );

  const PassengerSearchScreen = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="px-4 py-8 space-y-6 pb-32"
    >
      <div className="px-2">
        <h2 className="text-2xl font-extrabold text-primary-container">검색 결과</h2>
        <p className="text-on-surface-variant text-sm font-medium">자연과학대학 서문 권역 • 오늘 오전 08:30</p>
      </div>

      <div className="space-y-6">
        {MOCK_ROUTES.map(route => (
          <article 
            key={route.id} 
            onClick={() => {
              setSelectedRoute(route);
              setState('PASSENGER_MATCHED');
            }}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100 cursor-pointer hover:scale-[1.01] transition-transform"
          >
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 h-40 bg-slate-200 relative">
                <img src={`https://picsum.photos/seed/${route.id}/300/200`} className="w-full h-full object-cover" alt="Car" />
                <div className="absolute top-3 left-3 bg-primary-container text-white px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <Hand className="w-3 h-3" />
                  도보 3분
                </div>
              </div>
              <div className="md:w-2/3 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-primary-container uppercase">공과대학 / 교수</span>
                      <span className="bg-blue-50 text-primary-container text-[8px] px-1.5 py-0.5 rounded-full font-bold">✅ SSO</span>
                    </div>
                    <h3 className="text-lg font-bold text-on-surface">{route.driverName}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-primary-container block">{route.departureTime}</span>
                    <span className="text-[8px] font-medium text-on-surface-variant uppercase">Departure</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-on-surface-variant" />
                    <span className="text-xs font-medium text-on-surface-variant">{route.sourceName}</span>
                  </div>
                  <button className="bg-primary-container text-white px-4 py-2 rounded-lg text-xs font-bold">탑승 요청</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  );

  const PassengerMatchedScreen = () => {
    // Passenger's search center (mocked as the first point of the route for demo, but should be user's search location)
    const passengerSearchCenter = { lat: 36.355, lng: 127.345 };
    const passengerRadiusMeters = walkingRadius * 80; // Roughly 80m per minute walking
    const [calculatedRoute, setCalculatedRoute] = useState<Coordinate[]>([]);

    // Calculate actual closest point on driver's route to passenger's center
    const calculatedPickup = useMemo(() => {
      const routeToUse = calculatedRoute.length > 0 ? calculatedRoute : (selectedRoute?.path || MOCK_ROUTES[0].path);
      return findClosestPointOnRoute(routeToUse, passengerSearchCenter);
    }, [walkingRadius, calculatedRoute, selectedRoute]);

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="flex flex-col min-h-[calc(100vh-160px)]"
      >
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-slate-200">
            <MapComponent 
              origin={selectedRoute?.sourceName}
              destination={selectedRoute?.destName}
              onRouteCalculated={setCalculatedRoute}
              circles={[{ center: passengerSearchCenter, radius: passengerRadiusMeters }]}
              markers={[calculatedPickup]}
              center={calculatedPickup}
              zoom={15}
            />
          </div>

          <div className="relative z-10 p-6 space-y-6">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                  <img src="https://picsum.photos/seed/driver/100/100" alt="Driver" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-primary-container rounded-full text-[10px] font-bold mb-1">
                    <BadgeCheck className="w-3 h-3 fill-current" />
                    SSO 인증 완료
                  </div>
                  <h2 className="text-2xl font-extrabold text-primary-container tracking-tight">최적의 픽업 포인트를 찾았습니다</h2>
                </div>
              </div>
              
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                운전자의 실제 경로와 탑승자의 이동 가능 반경({walkingRadius}분)을 분석한 결과, <strong>가장 가까운 지점</strong>을 픽업지로 선정했습니다.
              </p>

              <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4">
                <div className="bg-primary-container w-10 h-10 rounded-lg flex items-center justify-center text-white">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase">계산된 픽업 좌표</p>
                  <p className="text-sm font-bold text-primary-container">{calculatedPickup.lat.toFixed(4)}, {calculatedPickup.lng.toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
          <button 
            onClick={() => setState('PASSENGER_EN_ROUTE')}
            className="w-full bg-primary-container text-white py-5 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            이 차에 탑승 신청
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  };

  const PassengerEnRouteScreen = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col min-h-[calc(100vh-160px)]"
    >
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-slate-200">
          <MapComponent 
            origin={selectedRoute?.sourceName}
            destination={selectedRoute?.destName}
            markers={[{ lat: 36.355, lng: 127.345 }]} // Mock pickup point
            center={{ lat: 36.355, lng: 127.345 }}
            zoom={15}
          />
        </div>
        
        <div className="relative z-10 p-6 space-y-6">
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-lg flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface-variant">운전자가 오고 있습니다</p>
              <p className="text-lg font-extrabold text-primary-container">도착까지 약 3분</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <button 
          onClick={() => setState('PASSENGER_IN_TRANSIT')}
          className="w-full h-24 bg-[#2E7D32] text-white rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <CheckCircle className="w-8 h-8" />
          <div className="text-center">
            <h3 className="text-xl font-extrabold tracking-tight">차량 탑승 완료</h3>
            <p className="text-xs font-medium opacity-80 mt-1">차량에 탑승하셨다면 눌러주세요</p>
          </div>
        </button>
      </div>
    </motion.div>
  );

  const PassengerInTransitScreen = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col min-h-[calc(100vh-160px)]"
    >
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-slate-200">
          <MapComponent 
            origin={selectedRoute?.sourceName}
            destination={selectedRoute?.destName}
            markers={[{ lat: 36.36, lng: 127.36 }]} // Mock destination
            center={{ lat: 36.355, lng: 127.35 }}
            zoom={14}
          />
        </div>
        
        <div className="relative z-10 p-6 space-y-6">
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-lg flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Navigation className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface-variant">목적지로 이동 중</p>
              <p className="text-lg font-extrabold text-primary-container">공과대학 1호관</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <button 
          onClick={() => setState('HOME')}
          className="w-full h-20 bg-primary-container text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all font-bold text-lg"
        >
          하차 완료
        </button>
      </div>
    </motion.div>
  );

  const ProfileScreen = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="px-5 pt-6 space-y-6 pb-32"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-primary-container tracking-tight">내 정보</h2>
        <button 
          onClick={() => setState('PROFILE_EDIT')}
          className="text-primary-container font-bold text-sm bg-blue-50 px-4 py-2 rounded-full"
        >
          프로필 수정
        </button>
      </div>
      
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex items-center gap-5">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary-container/10">
          <img src="https://picsum.photos/seed/faculty/100/100" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-primary-container">{user?.name}</h3>
          <p className="text-on-surface-variant font-medium">{user?.department}</p>
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-primary-container rounded-full text-[10px] font-bold mt-2">
            <BadgeCheck className="w-3 h-3 fill-current" />
            SSO 인증 완료
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest ml-1">자주 가는 주소</h4>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm space-y-4">
          {user?.savedAddresses?.map((addr, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-4">
                <div className="bg-primary-container/10 p-3 rounded-full">
                  <MapPin className="w-5 h-5 text-primary-container" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">주소 {idx + 1}</p>
                  <p className="font-bold text-on-surface">{addr}</p>
                </div>
              </div>
              {idx < (user.savedAddresses?.length || 0) - 1 && <div className="w-full h-px bg-slate-100"></div>}
            </React.Fragment>
          ))}
          {(!user?.savedAddresses || user.savedAddresses.length === 0) && (
            <p className="text-on-surface-variant text-sm text-center py-4">등록된 주소가 없습니다.</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest ml-1">차량 정보</h4>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary-container/10 p-3 rounded-full">
              <Car className="w-6 h-6 text-primary-container" />
            </div>
            <div>
              <p className="font-bold text-on-surface">12가 3456</p>
              <p className="text-xs text-on-surface-variant">그랜저 하이브리드 (화이트)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest ml-1">이용 기록</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-black text-primary-container mb-1">12</p>
            <p className="text-xs font-bold text-on-surface-variant">운행 횟수</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-black text-primary-container mb-1">5</p>
            <p className="text-xs font-bold text-on-surface-variant">탑승 횟수</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <button className="w-full bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between text-on-surface font-bold shadow-sm">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-on-surface-variant" />
            설정
          </div>
          <ChevronRight className="w-5 h-5 text-outline" />
        </button>
        <button 
          onClick={() => {
            setUser(null);
            setState('SIGNUP');
          }}
          className="w-full bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between text-red-500 font-bold shadow-sm"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            로그아웃
          </div>
        </button>
      </div>
    </motion.div>
  );

  const ProfileEditScreen = () => {
    const [addresses, setAddresses] = useState<string[]>(user?.savedAddresses || ['']);

    const handleAddAddress = () => setAddresses([...addresses, '']);
    const handleAddressChange = (idx: number, val: string) => {
      const newAddrs = [...addresses];
      newAddrs[idx] = val;
      setAddresses(newAddrs);
    };

    const handleSave = () => {
      if (addresses.some(a => !a)) {
        alert('모든 주소를 입력해주세요.');
        return;
      }
      setUser({
        ...user!,
        savedAddresses: addresses
      });
      setState('PROFILE');
    };

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="px-5 pt-6 space-y-8 pb-32"
      >
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setState('PROFILE')} className="p-2 bg-surface-container-lowest rounded-full shadow-sm">
            <ArrowRight className="w-6 h-6 rotate-180 text-on-surface" />
          </button>
          <h2 className="text-2xl font-extrabold text-primary-container tracking-tight">프로필 수정</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">자주 가는 주소</label>
              <button 
                onClick={handleAddAddress}
                className="text-primary-container text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> 추가
              </button>
            </div>
            {addresses.map((addr, idx) => (
              <div key={idx} className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-container" />
                <input 
                  type="text"
                  value={addr}
                  onChange={(e) => handleAddressChange(idx, e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-none rounded-xl text-on-surface font-semibold shadow-sm focus:ring-2 focus:ring-primary-container"
                  placeholder="예: 도안동 트리풀시티"
                />
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all mt-8"
        >
          저장하기
        </button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {state !== 'SIGNUP' && <TopAppBar title={state === 'HOME' ? "CNU 교직원 카풀" : "카풀 서비스"} />}
      
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
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

      {state !== 'SIGNUP' && <BottomNav />}
    </div>
  );
}

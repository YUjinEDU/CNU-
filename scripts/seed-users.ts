/**
 * Firestore 테스트 사용자 5명 시드 스크립트.
 * 실행: npx tsx scripts/seed-users.ts
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

const app = initializeApp(config);
const db = getFirestore(app);

const testUsers = [
  {
    uid: 'test-driver-kim',
    name: '김교수',
    department: '공과대학 컴퓨터공학과',
    role: 'driver' as const,
    isVerified: true,
    phone: '010-1234-5678',
    vehicle: {
      plateNumber: '대전 12가 3457',
      model: '그랜저 하이브리드',
      color: '화이트',
      seatCapacity: 4,
    },
    savedAddresses: [
      { name: '대전 유성구 도안동 트리풀시티', lat: 36.3500, lng: 127.3300 },
      { name: '충남대학교 공과대학 1호관', lat: 36.3680, lng: 127.3440 },
    ],
    createdAt: Timestamp.now(),
  },
  {
    uid: 'test-driver-park',
    name: '박주무관',
    department: '자연과학대학 행정실',
    role: 'driver' as const,
    isVerified: true,
    phone: '010-2345-6789',
    vehicle: {
      plateNumber: '대전 34나 7890',
      model: '투싼',
      color: '은색',
      seatCapacity: 5,
    },
    savedAddresses: [
      { name: '대전 서구 둔산동 타임월드 앞', lat: 36.3510, lng: 127.3780 },
      { name: '충남대학교 자연과학대학', lat: 36.3650, lng: 127.3450 },
    ],
    createdAt: Timestamp.now(),
  },
  {
    uid: 'test-passenger-lee',
    name: '이연구원',
    department: '학생처 장학팀',
    role: 'passenger' as const,
    isVerified: true,
    phone: '010-3456-7890',
    savedAddresses: [
      { name: '대전 유성구 봉명동 유성온천역 3번출구', lat: 36.3550, lng: 127.3400 },
      { name: '충남대학교 대학본부', lat: 36.3720, lng: 127.3430 },
    ],
    createdAt: Timestamp.now(),
  },
  {
    uid: 'test-both-choi',
    name: '최조교',
    department: '농업생명과학대학 식물자원학과',
    role: 'both' as const,
    isVerified: true,
    phone: '010-4567-8901',
    vehicle: {
      plateNumber: '대전 56다 1234',
      model: '아반떼',
      color: '검정',
      seatCapacity: 4,
    },
    savedAddresses: [
      { name: '대전 유성구 궁동 충대앞 사거리', lat: 36.3620, lng: 127.3500 },
      { name: '충남대학교 농업생명과학대학', lat: 36.3700, lng: 127.3480 },
    ],
    createdAt: Timestamp.now(),
  },
  {
    uid: 'test-passenger-jung',
    name: '정행정관',
    department: '의과대학 교학팀',
    role: 'passenger' as const,
    isVerified: true,
    phone: '010-5678-9012',
    savedAddresses: [
      { name: '대전 중구 대흥동 서대전역', lat: 36.3230, lng: 127.4040 },
      { name: '충남대학교 의과대학', lat: 36.3610, lng: 127.3500 },
    ],
    createdAt: Timestamp.now(),
  },
];

// 테스트 경로 2개 (김교수, 박주무관)
const testRoutes = [
  {
    driverId: 'test-driver-kim',
    driverName: '김교수',
    vehicle: testUsers[0].vehicle,
    departureTime: '08:30',
    availableSeats: 3,
    sourceName: '대전 유성구 도안동 트리풀시티',
    sourceCoord: { lat: 36.3500, lng: 127.3300 },
    destName: '충남대학교 공과대학 1호관',
    destCoord: { lat: 36.3680, lng: 127.3440 },
    path: JSON.stringify([
      { lat: 36.3500, lng: 127.3300 },
      { lat: 36.3520, lng: 127.3320 },
      { lat: 36.3550, lng: 127.3350 },
      { lat: 36.3580, lng: 127.3380 },
      { lat: 36.3600, lng: 127.3400 },
      { lat: 36.3630, lng: 127.3420 },
      { lat: 36.3650, lng: 127.3430 },
      { lat: 36.3680, lng: 127.3440 },
    ]),
    status: 'active' as const,
    createdAt: Timestamp.now(),
  },
  {
    driverId: 'test-driver-park',
    driverName: '박주무관',
    vehicle: testUsers[1].vehicle,
    departureTime: '09:00',
    availableSeats: 4,
    sourceName: '대전 서구 둔산동 타임월드 앞',
    sourceCoord: { lat: 36.3510, lng: 127.3780 },
    destName: '충남대학교 자연과학대학',
    destCoord: { lat: 36.3650, lng: 127.3450 },
    path: JSON.stringify([
      { lat: 36.3510, lng: 127.3780 },
      { lat: 36.3530, lng: 127.3700 },
      { lat: 36.3550, lng: 127.3620 },
      { lat: 36.3570, lng: 127.3550 },
      { lat: 36.3600, lng: 127.3500 },
      { lat: 36.3630, lng: 127.3470 },
      { lat: 36.3650, lng: 127.3450 },
    ]),
    status: 'active' as const,
    createdAt: Timestamp.now(),
  },
];

async function seed() {
  console.log('🌱 시드 데이터 삽입 시작...\n');

  for (const user of testUsers) {
    await setDoc(doc(db, 'users', user.uid), user);
    console.log(`✅ 사용자: ${user.name} (${user.department})`);
  }

  console.log('');

  for (const route of testRoutes) {
    const ref = await addDoc(collection(db, 'routes'), route);
    console.log(`✅ 경로: ${route.driverName} ${route.sourceName} → ${route.destName} (id: ${ref.id})`);
  }

  console.log('\n🎉 시드 완료! 사용자 5명, 활성 경로 2개 등록됨.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ 시드 실패:', err);
  process.exit(1);
});

/**
 * Firestore 연결 테스트 + 테스트 사용자 10명 시드
 * 실행: npx tsx scripts/test-firestore.ts
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

console.log('🔧 Firebase 설정 확인...');
console.log('  projectId:', config.projectId);
console.log('  databaseId:', config.firestoreDatabaseId);
console.log('');

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function testConnection() {
  console.log('1️⃣  Firestore 연결 테스트...');
  try {
    const testRef = doc(db, '_test', 'ping');
    await setDoc(testRef, { ok: true, time: Timestamp.now() });
    const snap = await getDoc(testRef);
    if (snap.exists()) {
      console.log('   ✅ Firestore 읽기/쓰기 정상!\n');
      return true;
    }
  } catch (err: any) {
    console.error('   ❌ Firestore 연결 실패:', err.code, err.message);
    if (err.code === 'permission-denied') {
      console.error('\n   👉 Firebase Console에서 Firestore 규칙을 열어야 합니다:');
      console.error('      https://console.firebase.google.com/project/' + config.projectId + '/firestore/rules');
      console.error('      규칙을 아래로 변경하세요:');
      console.error('      rules_version = "2";');
      console.error('      service cloud.firestore {');
      console.error('        match /databases/{database}/documents {');
      console.error('          match /{document=**} { allow read, write: if true; }');
      console.error('        }');
      console.error('      }');
    }
    return false;
  }
  return false;
}

const testUsers = [
  { name: '김교수', empNo: '2020-00101', dept: '공과대학 컴퓨터공학과', role: 'driver' as const, vehicle: { plateNumber: '대전 12가 3457', model: '그랜저', color: '화이트', seatCapacity: 4 }, home: { name: '대전 유성구 도안동 트리풀시티', lat: 36.3500, lng: 127.3300 }, work: { name: '충남대학교 공과대학 권역', lat: 36.3680, lng: 127.3460 } },
  { name: '박주무관', empNo: '2019-00205', dept: '자연과학대학 행정실', role: 'driver' as const, vehicle: { plateNumber: '대전 34나 7890', model: '투싼', color: '은색', seatCapacity: 5 }, home: { name: '대전 서구 둔산동 타임월드', lat: 36.3510, lng: 127.3780 }, work: { name: '충남대학교 자연과학대학 권역', lat: 36.3675, lng: 127.3450 } },
  { name: '이연구원', empNo: '2022-00312', dept: '학생처 장학팀', role: 'passenger' as const, home: { name: '대전 유성구 봉명동 유성온천역', lat: 36.3550, lng: 127.3400 }, work: { name: '충남대학교 대학본부 권역', lat: 36.3672, lng: 127.3430 } },
  { name: '최조교', empNo: '2023-00418', dept: '농업생명과학대학 식물자원학과', role: 'both' as const, vehicle: { plateNumber: '대전 56다 1234', model: '아반떼', color: '검정', seatCapacity: 4 }, home: { name: '대전 유성구 궁동 충대앞', lat: 36.3620, lng: 127.3500 }, work: { name: '충남대학교 농생대 권역', lat: 36.3690, lng: 127.3400 } },
  { name: '정행정관', empNo: '2018-00520', dept: '의과대학 교학팀', role: 'passenger' as const, home: { name: '대전 중구 대흥동 서대전역', lat: 36.3230, lng: 127.4040 }, work: { name: '충남대학교 대학본부 권역', lat: 36.3672, lng: 127.3430 } },
  { name: '한기사', empNo: '2021-00615', dept: '공과대학 전기공학과', role: 'driver' as const, vehicle: { plateNumber: '대전 78라 5678', model: '쏘나타', color: '파랑', seatCapacity: 4 }, home: { name: '대전 유성구 반석동', lat: 36.3880, lng: 127.3200 }, work: { name: '충남대학교 공과대학 권역', lat: 36.3680, lng: 127.3460 } },
  { name: '윤사서', empNo: '2020-00708', dept: '중앙도서관 자료실', role: 'passenger' as const, home: { name: '대전 서구 관저동', lat: 36.3350, lng: 127.3350 }, work: { name: '충남대학교 대학본부 권역', lat: 36.3672, lng: 127.3430 } },
  { name: '송교수', empNo: '2017-00803', dept: '자연과학대학 물리학과', role: 'both' as const, vehicle: { plateNumber: '대전 90마 9012', model: 'K5', color: '회색', seatCapacity: 4 }, home: { name: '세종시 나성동 세종호수공원', lat: 36.5000, lng: 127.0000 }, work: { name: '충남대학교 자연과학대학 권역', lat: 36.3675, lng: 127.3450 } },
  { name: '강직원', empNo: '2024-00910', dept: '대학본부 총무과', role: 'passenger' as const, home: { name: '대전 동구 판암동', lat: 36.3400, lng: 127.4500 }, work: { name: '충남대학교 대학본부 권역', lat: 36.3672, lng: 127.3430 } },
  { name: '조교수', empNo: '2019-01005', dept: '농업생명과학대학 원예학과', role: 'driver' as const, vehicle: { plateNumber: '대전 23바 3456', model: 'EV6', color: '초록', seatCapacity: 4 }, home: { name: '대전 유성구 신성동', lat: 36.3750, lng: 127.3550 }, work: { name: '충남대학교 농생대 권역', lat: 36.3690, lng: 127.3400 } },
];

async function seedUsers() {
  console.log('2️⃣  테스트 사용자 10명 생성...');
  for (const u of testUsers) {
    const uid = `test-${u.empNo}`;
    const userData = {
      uid,
      name: u.name,
      employeeNumber: u.empNo,
      department: u.dept,
      role: u.role,
      isVerified: true,
      vehicle: u.vehicle || null,
      savedAddresses: [
        { name: u.home.name, lat: u.home.lat, lng: u.home.lng },
        { name: u.work.name, lat: u.work.lat, lng: u.work.lng },
      ],
      createdAt: Timestamp.now(),
    };
    await setDoc(doc(db, 'users', uid), userData);
    console.log(`   ✅ ${u.name} (${u.dept}) - ${u.role}${u.vehicle ? ' 🚗' + u.vehicle.plateNumber : ''}`);
  }
  console.log('');
}

async function seedRoutes() {
  console.log('3️⃣  테스트 경로 4개 생성...');
  const routes = [
    {
      driverId: 'test-2020-00101', driverName: '김교수',
      vehicle: testUsers[0].vehicle,
      departureTime: '08:30', availableSeats: 3,
      sourceName: '대전 유성구 도안동 트리풀시티',
      sourceCoord: { lat: 36.3500, lng: 127.3300 },
      destName: '충남대학교 공과대학 권역',
      destCoord: { lat: 36.3680, lng: 127.3460 },
      path: JSON.stringify([
        {lat:36.3500,lng:127.3300},{lat:36.3530,lng:127.3330},{lat:36.3550,lng:127.3360},
        {lat:36.3580,lng:127.3390},{lat:36.3610,lng:127.3410},{lat:36.3640,lng:127.3430},
        {lat:36.3660,lng:127.3445},{lat:36.3680,lng:127.3460}
      ]),
      status: 'active' as const, createdAt: Timestamp.now(),
    },
    {
      driverId: 'test-2019-00205', driverName: '박주무관',
      vehicle: testUsers[1].vehicle,
      departureTime: '09:00', availableSeats: 4,
      sourceName: '대전 서구 둔산동 타임월드',
      sourceCoord: { lat: 36.3510, lng: 127.3780 },
      destName: '충남대학교 자연과학대학 권역',
      destCoord: { lat: 36.3675, lng: 127.3450 },
      path: JSON.stringify([
        {lat:36.3510,lng:127.3780},{lat:36.3530,lng:127.3700},{lat:36.3560,lng:127.3620},
        {lat:36.3590,lng:127.3550},{lat:36.3620,lng:127.3500},{lat:36.3650,lng:127.3470},
        {lat:36.3675,lng:127.3450}
      ]),
      status: 'active' as const, createdAt: Timestamp.now(),
    },
    {
      driverId: 'test-2021-00615', driverName: '한기사',
      vehicle: testUsers[5].vehicle,
      departureTime: '08:00', availableSeats: 3,
      sourceName: '대전 유성구 반석동',
      sourceCoord: { lat: 36.3880, lng: 127.3200 },
      destName: '충남대학교 공과대학 권역',
      destCoord: { lat: 36.3680, lng: 127.3460 },
      path: JSON.stringify([
        {lat:36.3880,lng:127.3200},{lat:36.3830,lng:127.3260},{lat:36.3780,lng:127.3320},
        {lat:36.3740,lng:127.3370},{lat:36.3710,lng:127.3410},{lat:36.3680,lng:127.3460}
      ]),
      status: 'active' as const, createdAt: Timestamp.now(),
    },
    {
      driverId: 'test-2019-01005', driverName: '조교수',
      vehicle: testUsers[9].vehicle,
      departureTime: '08:45', availableSeats: 3,
      sourceName: '대전 유성구 신성동',
      sourceCoord: { lat: 36.3750, lng: 127.3550 },
      destName: '충남대학교 농생대 권역',
      destCoord: { lat: 36.3690, lng: 127.3400 },
      path: JSON.stringify([
        {lat:36.3750,lng:127.3550},{lat:36.3740,lng:127.3510},{lat:36.3720,lng:127.3470},
        {lat:36.3710,lng:127.3440},{lat:36.3700,lng:127.3420},{lat:36.3690,lng:127.3400}
      ]),
      status: 'active' as const, createdAt: Timestamp.now(),
    },
  ];

  for (const route of routes) {
    const ref = await addDoc(collection(db, 'routes'), route);
    console.log(`   ✅ ${route.driverName}: ${route.sourceName} → ${route.destName} (${route.departureTime})`);
  }
  console.log('');
}

async function main() {
  console.log('🌱 CNU 카풀 테스트 데이터 시드\n');

  const ok = await testConnection();
  if (!ok) {
    process.exit(1);
  }

  await seedUsers();
  await seedRoutes();

  console.log('🎉 완료! 사용자 10명 + 활성 경로 4개 등록됨.');
  console.log('   브라우저에서 확인하세요: http://localhost:5173/');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 실패:', err);
  process.exit(1);
});

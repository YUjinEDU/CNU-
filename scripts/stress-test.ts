/**
 * 스트레스 테스트 — 대규모 동시 접속 시뮬레이션
 *
 * 실행: npx tsx scripts/stress-test.ts
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, doc, addDoc, getDoc, getDocs,
  updateDoc, query, where, runTransaction, deleteDoc,
} from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyAp3MX36j6E5t_Gz0JUkTjNV9VrDmswQN4',
  authDomain: 'cnu-carpool.firebaseapp.com',
  projectId: 'cnu-carpool',
  storageBucket: 'cnu-carpool.firebasestorage.app',
  messagingSenderId: '481343945369',
  appId: '1:481343945369:web:72673637d79f363763d608',
});
const db = getFirestore(app);

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✅ ${msg}`); passed++; }
  else { console.log(`  ❌ FAIL: ${msg}`); failed++; }
}

// ── Test 1: 50명 동시 탑승 신청 ──
async function test50ConcurrentApply() {
  console.log('\n🧪 Test 1: 50명 동시 탑승 신청');
  const start = Date.now();

  const routeRef = await addDoc(collection(db, 'routes'), {
    driverId: 'stress-driver', driverName: '스트레스운전자',
    sourceName: '출발', destName: '도착', status: 'active',
    availableSeats: 3, createdAt: new Date().toISOString(),
  });

  const rideIds: string[] = [];
  const results = await Promise.allSettled(
    Array.from({ length: 50 }, (_, i) =>
      addDoc(collection(db, 'rides'), {
        routeId: routeRef.id, driverId: 'stress-driver',
        passengerId: `stress-p-${i}`, passengerName: `유저${i}`,
        status: 'pending', pickupCoord: { lat: 36.36, lng: 127.34 },
        createdAt: new Date().toISOString(),
      }).then(ref => { rideIds.push(ref.id); return ref; })
    )
  );

  const elapsed = Date.now() - start;
  const success = results.filter(r => r.status === 'fulfilled').length;

  console.log(`  50건 신청 완료: ${elapsed}ms`);
  assert(success === 50, `50건 모두 생성 (실제: ${success}건)`);
  assert(elapsed < 10000, `10초 이내 (실제: ${elapsed}ms)`);

  // 정리
  for (const id of rideIds) await deleteDoc(doc(db, 'rides', id));
  await deleteDoc(doc(db, 'routes', routeRef.id));
}

// ── Test 2: 좌석 3석에 20명 동시 수락 경쟁 ──
async function test20ConcurrentAccept() {
  console.log('\n🧪 Test 2: 좌석 3석에 20명 동시 수락 경쟁');

  const routeRef = await addDoc(collection(db, 'routes'), {
    driverId: 'stress-driver', driverName: '테스트',
    sourceName: '출발', destName: '도착', status: 'active',
    availableSeats: 3, createdAt: new Date().toISOString(),
  });

  const rideIds: string[] = [];
  for (let i = 0; i < 20; i++) {
    const ref = await addDoc(collection(db, 'rides'), {
      routeId: routeRef.id, driverId: 'stress-driver',
      passengerId: `stress-p-${i}`, passengerName: `유저${i}`,
      status: 'pending', pickupCoord: { lat: 36.36, lng: 127.34 },
      createdAt: new Date().toISOString(),
    });
    rideIds.push(ref.id);
  }

  const start = Date.now();
  const results = await Promise.allSettled(
    rideIds.map(rideId =>
      runTransaction(db, async (transaction) => {
        const routeSnap = await transaction.get(doc(db, 'routes', routeRef.id));
        const route = routeSnap.data()!;
        if ((route.availableSeats ?? 0) <= 0) throw new Error('좌석 없음');
        transaction.update(doc(db, 'rides', rideId), { status: 'accepted' });
        transaction.update(doc(db, 'routes', routeRef.id), {
          availableSeats: (route.availableSeats ?? 1) - 1,
        });
      })
    )
  );
  const elapsed = Date.now() - start;

  const accepted = results.filter(r => r.status === 'fulfilled').length;
  const finalRoute = await getDoc(doc(db, 'routes', routeRef.id));
  const finalSeats = finalRoute.data()!.availableSeats;

  console.log(`  수락: ${accepted}건, 거절: ${20 - accepted}건, 좌석: ${finalSeats}, 시간: ${elapsed}ms`);
  assert(accepted === 3, `정확히 3명 수락 (실제: ${accepted}명)`);
  assert(finalSeats === 0, `좌석 0석 (실제: ${finalSeats}석)`);

  for (const id of rideIds) await deleteDoc(doc(db, 'rides', id));
  await deleteDoc(doc(db, 'routes', routeRef.id));
}

// ── Test 3: 100개 동시 읽기 ──
async function test100ConcurrentReads() {
  console.log('\n🧪 Test 3: 100개 동시 Firestore 읽기');

  const start = Date.now();
  await Promise.all(
    Array.from({ length: 100 }, () =>
      getDocs(query(collection(db, 'routes'), where('status', '==', 'active')))
    )
  );
  const elapsed = Date.now() - start;

  console.log(`  100개 동시 쿼리: ${elapsed}ms`);
  assert(elapsed < 10000, `10초 이내 (실제: ${elapsed}ms)`);
}

// ── Test 4: 50개 동시 채팅 메시지 ──
async function test50ConcurrentMessages() {
  console.log('\n🧪 Test 4: 50개 동시 채팅 메시지');

  const testRideId = 'stress-test-chat';
  const start = Date.now();

  await Promise.all(
    Array.from({ length: 50 }, (_, i) =>
      addDoc(collection(db, 'chats', testRideId, 'messages'), {
        senderId: `user-${i}`, senderName: `유저${i}`,
        text: `스트레스 메시지 #${i}`, createdAt: new Date().toISOString(),
      })
    )
  );

  const snap = await getDocs(collection(db, 'chats', testRideId, 'messages'));
  const elapsed = Date.now() - start;

  console.log(`  ${snap.size}개 메시지, ${elapsed}ms`);
  assert(snap.size === 50, `50개 모두 저장 (실제: ${snap.size}개)`);
  assert(elapsed < 10000, `10초 이내 (실제: ${elapsed}ms)`);

  for (const d of snap.docs) await deleteDoc(d.ref);
}

// ── Test 5: 10개 동시 합의 확정 (각각 다른 ride) ──
async function test10ConcurrentConfirm() {
  console.log('\n🧪 Test 5: 10쌍 동시 합의 확정');

  const rideIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    const ref = await addDoc(collection(db, 'rides'), {
      routeId: 'stress-route', driverId: `driver-${i}`, passengerId: `passenger-${i}`,
      passengerName: `탑승자${i}`, status: 'accepted',
      driverConfirmed: false, passengerConfirmed: false,
      pickupCoord: { lat: 36.36, lng: 127.34 }, createdAt: new Date().toISOString(),
    });
    rideIds.push(ref.id);
  }

  const start = Date.now();
  // 10쌍이 동시에 양쪽 확정
  await Promise.all(
    rideIds.flatMap(rideId => [
      runTransaction(db, async (tx) => {
        const snap = await tx.get(doc(db, 'rides', rideId));
        const d = snap.data()!;
        const other = d.passengerConfirmed;
        tx.update(doc(db, 'rides', rideId), {
          driverConfirmed: true, status: other ? 'confirmed' : 'confirming',
        });
      }),
      runTransaction(db, async (tx) => {
        const snap = await tx.get(doc(db, 'rides', rideId));
        const d = snap.data()!;
        const other = d.driverConfirmed;
        tx.update(doc(db, 'rides', rideId), {
          passengerConfirmed: true, status: other ? 'confirmed' : 'confirming',
        });
      }),
    ])
  );
  const elapsed = Date.now() - start;

  // 전부 confirmed인지 확인
  let allConfirmed = true;
  for (const id of rideIds) {
    const snap = await getDoc(doc(db, 'rides', id));
    const d = snap.data()!;
    if (d.status !== 'confirmed' || !d.driverConfirmed || !d.passengerConfirmed) {
      allConfirmed = false;
      console.log(`  ❌ ride ${id}: status=${d.status}, d=${d.driverConfirmed}, p=${d.passengerConfirmed}`);
    }
  }

  console.log(`  10쌍 동시 확정: ${elapsed}ms`);
  assert(allConfirmed, `10쌍 모두 confirmed 상태`);
  assert(elapsed < 15000, `15초 이내 (실제: ${elapsed}ms)`);

  for (const id of rideIds) await deleteDoc(doc(db, 'rides', id));
}

// ── Vercel API 부하 ──
async function testAPILoad() {
  console.log('\n🧪 Test 6: Vercel geocoding API 10건 동시 요청');

  const start = Date.now();
  const addresses = [
    '대전광역시 유성구 대학로 99', '대전광역시 동구 우암로 135',
    '대전광역시 서구 둔산로 100', '대전광역시 중구 대흥동',
    '대전광역시 유성구 궁동', '대전광역시 동구 가양동',
    '대전광역시 서구 탄방동', '대전광역시 유성구 봉명동',
    '대전광역시 대덕구 오정동', '대전광역시 중구 은행동',
  ];

  const results = await Promise.allSettled(
    addresses.map(addr =>
      fetch(`https://cnu-car.vercel.app/api/naver/geocode?query=${encodeURIComponent(addr)}`)
        .then(r => r.json())
    )
  );
  const elapsed = Date.now() - start;

  const success = results.filter(r => r.status === 'fulfilled').length;
  console.log(`  ${success}/10 성공, ${elapsed}ms`);
  assert(success >= 8, `80% 이상 성공 (실제: ${success}/10)`);
  assert(elapsed < 15000, `15초 이내 (실제: ${elapsed}ms)`);
}

async function main() {
  console.log('🔥 CNU 카풀 스트레스 테스트 시작\n');
  console.log('시뮬레이션: 50명 동시 접속 상황\n');

  await test50ConcurrentApply();
  await test20ConcurrentAccept();
  await test100ConcurrentReads();
  await test50ConcurrentMessages();
  await test10ConcurrentConfirm();
  await testAPILoad();

  console.log(`\n${'='.repeat(45)}`);
  console.log(`✅ 통과: ${passed}건  ❌ 실패: ${failed}건`);
  console.log(`${'='.repeat(45)}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });

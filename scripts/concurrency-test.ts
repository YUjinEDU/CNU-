/**
 * 동시성 테스트 — 여러 유저가 동시에 요청할 때 데이터 무결성 확인
 *
 * 테스트 항목:
 * 1. 동시 탑승 신청 — 좌석 초과 방지
 * 2. 동시 합의 확정 — race condition 방지
 * 3. 동시 읽기 — Firestore 부하
 *
 * 실행: npx tsx scripts/concurrency-test.ts
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, doc, addDoc, getDoc, getDocs,
  updateDoc, query, where, runTransaction, writeBatch, deleteDoc,
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
  if (condition) {
    console.log(`  ✅ ${msg}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

// ── Test 1: 동시 좌석 수락 — 좌석 초과 방지 ──
async function testConcurrentAccept() {
  console.log('\n🧪 Test 1: 동시 좌석 수락 (좌석 2석에 5명 동시 수락)');

  // 테스트 route 생성 (좌석 2석)
  const routeRef = await addDoc(collection(db, 'routes'), {
    driverId: 'test-driver',
    driverName: '테스트운전자',
    sourceName: '테스트출발',
    destName: '테스트도착',
    status: 'active',
    availableSeats: 2,
    createdAt: new Date().toISOString(),
  });

  // 5개 ride 생성
  const rideIds: string[] = [];
  for (let i = 0; i < 5; i++) {
    const ref = await addDoc(collection(db, 'rides'), {
      routeId: routeRef.id,
      driverId: 'test-driver',
      passengerId: `test-passenger-${i}`,
      passengerName: `테스트탑승자${i}`,
      status: 'pending',
      pickupCoord: { lat: 36.36, lng: 127.34 },
      createdAt: new Date().toISOString(),
    });
    rideIds.push(ref.id);
  }

  // 5개 동시 수락 시도 (트랜잭션)
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

  const accepted = results.filter(r => r.status === 'fulfilled').length;
  const rejected = results.filter(r => r.status === 'rejected').length;

  // 최종 좌석 확인
  const finalRoute = await getDoc(doc(db, 'routes', routeRef.id));
  const finalSeats = finalRoute.data()!.availableSeats;

  console.log(`  수락: ${accepted}건, 거절: ${rejected}건, 최종 좌석: ${finalSeats}`);
  assert(accepted === 2, `좌석 2석에 정확히 2명만 수락됨 (실제: ${accepted}명)`);
  assert(finalSeats === 0, `최종 좌석 0석 (실제: ${finalSeats}석)`);

  // 정리
  for (const id of rideIds) await deleteDoc(doc(db, 'rides', id));
  await deleteDoc(doc(db, 'routes', routeRef.id));
}

// ── Test 2: 동시 합의 확정 — race condition ──
async function testConcurrentConfirm() {
  console.log('\n🧪 Test 2: 동시 합의 확정 (양쪽이 동시에 "합의 완료" 클릭)');

  const rideRef = await addDoc(collection(db, 'rides'), {
    routeId: 'test-route',
    driverId: 'test-driver',
    passengerId: 'test-passenger',
    passengerName: '테스트',
    status: 'accepted',
    driverConfirmed: false,
    passengerConfirmed: false,
    pickupCoord: { lat: 36.36, lng: 127.34 },
    createdAt: new Date().toISOString(),
  });

  // 양쪽 동시 확정
  const confirmFn = (role: 'driver' | 'passenger') =>
    runTransaction(db, async (transaction) => {
      const snap = await transaction.get(doc(db, 'rides', rideRef.id));
      const ride = snap.data()!;
      const updateData: Record<string, unknown> = {};
      if (role === 'driver') updateData.driverConfirmed = true;
      else updateData.passengerConfirmed = true;
      const otherConfirmed = role === 'driver' ? ride.passengerConfirmed : ride.driverConfirmed;
      updateData.status = otherConfirmed ? 'confirmed' : 'confirming';
      transaction.update(doc(db, 'rides', rideRef.id), updateData);
    });

  await Promise.all([confirmFn('driver'), confirmFn('passenger')]);

  const finalRide = await getDoc(doc(db, 'rides', rideRef.id));
  const data = finalRide.data()!;

  assert(data.status === 'confirmed', `최종 상태: confirmed (실제: ${data.status})`);
  assert(data.driverConfirmed === true, `운전자 확정: true`);
  assert(data.passengerConfirmed === true, `탑승자 확정: true`);

  // 정리
  await deleteDoc(doc(db, 'rides', rideRef.id));
}

// ── Test 3: 동시 읽기 부하 ──
async function testConcurrentReads() {
  console.log('\n🧪 Test 3: 동시 읽기 (20개 동시 쿼리)');

  const start = Date.now();
  const promises = Array.from({ length: 20 }, () =>
    getDocs(query(collection(db, 'routes'), where('status', '==', 'active')))
  );
  await Promise.all(promises);
  const elapsed = Date.now() - start;

  console.log(`  20개 동시 쿼리 완료: ${elapsed}ms`);
  assert(elapsed < 5000, `5초 이내 완료 (실제: ${elapsed}ms)`);
}

// ── Test 4: 동시 채팅 메시지 ──
async function testConcurrentMessages() {
  console.log('\n🧪 Test 4: 동시 채팅 (10개 동시 메시지 전송)');

  const testRideId = 'concurrency-test-chat';
  const start = Date.now();

  await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      addDoc(collection(db, 'chats', testRideId, 'messages'), {
        senderId: `user-${i}`,
        senderName: `유저${i}`,
        text: `동시 메시지 #${i}`,
        createdAt: new Date().toISOString(),
      })
    )
  );

  const snap = await getDocs(collection(db, 'chats', testRideId, 'messages'));
  const elapsed = Date.now() - start;

  assert(snap.size === 10, `10개 메시지 모두 저장됨 (실제: ${snap.size}개)`);
  console.log(`  ${elapsed}ms 소요`);

  // 정리
  for (const d of snap.docs) await deleteDoc(d.ref);
}

// ── 실행 ──
async function main() {
  console.log('🚀 CNU 카풀 동시성 테스트 시작\n');

  await testConcurrentAccept();
  await testConcurrentConfirm();
  await testConcurrentReads();
  await testConcurrentMessages();

  console.log(`\n${'='.repeat(40)}`);
  console.log(`✅ 통과: ${passed}건  ❌ 실패: ${failed}건`);
  console.log(`${'='.repeat(40)}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });

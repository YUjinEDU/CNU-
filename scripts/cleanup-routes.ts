/**
 * 오래된 active 상태 route를 정리하는 스크립트.
 * 24시간 이상 지난 active route를 cancelled로 변경.
 *
 * 실행: npx tsx scripts/cleanup-routes.ts
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAp3MX36j6E5t_Gz0JUkTjNV9VrDmswQN4",
  authDomain: "cnu-carpool.firebaseapp.com",
  projectId: "cnu-carpool",
  storageBucket: "cnu-carpool.firebasestorage.app",
  messagingSenderId: "481343945369",
  appId: "1:481343945369:web:72673637d79f363763d608",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanup() {
  console.log('🧹 오래된 active route 정리 시작...\n');

  const q = query(collection(db, 'routes'), where('status', '==', 'active'));
  const snap = await getDocs(q);

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  let cleaned = 0;

  for (const d of snap.docs) {
    const route = d.data();
    const createdAt = new Date(route.createdAt).getTime();
    const age = now - createdAt;

    if (age > ONE_DAY) {
      console.log(`  ❌ ${d.id} — ${route.driverName} (${route.sourceName} → ${route.destName}) — ${Math.round(age / 3600000)}시간 전`);
      await updateDoc(doc(db, 'routes', d.id), { status: 'cancelled' });
      cleaned++;
    } else {
      console.log(`  ✅ ${d.id} — ${route.driverName} (${route.sourceName} → ${route.destName}) — 유지`);
    }
  }

  console.log(`\n🧹 정리 완료: ${cleaned}건 취소, ${snap.size - cleaned}건 유지`);
  process.exit(0);
}

cleanup().catch(e => { console.error(e); process.exit(1); });

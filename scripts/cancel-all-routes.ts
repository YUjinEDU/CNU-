import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyAp3MX36j6E5t_Gz0JUkTjNV9VrDmswQN4',
  authDomain: 'cnu-carpool.firebaseapp.com',
  projectId: 'cnu-carpool',
  storageBucket: 'cnu-carpool.firebasestorage.app',
  messagingSenderId: '481343945369',
  appId: '1:481343945369:web:72673637d79f363763d608',
});
const db = getFirestore(app);

async function main() {
  const q = query(collection(db, 'routes'), where('status', '==', 'active'));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await updateDoc(doc(db, 'routes', d.id), { status: 'cancelled' });
    console.log('cancelled:', d.id, d.data().driverName);
  }
  console.log(`done: ${snap.size} routes cancelled`);
  process.exit(0);
}
main();

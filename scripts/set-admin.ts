import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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
  await updateDoc(doc(db, 'users', '202650302'), { isAdmin: true });
  console.log('done: 202650302 is now admin');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });

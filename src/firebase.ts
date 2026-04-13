import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCjkT2G66V_24fypG6sdQz9ldljP9l8nK8",
  authDomain: "cnu-carpool.firebaseapp.com",
  projectId: "cnu-carpool",
  storageBucket: "cnu-carpool.firebasestorage.app",
  messagingSenderId: "803211976236",
  appId: "1:803211976236:web:a8ec3320b3cc887e933b89",
  measurementId: "G-LJF0DNR1DK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

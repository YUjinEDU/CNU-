import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../types';

const SESSION_KEY = 'cnu-session-id';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getCurrentEmployeeId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export async function signup(
  employeeId: string,
  password: string,
  userData: Omit<User, 'uid' | 'passwordHash' | 'createdAt'>
): Promise<User> {
  const docRef = doc(db, 'users', employeeId);
  const existing = await getDoc(docRef);
  if (existing.exists()) {
    throw new Error('이미 등록된 교번입니다.');
  }

  const passwordHash = await hashPassword(password);
  const newUser: User = {
    ...userData,
    uid: employeeId,
    employeeNumber: employeeId,
    passwordHash,
    isVerified: true,
    stats: { totalRides: 0, driveCount: 0, rideCount: 0, cancelCount: 0 },
    createdAt: new Date().toISOString(),
  };

  await setDoc(docRef, newUser);
  localStorage.setItem(SESSION_KEY, employeeId);
  return newUser;
}

export async function login(employeeId: string, password: string): Promise<User> {
  const docRef = doc(db, 'users', employeeId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error('교번 또는 비밀번호가 올바르지 않습니다.');
  }

  const userData = snap.data() as User;
  const passwordHash = await hashPassword(password);

  if (userData.passwordHash !== passwordHash) {
    throw new Error('교번 또는 비밀번호가 올바르지 않습니다.');
  }

  localStorage.setItem(SESSION_KEY, employeeId);
  return userData;
}

export async function resetPassword(
  employeeId: string,
  name: string,
  department: string,
  newPassword: string
): Promise<void> {
  const docRef = doc(db, 'users', employeeId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('입력 정보가 일치하지 않습니다.');
  }
  const userData = snap.data();
  // 본인 확인 — 이름 + 학과 일치 여부
  if (userData.name !== name.trim() || userData.department !== department.trim()) {
    throw new Error('입력 정보가 일치하지 않습니다.');
  }
  if (newPassword.length < 6) {
    throw new Error('비밀번호는 6자 이상이어야 합니다.');
  }
  const passwordHash = await hashPassword(newPassword);
  await setDoc(docRef, { passwordHash }, { merge: true });
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

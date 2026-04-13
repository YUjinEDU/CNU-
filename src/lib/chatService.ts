import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export async function sendMessage(
  rideId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  await addDoc(collection(db, 'chats', rideId, 'messages'), {
    senderId,
    senderName,
    text,
    createdAt: new Date().toISOString(),
  });
}

export async function sendSystemMessage(
  rideId: string,
  text: string
): Promise<void> {
  await addDoc(collection(db, 'chats', rideId, 'messages'), {
    senderId: 'system',
    senderName: '시스템',
    text,
    createdAt: new Date().toISOString(),
  });
}

export function subscribeToMessages(
  rideId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'chats', rideId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as ChatMessage)));
  });
}

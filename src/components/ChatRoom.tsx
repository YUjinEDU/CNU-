import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { sendMessage, subscribeToMessages, ChatMessage } from '../lib/chatService';
import { useApp } from '../contexts/AppContext';

export function ChatRoom() {
  const { user, currentRide, setState } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const rideId = currentRide?.id;

  useEffect(() => {
    if (!rideId) return;
    const unsubscribe = subscribeToMessages(rideId, setMessages);
    return unsubscribe;
  }, [rideId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !rideId || !user || isSending) return;
    const text = input.trim();
    setInput('');
    setIsSending(true);
    try {
      await sendMessage(rideId, user.uid, user.name, text);
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    if (currentRide?.driverId === user?.uid) {
      setState('DRIVER_MATCHED');
    } else {
      setState('PASSENGER_MATCHED');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-[calc(100vh-64px)]"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-slate-100 shadow-sm">
        <button onClick={handleBack} className="p-2 rounded-full bg-surface-container-lowest">
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-container" />
          <div>
            <p className="font-bold text-on-surface text-sm">픽업 위치 조율</p>
            <p className="text-xs text-on-surface-variant">만날 장소를 채팅으로 정하세요</p>
          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">채팅을 시작해 픽업 위치를 정해보세요!</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isMe && (
                  <p className="text-xs text-on-surface-variant font-medium ml-1">{msg.senderName}</p>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                    isMe
                      ? 'bg-primary-container text-white rounded-br-sm'
                      : 'bg-white text-on-surface rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <p className="text-[10px] text-on-surface-variant mx-1">
                  {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="px-4 py-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1 px-4 py-3 bg-surface-container-lowest rounded-full text-on-surface font-medium focus:ring-2 focus:ring-primary-container outline-none text-sm"
            placeholder="메시지를 입력하세요..."
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              input.trim() && !isSending
                ? 'bg-primary-container text-white active:scale-95'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

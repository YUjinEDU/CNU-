import { useState, useEffect } from 'react';
import { X, MessageCircle, Lock } from 'lucide-react';
import { subscribeToMessages, ChatMessage } from '../lib/chatService';

interface ChatHistoryModalProps {
  rideId: string;
  title: string;
  onClose: () => void;
}

export function ChatHistoryModal({ rideId, title, onClose }: ChatHistoryModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(rideId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return unsubscribe;
  }, [rideId]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary-container" />
            <div>
              <h3 className="text-sm font-extrabold text-primary-container">{title}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3 text-slate-400" />
                <p className="text-[10px] text-slate-400">읽기 전용 · 채팅 기록 보관</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
          {loading && (
            <p className="text-center text-sm text-on-surface-variant py-8">불러오는 중...</p>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-center text-sm text-on-surface-variant py-8">채팅 기록이 없습니다.</p>
          )}
          {messages.map(msg => {
            if (msg.senderId === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-1">
                  <div className="bg-slate-100 text-slate-500 text-[10px] font-medium px-3 py-1.5 rounded-full max-w-[85%] text-center">
                    {msg.text}
                  </div>
                </div>
              );
            }
            return (
              <div key={msg.id} className="flex flex-col gap-0.5">
                <p className="text-[10px] text-on-surface-variant font-medium ml-1">{msg.senderName}</p>
                <div className="bg-white px-3 py-2 rounded-xl text-sm text-on-surface shadow-sm max-w-[85%]">
                  {msg.text}
                </div>
                <p className="text-[9px] text-slate-400 ml-1">
                  {new Date(msg.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

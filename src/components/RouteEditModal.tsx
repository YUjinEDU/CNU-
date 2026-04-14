import { useState } from 'react';
import { X, Clock, Users, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Route } from '../types';
import { updateRideField } from '../lib/firebaseDb';
import { showToast } from './Toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface RouteEditModalProps {
  route: Route;
  onClose: () => void;
  onSaved: (updated: Route) => void;
}

export function RouteEditModal({ route, onClose, onSaved }: RouteEditModalProps) {
  const [date, setDate] = useState(route.departureDate || format(new Date(), 'yyyy-MM-dd'));
  const [hour, setHour] = useState(parseInt(route.departureTime?.split(':')[0] || '8'));
  const [minute, setMinute] = useState(parseInt(route.departureTime?.split(':')[1] || '30'));
  const [seats, setSeats] = useState(route.availableSeats ?? 3);
  const [saving, setSaving] = useState(false);

  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  const handleSave = async () => {
    if (!route.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'routes', route.id), {
        departureDate: date,
        departureTime: timeStr,
        availableSeats: seats,
      });
      showToast('운행 정보가 수정되었습니다.', 'success');
      onSaved({ ...route, departureDate: date, departureTime: timeStr, availableSeats: seats });
      onClose();
    } catch (e: any) {
      showToast(e.message || '수정 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-extrabold text-primary-container">운행 정보 수정</h3>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {/* 날짜 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary-container" />
              <label className="text-xs font-bold text-on-surface-variant">출발 날짜</label>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                const d = addDays(new Date(), offset);
                const dateStr = format(d, 'yyyy-MM-dd');
                const label = offset === 0 ? '오늘' : offset === 1 ? '내일' : format(d, 'M/d(EEE)', { locale: ko });
                return (
                  <button key={offset} onClick={() => setDate(dateStr)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${date === dateStr ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 시간 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary-container" />
              <label className="text-xs font-bold text-on-surface-variant">출발 시간</label>
              <span className="ml-auto text-sm font-bold text-primary-container">{timeStr}</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <select value={hour} onChange={e => setHour(parseInt(e.target.value))}
                className="bg-slate-50 rounded-xl px-3 py-2 text-lg font-bold text-primary-container outline-none">
                {Array.from({ length: 14 }, (_, i) => i + 6).map(h => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                ))}
              </select>
              <span className="text-xl font-bold text-primary-container">:</span>
              <select value={minute} onChange={e => setMinute(parseInt(e.target.value))}
                className="bg-slate-50 rounded-xl px-3 py-2 text-lg font-bold text-primary-container outline-none">
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 좌석 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary-container" />
              <label className="text-xs font-bold text-on-surface-variant">탑승 가능 인원</label>
            </div>
            <div className="flex items-center justify-center gap-6">
              <button onClick={() => setSeats(Math.max(1, seats - 1))}
                className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500">−</button>
              <span className="text-2xl font-black text-primary-container">{seats}명</span>
              <button onClick={() => setSeats(Math.min(6, seats + 1))}
                className="w-10 h-10 rounded-full border-2 border-primary-container bg-primary-container/10 flex items-center justify-center text-primary-container">+</button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-primary-container text-white rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-60"
          >
            {saving ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

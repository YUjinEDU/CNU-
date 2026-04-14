import { useState, useEffect } from 'react';
import { Users, Car, MessageCircle, ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, Handshake } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { getAllUsers, getActiveRoutes, getRideHistory, updateRouteStatus, cancelRide } from '../lib/firebaseDb';
import { ChatHistoryModal } from '../components/ChatHistoryModal';
import { User, Route, Ride } from '../types';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { showToast } from '../components/Toast';
import { showConfirm } from '../components/ConfirmModal';

export function AdminScreen() {
  const { setState } = useApp();
  const [tab, setTab] = useState<'overview' | 'users' | 'routes' | 'rides'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([getAllUsers(), getActiveRoutes()]);
      setUsers(u);
      setRoutes(r);
      // 최근 rides 50건
      const ridesQ = query(collection(db, 'rides'), orderBy('createdAt', 'desc'), limit(50));
      const ridesSnap = await getDocs(ridesQ);
      setRides(ridesSnap.docs.map(d => ({ ...d.data(), id: d.id } as Ride)));
    } catch (e: any) {
      showToast('데이터 로드 실패: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const statusColor = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'accepted': return 'bg-blue-100 text-blue-700';
      case 'confirming': return 'bg-purple-100 text-purple-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-green-200 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-600';
      case 'rejected': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: '대기', accepted: '수락', confirming: '합의중',
      confirmed: '확정', completed: '완료', cancelled: '취소',
      rejected: '거절', active: '모집중',
    };
    return map[s] || s;
  };

  // 통계
  const totalUsers = users.length;
  const totalDrivers = users.filter(u => u.role === 'driver' || u.role === 'both').length;
  const activeRoutes = routes.length;
  const totalRides = rides.length;
  const completedRides = rides.filter(r => r.status === 'completed').length;
  const activeRides = rides.filter(r => ['pending', 'accepted', 'confirming', 'confirmed'].includes(r.status)).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 space-y-4 pb-32"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setState('HOME')} className="p-2 rounded-full bg-surface-container-lowest shadow-sm">
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <h2 className="text-2xl font-extrabold text-primary-container">관리자 대시보드</h2>
        </div>
        <button onClick={loadData} className="p-2 rounded-full bg-blue-50">
          <RefreshCw className={`w-5 h-5 text-primary-container ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-2">
        {(['overview', 'users', 'routes', 'rides'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              tab === t ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t === 'overview' ? '전체 현황' : t === 'users' ? '사용자' : t === 'routes' ? '운행' : '매칭'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-slate-300 mx-auto animate-spin" />
          <p className="text-sm text-on-surface-variant mt-3">데이터 로딩 중...</p>
        </div>
      ) : (
        <>
          {/* 전체 현황 */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm text-center">
                  <Users className="w-6 h-6 text-primary-container mx-auto mb-2" />
                  <p className="text-2xl font-black text-primary-container">{totalUsers}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold">전체 사용자</p>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm text-center">
                  <Car className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-black text-blue-600">{totalDrivers}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold">운전자 수</p>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm text-center">
                  <Handshake className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-black text-green-600">{activeRoutes}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold">모집 중 운행</p>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm text-center">
                  <MessageCircle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-black text-orange-500">{activeRides}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold">진행 중 매칭</p>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">카풀 통계</p>
                <div className="flex justify-between">
                  <div className="text-center">
                    <p className="text-lg font-black text-on-surface">{totalRides}</p>
                    <p className="text-[10px] text-on-surface-variant">전체 매칭</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-green-600">{completedRides}</p>
                    <p className="text-[10px] text-on-surface-variant">완료</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-orange-500">{activeRides}</p>
                    <p className="text-[10px] text-on-surface-variant">진행 중</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-red-500">{rides.filter(r => r.status === 'cancelled').length}</p>
                    <p className="text-[10px] text-on-surface-variant">취소</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 사용자 목록 */}
          {tab === 'users' && (
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant font-bold">{users.length}명</p>
              {users.map(u => (
                <div key={u.uid} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
                    <span className="font-bold text-primary-container">{(u.name ?? '?')[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-sm truncate">{u.name} {u.isAdmin && '(관리자)'}</p>
                    <p className="text-[10px] text-on-surface-variant">{u.department} · {u.employeeNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      u.role === 'driver' ? 'bg-blue-50 text-blue-600' :
                      u.role === 'passenger' ? 'bg-green-50 text-green-600' :
                      'bg-purple-50 text-purple-600'
                    }`}>
                      {u.role === 'driver' ? '운전' : u.role === 'passenger' ? '탑승' : '둘 다'}
                    </span>
                    {u.stats && (
                      <p className="text-[9px] text-on-surface-variant mt-1">카풀 {u.stats.totalRides}회</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 운행 목록 */}
          {tab === 'routes' && (
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant font-bold">모집 중 {routes.length}건</p>
              {routes.length === 0 && (
                <p className="text-center py-8 text-on-surface-variant text-sm">현재 모집 중인 운행이 없습니다.</p>
              )}
              {routes.map(r => (
                <div key={r.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-on-surface text-sm">{r.driverName}</p>
                    <div className="flex items-center gap-2">
                      {r.departureTime && <span className="text-xs font-bold text-primary-container">{r.departureTime}</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant">{r.sourceName} → {r.destName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-2">
                      {r.availableSeats !== undefined && (
                        <span className="text-[10px] text-on-surface-variant">잔여석: {r.availableSeats}석</span>
                      )}
                      {r.departureDate && (
                        <span className="text-[10px] text-on-surface-variant">{r.departureDate.slice(5).replace('-', '/')}</span>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        if (!(await showConfirm(`${r.driverName}의 운행을 취소하시겠습니까?`))) return;
                        try {
                          await updateRouteStatus(r.id!, 'cancelled');
                          showToast('운행이 취소되었습니다.', 'success');
                          loadData();
                        } catch (e: any) {
                          showToast(e.message || '취소 실패', 'error');
                        }
                      }}
                      className="text-red-500 text-[11px] font-bold px-2 py-1 bg-red-50 rounded-full"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 매칭 목록 */}
          {tab === 'rides' && (
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant font-bold">최근 {rides.length}건</p>
              {rides.map(r => (
                <div key={r.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-on-surface text-sm">
                      {r.driverName || '운전자'} ↔ {r.passengerName}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant">
                    {new Date(r.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {r.completedAt && ` → ${new Date(r.completedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 완료`}
                  </p>
                  {r.cancelledBy && (
                    <p className="text-[10px] text-red-500 mt-0.5">{r.cancelledBy === 'driver' ? '운전자' : '탑승자'} 취소</p>
                  )}
                  {r.passengerDepartureAddress && (
                    <p className="text-[10px] text-on-surface-variant mt-0.5">출발: {r.passengerDepartureAddress}</p>
                  )}
                  {r.passengerDestBuilding && (
                    <p className="text-[10px] text-on-surface-variant">목적지: {r.passengerDestBuilding}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setSelectedRide(r)}
                      className="flex items-center gap-1 text-[11px] text-primary-container font-bold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      채팅 기록
                    </button>
                    {!['completed', 'cancelled', 'rejected'].includes(r.status) && (
                      <button
                        onClick={async () => {
                          if (!(await showConfirm(`${r.driverName || '운전자'} ↔ ${r.passengerName} 매칭을 취소하시겠습니까?`))) return;
                          try {
                            await cancelRide(r.id!, 'driver', r.driverId);
                            showToast('매칭이 취소되었습니다.', 'success');
                            loadData();
                          } catch (e: any) {
                            showToast(e.message || '취소 실패', 'error');
                          }
                        }}
                        className="text-red-500 text-[11px] font-bold"
                      >
                        매칭 취소
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 채팅 기록 모달 */}
      {selectedRide?.id && (
        <ChatHistoryModal
          rideId={selectedRide.id}
          title={`${selectedRide.driverName || '운전자'} ↔ ${selectedRide.passengerName}`}
          onClose={() => setSelectedRide(null)}
        />
      )}
    </motion.div>
  );
}

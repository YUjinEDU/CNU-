import { MapPin, Hand } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../contexts/AppContext';

export function PassengerSearchScreen() {
  const { setState, availableRoutes, setSelectedRoute } = useApp();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-8 space-y-6 pb-32"
    >
      <div className="px-2">
        <h2 className="text-2xl font-extrabold text-primary-container">검색 결과</h2>
        <p className="text-on-surface-variant text-sm font-medium">자연과학대학 서문 권역 • 오늘 오전 08:30</p>
      </div>

      <div className="space-y-6">
        {availableRoutes.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            현재 이용 가능한 차량이 없습니다.
          </div>
        ) : (
          availableRoutes.map(route => (
            <article
              key={route.id}
              onClick={() => {
                setSelectedRoute(route);
                setState('PASSENGER_MATCHED');
              }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100 cursor-pointer hover:scale-[1.01] transition-transform"
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 h-40 bg-slate-200 relative">
                  <img src={`https://picsum.photos/seed/${route.id}/300/200`} className="w-full h-full object-cover" alt="Car" />
                  <div className="absolute top-3 left-3 bg-primary-container text-white px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <Hand className="w-3 h-3" />
                    도보 3분
                  </div>
                </div>
                <div className="md:w-2/3 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-primary-container uppercase">공과대학 / 교수</span>
                        <span className="bg-blue-50 text-primary-container text-[8px] px-1.5 py-0.5 rounded-full font-bold">✅ SSO</span>
                      </div>
                      <h3 className="text-lg font-bold text-on-surface">{route.driverName}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-primary-container block">{route.departureTime}</span>
                      <span className="text-[8px] font-medium text-on-surface-variant uppercase">Departure</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-on-surface-variant" />
                      <span className="text-xs font-medium text-on-surface-variant">{route.sourceName}</span>
                    </div>
                    <button className="bg-primary-container text-white px-4 py-2 rounded-lg text-xs font-bold">탑승 요청</button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </motion.div>
  );
}

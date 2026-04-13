import { Car, Users, X } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export function GuideModal({ onClose }: GuideModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-6" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-extrabold text-primary-container">CNU 카풀 이용 가이드</h3>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="px-5 pb-6 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-primary-container" />
              <p className="font-bold text-on-surface">운전자라면</p>
            </div>
            <div className="space-y-2 ml-7">
              {[
                '하단 "운전" 탭 또는 홈의 운행 버튼을 눌러 출발지, 도착지, 출발 시간을 등록하세요.',
                '탑승 신청이 오면 신청자의 출발지와 목적지를 확인하고 수락하세요.',
                '채팅으로 만날 장소와 시간을 조율하고, 양쪽 모두 "합의 완료"를 누르면 매칭이 확정됩니다.',
                '약속 장소에 도착하면 "도착했어요", 탑승하면 "탑승했어요", 도착하면 "하차 완료"를 눌러주세요.',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="bg-primary-container text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-on-surface-variant">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-container" />
              <p className="font-bold text-on-surface">탑승자라면</p>
            </div>
            <div className="space-y-2 ml-7">
              {[
                '하단 "탑승" 탭을 눌러 출발지와 목적지 권역을 선택하세요.',
                '가까운 운전자 리스트에서 원하는 운전자에게 "탑승 신청"하세요.',
                '운전자가 수락하면 채팅이 열립니다. 만날 장소를 정하고 "합의 완료"를 누르세요.',
                '도착/탑승/하차 버튼으로 상태를 알려주세요. 어느 단계에서든 취소할 수 있습니다.',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="bg-green-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-on-surface-variant">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-800 mb-1">참고</p>
            <p className="text-xs text-amber-700">2부제 적용일에는 해당 차량의 운행 등록이 제한됩니다. 카풀 탑승은 언제든 가능합니다.</p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-primary-container text-white rounded-xl font-bold text-sm active:scale-95 transition-all"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

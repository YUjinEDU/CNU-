import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmState {
  message: string;
  resolve: (result: boolean) => void;
}

let showConfirmFn: ((msg: string) => Promise<boolean>) | null = null;

/** alert() 대신 사용 — confirm() 대체 */
export function showConfirm(message: string): Promise<boolean> {
  if (!showConfirmFn) return Promise.resolve(window.confirm(message));
  return showConfirmFn(message);
}

export function ConfirmModalContainer() {
  const [state, setState] = useState<ConfirmState | null>(null);

  showConfirmFn = (message: string) => {
    return new Promise<boolean>((resolve) => {
      setState({ message, resolve });
    });
  };

  if (!state) return null;

  const handleResult = (result: boolean) => {
    state.resolve(result);
    setState(null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center px-6" onClick={() => handleResult(false)}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-full">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <p className="font-bold text-on-surface text-sm flex-1">{state.message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleResult(false)}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm active:scale-95 transition-all"
          >
            취소
          </button>
          <button
            onClick={() => handleResult(true)}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-all"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

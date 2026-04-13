import { useState } from 'react';
import { School, BookOpen } from 'lucide-react';
import { GuideModal } from '../GuideModal';

interface TopAppBarProps {
  title?: string;
}

export function TopAppBar({ title = "CNU 카풀" }: TopAppBarProps) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 bg-white/80 backdrop-blur-xl z-50 shadow-[0_8px_24px_rgba(0,40,83,0.06)]">
        <div className="flex items-center gap-3">
          <School className="text-primary-container w-6 h-6" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Chungnam National University</span>
            <h1 className="text-lg font-bold tracking-tight font-headline text-primary-container">{title}</h1>
          </div>
        </div>
        <button
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-1.5 bg-blue-50 text-primary-container px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          가이드
        </button>
      </header>
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </>
  );
}

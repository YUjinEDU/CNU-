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
      <header className="flex justify-between items-center px-5 py-2.5 w-full sticky top-0 bg-white/80 backdrop-blur-xl z-50 shadow-[0_4px_12px_rgba(0,40,83,0.04)]">
        <div className="flex items-center gap-2">
          <School className="text-primary-container w-5 h-5" />
          <div className="flex items-baseline gap-1.5">
            <h1 className="text-base font-bold tracking-tight font-headline text-primary-container">{title}</h1>
            <span className="text-[9px] text-on-surface-variant font-medium">충남대</span>
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

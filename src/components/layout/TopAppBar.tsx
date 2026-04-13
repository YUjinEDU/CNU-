import { School } from 'lucide-react';

interface TopAppBarProps {
  title?: string;
}

export function TopAppBar({ title = "CNU 카풀" }: TopAppBarProps) {
  return (
    <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 bg-white/80 backdrop-blur-xl z-50 shadow-[0_8px_24px_rgba(0,40,83,0.06)]">
      <div className="flex items-center gap-3">
        <School className="text-primary-container w-6 h-6" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Chungnam National University</span>
          <h1 className="text-lg font-bold tracking-tight font-headline text-primary-container">{title}</h1>
        </div>
      </div>
    </header>
  );
}

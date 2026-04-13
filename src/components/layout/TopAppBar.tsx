import { School } from 'lucide-react';

interface TopAppBarProps {
  title?: string;
}

export function TopAppBar({ title = "CNU 교직원 카풀" }: TopAppBarProps) {
  return (
    <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 bg-white/80 backdrop-blur-xl z-50 shadow-[0_8px_24px_rgba(0,40,83,0.06)]">
      <div className="flex items-center gap-3">
        <School className="text-primary-container w-6 h-6" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Chungnam National University</span>
          <h1 className="text-lg font-bold tracking-tight font-headline text-primary-container">{title}</h1>
        </div>
      </div>
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container/10">
        <img
          src="https://picsum.photos/seed/faculty/100/100"
          alt="Profile"
          className="w-full h-full object-cover"
        />
      </div>
    </header>
  );
}

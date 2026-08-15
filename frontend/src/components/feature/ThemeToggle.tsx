import { useState, useRef, useEffect } from 'react';

interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (t: 'light' | 'dark' | 'system') => void;
}

export default function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const iconMap: Record<string, string> = {
    light: 'ri-sun-line',
    dark: 'ri-moon-line',
    system: 'ri-computer-line',
  };

  const options: { value: 'light' | 'dark' | 'system'; label: string; icon: string }[] = [
    { value: 'light', label: 'Claro', icon: 'ri-sun-line' },
    { value: 'dark', label: 'Oscuro', icon: 'ri-moon-line' },
    { value: 'system', label: 'Sistema', icon: 'ri-computer-line' },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Cambiar tema"
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-800 hover:bg-background-100 transition-colors cursor-pointer"
        title="Cambiar tema"
      >
        <i className={iconMap[theme] || 'ri-contrast-2-line'} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1 w-36 bg-background-50 border border-secondary-200 rounded-lg shadow-lg z-50 py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="menuitem"
              onClick={() => { onThemeChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                theme === opt.value
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-foreground-600 hover:bg-background-100'
              }`}
            >
              <i className={opt.icon} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
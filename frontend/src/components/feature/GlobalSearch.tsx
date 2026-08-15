import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const searchItems = [
    { label: 'Dashboard', path: '/', icon: 'ri-dashboard-line', category: 'Navegación' },
    { label: 'Alumnos', path: '/alumnos', icon: 'ri-user-star-line', category: 'Gestión' },
    { label: 'Profesores', path: '/profesores', icon: 'ri-user-voice-line', category: 'Gestión' },
    { label: 'Padres', path: '/padres', icon: 'ri-user-heart-line', category: 'Gestión' },
    { label: 'Salones', path: '/salones', icon: 'ri-building-2-line', category: 'Gestión' },
    { label: 'Sucursales', path: '/sucursales', icon: 'ri-store-2-line', category: 'Gestión' },
    { label: 'Inscripciones', path: '/inscripciones', icon: 'ri-file-list-3-line', category: 'Procesos' },
    { label: 'Finanzas', path: '/finanzas', icon: 'ri-money-dollar-circle-line', category: 'Finanzas' },
    { label: 'Caja', path: '/caja', icon: 'ri-money-dollar-box-line', category: 'Finanzas' },
    { label: 'Reportes', path: '/reportes', icon: 'ri-bar-chart-2-line', category: 'Análisis' },
    { label: 'Configuración', path: '/configuracion', icon: 'ri-settings-3-line', category: 'Sistema' },
  ];

  const filtered = query
    ? searchItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : searchItems;

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        aria-label="Buscar en SchoolCore"
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-background-100 border border-secondary-200 text-sm text-foreground-400 hover:text-foreground-600 hover:border-secondary-300 transition-colors cursor-pointer min-w-[200px]"
      >
        <i className="ri-search-line text-sm" />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="text-3xs px-1.5 py-0.5 rounded bg-secondary-200 text-foreground-500 hidden lg:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label="Búsqueda"
            className="relative w-full max-w-lg bg-background-50 rounded-xl border border-secondary-200 shadow-2xl overflow-hidden mx-4"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-secondary-100">
              <i className="ri-search-line text-foreground-400" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar módulos, alumnos, reportes..."
                aria-label="Buscar módulos"
                className="flex-1 bg-transparent text-sm text-foreground-900 placeholder:text-foreground-300 outline-none"
              />
              <kbd className="text-3xs px-1.5 py-0.5 rounded bg-secondary-100 text-foreground-500">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-foreground-400 text-center py-8">Sin resultados</p>
              ) : (
                filtered.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { navigate(item.path); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer text-left whitespace-nowrap"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-md bg-secondary-100">
                      <i className={`${item.icon} text-foreground-500`} />
                    </div>
                    <span>{item.label}</span>
                    <span className="ml-auto text-2xs text-foreground-400">{item.category}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
import { ReactNode, useState, useEffect, useCallback } from 'react';
import { SidebarContext } from '@/hooks/useSidebar';
import { useTheme, ThemeMode } from '@/hooks/useTheme';
import Sidebar from '@/components/feature/Sidebar';
import Header from '@/components/feature/Header';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem('SchoolCore-sidebar-collapsed');
    return stored === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme, applyTheme } = useTheme();

  useEffect(() => {
    applyTheme(theme);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  const handleCollapsedChange = useCallback((v: boolean) => {
    setCollapsed(v);
    localStorage.setItem('SchoolCore-sidebar-collapsed', String(v));
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed: handleCollapsedChange, mobileOpen, setMobileOpen }}>
      <div className="flex h-screen overflow-hidden bg-background-50">
        <Sidebar />
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'lg:ml-[64px]' : 'lg:ml-[240px]'
        }`}>
          <Header theme={theme} onThemeChange={setTheme} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background-50" role="main" aria-label="Contenido principal">
            <div className="page-enter">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
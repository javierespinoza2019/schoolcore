import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { AppRoutes } from './router';
import { ToastProvider } from '@/components/base/Toast';
import { AuthProvider } from '@/auth/AuthContext';
import { PermissionProvider } from '@/permissions/PermissionContext';
import { SchoolProvider } from '@/context/SchoolContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={__BASE_PATH__}>
          <AuthProvider>
            <PermissionProvider>
              <SchoolProvider>
                <ToastProvider>
                  <AppRoutes />
                </ToastProvider>
              </SchoolProvider>
            </PermissionProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;

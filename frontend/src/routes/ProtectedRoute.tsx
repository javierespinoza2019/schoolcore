import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAccessToken } from '@/auth/tokenStorage';
import { useAuth } from '@/auth/AuthContext';
import { usePermissions } from '@/permissions/PermissionContext';
import { viewCodeForPath } from '@/permissions/viewCodes';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';

/**
 * Protege rutas: sin token → /login.
 * Con permisos reales → ViewCode.view; stub permite todo si autenticado.
 * Asistente IA gated por feature flag AiAssistant (BD).
 */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const { can, usingRealPermissions } = usePermissions();
  const { isEnabled } = useFeatureFlags();
  const location = useLocation();
  const token = getAccessToken();

  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (location.pathname.startsWith('/asistente-ia') && !isEnabled('aiAssistant')) {
    return <Navigate to="/" replace />;
  }

  const view = viewCodeForPath(location.pathname);
  if (usingRealPermissions && view && !can(view, 'view')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-100 p-6">
        <div className="max-w-md text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
            <i className="ri-lock-line text-2xl text-amber-600" />
          </div>
          <h1 className="text-lg font-semibold text-foreground-900">Sin permiso</h1>
          <p className="text-sm text-foreground-500">
            No tienes acceso a esta sección. Contacta al administrador de tu escuela.
          </p>
          <a href="/" className="inline-flex text-sm text-primary-600 hover:underline">
            Volver al dashboard
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

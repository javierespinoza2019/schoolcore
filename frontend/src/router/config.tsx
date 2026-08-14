import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import NotFound from '../pages/NotFound';
import Dashboard from '../pages/dashboard/page';
import Alumnos from '../pages/alumnos/page';
import AlumnoDetail from '../pages/alumnos/detail/page';
import Padres from '../pages/padres/page';
import PadreDetail from '../pages/padres/detail/page';
import Profesores from '../pages/profesores/page';
import ProfesorDetail from '../pages/profesores/detail/page';
import Salones from '../pages/salones/page';
import Sucursales from '../pages/sucursales/page';
import Inscripciones from '../pages/inscripciones/page';
import Finanzas from '../pages/finanzas/page';
import EstadoCuenta from '../pages/finanzas/estado-cuenta/page';
import Caja from '../pages/caja/page';
import Reportes from '../pages/reportes/page';
import AsistenteIA from '../pages/asistente-ia/page';
import Configuracion from '../pages/configuracion/page';
import Notificaciones from '../pages/notificaciones/page';
import LoginPage from '../pages/login/page';
import ForgotPasswordPage from '../pages/forgot-password/page';
import ResetPasswordPage from '../pages/reset-password/page';
import ProtectedRoute from '../routes/ProtectedRoute';
import { FEATURES } from '../config/features';

const appChildren: RouteObject[] = [
  { path: '/', element: <Dashboard /> },
  { path: '/alumnos', element: <Alumnos /> },
  { path: '/alumnos/:id', element: <AlumnoDetail /> },
  { path: '/padres', element: <Padres /> },
  { path: '/padres/:id', element: <PadreDetail /> },
  { path: '/profesores', element: <Profesores /> },
  { path: '/profesores/:id', element: <ProfesorDetail /> },
  { path: '/salones', element: <Salones /> },
  { path: '/sucursales', element: <Sucursales /> },
  { path: '/inscripciones', element: <Inscripciones /> },
  { path: '/finanzas', element: <Finanzas /> },
  { path: '/finanzas/estado-cuenta/:id', element: <EstadoCuenta /> },
  { path: '/caja', element: <Caja /> },
  { path: '/reportes', element: <Reportes /> },
  {
    path: '/asistente-ia',
    element: FEATURES.aiAssistant ? <AsistenteIA /> : <Navigate to="/" replace />,
  },
  { path: '/configuracion', element: <Configuracion /> },
  { path: '/notificaciones', element: <Notificaciones /> },
  { path: '*', element: <NotFound /> },
];

const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: appChildren,
  },
];

export default routes;

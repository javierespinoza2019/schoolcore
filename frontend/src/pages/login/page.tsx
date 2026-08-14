import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Button from '@/components/base/Button';
import Card from '@/components/base/Card';
import Input from '@/components/base/Input';
import { useAuth } from '@/auth/AuthContext';
import { env, isProduction } from '@/config/env';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Ingresa correo y contraseña.');
      return;
    }

    const result = await login({ email: email.trim(), password });
    if (!result.ok) {
      setError(result.message || 'Credenciales inválidas.');
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mb-4 shadow-sm">
            <i className="ri-graduation-cap-fill text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground-900 tracking-tight">{env.appName}</h1>
          <p className="mt-1.5 text-sm text-foreground-500 text-center">
            ERP escolar — inicia sesión para continuar
          </p>
          {!isProduction && (
            <p className="mt-2 text-3xs uppercase tracking-wide text-foreground-400">
              {env.appEnv} · {env.apiBaseUrl}
            </p>
          )}
        </div>

        <Card padding="lg" className="shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              required
              icon="ri-mail-line"
              placeholder="usuario@colegio.edu.mx"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              icon="ri-lock-line"
              iconRight={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}
              onIconClick={() => setShowPassword((v) => !v)}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-100 px-3 py-2">
                <i className="ri-error-warning-line text-red-500 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" variant="primary" className="w-full" loading={isLoading} size="lg">
              Iniciar sesión
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-3xs text-foreground-400">
          © {new Date().getFullYear()} {env.appName} · school-core.net
        </p>
      </div>
    </div>
  );
}

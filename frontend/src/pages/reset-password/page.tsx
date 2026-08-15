import { useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '@/components/base/Button';
import Card from '@/components/base/Card';
import Input from '@/components/base/Input';
import * as authApi from '@/api/authApi';
import { friendlyApiError } from '@/lib/interaction/messages';
import { validatePassword } from '@/lib/validation/fields';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!token) {
      setError('El enlace de recuperación no es válido o ha expirado.');
      return;
    }
    const passwordErr = validatePassword(password);
    if (passwordErr) {
      setError(passwordErr);
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({ token, newPassword: password });
      if (!res.success) {
        setError(friendlyApiError(res) || 'No se pudo restablecer la contraseña.');
        return;
      }
      setDone(true);
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mb-4 shadow-sm">
            <i className="ri-graduation-cap-fill text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground-900 tracking-tight">SchoolCore</h1>
          <p className="mt-1.5 text-sm text-foreground-500 text-center">
            Restablecer contraseña
          </p>
        </div>

        <Card padding="lg" className="shadow-sm">
          {!token && !done ? (
            <div className="space-y-4 text-center">
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-left">
                <i className="ri-error-warning-line text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Falta el token de recuperación. Abre el enlace que recibiste por correo.
                </p>
              </div>
              <Link to="/forgot-password">
                <Button variant="primary" className="w-full" size="lg">
                  Solicitar nuevo enlace
                </Button>
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-accent-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground-800">Contraseña actualizada</p>
                <p className="mt-1.5 text-xs text-foreground-500">
                  Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>
              <Link to="/login">
                <Button variant="primary" className="w-full" size="lg">
                  Ir al inicio de sesión
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nueva contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                icon="ri-lock-line"
                iconRight={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}
                iconRightAriaLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onIconClick={() => setShowPassword((v) => !v)}
                placeholder="Mínimo 8 caracteres, mayúscula, minúscula y dígito"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Input
                label="Confirmar contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                icon="ri-lock-password-line"
                placeholder="Repite la contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />

              {error && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-100 px-3 py-2" role="alert">
                  <i className="ri-error-warning-line text-red-500 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full" loading={loading} size="lg">
                Guardar contraseña
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

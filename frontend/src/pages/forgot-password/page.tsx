import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/base/Button';
import Card from '@/components/base/Card';
import Input from '@/components/base/Input';
import * as authApi from '@/api/authApi';
import { friendlyApiError } from '@/lib/interaction/messages';
import { FieldLimits, validateEmail } from '@/lib/validation/fields';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const emailErr = validateEmail(email, true);
    setFieldError(emailErr);
    if (emailErr) return;

    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      if (!res.success) {
        setError(friendlyApiError(res) || 'No se pudo enviar el correo.');
        return;
      }
      setSent(true);
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
            <i className="ri-graduation-cap-fill text-white text-2xl" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground-900 tracking-tight">SchoolCore</h1>
          <p className="mt-1.5 text-sm text-foreground-500 text-center">
            Recuperar contraseña
          </p>
        </div>

        <Card padding="lg" className="shadow-sm">
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center">
                <i className="ri-mail-check-line text-accent-600 text-xl" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground-800">Revisa tu correo</p>
                <p className="mt-1.5 text-xs text-foreground-500">
                  Si existe una cuenta con <span className="font-medium">{email}</span>,
                  enviamos un enlace para restablecer tu contraseña.
                </p>
              </div>
              <Link to="/login">
                <Button variant="primary" className="w-full" size="lg">
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-foreground-500">
                Ingresa el correo de tu cuenta y te enviaremos un enlace para restablecer la
                contraseña.
              </p>

              <Input
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                required
                maxLength={FieldLimits.email}
                icon="ri-mail-line"
                placeholder="usuario@colegio.edu.mx"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldError) setFieldError(null);
                }}
                error={fieldError || undefined}
              />

              {error && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-100 px-3 py-2" role="alert">
                  <i className="ri-error-warning-line text-red-500 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full" loading={loading} size="lg">
                Enviar enlace
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

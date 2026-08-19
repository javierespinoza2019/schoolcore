import { useRef } from 'react';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import { useToast } from '@/components/base/Toast';
import TeacherAvatar from '@/components/feature/TeacherAvatar';
import { FieldLimits } from '@/lib/validation/fields';
import {
  detectDeviceTimeZone,
  labelForTimeZone,
  MEXICO_TIME_ZONES,
  PLATFORM_DEFAULT_TIME_ZONE,
} from '@/lib/timeZones';

interface Props {
  saved: boolean;
  nombre: string;
  rfc: string;
  telefono: string;
  email: string;
  sitio: string;
  direccion: string;
  timeZoneId: string;
  logo: string;
  uploadingLogo?: boolean;
  errors?: Record<string, string>;
  onNombreChange: (v: string) => void;
  onRfcChange: (v: string) => void;
  onTelefonoChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onSitioChange: (v: string) => void;
  onDireccionChange: (v: string) => void;
  onTimeZoneChange: (v: string) => void;
  onLogoFile: (file: File) => void;
  onSave: () => void;
}

export default function GeneralTab({
  saved, nombre, rfc, telefono, email, sitio, direccion, timeZoneId,   logo,
  uploadingLogo = false,
  errors = {},
  onNombreChange, onRfcChange, onTelefonoChange, onEmailChange, onSitioChange, onDireccionChange, onTimeZoneChange, onLogoFile, onSave,
}: Props) {
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDetect = () => {
    const detected = detectDeviceTimeZone();
    if (!detected) {
      showToast('No se pudo detectar la zona del dispositivo', 'error');
      return;
    }
    const allowed = MEXICO_TIME_ZONES.some((z) => z.id === detected);
    if (allowed) {
      onTimeZoneChange(detected);
      showToast(`Sugerencia aplicada: ${labelForTimeZone(detected)}. Confirma con Guardar.`, 'info');
    } else {
      showToast(`Detectamos ${detected}. Elige la zona de negocio más cercana del catálogo.`, 'info');
    }
  };

  const handlePickLogo = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('El logo debe pesar máximo 2 MB', 'error');
      return;
    }
    const okType = /image\/(png|jpeg|jpg)/i.test(file.type) || /\.(png|jpe?g)$/i.test(file.name);
    if (!okType) {
      showToast('Usa PNG o JPG (SVG no está soportado todavía)', 'error');
      return;
    }
    onLogoFile(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-2" padding="lg">
        <h3 className="text-sm font-semibold text-foreground-900 mb-5">Información de la Institución</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre de la Institución"
            required
            autoComplete="organization"
            maxLength={FieldLimits.institutionDisplayName}
            value={nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            error={errors.nombre}
          />
          <Input
            label="RFC"
            autoComplete="off"
            maxLength={FieldLimits.taxId}
            value={rfc}
            onChange={(e) => onRfcChange(e.target.value)}
            error={errors.rfc}
          />
          <Input
            label="Teléfono"
            type="tel"
            autoComplete="tel"
            maxLength={FieldLimits.phone}
            value={telefono}
            onChange={(e) => onTelefonoChange(e.target.value)}
            error={errors.telefono}
          />
          <Input
            label="Correo Electrónico"
            type="email"
            autoComplete="email"
            maxLength={FieldLimits.email}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            error={errors.email}
          />
          <div className="sm:col-span-2">
            <Input
              label="Sitio Web"
              type="url"
              autoComplete="url"
              maxLength={FieldLimits.website}
              value={sitio}
              onChange={(e) => onSitioChange(e.target.value)}
              error={errors.sitio}
              placeholder="https://www.colegio.edu.mx"
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Dirección Fiscal"
              autoComplete="street-address"
              maxLength={FieldLimits.address}
              value={direccion}
              onChange={(e) => onDireccionChange(e.target.value)}
              error={errors.direccion}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-secondary-100">
          <Button onClick={onSave} icon={saved ? 'ri-check-line' : 'ri-save-line'} variant={saved ? 'success' : 'primary'}>{saved ? 'Guardado' : 'Guardar Cambios'}</Button>
          <Button variant="ghost">Cancelar</Button>
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-sm font-semibold text-foreground-900 mb-5">Logo de la Institución</h3>
        <div className="flex flex-col items-center gap-3">
          {logo ? (
            <TeacherAvatar
              src={String(logo)}
              alt="Logo"
              filenameHint="institution-logo"
              className="w-28 h-28 rounded-xl object-contain border border-secondary-200 bg-background-50"
            />
          ) : (
            <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <i className="ri-graduation-cap-fill text-white text-3xl" />
            </div>
          )}
          <p className="text-xs text-foreground-500 text-center">PNG o JPG, máximo 2 MB. Después pulsa Guardar cambios.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              handlePickLogo(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <Button
            variant="outline"
            size="sm"
            icon="ri-upload-line"
            loading={uploadingLogo}
            disabled={uploadingLogo}
            onClick={() => fileRef.current?.click()}
          >
            Subir Logo
          </Button>
        </div>
      </Card>

      <Card className="lg:col-span-3" padding="lg">
        <h3 className="text-sm font-semibold text-foreground-900 mb-1">Zona horaria de la institución</h3>
        <p className="text-xs text-foreground-500 mb-5">
          Fechas, caja del día y reportes usan esta zona. Los registros se guardan en UTC; al cambiar la zona no se reescriben fechas históricas.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <Select
            label="Zona horaria"
            options={MEXICO_TIME_ZONES.map((z) => ({ value: z.id, label: z.label }))}
            value={timeZoneId || PLATFORM_DEFAULT_TIME_ZONE}
            onChange={(e) => onTimeZoneChange(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" icon="ri-map-pin-time-line" onClick={handleDetect}>
              Detectar zona del dispositivo
            </Button>
          </div>
          <Select label="Moneda" options={[{ value: 'mxn', label: 'Peso Mexicano (MXN $)' }]} value="mxn" onChange={() => {}} />
        </div>
      </Card>
    </div>
  );
}

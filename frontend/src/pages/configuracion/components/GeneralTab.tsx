import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import { useToast } from '@/components/base/Toast';
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
  onNombreChange: (v: string) => void;
  onRfcChange: (v: string) => void;
  onTelefonoChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onSitioChange: (v: string) => void;
  onDireccionChange: (v: string) => void;
  onTimeZoneChange: (v: string) => void;
  onSave: () => void;
}

export default function GeneralTab({
  saved, nombre, rfc, telefono, email, sitio, direccion, timeZoneId,
  onNombreChange, onRfcChange, onTelefonoChange, onEmailChange, onSitioChange, onDireccionChange, onTimeZoneChange, onSave,
}: Props) {
  const { showToast } = useToast();

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-2" padding="lg">
        <h3 className="text-sm font-semibold text-foreground-900 mb-5">Información de la Institución</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre de la Institución" value={nombre} onChange={(e) => onNombreChange(e.target.value)} />
          <Input label="RFC" value={rfc} onChange={(e) => onRfcChange(e.target.value)} />
          <Input label="Teléfono" value={telefono} onChange={(e) => onTelefonoChange(e.target.value)} />
          <Input label="Correo Electrónico" type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Sitio Web" value={sitio} onChange={(e) => onSitioChange(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Input label="Dirección Fiscal" value={direccion} onChange={(e) => onDireccionChange(e.target.value)} />
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
          <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <i className="ri-graduation-cap-fill text-white text-3xl" />
          </div>
          <p className="text-xs text-foreground-500 text-center">Haz clic para subir un nuevo logo (PNG o SVG, max 2MB)</p>
          <Button variant="outline" size="sm" icon="ri-upload-line" onClick={() => showToast('Selector de archivos abierto — selecciona tu logo', 'info')}>Subir Logo</Button>
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

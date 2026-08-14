import { useState, useEffect } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import { useToast } from '@/components/base/Toast';
import type { Sucursal } from '@/mocks/sucursales';
import {
  detectDeviceTimeZone,
  labelForTimeZone,
  MEXICO_TIME_ZONES,
  PLATFORM_DEFAULT_TIME_ZONE,
} from '@/lib/timeZones';

interface SucursalFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SucursalFormData) => void;
  sucursal?: Sucursal | null;
  saving?: boolean;
}

export interface SucursalFormData {
  nombre: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  telefono: string;
  email: string;
  director: string;
  directorEmail: string;
  directorTelefono: string;
  capacidadTotal: string;
  niveles: string;
  estadoOperativo: string;
  fechaApertura: string;
  superficie: string;
  /** null = hereda de la institución. */
  timeZoneId: string | null;
}

const emptyForm: SucursalFormData = {
  nombre: '', direccion: '', ciudad: 'Ciudad de México', estado: 'CDMX',
  codigoPostal: '', telefono: '', email: '',
  director: '', directorEmail: '', directorTelefono: '',
  capacidadTotal: '', niveles: 'Secundaria, Preparatoria',
  estadoOperativo: 'Operando', fechaApertura: '', superficie: '',
  timeZoneId: null,
};

const estadosOperativos = ['Operando', 'Mantenimiento', 'Próxima Apertura'];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/[\s\-\+\(\)]/g, '');
  return digits.length >= 8;
}

export default function SucursalFormModal({ open, onClose, onSave, sucursal, saving = false }: SucursalFormModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<SucursalFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tzMode, setTzMode] = useState<'inherit' | 'custom'>('inherit');

  useEffect(() => {
    if (sucursal) {
      const hasCustom = Boolean(sucursal.timeZoneId);
      setTzMode(hasCustom ? 'custom' : 'inherit');
      setForm({
        nombre: sucursal.nombre,
        direccion: sucursal.direccion,
        ciudad: sucursal.ciudad,
        estado: sucursal.estado,
        codigoPostal: sucursal.codigoPostal,
        telefono: sucursal.telefono,
        email: sucursal.email,
        director: sucursal.director,
        directorEmail: sucursal.directorEmail,
        directorTelefono: sucursal.directorTelefono,
        capacidadTotal: String(sucursal.capacidadTotal),
        niveles: sucursal.niveles.join(', '),
        estadoOperativo: sucursal.estadoOperativo,
        fechaApertura: sucursal.fechaApertura ? sucursal.fechaApertura.slice(0, 10) : '',
        superficie: sucursal.superficie,
        timeZoneId: sucursal.timeZoneId ?? null,
      });
    } else {
      setTzMode('inherit');
      setForm(emptyForm);
    }
    setErrors({});
  }, [sucursal, open]);

  const handleChange = (field: keyof SucursalFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleDetect = () => {
    const detected = detectDeviceTimeZone();
    if (!detected) {
      showToast('No se pudo detectar la zona del dispositivo', 'error');
      return;
    }
    const allowed = MEXICO_TIME_ZONES.some((z) => z.id === detected);
    setTzMode('custom');
    if (allowed) {
      setForm((prev) => ({ ...prev, timeZoneId: detected }));
      showToast(`Sugerencia: ${labelForTimeZone(detected)}. Guarda para aplicar.`, 'info');
    } else {
      setForm((prev) => ({ ...prev, timeZoneId: PLATFORM_DEFAULT_TIME_ZONE }));
      showToast(`Detectamos ${detected}. Elige la zona de negocio más cercana.`, 'info');
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.nombre.trim()) newErrors.nombre = 'El nombre del campus es obligatorio';
    else if (form.nombre.trim().length < 3) newErrors.nombre = 'Mínimo 3 caracteres';

    if (!form.direccion.trim()) newErrors.direccion = 'La dirección es obligatoria';

    if (!form.ciudad.trim()) newErrors.ciudad = 'La ciudad es obligatoria';

    if (!form.estado.trim()) newErrors.estado = 'El estado es obligatorio';

    if (!form.codigoPostal.trim()) newErrors.codigoPostal = 'El código postal es obligatorio';
    else if (!/^\d{5}$/.test(form.codigoPostal.trim())) newErrors.codigoPostal = 'Debe ser 5 dígitos';

    if (!form.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';
    else if (!isValidPhone(form.telefono.trim())) newErrors.telefono = 'Mínimo 8 dígitos';

    if (!form.email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!isValidEmail(form.email.trim())) newErrors.email = 'Formato de email inválido';

    if (!form.director.trim()) newErrors.director = 'El nombre del director es obligatorio';
    else if (form.director.trim().length < 3) newErrors.director = 'Mínimo 3 caracteres';

    if (!form.directorEmail.trim()) newErrors.directorEmail = 'El email del director es obligatorio';
    else if (!isValidEmail(form.directorEmail.trim())) newErrors.directorEmail = 'Formato de email inválido';

    if (!form.directorTelefono.trim()) newErrors.directorTelefono = 'El teléfono del director es obligatorio';
    else if (!isValidPhone(form.directorTelefono.trim())) newErrors.directorTelefono = 'Mínimo 8 dígitos';

    if (!form.capacidadTotal.trim()) newErrors.capacidadTotal = 'La capacidad es obligatoria';
    else if (isNaN(Number(form.capacidadTotal)) || Number(form.capacidadTotal) <= 0) newErrors.capacidadTotal = 'Ingresa un número válido mayor a 0';

    if (!form.fechaApertura) newErrors.fechaApertura = 'La fecha de apertura es obligatoria';

    if (tzMode === 'custom' && !form.timeZoneId) {
      newErrors.timeZoneId = 'Selecciona una zona o hereda de la institución';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      ...form,
      timeZoneId: tzMode === 'inherit' ? null : form.timeZoneId,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
      subtitle={sucursal ? `Editando: ${sucursal.nombre}` : 'Los campos marcados con * son obligatorios'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="primary" size="sm" icon="ri-save-line" onClick={handleSubmit} loading={saving}>
            {sucursal ? 'Guardar Cambios' : 'Registrar Sucursal'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-building-4-line text-primary-500" />
            Datos del Campus
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Input label="Nombre del Campus" required value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} error={errors.nombre} placeholder="Ej. Campus Norte" />
            </div>
            <div className="sm:col-span-2">
              <Input label="Dirección" required value={form.direccion} onChange={(e) => handleChange('direccion', e.target.value)} error={errors.direccion} placeholder="Calle, Número, Colonia" />
            </div>
            <Input label="Ciudad" required value={form.ciudad} onChange={(e) => handleChange('ciudad', e.target.value)} error={errors.ciudad} placeholder="Ej. Ciudad de México" />
            <Input label="Estado" required value={form.estado} onChange={(e) => handleChange('estado', e.target.value)} error={errors.estado} placeholder="Ej. CDMX" />
            <Input label="Código Postal" required value={form.codigoPostal} onChange={(e) => handleChange('codigoPostal', e.target.value)} error={errors.codigoPostal} placeholder="07300" />
            <Input label="Superficie" value={form.superficie} onChange={(e) => handleChange('superficie', e.target.value)} placeholder="Ej. 12,500 m²" />
            <Input label="Teléfono" required value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} error={errors.telefono} placeholder="55-0000-0000" />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => handleChange('email', e.target.value)} error={errors.email} placeholder="campus@SchoolCore.edu.mx" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-user-star-line text-accent-500" />
            Director
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Nombre del Director" required value={form.director} onChange={(e) => handleChange('director', e.target.value)} error={errors.director} placeholder="Ej. Dr. Ricardo Álvarez" />
            <Input label="Email del Director" type="email" required value={form.directorEmail} onChange={(e) => handleChange('directorEmail', e.target.value)} error={errors.directorEmail} placeholder="director@SchoolCore.edu.mx" />
            <Input label="Teléfono del Director" required value={form.directorTelefono} onChange={(e) => handleChange('directorTelefono', e.target.value)} error={errors.directorTelefono} placeholder="55-0000-0000" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-settings-3-line text-secondary-500" />
            Configuración
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Capacidad Total" type="number" required value={form.capacidadTotal} onChange={(e) => handleChange('capacidadTotal', e.target.value)} error={errors.capacidadTotal} placeholder="850" />
            <Select
              label="Estado Operativo"
              value={form.estadoOperativo}
              onChange={(e) => handleChange('estadoOperativo', e.target.value)}
              options={estadosOperativos.map((e) => ({ value: e, label: e }))}
            />
            <Input label="Fecha de Apertura" type="date" required value={form.fechaApertura} onChange={(e) => handleChange('fechaApertura', e.target.value)} error={errors.fechaApertura} />
            <div className="sm:col-span-3">
              <Input
                label="Niveles Educativos"
                value={form.niveles}
                onChange={(e) => handleChange('niveles', e.target.value)}
                placeholder="Ej. Secundaria, Preparatoria"
                hint="Separa cada nivel con una coma"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-1 flex items-center gap-2">
            <i className="ri-earth-line text-primary-500" />
            Zona horaria
          </h4>
          <p className="text-xs text-foreground-500 mb-3">
            Por defecto hereda la de la institución. Solo configura aquí si este campus opera en otra zona. No reescribe fechas históricas.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <Select
              label="Origen"
              value={tzMode}
              onChange={(e) => {
                const mode = e.target.value as 'inherit' | 'custom';
                setTzMode(mode);
                if (mode === 'inherit') {
                  setForm((prev) => ({ ...prev, timeZoneId: null }));
                } else if (!form.timeZoneId) {
                  setForm((prev) => ({ ...prev, timeZoneId: PLATFORM_DEFAULT_TIME_ZONE }));
                }
              }}
              options={[
                { value: 'inherit', label: 'Heredar de la institución' },
                { value: 'custom', label: 'Zona propia del campus' },
              ]}
            />
            {tzMode === 'custom' && (
              <Select
                label="Zona horaria"
                value={form.timeZoneId || PLATFORM_DEFAULT_TIME_ZONE}
                onChange={(e) => handleChange('timeZoneId', e.target.value)}
                options={MEXICO_TIME_ZONES.map((z) => ({ value: z.id, label: z.label }))}
                error={errors.timeZoneId}
              />
            )}
            <div className="sm:col-span-2">
              <Button type="button" variant="outline" size="sm" icon="ri-map-pin-time-line" onClick={handleDetect}>
                Detectar zona del dispositivo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import { useToast } from '@/components/base/Toast';
import TeacherAvatar from '@/components/feature/TeacherAvatar';
import type { Sucursal } from '@/mocks/sucursales';
import {
  detectDeviceTimeZone,
  labelForTimeZone,
  MEXICO_TIME_ZONES,
  PLATFORM_DEFAULT_TIME_ZONE,
} from '@/lib/timeZones';
import {
  FieldLimits,
  assignError,
  validateEmail,
  validatePhone,
  validatePostalCodeMx,
  validatePositiveNumber,
  validateTextFree,
} from '@/lib/validation/fields';
import { afterValidationErrors } from '@/lib/ui/scrollToFirstError';

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
  /** Preview (data URL) o referencia persistida (GUID / http). */
  photo: string;
  photoFile: File | null;
  photoRemoved: boolean;
}

const emptyForm: SucursalFormData = {
  nombre: '', direccion: '', ciudad: 'Ciudad de México', estado: 'CDMX',
  codigoPostal: '', telefono: '', email: '',
  director: '', directorEmail: '', directorTelefono: '',
  capacidadTotal: '', niveles: 'Secundaria, Preparatoria',
  estadoOperativo: 'Operando', fechaApertura: '', superficie: '',
  timeZoneId: null,
  photo: '',
  photoFile: null,
  photoRemoved: false,
};

const estadosOperativos = ['Operando', 'Mantenimiento', 'Próxima Apertura'];

export default function SucursalFormModal({ open, onClose, onSave, sucursal, saving = false }: SucursalFormModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<SucursalFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tzMode, setTzMode] = useState<'inherit' | 'custom'>('inherit');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        photo: sucursal.fotoUrl || '',
        photoFile: null,
        photoRemoved: false,
      });
      setPhotoPreview(sucursal.fotoUrl || '');
    } else {
      setTzMode('inherit');
      setForm(emptyForm);
      setPhotoPreview('');
    }
    setErrors({});
  }, [sucursal, open]);

  const handleChange = (field: keyof SucursalFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const processFile = (file: File) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: 'Solo se permiten imágenes JPG o PNG (máx. 5 MB)' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'La imagen no debe superar 5 MB' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoPreview(dataUrl);
      setForm((prev) => ({ ...prev, photo: dataUrl, photoFile: file, photoRemoved: false }));
      if (errors.photo) {
        setErrors((prev) => {
          const n = { ...prev };
          delete n.photo;
          return n;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setForm((prev) => ({ ...prev, photo: '', photoFile: null, photoRemoved: true }));
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    else if (form.nombre.trim().length < 2) newErrors.nombre = 'Mínimo 2 caracteres';
    assignError(newErrors, 'nombre', validateTextFree(form.nombre, FieldLimits.branchName, 'El nombre'));

    assignError(newErrors, 'direccion', validateTextFree(form.direccion, FieldLimits.addressBranch, 'Dirección'));
    assignError(newErrors, 'ciudad', validateTextFree(form.ciudad, FieldLimits.city, 'Ciudad'));
    assignError(newErrors, 'estado', validateTextFree(form.estado, FieldLimits.state, 'Estado'));

    assignError(newErrors, 'codigoPostal', validatePostalCodeMx(form.codigoPostal, false));
    assignError(newErrors, 'telefono', validatePhone(form.telefono, false));
    assignError(newErrors, 'email', validateEmail(form.email, false));

    assignError(newErrors, 'director', validateTextFree(form.director, FieldLimits.directorName, 'El nombre del director'));
    assignError(newErrors, 'directorEmail', validateEmail(form.directorEmail, false));
    assignError(newErrors, 'directorTelefono', validatePhone(form.directorTelefono, false, 'El teléfono del director'));
    assignError(newErrors, 'capacidadTotal', validatePositiveNumber(form.capacidadTotal, 'La capacidad'));
    assignError(newErrors, 'superficie', validateTextFree(form.superficie, 50, 'Superficie', false));
    if (form.superficie.trim() && !/\d/.test(form.superficie)) {
      newErrors.superficie = 'Indica la superficie con un número (p. ej. 12500 m²)';
    }
    assignError(newErrors, 'niveles', validateTextFree(form.niveles, 200, 'Niveles educativos', false));

    if (!form.fechaApertura) newErrors.fechaApertura = 'La fecha de apertura es obligatoria';
    else {
      const d = new Date(`${form.fechaApertura}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!Number.isNaN(d.getTime()) && d > today && form.estadoOperativo === 'Operando') {
        newErrors.estadoOperativo = 'Con fecha futura usa “Próxima Apertura”, no “Operando”';
      }
    }

    if (tzMode === 'custom' && !form.timeZoneId) {
      newErrors.timeZoneId = 'Selecciona una zona o hereda de la institución';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      afterValidationErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate() || saving) return;
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
          <Button variant="primary" size="sm" icon="ri-save-line" onClick={handleSubmit} disabled={saving} loading={saving}>
            {sucursal ? 'Guardar Cambios' : 'Registrar Sucursal'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-camera-line text-primary-500" />
            Imagen del campus
          </h4>
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0">
              {photoPreview ? (
                <div className="relative">
                  <TeacherAvatar
                    src={photoPreview}
                    alt="Vista previa"
                    filenameHint="branch-photo"
                    emptyIcon="ri-building-4-line"
                    className="w-32 h-20 rounded-xl object-cover border-2 border-secondary-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600 transition-colors cursor-pointer shadow-sm"
                    title="Quitar imagen"
                  >
                    <i className="ri-close-line" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-20 rounded-xl bg-background-100 border-2 border-dashed border-secondary-300 flex flex-col items-center justify-center gap-1">
                  <i className="ri-building-4-line text-2xl text-foreground-300" />
                  <span className="text-3xs text-foreground-400">Sin imagen</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div
                className={`relative rounded-lg border-2 border-dashed p-4 text-center transition-all duration-150 cursor-pointer ${
                  isDragging
                    ? 'border-primary-400 bg-primary-50/50'
                    : 'border-secondary-300 hover:border-secondary-400 bg-background-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-full bg-secondary-100 flex items-center justify-center">
                    <i className="ri-upload-cloud-2-line text-lg text-foreground-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-700">
                      {photoPreview ? 'Cambiar imagen' : 'Subir imagen'}
                    </p>
                    <p className="text-xs text-foreground-400 mt-0.5">
                      Arrastra una imagen o haz clic para seleccionar
                    </p>
                  </div>
                  <span className="text-3xs text-foreground-300">JPG o PNG · Máx. 5 MB</span>
                </div>
              </div>
              {errors.photo && <p className="mt-1.5 text-xs text-red-500">{errors.photo}</p>}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-building-4-line text-primary-500" />
            Datos del Campus
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Input label="Nombre del Campus" required maxLength={FieldLimits.branchName} value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} error={errors.nombre} placeholder="Ej. Campus Norte" />
            </div>
            <div className="sm:col-span-2">
              <Input label="Dirección" maxLength={FieldLimits.addressBranch} value={form.direccion} onChange={(e) => handleChange('direccion', e.target.value)} error={errors.direccion} placeholder="Calle, Número, Colonia" />
            </div>
            <Input label="Ciudad" maxLength={FieldLimits.city} value={form.ciudad} onChange={(e) => handleChange('ciudad', e.target.value)} error={errors.ciudad} placeholder="Ej. Ciudad de México" />
            <Input label="Estado" maxLength={FieldLimits.state} value={form.estado} onChange={(e) => handleChange('estado', e.target.value)} error={errors.estado} placeholder="Ej. CDMX" />
            <Input label="Código Postal" maxLength={5} value={form.codigoPostal} onChange={(e) => handleChange('codigoPostal', e.target.value)} error={errors.codigoPostal} placeholder="07300" />
            <Input label="Superficie" value={form.superficie} onChange={(e) => handleChange('superficie', e.target.value)} error={errors.superficie} placeholder="Ej. 12,500 m²" />
            <Input label="Teléfono" type="tel" maxLength={FieldLimits.phone} value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} error={errors.telefono} placeholder="55-0000-0000" />
            <Input label="Email" type="email" maxLength={FieldLimits.email} value={form.email} onChange={(e) => handleChange('email', e.target.value)} error={errors.email} placeholder="campus@SchoolCore.edu.mx" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-user-star-line text-accent-500" />
            Director
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Nombre del Director" maxLength={FieldLimits.directorName} value={form.director} onChange={(e) => handleChange('director', e.target.value)} error={errors.director} placeholder="Ej. Dr. Ricardo Álvarez" />
            <Input label="Email del Director" type="email" maxLength={FieldLimits.email} value={form.directorEmail} onChange={(e) => handleChange('directorEmail', e.target.value)} error={errors.directorEmail} placeholder="director@SchoolCore.edu.mx" />
            <Input label="Teléfono del Director" type="tel" maxLength={FieldLimits.phone} value={form.directorTelefono} onChange={(e) => handleChange('directorTelefono', e.target.value)} error={errors.directorTelefono} placeholder="55-0000-0000" />
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
              error={errors.estadoOperativo}
            />
            <Input label="Fecha de Apertura" type="date" required value={form.fechaApertura} onChange={(e) => handleChange('fechaApertura', e.target.value)} error={errors.fechaApertura} />
            <div className="sm:col-span-3">
              <Input
                label="Niveles Educativos"
                value={form.niveles}
                onChange={(e) => handleChange('niveles', e.target.value)}
                placeholder="Ej. Secundaria, Preparatoria"
                hint="Separa cada nivel con una coma"
                error={errors.niveles}
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

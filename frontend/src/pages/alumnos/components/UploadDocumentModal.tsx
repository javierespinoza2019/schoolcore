import { useState, useRef } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import type { Student, StudentDocument } from '@/mocks/alumnos';
import { uploadStudentDocument } from '@/api/studentsApi';
import { useToast } from '@/components/base/Toast';
import { isDevelopment } from '@/config/env';

interface UploadDocumentModalProps {
  open: boolean;
  onClose: () => void;
  student: Student;
  onDocumentUploaded: (updatedStudent: Student) => void;
}

const documentTypes = [
  { value: 'PDF', label: 'PDF' },
  { value: 'Imagen', label: 'Imagen' },
];

const documentNames = [
  'Acta de Nacimiento',
  'Certificado Médico',
  'Comprobante Domicilio',
  'Boleta de Calificaciones',
  'Carta de Buena Conducta',
  'Cartilla de Vacunación',
  'INE del Tutor',
  'CURP',
  'Certificado de Preparatoria',
  'Carta Recomendación',
  'Solicitud de Inscripción',
  'Reglamento Firmado',
  'Otro',
];

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png'];

export default function UploadDocumentModal({ open, onClose, student, onDocumentUploaded }: UploadDocumentModalProps) {
  const { showToast } = useToast();
  const [docName, setDocName] = useState('');
  const [customName, setCustomName] = useState('');
  const [docType, setDocType] = useState('PDF');
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setDocName('');
    setCustomName('');
    setDocType('PDF');
    setFileName('');
    setFile(null);
    setErrors({});
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const processFile = (selected: File) => {
    const ext = '.' + selected.name.split('.').pop()?.toLowerCase();

    if (!ALLOWED_EXT.includes(ext)) {
      setErrors((prev) => ({ ...prev, file: 'Solo se permiten PDF, JPG, JPEG o PNG' }));
      return;
    }

    if (selected.size > MAX_BYTES) {
      setErrors((prev) => ({ ...prev, file: 'El archivo no debe superar 5 MB' }));
      return;
    }

    setFile(selected);
    setFileName(selected.name);
    if (ext === '.pdf') setDocType('PDF');
    else setDocType('Imagen');

    setErrors((prev) => {
      const n = { ...prev };
      delete n.file;
      return n;
    });
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const finalName = docName === 'Otro' ? customName.trim() : docName;

    if (!finalName) newErrors.name = 'Selecciona o escribe el nombre del documento';
    if (!fileName) newErrors.file = 'Selecciona un archivo para subir';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!file) return;

    const finalName = docName === 'Otro' ? customName.trim() : docName;
    const today = new Date().toISOString().split('T')[0];
    setUploading(true);

    const res = await uploadStudentDocument(student.id, file, { name: finalName, type: docType });

    let newDoc: StudentDocument;
    if (res.success && res.data) {
      newDoc = res.data;
    } else {
      // TODO: quitar fallback local cuando /students/:id/documents esté estable
      if (isDevelopment) {
        console.warn('[Upload] API falló; metadatos locales temporales', res.message);
      }
      showToast(res.message || 'Upload API no disponible; se registró metadato local', 'info');
      newDoc = {
        id: `DOC-${Date.now().toString(36).toUpperCase()}`,
        name: finalName,
        type: docType,
        uploadDate: today,
        status: 'pending',
      };
    }

    const updatedStudent: Student = {
      ...student,
      documents: [newDoc, ...student.documents],
      timeline: [
        {
          id: `TL-${Date.now()}`,
          date: `${today} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
          title: `Documento "${finalName}" subido`,
          description: `Se subió el documento "${finalName}" (${docType}) al expediente del alumno`,
          icon: 'ri-file-upload-line',
          iconBg: 'bg-primary-100',
          iconColor: 'text-primary-600',
          badge: 'Documento',
        },
        ...student.timeline,
      ],
    };

    onDocumentUploaded(updatedStudent);
    if (res.success) showToast('Documento subido correctamente', 'success');
    setUploading(false);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Subir Documento"
      subtitle={`Alumno: ${student.fullName}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={uploading}>Cancelar</Button>
          <Button variant="primary" size="sm" icon="ri-upload-cloud-2-line" loading={uploading} onClick={handleSubmit}>
            Subir Documento
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Tipo de documento"
          required
          value={docName}
          onChange={(e) => {
            setDocName(e.target.value);
            if (e.target.value !== 'Otro') setCustomName('');
            if (errors.name) setErrors((prev) => { const n = { ...prev }; delete n.name; return n; });
          }}
          options={documentNames.map((n) => ({ value: n, label: n }))}
          placeholder="Selecciona el tipo de documento..."
          error={errors.name}
        />

        {docName === 'Otro' && (
          <Input
            label="Nombre del documento"
            required
            value={customName}
            onChange={(e) => {
              setCustomName(e.target.value);
              if (errors.name) setErrors((prev) => { const n = { ...prev }; delete n.name; return n; });
            }}
            error={errors.name}
            placeholder="Ej. Constancia de estudios previos..."
          />
        )}

        <Select
          label="Formato"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          options={documentTypes}
        />

        <div>
          <label className="block text-xs font-medium text-foreground-700 mb-1.5">Archivo</label>
          <div
            className={`relative rounded-lg border-2 border-dashed p-5 text-center transition-all duration-150 cursor-pointer ${
              isDragging
                ? 'border-primary-400 bg-primary-50/50'
                : fileName
                  ? 'border-emerald-300 bg-emerald-50/30'
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
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              {fileName ? (
                <>
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <i className="ri-file-check-line text-xl text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-800 truncate max-w-[300px]">{fileName}</p>
                    <p className="text-xs text-foreground-400 mt-0.5">Haz clic para cambiar el archivo</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                    <i className="ri-upload-cloud-2-line text-xl text-foreground-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-700">Seleccionar archivo</p>
                    <p className="text-xs text-foreground-400 mt-0.5">Arrastra un archivo o haz clic aquí</p>
                  </div>
                  <span className="text-3xs text-foreground-300">PDF, JPG, PNG, DOC, DOCX · Máx. 10 MB</span>
                </>
              )}
            </div>
          </div>
          {errors.file && (
            <p className="mt-1.5 text-xs text-red-500">{errors.file}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
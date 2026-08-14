import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import type { Student, StudentDocument } from '@/mocks/alumnos';

interface DocumentosTabProps {
  student: Student;
  onUploadDocumento?: () => void;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  verified: { label: 'Verificado', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'warning' },
  rejected: { label: 'Rechazado', variant: 'danger' },
};

export default function DocumentosTab({ student, onUploadDocumento }: DocumentosTabProps) {
  const verifiedCount = student.documents.filter((d) => d.status === 'verified').length;
  const pendingCount = student.documents.filter((d) => d.status !== 'verified').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center">
              <i className="ri-check-line text-sm text-emerald-600" />
            </div>
            <span className="text-sm text-foreground-700">{verifiedCount} verificados</span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
                <i className="ri-time-line text-sm text-amber-600" />
              </div>
              <span className="text-sm text-foreground-700">{pendingCount} pendientes</span>
            </div>
          )}
        </div>
        {onUploadDocumento && (
          <Button variant="outline" size="sm" icon="ri-upload-line" onClick={onUploadDocumento}>
            Subir Documento
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {student.documents.map((doc: StudentDocument) => (
          <Card key={doc.id} padding="md" hover>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                  <i className="ri-file-pdf-2-line text-lg text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground-800 truncate">{doc.name}</p>
                  <p className="text-2xs text-foreground-500">{doc.type}</p>
                </div>
              </div>
              <Badge variant={statusConfig[doc.status]?.variant || 'default'} size="sm">
                {statusConfig[doc.status]?.label || doc.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-3xs text-foreground-400">Subido: {doc.uploadDate}</span>
              <div className="flex gap-1">
                <button className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer" title="Ver">
                  <i className="ri-eye-line text-sm" />
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-foreground-700 hover:bg-secondary-100 transition-colors cursor-pointer" title="Descargar">
                  <i className="ri-download-line text-sm" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {student.documents.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-10 text-foreground-400">
            <i className="ri-file-upload-line text-2xl mb-2" />
            <p className="text-sm">Sin documentos en el expediente</p>
            {onUploadDocumento && (
              <Button variant="primary" size="sm" className="mt-3" icon="ri-upload-line" onClick={onUploadDocumento}>
                Subir Documento
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
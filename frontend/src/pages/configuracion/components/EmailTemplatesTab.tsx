import { useEffect, useState } from 'react';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import Input from '@/components/base/Input';
import Modal from '@/components/base/Modal';
import { useToast } from '@/components/base/Toast';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import * as settingsApi from '@/api/settingsApi';
import type { EmailTemplateSummary } from '@/api/settingsApi';
import { useQueryClient } from '@tanstack/react-query';

/** Tab mínimo de plantillas email (layout fijo + override tenant). */
export default function EmailTemplatesTab() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [edit, setEdit] = useState<EmailTemplateSummary | null>(null);
  const [subject, setSubject] = useState('');
  const [saving, setSaving] = useState(false);

  const templatesQuery = useApiResource({
    queryKey: queryKeys.settings.emailTemplates(),
    queryFn: () => settingsApi.listEmailTemplates(),
    errorToast: 'No se pudieron cargar plantillas de email',
  });

  const templates = templatesQuery.data ?? [];

  useEffect(() => {
    if (edit) setSubject(edit.subject);
  }, [edit]);

  const handleSave = async () => {
    if (!edit) return;
    setSaving(true);
    const res = await settingsApi.updateEmailTemplate(edit.id, { subject });
    setSaving(false);
    if (res.success || templatesQuery.isFallback) {
      showToast('Plantilla actualizada', 'success');
      setEdit(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.emailTemplates() });
    } else {
      showToast(res.message || 'No se pudo guardar', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground-900">Plantillas de email</h3>
            <p className="text-xs text-foreground-500 mt-0.5">
              Layout fijo SchoolCore con variables {'{{SchoolName}}'}, {'{{UserName}}'}, {'{{ResetUrl}}'}, {'{{Year}}'}.
              Sin editor HTML libre en MVP.
            </p>
          </div>
        </div>

        {templatesQuery.isLoading ? (
          <p className="text-xs text-foreground-400 py-6 text-center">Cargando plantillas…</p>
        ) : templates.length === 0 ? (
          <p className="text-xs text-foreground-400 py-6 text-center">No hay plantillas configuradas.</p>
        ) : (
          <ul className="divide-y divide-secondary-100">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground-800">{t.name}</p>
                  <p className="text-xs text-foreground-500 truncate">{t.subject}</p>
                  <p className="text-2xs text-foreground-400 mt-0.5">key: {t.key}</p>
                </div>
                <Badge variant={t.isOverride ? 'accent' : 'default'} size="sm">
                  {t.isOverride ? 'Override tenant' : 'Base'}
                </Badge>
                <Button variant="ghost" size="xs" icon="ri-edit-line" onClick={() => setEdit(t)}>
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Editar plantilla" size="md">
        {edit && (
          <div className="space-y-4">
            <Input label="Asunto" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <p className="text-2xs text-foreground-400">
              TODO: conectar colores/logo/bodyText cuando el endpoint de override esté listo.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEdit(null)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
                Guardar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

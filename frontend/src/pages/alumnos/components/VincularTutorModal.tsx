import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Badge from '@/components/base/Badge';
import type { Parent } from '@/mocks/padres';
import type { Student, StudentParent } from '@/mocks/alumnos';
import * as parentsApi from '@/api/parentsApi';
import * as studentsApi from '@/api/studentsApi';
import { queryKeys } from '@/api/queryKeys';
import { isGuid } from '@/api/helpers';
import { afterValidationErrors } from '@/lib/ui/scrollToFirstError';

interface VincularTutorModalProps {
  open: boolean;
  onClose: () => void;
  student: Student;
  onTutorVinculado: (updatedStudent: Student) => void;
}

export default function VincularTutorModal({
  open,
  onClose,
  student,
  onTutorVinculado,
}: VincularTutorModalProps) {
  const [search, setSearch] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [relationship, setRelationship] = useState('Padre');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const parentsQuery = useQuery({
    queryKey: queryKeys.parents.list({}),
    queryFn: () => parentsApi.listParents({ pageSize: 100 }),
    enabled: open,
  });
  const allParents: Parent[] = parentsQuery.data?.data ?? [];

  const alreadyLinkedIds = useMemo(() => student.parents.map((p) => p.id), [student.parents]);

  const availableParents = useMemo(() => {
    let filtered = allParents.filter((p) => !alreadyLinkedIds.includes(p.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.includes(q)
      );
    }
    return filtered;
  }, [search, alreadyLinkedIds, allParents]);

  const selectedParent = useMemo(
    () => allParents.find((p) => p.id === selectedParentId) || null,
    [selectedParentId, allParents]
  );

  useEffect(() => {
    if (open) {
      setSearch('');
      setSelectedParentId(null);
      setRelationship('Padre');
      setErrors({});
      setSaving(false);
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedParentId || !isGuid(selectedParentId)) {
      newErrors.parent = 'Selecciona un tutor de la lista';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      afterValidationErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedParent || saving) return;
    setSaving(true);
    try {
      const res = await studentsApi.linkParent(student.id, selectedParent.id, relationship);
      if (!res.success) {
        const apiErrs = { parent: res.message || 'No se pudo vincular el tutor' };
        setErrors(apiErrs);
        afterValidationErrors(apiErrs);
        return;
      }

      const newParent: StudentParent = {
        id: selectedParent.id,
        name: selectedParent.fullName,
        relationship,
        email: selectedParent.email,
        phone: selectedParent.phone,
        occupation: selectedParent.occupation,
      };

      onTutorVinculado({
        ...student,
        parents: [...student.parents, newParent],
      });
      onClose();
    } catch {
      const apiErrs = { parent: 'Error de red al vincular' };
      setErrors(apiErrs);
      afterValidationErrors(apiErrs);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vincular Tutor"
      subtitle={`Alumno: ${student.fullName}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={saving ? undefined : 'ri-link'}
            onClick={() => void handleSubmit()}
            disabled={saving}
            loading={saving}
          >
            Vincular Tutor
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          icon="ri-search-line"
          placeholder="Buscar tutor por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {errors.parent && <p className="text-xs text-red-500">{errors.parent}</p>}

        <div className="max-h-64 overflow-y-auto border border-secondary-200/70 rounded-lg divide-y divide-secondary-100/70">
          {parentsQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-foreground-400">
              <i className="ri-loader-4-line animate-spin text-2xl mb-2" />
              <p className="text-sm">Cargando tutores...</p>
            </div>
          ) : parentsQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-10 text-red-500">
              <i className="ri-error-warning-line text-2xl mb-2" />
              <p className="text-sm font-medium">No se pudieron cargar los tutores</p>
              <p className="text-xs text-foreground-500 mt-1 mb-3">
                {(parentsQuery.error as Error)?.message || 'Error de red o del servidor'}
              </p>
              <Button variant="outline" size="sm" icon="ri-refresh-line" onClick={() => void parentsQuery.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : availableParents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-foreground-400">
              <i className="ri-user-search-line text-2xl mb-2" />
              <p className="text-sm">
                {search.trim()
                  ? 'No se encontraron tutores con ese criterio'
                  : 'No hay tutores disponibles. Créalos en Padres.'}
              </p>
            </div>
          ) : (
            availableParents.map((parent) => (
              <label
                key={parent.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  selectedParentId === parent.id
                    ? 'bg-primary-50 border-l-2 border-primary-500'
                    : 'hover:bg-secondary-50/50 border-l-2 border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name="parentSelect"
                  className="w-4 h-4 text-primary-500 accent-primary-500 cursor-pointer"
                  checked={selectedParentId === parent.id}
                  onChange={() => {
                    setSelectedParentId(parent.id);
                    if (errors.parent) {
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.parent;
                        return n;
                      });
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground-800">{parent.fullName}</span>
                    <Badge variant="default" size="sm">
                      {parent.childrenCount} {parent.childrenCount === 1 ? 'hijo' : 'hijos'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-foreground-500">
                    <span className="flex items-center gap-1">
                      <i className="ri-mail-line" /> {parent.email || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ri-phone-line" /> {parent.phone || '—'}
                    </span>
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        {selectedParent && (
          <div>
            <label className="block text-xs font-medium text-foreground-700 mb-1.5">Parentesco</label>
            <div className="flex flex-wrap gap-2">
              {[
                'Padre',
                'Madre',
                'Tutor Legal',
                'Abuelo',
                'Abuela',
                'Tío',
                'Tía',
                'Hermano',
                'Hermana',
                'Otro Familiar',
              ].map((rel) => (
                <button
                  key={rel}
                  type="button"
                  onClick={() => setRelationship(rel)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    relationship === rel
                      ? 'bg-primary-500 text-background-50'
                      : 'bg-secondary-100 text-foreground-600 hover:bg-secondary-200'
                  }`}
                >
                  {rel}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

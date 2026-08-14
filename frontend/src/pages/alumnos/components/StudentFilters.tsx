import { useState } from 'react';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import Button from '@/components/base/Button';
import { studentLevels } from '@/mocks/alumnos';
import { useSchoolContext } from '@/context/SchoolContext';

interface StudentFiltersProps {
  onSearch: (query: string) => void;
  onLevelChange: (level: string) => void;
  onStatusChange: (status: string) => void;
  onBranchChange: (branch: string) => void;
  onClear: () => void;
  className?: string;
}

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'graduated', label: 'Graduado' },
  { value: 'suspended', label: 'Suspendido' },
];

const levelOptions = [
  { value: '', label: 'Todos los niveles' },
  ...studentLevels.map((l) => ({ value: l, label: l })),
];

export default function StudentFilters({
  onSearch,
  onLevelChange,
  onStatusChange,
  onBranchChange,
  onClear,
  className = '',
}: StudentFiltersProps) {
  const { branchOptions } = useSchoolContext();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [branch, setBranch] = useState('');

  const branchSelectOptions = [
    { value: '', label: 'Todas las sucursales' },
    ...branchOptions.map((b) => ({ value: b.name, label: b.name })),
  ];

  const hasFilters = search || level || status || branch;

  const handleClear = () => {
    setSearch('');
    setLevel('');
    setStatus('');
    setBranch('');
    onClear();
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap ${className}`}
    >
      <div className="w-full sm:w-72">
        <Input
          icon="ri-search-line"
          placeholder="Buscar por nombre, matrícula o email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onSearch(e.target.value);
          }}
        />
      </div>
      <div className="w-full sm:w-40">
        <Select
          options={levelOptions}
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            onLevelChange(e.target.value);
          }}
          placeholder="Nivel"
        />
      </div>
      <div className="w-full sm:w-36">
        <Select
          options={statusOptions}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            onStatusChange(e.target.value);
          }}
          placeholder="Estado"
        />
      </div>
      <div className="w-full sm:w-44">
        <Select
          options={branchSelectOptions}
          value={branch}
          onChange={(e) => {
            setBranch(e.target.value);
            onBranchChange(e.target.value);
          }}
          placeholder="Sucursal"
        />
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" icon="ri-close-line" onClick={handleClear}>
          Limpiar
        </Button>
      )}
    </div>
  );
}

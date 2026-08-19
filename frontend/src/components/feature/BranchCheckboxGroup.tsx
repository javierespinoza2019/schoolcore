interface BranchOption {
  id: string;
  name: string;
}

interface BranchCheckboxGroupProps {
  label?: string;
  required?: boolean;
  options: BranchOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

/** Selector múltiple de sucursales (checkboxes). */
export default function BranchCheckboxGroup({
  label = 'Sucursales',
  required,
  options,
  value,
  onChange,
  error,
  hint,
  disabled,
}: BranchCheckboxGroupProps) {
  const selected = new Set(value);

  const toggle = (id: string) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  return (
    <div>
      {label && (
        <p className="text-sm font-medium text-foreground-800 mb-2">
          {label}
          {required ? <span className="text-red-500 ml-0.5">*</span> : null}
        </p>
      )}
      <div
        className={`rounded-lg border ${error ? 'border-red-300' : 'border-secondary-200/70'} bg-background-50 divide-y divide-secondary-100 max-h-48 overflow-y-auto`}
      >
        {options.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-foreground-500">No hay sucursales disponibles</p>
        ) : (
          options.map((opt) => {
            const checked = selected.has(opt.id);
            const inputId = `branch-cb-${opt.id}`;
            return (
              <label
                key={opt.id}
                htmlFor={inputId}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-secondary-50'}`}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-200"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(opt.id)}
                />
                <span className="text-foreground-800">{opt.name}</span>
              </label>
            );
          })
        )}
      </div>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : hint ? <p className="mt-1 text-xs text-foreground-500">{hint}</p> : null}
    </div>
  );
}

/**
 * Tras fallar validación: scroll + focus al primer control inválido.
 * Requiere que Input/Select expongan aria-invalid (ya lo hacen con `error`).
 * Llamar DESPUÉS de setErrors (usa rAF para esperar el paint).
 */
export function scrollToFirstFormError(root?: ParentNode | Document | null): void {
  const scope: ParentNode = root ?? document;

  const run = () => {
    const invalid = scope.querySelector<HTMLElement>(
      'input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"], [aria-invalid="true"]'
    );
    if (!invalid) return;

    invalid.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    const focusTarget =
      invalid.matches('input, select, textarea, button')
        ? invalid
        : invalid.querySelector<HTMLElement>('input, select, textarea, button');

    try {
      focusTarget?.focus({ preventScroll: true });
    } catch {
      focusTarget?.focus();
    }
  };

  // Doble rAF: setState → commit → paint
  requestAnimationFrame(() => requestAnimationFrame(run));
}

/** Si validate() devolvió false / hay errores, lleva al primero. */
export function afterValidationErrors(
  errors: Record<string, string>,
  root?: ParentNode | Document | null
): void {
  if (Object.keys(errors).length === 0) return;
  scrollToFirstFormError(root);
}

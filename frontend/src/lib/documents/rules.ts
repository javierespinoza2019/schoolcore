/** BR-48 / BR-49 — reglas de documentos (expediente e inscripción). */
export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png'] as const;
export const DOCUMENT_RULES_HINT = 'PDF, PNG o JPG · máximo 5 MB';

export function documentExtensionError(fileName: string): string | null {
  const ext = `.${fileName.split('.').pop()?.toLowerCase() ?? ''}`;
  if (!(DOCUMENT_ALLOWED_EXT as readonly string[]).includes(ext)) {
    return 'El tipo de archivo no está permitido. Usa PDF, PNG o JPG.';
  }
  return null;
}

export function documentSizeError(sizeBytes: number): string | null {
  if (sizeBytes > DOCUMENT_MAX_BYTES) {
    return 'El archivo supera el tamaño máximo de 5 MB.';
  }
  return null;
}

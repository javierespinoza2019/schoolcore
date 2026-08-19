import Swal from 'sweetalert2';
import type { GuardIssue } from '@/lib/interaction/guards';

/**
 * Confirmación previa al guardar cuando hay warnings soft.
 * @returns true si el usuario confirma "Guardar de todos modos".
 */
export async function confirmSoftWarnings(issues: GuardIssue[]): Promise<boolean> {
  if (issues.length === 0) return true;

  const listHtml = issues
    .map((i) => `<li style="margin:0.25rem 0;text-align:left">${escapeHtml(i.message)}</li>`)
    .join('');

  const result = await Swal.fire({
    title: 'Revisa antes de guardar',
    html: `<p style="margin-bottom:0.75rem;text-align:left;font-size:0.875rem">Hay recomendaciones pendientes:</p><ul style="padding-left:1.25rem;font-size:0.875rem">${listHtml}</ul>`,
    icon: 'warning',
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText: 'Guardar de todos modos',
    cancelButtonText: 'Revisar',
    reverseButtons: true,
  });

  if (!result.isConfirmed) {
    const body = document.querySelector<HTMLElement>('[role="dialog"] .overflow-y-auto');
    body?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return result.isConfirmed;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

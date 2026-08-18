/** Truncate + tooltip helpers for list cells. */
export function truncateTitleProps(value: string | null | undefined): {
  className: string;
  title: string | undefined;
  children: string;
} {
  const text = (value ?? '').trim();
  return {
    className: 'truncate',
    title: text || undefined,
    children: text,
  };
}

import { isGuid } from '@/api/helpers';

export const TUTOR_SEARCH_MIN = 2;
export const TUTOR_PREVIEW_MAX = 8;

export interface TutorCatalogItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export function filterTutorCatalog<T extends TutorCatalogItem>(
  parents: T[],
  search: string,
  excludeIds: string[] = []
): { list: T[]; needsSearch: boolean; catalogSize: number } {
  const exclude = new Set(excludeIds);
  const catalog = parents.filter((p) => isGuid(p.id) && !exclude.has(p.id));
  const q = search.trim().toLowerCase();
  if (q.length >= TUTOR_SEARCH_MIN) {
    return {
      list: catalog.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.includes(q)
      ),
      needsSearch: false,
      catalogSize: catalog.length,
    };
  }
  if (catalog.length <= TUTOR_PREVIEW_MAX) {
    return { list: catalog, needsSearch: false, catalogSize: catalog.length };
  }
  return { list: [], needsSearch: true, catalogSize: catalog.length };
}

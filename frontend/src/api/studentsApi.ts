import { apiClient } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, isGuid, unwrapList, unwrapTotalCount } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import type { Student, StudentDocument, StudentPayment, StudentTimelineEvent } from '@/mocks/alumnos';
import { students as mockStudents } from '@/mocks/alumnos';

export interface StudentListParams {
  branchId?: string | null;
  cycleId?: string | null;
  page?: number;
  pageSize?: number;
  search?: string;
  level?: string;
  status?: string;
}

function normalizeStudent(raw: unknown): Student {
  const r = (raw ?? {}) as Record<string, unknown>;
  const firstName = String(r.firstName ?? '');
  const lastName = String(r.lastName ?? '');
  const birth = String(r.birthDate ?? '').slice(0, 10);
  let age = Number(r.age ?? 0);
  if (!age && birth) {
    const y = new Date(birth).getFullYear();
    if (!Number.isNaN(y)) age = Math.max(0, new Date().getFullYear() - y);
  }
  return {
    id: String(r.id ?? ''),
    enrollment: String(r.enrollmentNumber ?? r.enrollment ?? ''),
    firstName,
    lastName,
    fullName: String(r.fullName ?? `${firstName} ${lastName}`.trim()),
    photo: String(r.photoUrl ?? r.photo ?? ''),
    gender: (String(r.gender ?? 'M') as Student['gender']) || 'M',
    birthDate: birth,
    age,
    email: String(r.email ?? ''),
    phone: String(r.phone ?? ''),
    address: String(r.address ?? ''),
    level: String(r.educationLevelName ?? r.levelName ?? r.level ?? ''),
    grade: String(r.grade ?? ''),
    group: String(r.groupCode ?? r.group ?? ''),
    status: (String(r.status ?? 'active') as Student['status']) || 'active',
    enrollmentDate: String(r.enrollmentDate ?? '').slice(0, 10),
    branchId: String(r.branchId ?? ''),
    branchName: String(r.branchName ?? ''),
    schoolCycleId: isGuid(r.schoolCycleId) ? String(r.schoolCycleId) : undefined,
    classroomId: isGuid(r.classroomId) ? String(r.classroomId) : undefined,
    educationLevelId: isGuid(r.educationLevelId) ? String(r.educationLevelId) : undefined,
    bloodType: String(r.bloodType ?? ''),
    allergies: Array.isArray(r.allergies)
      ? (r.allergies as string[])
      : String(r.allergies ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    medicalNotes: String(r.medicalNotes ?? ''),
    parents: (r.parents as Student['parents']) ?? [],
    payments: (r.payments as Student['payments']) ?? [],
    documents: (r.documents as Student['documents']) ?? [],
    timeline: (r.timeline as Student['timeline']) ?? [],
    balance: Number(r.balance ?? 0),
    lastPayment: String(r.lastPayment ?? ''),
    scholarship: Number(r.scholarshipPercent ?? r.scholarship ?? 0),
  };
}

function toStudentUpsert(payload: Partial<Student>) {
  return {
    branchId: payload.branchId,
    enrollmentNumber: payload.enrollment || null,
    firstName: payload.firstName,
    lastName: payload.lastName,
    gender: payload.gender,
    birthDate: payload.birthDate || null,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    educationLevelId: isGuid(payload.educationLevelId) ? payload.educationLevelId : null,
    levelName: payload.level || null,
    grade: payload.grade,
    groupCode: payload.group,
    status: payload.status ?? 'active',
    enrollmentDate: payload.enrollmentDate || null,
    bloodType: payload.bloodType,
    allergies: Array.isArray(payload.allergies) ? payload.allergies.join(', ') : payload.allergies,
    medicalNotes: payload.medicalNotes,
    scholarshipPercent: payload.scholarship ?? 0,
    schoolCycleId: isGuid(payload.schoolCycleId) ? payload.schoolCycleId : null,
    classroomId: isGuid(payload.classroomId) ? payload.classroomId : null,
    photoUrl: toStoredPhotoUrl(payload.photo),
  };
}

function toStoredPhotoUrl(value?: string | null): string | null {
  const s = (value ?? '').trim();
  if (!s || s.startsWith('data:')) return null;
  if (isGuid(s) || s.startsWith('http://') || s.startsWith('https://')) return s;
  return null;
}

/** POST /documents — foto del alumno (entityType distinto al expediente). */
export async function uploadStudentPhoto(
  studentId: string,
  file: File
): Promise<ApiResponse<string>> {
  const form = new FormData();
  form.append('file', file);
  form.append('entityType', 'student-photo');
  form.append('entityId', studentId);
  const res = await apiClient<Record<string, unknown>>('/documents', { method: 'POST', body: form });
  if (res.success && res.data) {
    const id = String(res.data.id ?? '');
    return { ...res, data: isGuid(id) ? id : null };
  }
  return { ...res, data: null };
}

/** GET /students */
export async function listStudents(params: StudentListParams = {}): Promise<FetchResult<Student[]>> {
  const q = buildQuery({
    branchId: params.branchId,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 100,
    search: params.search,
    status: params.status,
  });
  const result = await fetchOrFallback<PagedResult<unknown> | unknown[]>(
    () => apiClient(`/students${q}`),
    () => mockStudents
  );
  const items = unwrapList(result.data).map(normalizeStudent);
  return {
    data: items,
    totalCount: unwrapTotalCount(result.data, items.length),
    source: result.source,
    message: result.message,
  };
}

/** GET /students/:id */
export async function getStudent(id: string): Promise<FetchResult<Student | null>> {
  const result = await fetchOrFallback<unknown | null>(
    () => apiClient(`/students/${id}`),
    () => mockStudents.find((s) => s.id === id) ?? null
  );
  if (!result.data) return { data: null, source: result.source, message: result.message };
  return { data: normalizeStudent(result.data), source: result.source, message: result.message };
}

export async function createStudent(payload: Partial<Student>): Promise<ApiResponse<Student>> {
  const res = await apiClient<unknown>('/students', { method: 'POST', body: toStudentUpsert(payload) });
  if (res.success && res.data) return { ...res, data: normalizeStudent(res.data) };
  return { ...res, data: null };
}

export async function updateStudent(id: string, payload: Partial<Student>): Promise<ApiResponse<Student>> {
  const res = await apiClient<unknown>(`/students/${id}`, { method: 'PUT', body: toStudentUpsert(payload) });
  if (res.success && res.data) return { ...res, data: normalizeStudent(res.data) };
  return { ...res, data: null };
}

export async function deleteStudent(id: string): Promise<ApiResponse<null>> {
  return apiClient<null>(`/students/${id}`, { method: 'DELETE' });
}

/**
 * POST /documents — multipart (entityType, entityId, file).
 * Máx 5 MB; pdf/png/jpg/jpeg.
 */
export async function uploadStudentDocument(
  studentId: string,
  file: File,
  meta: { name: string; type: string }
): Promise<ApiResponse<StudentDocument>> {
  const form = new FormData();
  form.append('file', file);
  form.append('entityType', 'student');
  form.append('entityId', studentId);
  void meta;
  const res = await apiClient<Record<string, unknown>>('/documents', {
    method: 'POST',
    body: form,
  });
  if (res.success && res.data) {
    const d = res.data;
    return {
      ...res,
      data: {
        id: String(d.id ?? ''),
        name: String(d.originalFileName ?? meta.name),
        type: meta.type || String(d.extension ?? ''),
        uploadDate: String(d.createdAt ?? '').slice(0, 10),
        status: (String(d.status ?? 'pending') as StudentDocument['status']) || 'pending',
      },
    };
  }
  return { ...res, data: null };
}

export async function deleteStudentDocument(
  _studentId: string,
  documentId: string
): Promise<ApiResponse<null>> {
  return apiClient<null>(`/documents/${documentId}`, { method: 'DELETE' });
}

/** GET /students/:id/guardians — sin fallback a [] (error debe propagarse a la UI). */
export async function listStudentGuardians(studentId: string): Promise<FetchResult<Student['parents']>> {
  const result = await fetchOrFallback<unknown[]>(
    () => apiClient(`/students/${studentId}/guardians`),
    () => [],
    { allowFallback: false }
  );
  const items = unwrapList(result.data).map((raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const first = String(r.firstName ?? '');
    const last = String(r.lastName ?? '');
    return {
      id: String(r.id ?? ''),
      name: String(r.fullName ?? (`${first} ${last}`.trim() || 'Tutor')),
      relationship: String(r.relationship ?? 'Padre'),
      email: String(r.email ?? ''),
      phone: String(r.phone ?? ''),
      occupation: String(r.occupation ?? ''),
    };
  });
  return { data: items, source: result.source, message: result.message };
}

/** POST /students/:id/guardians */
export async function linkParent(
  studentId: string,
  parentId: string,
  relationship?: string
): Promise<ApiResponse<null>> {
  return apiClient<null>(`/students/${studentId}/guardians`, {
    method: 'POST',
    body: {
      guardianId: parentId,
      relationship: relationship ?? 'padre',
      isPrimary: false,
    },
  });
}

/** DELETE /students/:studentId/guardians/:guardianId */
export async function unlinkParent(studentId: string, parentId: string): Promise<ApiResponse<null>> {
  return apiClient<null>(`/students/${studentId}/guardians/${parentId}`, { method: 'DELETE' });
}

/** GET /documents?entityType=student&entityId= (no incluye student-photo). */
export async function listStudentDocuments(
  studentId: string,
  opts?: { excludeDocumentIds?: string[] }
): Promise<FetchResult<StudentDocument[]>> {
  const q = buildQuery({ entityType: 'student', entityId: studentId, page: 1, pageSize: 100 });
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient(`/documents${q}`),
    () => [],
    { allowFallback: false }
  );
  const exclude = new Set((opts?.excludeDocumentIds ?? []).filter(Boolean));
  const items = unwrapList(result.data)
    .map((raw) => {
      const d = raw as Record<string, unknown>;
      const statusRaw = String(d.status ?? 'pending').toLowerCase();
      const status: StudentDocument['status'] =
        statusRaw === 'verified' || statusRaw === 'rejected' ? statusRaw : 'pending';
      return {
        id: String(d.id ?? ''),
        name: String(d.originalFileName ?? d.name ?? 'Documento'),
        type: String(d.extension ?? d.contentType ?? '').replace(/^\./, '') || 'file',
        uploadDate: String(d.createdAt ?? '').slice(0, 10),
        status,
      };
    })
    .filter((d) => !exclude.has(d.id));
  return { data: items, source: result.source, message: result.message };
}

/** GET /timeline?entityType=student&entityId= */
export async function listStudentTimeline(
  studentId: string
): Promise<FetchResult<StudentTimelineEvent[]>> {
  const q = buildQuery({ entityType: 'student', entityId: studentId });
  const result = await fetchOrFallback<Record<string, unknown>[] | PagedResult<Record<string, unknown>>>(
    () => apiClient(`/timeline${q}`),
    () => [],
    { allowFallback: false }
  );
  const rows = Array.isArray(result.data)
    ? result.data
    : unwrapList(result.data ?? null);
  const items: StudentTimelineEvent[] = rows.map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      id: String(r.id ?? ''),
      date: String(r.eventDate ?? r.createdAt ?? '').slice(0, 10),
      title: String(r.title ?? 'Evento'),
      description: String(r.description ?? ''),
      icon: String(r.icon ?? 'ri-history-line'),
      iconBg: 'bg-secondary-100',
      iconColor: 'text-secondary-600',
      badge: r.badge ? String(r.badge) : undefined,
      badgeVariant: 'default',
    };
  });
  return { data: items, source: result.source, message: result.message };
}

/** Mapea cargos del alumno a la forma UI de PagosTab (sin inventar datos). */
export function chargesToStudentPayments(
  charges: Array<{
    id: string;
    conceptName: string;
    netAmount: number;
    status: string;
    dueDate: string;
  }>
): StudentPayment[] {
  const today = new Date().toISOString().slice(0, 10);
  return charges.map((c) => {
    const st = c.status.toLowerCase();
    let status: StudentPayment['status'] = 'pending';
    if (st === 'paid') status = 'paid';
    else if (st === 'overdue' || (st === 'pending' && c.dueDate && c.dueDate < today)) status = 'overdue';
    return {
      id: c.id,
      concept: c.conceptName,
      amount: c.netAmount,
      date: c.dueDate,
      status,
    };
  });
}

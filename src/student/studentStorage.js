export const STUDENT_IDENTITIES_STORAGE_KEY = 'musical-caterpillar-student-identities';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadRememberedStudentIdentities() {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STUDENT_IDENTITIES_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

export function saveRememberedStudentIdentity(identity) {
  if (!canUseLocalStorage()) {
    return [];
  }

  const current = loadRememberedStudentIdentities();
  const next = [
    identity,
    ...current.filter((item) => !(item.classId === identity.classId && item.studentId === identity.studentId)),
  ].slice(0, 10);

  window.localStorage.setItem(
    STUDENT_IDENTITIES_STORAGE_KEY,
    JSON.stringify(next)
  );

  return next;
}

export function getCurrentStudentIdentity() {
  return loadRememberedStudentIdentities()[0] || null;
}

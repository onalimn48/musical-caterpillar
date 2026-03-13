import { supabase } from '../teacher/supabaseClient.js';

async function invokeAssignmentFunction(name, body) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    const response = error.context;

    if (response) {
      try {
        const payload = await response.json();
        if (payload?.error) {
          throw new Error(payload.error);
        }
      } catch (_jsonError) {
        try {
          const text = await response.text();
          if (text) {
            throw new Error(text);
          }
        } catch (_textError) {
          // Fall through.
        }
      }
    }

    throw new Error(error.message || 'Assignment request failed.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export function listAssignmentsForStudent({ classId, studentId, assignmentId = '' }) {
  return invokeAssignmentFunction('list-assignments-for-student', {
    classId,
    studentId,
    assignmentId,
  });
}

export function recordAttemptStarted({ assignmentId, classId, studentId }) {
  return invokeAssignmentFunction('record-attempt-started', {
    assignmentId,
    classId,
    studentId,
  });
}

export function recordAttemptCompleted({
  attemptId,
  assignmentId,
  classId,
  studentId,
  payload,
}) {
  return invokeAssignmentFunction('record-attempt-completed', {
    attemptId,
    assignmentId,
    classId,
    studentId,
    payload,
  });
}

import { supabase } from '../teacher/supabaseClient.js';

async function extractFunctionError(error) {
  const response = error?.context;

  if (!response) {
    return error?.message || 'Assignment request failed.';
  }

  try {
    const payload = await response.clone().json();

    if (payload?.error) {
      return payload.error;
    }
  } catch (_jsonError) {
    // Fall through to text parsing.
  }

  try {
    const text = await response.text();

    if (text) {
      return text;
    }
  } catch (_textError) {
    // Fall through to the generic fallback below.
  }

  return error?.message || 'Assignment request failed.';
}

async function invokeAssignmentFunction(name, body) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    throw new Error(await extractFunctionError(error));
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

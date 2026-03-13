import { supabase } from '../supabaseClient.js';

const ASSIGNMENT_SELECT_FIELDS = [
  'id',
  'teacher_id',
  'class_id',
  'title',
  'instructions',
  'game_id',
  'activity_config',
  'due_at',
  'published',
  'created_at',
].join(', ');

const ASSIGNMENT_DETAIL_SELECT_FIELDS = [
  ASSIGNMENT_SELECT_FIELDS,
  'class:classes(id, name, class_code, grade_label)',
].join(', ');

const STUDENT_SELECT_FIELDS = [
  'id',
  'class_id',
  'display_name',
  'sort_name',
  'archived',
  'created_at',
].join(', ');

const ASSIGNMENT_ATTEMPT_SELECT_FIELDS = [
  'id',
  'assignment_id',
  'student_id',
  'game_id',
  'status',
  'score',
  'accuracy',
  'duration_seconds',
  'result_summary',
  'started_at',
  'completed_at',
].join(', ');

function getAttemptSummary(attempt) {
  return attempt?.result_summary?.summary || {};
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return null;
}

function getLatestTimestampValue(attempt) {
  const timestamp = attempt?.completed_at || attempt?.started_at;

  if (!timestamp) {
    return 0;
  }

  const value = new Date(timestamp).getTime();
  return Number.isFinite(value) ? value : 0;
}

function compareLatestFirst(left, right) {
  return getLatestTimestampValue(right) - getLatestTimestampValue(left);
}

function getAttemptAccuracy(attempt) {
  const summary = getAttemptSummary(attempt);
  return toNumber(attempt?.accuracy ?? summary.accuracy);
}

function getAttemptScore(attempt) {
  const summary = getAttemptSummary(attempt);
  return toNumber(attempt?.score ?? summary.score);
}

function compareBestAttempt(gameId, left, right) {
  if (gameId === 'notes-per-minute') {
    const leftAccuracy = getAttemptAccuracy(left) ?? -1;
    const rightAccuracy = getAttemptAccuracy(right) ?? -1;

    if (leftAccuracy !== rightAccuracy) {
      return rightAccuracy - leftAccuracy;
    }
  } else {
    const leftScore = getAttemptScore(left) ?? -1;
    const rightScore = getAttemptScore(right) ?? -1;

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }
  }

  return compareLatestFirst(left, right);
}

function buildStudentAssignmentSummary(student, attempts, gameId) {
  const sortedAttempts = [...attempts].sort(compareLatestFirst);
  const completedAttempts = sortedAttempts.filter((attempt) => attempt.status === 'completed');
  const latestAttempt = sortedAttempts[0] || null;
  const latestCompletedAttempt = completedAttempts[0] || null;
  const bestAttempt = completedAttempts.length > 0
    ? [...completedAttempts].sort((left, right) => compareBestAttempt(gameId, left, right))[0]
    : null;
  const hasStartedAttempt = sortedAttempts.some((attempt) => (
    attempt.status === 'started' || attempt.status === 'abandoned'
  ));

  let status = 'not started';

  if (completedAttempts.length > 0) {
    status = 'completed';
  } else if (hasStartedAttempt) {
    status = 'started';
  }

  return {
    student,
    attempts: sortedAttempts,
    status,
    lastActivityAt: latestAttempt?.completed_at || latestAttempt?.started_at || '',
    latestAttempt,
    latestCompletedAttempt,
    bestAttempt,
  };
}

function buildAssignmentCompletionSummary(studentSummaries) {
  const baseSummary = studentSummaries.reduce((summary, studentSummary) => {
    if (studentSummary.status === 'completed') {
      summary.completedCount += 1;
    } else if (studentSummary.status === 'started') {
      summary.startedCount += 1;
    } else {
      summary.notStartedCount += 1;
    }

    return summary;
  }, {
    totalStudents: studentSummaries.length,
    notStartedCount: 0,
    startedCount: 0,
    completedCount: 0,
    latestResultCount: 0,
    bestResultCount: 0,
    latestActivityAt: '',
  });

  let latestActivityAt = '';
  let latestActivityValue = 0;

  studentSummaries.forEach((studentSummary) => {
    if (studentSummary.latestCompletedAttempt) {
      baseSummary.latestResultCount += 1;
    }

    if (studentSummary.bestAttempt) {
      baseSummary.bestResultCount += 1;
    }

    const candidateTimestamp = studentSummary.lastActivityAt;
    const candidateValue = candidateTimestamp ? new Date(candidateTimestamp).getTime() : 0;

    if (Number.isFinite(candidateValue) && candidateValue > latestActivityValue) {
      latestActivityValue = candidateValue;
      latestActivityAt = candidateTimestamp;
    }
  });

  return {
    ...baseSummary,
    latestActivityAt,
  };
}

function buildAssignmentWithSummaries(assignment, students, attempts) {
  const attemptsByStudentId = attempts.reduce((map, attempt) => {
    const currentAttempts = map.get(attempt.student_id) || [];
    currentAttempts.push(attempt);
    map.set(attempt.student_id, currentAttempts);
    return map;
  }, new Map());

  const studentSummaries = students.map((student) => buildStudentAssignmentSummary(
    student,
    attemptsByStudentId.get(student.id) || [],
    assignment.game_id,
  ));

  return {
    assignment,
    studentSummaries,
    completionSummary: buildAssignmentCompletionSummary(studentSummaries),
  };
}

export async function createTeacherAssignment({
  teacherId,
  classId,
  title,
  instructions,
  gameId,
  activityConfig,
  dueAt,
}) {
  const { data, error } = await supabase
    .from('assignments')
    .insert({
      teacher_id: teacherId,
      class_id: classId,
      title: title.trim(),
      instructions: instructions.trim(),
      game_id: gameId,
      activity_config: activityConfig,
      due_at: dueAt || null,
      published: true,
    })
    .select(ASSIGNMENT_SELECT_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listAssignmentsByClass(classId) {
  const { data, error } = await supabase
    .from('assignments')
    .select(ASSIGNMENT_SELECT_FIELDS)
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getTeacherAssignment({ teacherId, assignmentId }) {
  const { data, error } = await supabase
    .from('assignments')
    .select(ASSIGNMENT_DETAIL_SELECT_FIELDS)
    .eq('teacher_id', teacherId)
    .eq('id', assignmentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getTeacherAssignmentDetail({ teacherId, assignmentId }) {
  const assignment = await getTeacherAssignment({ teacherId, assignmentId });

  if (!assignment) {
    return null;
  }

  const [{ data: students, error: studentsError }, { data: attempts, error: attemptsError }] = await Promise.all([
    supabase
      .from('students')
      .select(STUDENT_SELECT_FIELDS)
      .eq('class_id', assignment.class_id)
      .eq('archived', false)
      .order('sort_name', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('assignment_attempts')
      .select(ASSIGNMENT_ATTEMPT_SELECT_FIELDS)
      .eq('teacher_id', teacherId)
      .eq('assignment_id', assignmentId),
  ]);

  if (studentsError) {
    throw studentsError;
  }

  if (attemptsError) {
    throw attemptsError;
  }

  return buildAssignmentWithSummaries(assignment, students, attempts);
}

export async function listRecentTeacherAssignments(teacherId, limitCount = 5) {
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(ASSIGNMENT_DETAIL_SELECT_FIELDS)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (assignmentsError) {
    throw assignmentsError;
  }

  if (!assignments.length) {
    return [];
  }

  const classIds = [...new Set(assignments.map((assignment) => assignment.class_id))];
  const assignmentIds = assignments.map((assignment) => assignment.id);

  const [{ data: students, error: studentsError }, { data: attempts, error: attemptsError }] = await Promise.all([
    supabase
      .from('students')
      .select(STUDENT_SELECT_FIELDS)
      .in('class_id', classIds)
      .eq('archived', false)
      .order('sort_name', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('assignment_attempts')
      .select(ASSIGNMENT_ATTEMPT_SELECT_FIELDS)
      .eq('teacher_id', teacherId)
      .in('assignment_id', assignmentIds),
  ]);

  if (studentsError) {
    throw studentsError;
  }

  if (attemptsError) {
    throw attemptsError;
  }

  return assignments.map((assignment) => buildAssignmentWithSummaries(
    assignment,
    students.filter((student) => student.class_id === assignment.class_id),
    attempts.filter((attempt) => attempt.assignment_id === assignment.id),
  ));
}

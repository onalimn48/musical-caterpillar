import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { classId, studentId, assignmentId } = await request.json();

    if (!classId || !studentId) {
      return Response.json({ error: 'classId and studentId are required.' }, { status: 400, headers: corsHeaders });
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, class_id, display_name, archived')
      .eq('id', studentId)
      .eq('class_id', classId)
      .eq('archived', false)
      .maybeSingle();

    if (studentError) {
      throw studentError;
    }

    if (!student) {
      return Response.json({ error: 'Student not found in this class.' }, { status: 404, headers: corsHeaders });
    }

    let query = supabase
      .from('assignments')
      .select('id, class_id, title, instructions, game_id, activity_config, due_at, published, created_at')
      .eq('class_id', classId)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (assignmentId) {
      query = query.eq('id', assignmentId);
    }

    const { data: assignments, error: assignmentError } = await query;

    if (assignmentError) {
      throw assignmentError;
    }

    const mappedAssignments = (assignments ?? []).map((assignment) => ({
      id: assignment.id,
      classId: assignment.class_id,
      title: assignment.title,
      instructions: assignment.instructions,
      gameId: assignment.game_id,
      activityConfig: assignment.activity_config,
      dueAt: assignment.due_at,
      published: assignment.published,
      createdAt: assignment.created_at,
    }));

    const assignmentIds = mappedAssignments.map((assignment) => assignment.id);
    let attemptsByAssignmentId = new Map<string, Array<{
      status: string;
      started_at: string | null;
      completed_at: string | null;
    }>>();

    if (assignmentIds.length > 0) {
      const { data: attempts, error: attemptsError } = await supabase
        .from('assignment_attempts')
        .select('assignment_id, status, started_at, completed_at')
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .in('assignment_id', assignmentIds)
        .order('started_at', { ascending: false });

      if (attemptsError) {
        throw attemptsError;
      }

      attemptsByAssignmentId = (attempts ?? []).reduce((map, attempt) => {
        const current = map.get(attempt.assignment_id) || [];
        current.push({
          status: attempt.status,
          started_at: attempt.started_at,
          completed_at: attempt.completed_at,
        });
        map.set(attempt.assignment_id, current);
        return map;
      }, new Map<string, Array<{
        status: string;
        started_at: string | null;
        completed_at: string | null;
      }>>());
    }

    const assignmentsWithStatus = mappedAssignments.map((assignment) => {
      const attempts = attemptsByAssignmentId.get(assignment.id) || [];
      const completedAttempt = attempts.find((attempt) => attempt.status === 'completed') || null;
      const latestAttempt = attempts[0] || null;
      const studentStatus = completedAttempt
        ? 'completed'
        : latestAttempt
          ? latestAttempt.status
          : 'not_started';

      return {
        ...assignment,
        studentStatus,
        completedAt: completedAttempt?.completed_at || null,
        canStart: studentStatus !== 'completed',
      };
    });

    return Response.json(
      assignmentId
        ? { assignment: assignmentsWithStatus[0] ?? null }
        : { assignments: assignmentsWithStatus },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      { error: error.message || 'Unexpected error.' },
      { status: 500, headers: corsHeaders }
    );
  }
});

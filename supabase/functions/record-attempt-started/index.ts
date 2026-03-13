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
    const { assignmentId, classId, studentId } = await request.json();

    if (!assignmentId || !classId || !studentId) {
      return Response.json({ error: 'assignmentId, classId, and studentId are required.' }, { status: 400, headers: corsHeaders });
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, class_id, teacher_id, game_id, published')
      .eq('id', assignmentId)
      .eq('class_id', classId)
      .eq('published', true)
      .maybeSingle();

    if (assignmentError) {
      throw assignmentError;
    }

    if (!assignment) {
      return Response.json({ error: 'Assignment not found.' }, { status: 404, headers: corsHeaders });
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
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

    const { data: existingAttempts, error: existingAttemptsError } = await supabase
      .from('assignment_attempts')
      .select('id, status, started_at, completed_at')
      .eq('assignment_id', assignment.id)
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .order('started_at', { ascending: false });

    if (existingAttemptsError) {
      throw existingAttemptsError;
    }

    const completedAttempt = (existingAttempts ?? []).find((attempt) => attempt.status === 'completed');

    if (completedAttempt) {
      return Response.json(
        { error: 'This assignment has already been completed.' },
        { status: 409, headers: corsHeaders }
      );
    }

    const startedAt = new Date().toISOString();
    const { data: attempt, error: attemptError } = await supabase
      .from('assignment_attempts')
      .insert({
        assignment_id: assignment.id,
        class_id: classId,
        student_id: studentId,
        teacher_id: assignment.teacher_id,
        game_id: assignment.game_id,
        status: 'started',
        started_at: startedAt,
      })
      .select('id, started_at')
      .single();

    if (attemptError) {
      throw attemptError;
    }

    return Response.json(
      {
        attemptId: attempt.id,
        startedAt: attempt.started_at,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      { error: error.message || 'Unexpected error.' },
      { status: 500, headers: corsHeaders }
    );
  }
});

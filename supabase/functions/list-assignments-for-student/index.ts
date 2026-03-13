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

    return Response.json(
      assignmentId
        ? { assignment: mappedAssignments[0] ?? null }
        : { assignments: mappedAssignments },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      { error: error.message || 'Unexpected error.' },
      { status: 500, headers: corsHeaders }
    );
  }
});

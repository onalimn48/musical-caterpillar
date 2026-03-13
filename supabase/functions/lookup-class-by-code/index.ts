import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { classCode } = await request.json();
    const normalizedCode = String(classCode ?? '').trim().toUpperCase();

    if (!normalizedCode) {
      return Response.json(
        { error: 'Class code is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: classroom, error: classError } = await supabase
      .from('classes')
      .select('id, name, class_code, archived')
      .eq('class_code', normalizedCode)
      .eq('archived', false)
      .maybeSingle();

    if (classError) {
      throw classError;
    }

    if (!classroom) {
      return Response.json(
        { error: 'Class not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, display_name, archived')
      .eq('class_id', classroom.id)
      .eq('archived', false)
      .order('sort_name', { ascending: true })
      .order('created_at', { ascending: true });

    if (studentError) {
      throw studentError;
    }

    return Response.json(
      {
        classroom: {
          id: classroom.id,
          name: classroom.name,
          classCode: classroom.class_code,
          students: (students ?? []).map((student) => ({
            id: student.id,
            displayName: student.display_name,
          })),
        },
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

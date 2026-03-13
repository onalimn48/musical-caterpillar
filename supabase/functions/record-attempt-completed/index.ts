import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function deriveScore(summary: Record<string, unknown>) {
  if (typeof summary.score === 'number') return summary.score;
  if (typeof summary.fluencyScore === 'number') return summary.fluencyScore;
  if (typeof summary.rawNpm === 'number') return summary.rawNpm;
  if (typeof summary.npm === 'number') return summary.npm;
  return null;
}

function deriveAccuracy(summary: Record<string, unknown>) {
  if (typeof summary.accuracy === 'number') return summary.accuracy;
  return null;
}

function deriveDurationSeconds(startedAt: string, completedAt: string) {
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }

  return Math.max(0, Math.round((end - start) / 1000));
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { attemptId, assignmentId, classId, studentId, payload } = await request.json();

    if (!attemptId || !assignmentId || !classId || !studentId || !payload) {
      return Response.json({ error: 'attemptId, assignmentId, classId, studentId, and payload are required.' }, { status: 400, headers: corsHeaders });
    }

    const { data: attempt, error: attemptError } = await supabase
      .from('assignment_attempts')
      .select('id, assignment_id, class_id, student_id, started_at')
      .eq('id', attemptId)
      .eq('assignment_id', assignmentId)
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (attemptError) {
      throw attemptError;
    }

    if (!attempt) {
      return Response.json({ error: 'Attempt not found.' }, { status: 404, headers: corsHeaders });
    }

    const summary = (payload.summary ?? {}) as Record<string, unknown>;
    const completedAt = String(payload.completedAt ?? new Date().toISOString());
    const resultSummary = {
      summary,
      rawResult: payload.rawResult ?? {},
      configSnapshot: payload.configSnapshot ?? {},
      startedAt: payload.startedAt ?? attempt.started_at,
      completedAt,
      status: payload.status ?? 'completed',
      gameVersion: payload.gameVersion ?? '1',
    };

    const { error: updateError } = await supabase
      .from('assignment_attempts')
      .update({
        game_version: payload.gameVersion ?? '1',
        status: payload.status ?? 'completed',
        score: deriveScore(summary),
        accuracy: deriveAccuracy(summary),
        duration_seconds: deriveDurationSeconds(
          String(payload.startedAt ?? attempt.started_at),
          completedAt
        ),
        result_summary: resultSummary,
        completed_at: completedAt,
      })
      .eq('id', attemptId);

    if (updateError) {
      throw updateError;
    }

    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error.message || 'Unexpected error.' },
      { status: 500, headers: corsHeaders }
    );
  }
});

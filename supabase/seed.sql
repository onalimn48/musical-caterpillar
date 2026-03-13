-- Day 7 demo seed
-- Demo teacher login:
--   email: demo.teacher@musicalcaterpillar.com
--   password: MusicDemo123!
--
-- This seed is intended for local/demo environments so the teacher dashboard
-- is not empty on first login. It creates one approved teacher, one class,
-- six students, one sample assignment, and a few assignment attempts.

do $$
declare
  demo_teacher_id uuid := '11111111-1111-1111-1111-111111111111';
  demo_class_id uuid := '22222222-2222-2222-2222-222222222222';
  demo_assignment_id uuid := '33333333-3333-3333-3333-333333333333';
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    demo_teacher_id,
    'authenticated',
    'authenticated',
    'demo.teacher@musicalcaterpillar.com',
    crypt('MusicDemo123!', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"seeded":true,"name":"Demo Teacher"}'::jsonb,
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    id
  )
  values (
    demo_teacher_id::text,
    demo_teacher_id,
    format('{"sub":"%s","email":"%s"}', demo_teacher_id::text, 'demo.teacher@musicalcaterpillar.com')::jsonb,
    'email',
    now(),
    now(),
    now(),
    demo_teacher_id
  )
  on conflict (provider, provider_id) do update
  set
    identity_data = excluded.identity_data,
    last_sign_in_at = now(),
    updated_at = now();

  insert into public.teachers (id, email, approved, created_at)
  values (
    demo_teacher_id,
    'demo.teacher@musicalcaterpillar.com',
    true,
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    approved = true;

  insert into public.classes (
    id,
    teacher_id,
    name,
    description,
    grade_label,
    class_code,
    allow_self_join,
    archived,
    created_at
  )
  values (
    demo_class_id,
    demo_teacher_id,
    'Cedar Grove Music',
    'Demo class for pilot walkthroughs and first-login screenshots.',
    'Grade 4',
    'MUSIC-4829',
    false,
    false,
    now()
  )
  on conflict (id) do update
  set
    teacher_id = excluded.teacher_id,
    name = excluded.name,
    description = excluded.description,
    grade_label = excluded.grade_label,
    class_code = excluded.class_code,
    allow_self_join = false,
    archived = false;

  insert into public.students (id, class_id, display_name, sort_name, created_by_teacher, archived, created_at)
  values
    ('44444444-4444-4444-4444-444444444441', demo_class_id, 'Ava Martinez', 'Martinez, Ava', true, false, now()),
    ('44444444-4444-4444-4444-444444444442', demo_class_id, 'Leo Chen', 'Chen, Leo', true, false, now()),
    ('44444444-4444-4444-4444-444444444443', demo_class_id, 'Maya Patel', 'Patel, Maya', true, false, now()),
    ('44444444-4444-4444-4444-444444444444', demo_class_id, 'Noah Brooks', 'Brooks, Noah', true, false, now()),
    ('44444444-4444-4444-4444-444444444445', demo_class_id, 'Zoe Kim', 'Kim, Zoe', true, false, now()),
    ('44444444-4444-4444-4444-444444444446', demo_class_id, 'Ethan Rivera', 'Rivera, Ethan', true, false, now())
  on conflict (id) do update
  set
    class_id = excluded.class_id,
    display_name = excluded.display_name,
    sort_name = excluded.sort_name,
    created_by_teacher = true,
    archived = false;

  insert into public.assignments (
    id,
    teacher_id,
    class_id,
    title,
    instructions,
    game_id,
    activity_config,
    due_at,
    published,
    created_at
  )
  values (
    demo_assignment_id,
    demo_teacher_id,
    demo_class_id,
    'Treble Benchmark Check-In',
    'Complete one focused run and do your best to keep accuracy above 85%.',
    'notes-per-minute',
    '{"gameId":"notes-per-minute","runType":"benchmark","presetId":"NPM-T1"}'::jsonb,
    '2026-09-15T15:00:00Z'::timestamptz,
    true,
    now()
  )
  on conflict (id) do update
  set
    teacher_id = excluded.teacher_id,
    class_id = excluded.class_id,
    title = excluded.title,
    instructions = excluded.instructions,
    game_id = excluded.game_id,
    activity_config = excluded.activity_config,
    due_at = excluded.due_at,
    published = true;

  insert into public.assignment_attempts (
    id,
    assignment_id,
    class_id,
    student_id,
    teacher_id,
    game_id,
    game_version,
    status,
    score,
    accuracy,
    duration_seconds,
    result_summary,
    started_at,
    completed_at
  )
  values
    (
      '55555555-5555-5555-5555-555555555551',
      demo_assignment_id,
      demo_class_id,
      '44444444-4444-4444-4444-444444444441',
      demo_teacher_id,
      'notes-per-minute',
      '1',
      'completed',
      92,
      97.0,
      60,
      '{
        "summary": {
          "accuracy": 97,
          "rawNpm": 31,
          "npm": 31,
          "score": 92,
          "fluencyScore": 92,
          "qualifiedBenchmark": true,
          "presetId": "NPM-T1",
          "clef": "Treble"
        },
        "rawResult": {
          "summary": {
            "accuracy": 97,
            "rawNpm": 31,
            "fluencyScore": 92
          }
        }
      }'::jsonb,
      '2026-03-10T15:00:00Z'::timestamptz,
      '2026-03-10T15:01:00Z'::timestamptz
    ),
    (
      '55555555-5555-5555-5555-555555555552',
      demo_assignment_id,
      demo_class_id,
      '44444444-4444-4444-4444-444444444442',
      demo_teacher_id,
      'notes-per-minute',
      '1',
      'started',
      null,
      null,
      null,
      '{"summary":{},"rawResult":{}}'::jsonb,
      '2026-03-11T15:00:00Z'::timestamptz,
      null
    ),
    (
      '55555555-5555-5555-5555-555555555553',
      demo_assignment_id,
      demo_class_id,
      '44444444-4444-4444-4444-444444444443',
      demo_teacher_id,
      'notes-per-minute',
      '1',
      'completed',
      84,
      91.0,
      60,
      '{
        "summary": {
          "accuracy": 91,
          "rawNpm": 27,
          "npm": 27,
          "score": 84,
          "fluencyScore": 84,
          "qualifiedBenchmark": true,
          "presetId": "NPM-T1",
          "clef": "Treble"
        },
        "rawResult": {
          "summary": {
            "accuracy": 91,
            "rawNpm": 27,
            "fluencyScore": 84
          }
        }
      }'::jsonb,
      '2026-03-12T15:00:00Z'::timestamptz,
      '2026-03-12T15:01:00Z'::timestamptz
    )
  on conflict (id) do update
  set
    status = excluded.status,
    score = excluded.score,
    accuracy = excluded.accuracy,
    duration_seconds = excluded.duration_seconds,
    result_summary = excluded.result_summary,
    started_at = excluded.started_at,
    completed_at = excluded.completed_at;
end $$;

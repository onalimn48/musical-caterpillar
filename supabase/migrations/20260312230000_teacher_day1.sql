create extension if not exists pgcrypto;

create table if not exists public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  name text not null,
  description text not null default '',
  class_code text not null unique,
  allow_self_join boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  display_name text not null,
  sort_name text not null default '',
  created_by_teacher boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  instructions text not null default '',
  game_id text not null,
  activity_config jsonb not null,
  due_at timestamptz,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  game_id text not null,
  game_version text not null default '1',
  status text not null check (status in ('started', 'completed', 'abandoned')),
  score integer,
  accuracy numeric,
  duration_seconds integer,
  result_summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_classes_teacher_id on public.classes(teacher_id);
create index if not exists idx_students_class_id on public.students(class_id);
create index if not exists idx_assignments_class_id on public.assignments(class_id);
create index if not exists idx_assignment_attempts_assignment_id on public.assignment_attempts(assignment_id);
create index if not exists idx_assignment_attempts_student_id on public.assignment_attempts(student_id);
create index if not exists idx_assignment_attempts_class_id on public.assignment_attempts(class_id);

create or replace function public.handle_new_teacher()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.teachers (id, email)
  values (new.id, new.email)
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

create or replace function public.sync_teacher_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.teachers
  set email = new.email
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_teacher();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email on auth.users
for each row execute procedure public.sync_teacher_email();

insert into public.teachers (id, email)
select id, email
from auth.users
where email is not null
on conflict (id) do update
set email = excluded.email;

alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_attempts enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.teachers to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.assignments to authenticated;
grant select, insert, update, delete on public.assignment_attempts to authenticated;

create policy "teachers_select_own_profile"
on public.teachers
for select
to authenticated
using (auth.uid() = id);

create policy "teachers_update_own_profile"
on public.teachers
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "classes_select_owned"
on public.classes
for select
to authenticated
using (teacher_id = auth.uid());

create policy "classes_insert_owned"
on public.classes
for insert
to authenticated
with check (teacher_id = auth.uid());

create policy "classes_update_owned"
on public.classes
for update
to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

create policy "classes_delete_owned"
on public.classes
for delete
to authenticated
using (teacher_id = auth.uid());

create policy "students_select_owned_classes"
on public.students
for select
to authenticated
using (
  exists (
    select 1
    from public.classes
    where classes.id = students.class_id
      and classes.teacher_id = auth.uid()
  )
);

create policy "students_insert_owned_classes"
on public.students
for insert
to authenticated
with check (
  exists (
    select 1
    from public.classes
    where classes.id = students.class_id
      and classes.teacher_id = auth.uid()
  )
);

create policy "students_update_owned_classes"
on public.students
for update
to authenticated
using (
  exists (
    select 1
    from public.classes
    where classes.id = students.class_id
      and classes.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.classes
    where classes.id = students.class_id
      and classes.teacher_id = auth.uid()
  )
);

create policy "students_delete_owned_classes"
on public.students
for delete
to authenticated
using (
  exists (
    select 1
    from public.classes
    where classes.id = students.class_id
      and classes.teacher_id = auth.uid()
  )
);

create policy "assignments_select_owned"
on public.assignments
for select
to authenticated
using (teacher_id = auth.uid());

create policy "assignments_insert_owned"
on public.assignments
for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.classes
    where classes.id = assignments.class_id
      and classes.teacher_id = auth.uid()
  )
);

create policy "assignments_update_owned"
on public.assignments
for update
to authenticated
using (teacher_id = auth.uid())
with check (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.classes
    where classes.id = assignments.class_id
      and classes.teacher_id = auth.uid()
  )
);

create policy "assignments_delete_owned"
on public.assignments
for delete
to authenticated
using (teacher_id = auth.uid());

create policy "attempts_select_owned"
on public.assignment_attempts
for select
to authenticated
using (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.classes
    where classes.id = assignment_attempts.class_id
      and classes.teacher_id = auth.uid()
  )
);

create policy "attempts_insert_owned"
on public.assignment_attempts
for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.classes
    where classes.id = assignment_attempts.class_id
      and classes.teacher_id = auth.uid()
  )
);

create policy "attempts_update_owned"
on public.assignment_attempts
for update
to authenticated
using (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.classes
    where classes.id = assignment_attempts.class_id
      and classes.teacher_id = auth.uid()
  )
)
with check (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.classes
    where classes.id = assignment_attempts.class_id
      and classes.teacher_id = auth.uid()
  )
);

create policy "attempts_delete_owned"
on public.assignment_attempts
for delete
to authenticated
using (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.classes
    where classes.id = assignment_attempts.class_id
      and classes.teacher_id = auth.uid()
  )
);

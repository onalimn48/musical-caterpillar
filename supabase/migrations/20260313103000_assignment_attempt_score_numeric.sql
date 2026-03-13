alter table public.assignment_attempts
alter column score type numeric
using score::numeric;

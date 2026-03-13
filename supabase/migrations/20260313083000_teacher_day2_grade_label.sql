alter table public.classes
add column if not exists grade_label text not null default '';

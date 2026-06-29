-- Run this in the Supabase SQL editor if photo uploads fail or thumbnails do not load.

-- Buckets (public read keeps <img src> simple; signed URLs also work with SELECT policies below)
insert into storage.buckets (id, name, public)
values
  ('food-photos', 'food-photos', true),
  ('progress-photos', 'progress-photos', true)
on conflict (id) do update
set public = excluded.public;

-- Storage policies
drop policy if exists "Public read food photos" on storage.objects;
drop policy if exists "Public read progress photos" on storage.objects;
drop policy if exists "Anon upload food photos" on storage.objects;
drop policy if exists "Anon upload progress photos" on storage.objects;

create policy "Public read food photos"
  on storage.objects for select
  using (bucket_id = 'food-photos');

create policy "Public read progress photos"
  on storage.objects for select
  using (bucket_id = 'progress-photos');

create policy "Anon upload food photos"
  on storage.objects for insert
  with check (bucket_id = 'food-photos');

create policy "Anon upload progress photos"
  on storage.objects for insert
  with check (bucket_id = 'progress-photos');

-- food_photo_logs
alter table if exists public.food_photo_logs enable row level security;

drop policy if exists "Anon read food photo logs" on public.food_photo_logs;
drop policy if exists "Anon insert food photo logs" on public.food_photo_logs;

create policy "Anon read food photo logs"
  on public.food_photo_logs for select
  using (true);

create policy "Anon insert food photo logs"
  on public.food_photo_logs for insert
  with check (true);

-- progress_photos
alter table if exists public.progress_photos enable row level security;

drop policy if exists "Anon read progress photos table" on public.progress_photos;
drop policy if exists "Anon insert progress photos table" on public.progress_photos;

create policy "Anon read progress photos table"
  on public.progress_photos for select
  using (true);

create policy "Anon insert progress photos table"
  on public.progress_photos for insert
  with check (true);

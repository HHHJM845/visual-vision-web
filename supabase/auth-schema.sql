-- Supabase Auth profile schema for visual-vision-web.
-- Run this once in the Supabase SQL Editor for the project used by VITE_SUPABASE_URL.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text default '',
  nickname text not null default '新用户',
  role text not null default 'aigcer' check (role in ('aigcer', 'client')),
  verification_status text not null default 'none' check (verification_status in ('none', 'pending', 'verified')),
  client_verification_type text check (client_verification_type in ('realname', 'enterprise')),
  avatar_url text,
  aigcer_bio text,
  aigcer_styles text[] not null default '{}',
  aigcer_tools text[] not null default '{}',
  aigcer_portfolio jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_verification_status_idx on public.profiles(verification_status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone, nickname, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'nickname', split_part(new.email, '@', 1), '新用户'),
    case
      when new.raw_user_meta_data ->> 'role' = 'client' then 'client'
      else 'aigcer'
    end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    phone = excluded.phone,
    nickname = excluded.nickname,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by signed-in users" on public.profiles;
create policy "Profiles are readable by signed-in users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

insert into storage.buckets (id, name, public)
values ('portfolios', 'portfolios', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Portfolio images are public" on storage.objects;
create policy "Portfolio images are public"
on storage.objects for select
to public
using (bucket_id = 'portfolios');

drop policy if exists "Users manage their own portfolio images" on storage.objects;
create policy "Users manage their own portfolio images"
on storage.objects for all
to authenticated
using (bucket_id = 'portfolios' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'portfolios' and auth.uid()::text = (storage.foldername(name))[1]);

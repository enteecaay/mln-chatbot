create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.message_role as enum ('user', 'assistant');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.otp_purpose as enum ('signup', 'change_email');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  role public.user_role not null default 'user',
  is_banned boolean not null default false,
  ban_expires_at timestamptz,
  ban_reason text,
  message_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.message_role not null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  path text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  otp_code text not null,
  purpose public.otp_purpose not null default 'signup',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Người dùng mới')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists chat_sessions_set_updated_at on public.chat_sessions;
create trigger chat_sessions_set_updated_at
before update on public.chat_sessions
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.access_logs enable row level security;
alter table public.email_otps enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "chat_sessions_all_own" on public.chat_sessions;
create policy "chat_sessions_all_own"
on public.chat_sessions for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
on public.messages for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
on public.messages for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "access_logs_select_own" on public.access_logs;
create policy "access_logs_select_own"
on public.access_logs for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "access_logs_insert_own" on public.access_logs;
create policy "access_logs_insert_own"
on public.access_logs for insert
to authenticated
with check (auth.uid() = user_id);

comment on table public.email_otps is 'Server-side only. Access via service role.';
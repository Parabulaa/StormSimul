-- Run once in the Supabase SQL editor. All user-owned tables use RLS.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  address text not null check (char_length(address) between 1 and 240),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  storm_alerts boolean not null default true,
  flood_warnings boolean not null default true,
  evacuation_alerts boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.saved_locations enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Users read own locations" on public.saved_locations;
create policy "Users read own locations" on public.saved_locations for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users insert own locations" on public.saved_locations;
create policy "Users insert own locations" on public.saved_locations for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update own locations" on public.saved_locations;
create policy "Users update own locations" on public.saved_locations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete own locations" on public.saved_locations;
create policy "Users delete own locations" on public.saved_locations for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users read own notification preferences" on public.notification_preferences;
create policy "Users read own notification preferences" on public.notification_preferences for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users insert own notification preferences" on public.notification_preferences;
create policy "Users insert own notification preferences" on public.notification_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update own notification preferences" on public.notification_preferences;
create policy "Users update own notification preferences" on public.notification_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  insert into public.notification_preferences (user_id) values (new.id);
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists saved_locations_set_updated_at on public.saved_locations;
create trigger saved_locations_set_updated_at before update on public.saved_locations for each row execute procedure public.set_updated_at();
drop trigger if exists preferences_set_updated_at on public.notification_preferences;
create trigger preferences_set_updated_at before update on public.notification_preferences for each row execute procedure public.set_updated_at();

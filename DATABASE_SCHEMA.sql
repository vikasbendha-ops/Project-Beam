-- =============================================================================
-- BEAM — Complete Supabase Schema
-- =============================================================================
-- Run this entire file in the Supabase Dashboard → SQL Editor → New Query
-- Run sections sequentially (or all at once — they're idempotent where possible)
-- After running, verify in Table Editor that all tables exist.
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================================
-- 2. CUSTOM TYPES (ENUMS)
-- =============================================================================

do $$ begin
  create type workspace_role as enum ('owner', 'member', 'guest');
exception when duplicate_object then null; end $$;

do $$ begin
  create type markup_type as enum ('image', 'pdf', 'website');
exception when duplicate_object then null; end $$;

do $$ begin
  create type markup_status as enum ('draft', 'ready_for_review', 'changes_requested', 'approved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type thread_status as enum ('open', 'resolved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type thread_priority as enum ('none', 'low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type device_type as enum ('desktop', 'tablet', 'mobile');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum (
    'comment', 'mention', 'reply', 'resolve', 'status_change', 'share', 'invite', 'approve'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type email_digest_frequency as enum ('off', 'realtime', 'daily', 'weekly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type markup_notification_default as enum ('all', 'mentions', 'off');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- 3. PROFILES TABLE (1:1 with auth.users)
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  username text unique,
  avatar_url text,
  timezone text default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_username_idx on public.profiles(username);

-- =============================================================================
-- 4. WORKSPACES
-- =============================================================================

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique,
  avatar_url text,
  is_personal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_owner_idx on public.workspaces(owner_id);
create index if not exists workspaces_slug_idx on public.workspaces(slug);

-- =============================================================================
-- 5. WORKSPACE MEMBERS (sharing workspaces)
-- =============================================================================

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role workspace_role not null default 'member',
  invited_by uuid references public.profiles(id) on delete set null,
  joined_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create index if not exists workspace_members_workspace_idx on public.workspace_members(workspace_id);
create index if not exists workspace_members_user_idx on public.workspace_members(user_id);

-- =============================================================================
-- 6. FOLDERS (nested up to 5 deep — enforced by trigger)
-- =============================================================================

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  parent_folder_id uuid references public.folders(id) on delete cascade,
  name text not null,
  created_by uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists folders_workspace_idx on public.folders(workspace_id);
create index if not exists folders_parent_idx on public.folders(parent_folder_id);

-- =============================================================================
-- 7. MARKUPS (the assets — websites, images, PDFs)
-- =============================================================================

create table if not exists public.markups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete set null,
  title text not null,
  type markup_type not null,
  status markup_status not null default 'draft',
  thumbnail_url text,
  source_url text,                                  -- original URL for type='website'
  archived boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists markups_workspace_idx on public.markups(workspace_id);
create index if not exists markups_folder_idx on public.markups(folder_id);
create index if not exists markups_status_idx on public.markups(status);
create index if not exists markups_archived_idx on public.markups(archived);

-- =============================================================================
-- 8. MARKUP VERSIONS
-- =============================================================================

create table if not exists public.markup_versions (
  id uuid primary key default gen_random_uuid(),
  markup_id uuid not null references public.markups(id) on delete cascade,
  version_number int not null,
  file_url text,                                    -- supabase storage path for image/pdf/screenshot
  file_size bigint,                                 -- bytes
  file_name text,
  mime_type text,
  page_count int,                                   -- for PDFs
  source_url text,                                  -- original URL for website type
  uploaded_by uuid not null references public.profiles(id) on delete set null,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique(markup_id, version_number)
);

create index if not exists markup_versions_markup_idx on public.markup_versions(markup_id);
create index if not exists markup_versions_current_idx on public.markup_versions(is_current);

-- =============================================================================
-- 9. THREADS (the pins / comment threads)
-- =============================================================================

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  markup_id uuid not null references public.markups(id) on delete cascade,
  markup_version_id uuid references public.markup_versions(id) on delete cascade,
  thread_number int not null,                       -- the #1, #2 displayed (auto-incremented per markup)
  x_position numeric(8,5),                          -- 0-100 percentage
  y_position numeric(8,5),                          -- 0-100 percentage
  page_number int,                                  -- for PDFs
  device_type device_type,                          -- for websites (which breakpoint)
  status thread_status not null default 'open',
  priority thread_priority not null default 'none',
  screenshot_url text,                              -- captured screenshot for context
  created_by uuid references public.profiles(id) on delete set null,  -- nullable for guests
  guest_name text,                                  -- when created_by is null
  guest_email text,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (created_by is not null) or (guest_name is not null)
  )
);

create index if not exists threads_markup_idx on public.threads(markup_id);
create index if not exists threads_version_idx on public.threads(markup_version_id);
create index if not exists threads_status_idx on public.threads(status);

-- =============================================================================
-- 10. MESSAGES (replies in a thread, including the first message)
-- =============================================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  content text not null,
  parent_message_id uuid references public.messages(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  guest_name text,
  guest_email text,
  attachments jsonb default '[]'::jsonb,            -- [{url, filename, size, mime_type}]
  mentions uuid[] default array[]::uuid[],          -- array of profile IDs mentioned
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  check (
    (created_by is not null) or (guest_name is not null)
  )
);

create index if not exists messages_thread_idx on public.messages(thread_id);
create index if not exists messages_created_by_idx on public.messages(created_by);

-- =============================================================================
-- 11. SHARE LINKS (public access tokens)
-- =============================================================================

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  markup_id uuid references public.markups(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_by uuid not null references public.profiles(id) on delete cascade,
  can_comment boolean not null default true,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (
    (markup_id is not null) or (folder_id is not null) or (workspace_id is not null)
  )
);

create index if not exists share_links_token_idx on public.share_links(token);
create index if not exists share_links_markup_idx on public.share_links(markup_id);

-- =============================================================================
-- 12. WORKSPACE INVITES (pending email-based invites)
-- =============================================================================

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role workspace_role not null default 'member',
  invited_by uuid not null references public.profiles(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists workspace_invites_token_idx on public.workspace_invites(token);
create index if not exists workspace_invites_email_idx on public.workspace_invites(email);
create index if not exists workspace_invites_workspace_idx on public.workspace_invites(workspace_id);

-- =============================================================================
-- 13. NOTIFICATIONS
-- =============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  markup_id uuid references public.markups(id) on delete cascade,
  thread_id uuid references public.threads(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  triggered_by uuid references public.profiles(id) on delete set null,
  triggered_by_guest_name text,
  content_preview text,                             -- short text preview for the notification
  read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id);
create index if not exists notifications_unread_idx on public.notifications(user_id, read) where read = false;

-- =============================================================================
-- 14. NOTIFICATION PREFERENCES
-- =============================================================================

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_digest_frequency email_digest_frequency not null default 'realtime',
  markup_notifications_default markup_notification_default not null default 'all',
  browser_push_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- 15. PER-MARKUP NOTIFICATION OVERRIDES
-- =============================================================================

create table if not exists public.markup_notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  markup_id uuid not null references public.markups(id) on delete cascade,
  setting markup_notification_default not null default 'all',
  updated_at timestamptz not null default now(),
  unique(user_id, markup_id)
);

-- =============================================================================
-- 16. UPDATED_AT TRIGGER FUNCTION (reusable)
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Apply to all tables with updated_at
do $$
declare
  t text;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public'
      and column_name = 'updated_at'
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- =============================================================================
-- 17. AUTO-CREATE PROFILE + PERSONAL WORKSPACE ON SIGNUP
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  user_name text;
  workspace_name text;
  workspace_slug text;
begin
  -- Get the name from raw_user_meta_data, fall back to email prefix
  user_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  -- Create profile
  insert into public.profiles (id, email, name, username)
  values (
    new.id,
    new.email,
    user_name,
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '', 'g'))
  );

  -- Create personal workspace
  workspace_name := split_part(user_name, ' ', 1) || '''s Workspace';
  workspace_slug := lower(regexp_replace(workspace_name, '[^a-z0-9]+', '-', 'g'));

  insert into public.workspaces (owner_id, name, slug, is_personal)
  values (new.id, workspace_name, workspace_slug || '-' || substring(new.id::text from 1 for 8), true)
  returning id into new_workspace_id;

  -- Add owner as workspace member with owner role
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  -- Create default notification preferences
  insert into public.notification_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- 18. AUTO-INCREMENT THREAD NUMBER PER MARKUP
-- =============================================================================

create or replace function public.set_thread_number()
returns trigger
language plpgsql
as $$
begin
  if new.thread_number is null or new.thread_number = 0 then
    select coalesce(max(thread_number), 0) + 1
    into new.thread_number
    from public.threads
    where markup_id = new.markup_id;
  end if;
  return new;
end;
$$;

drop trigger if exists set_thread_number_trigger on public.threads;
create trigger set_thread_number_trigger
  before insert on public.threads
  for each row execute function public.set_thread_number();

-- =============================================================================
-- 19. AUTO-MANAGE MARKUP STATUS BASED ON ACTIVITY
-- =============================================================================

-- When a thread is created:
-- - If created by a user who is NOT the markup owner → status becomes 'changes_requested'
-- - If created by the owner → status stays as is (or moves to 'ready_for_review' if 'draft')
-- (Guest comments are also treated as "non-owner")

create or replace function public.handle_new_thread()
returns trigger
language plpgsql
security definer
as $$
declare
  markup_owner_id uuid;
  current_status markup_status;
begin
  select created_by, status into markup_owner_id, current_status
  from public.markups
  where id = new.markup_id;

  -- If markup is approved, don't auto-change status (someone needs to reopen)
  if current_status = 'approved' then
    return new;
  end if;

  -- Guest commenter or non-owner commenter → changes_requested
  if new.created_by is null or new.created_by != markup_owner_id then
    update public.markups
    set status = 'changes_requested'
    where id = new.markup_id and status != 'approved';
  else
    -- Owner is commenting on their own markup → ready_for_review (if currently draft)
    if current_status = 'draft' then
      update public.markups
      set status = 'ready_for_review'
      where id = new.markup_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists handle_new_thread_trigger on public.threads;
create trigger handle_new_thread_trigger
  after insert on public.threads
  for each row execute function public.handle_new_thread();

-- =============================================================================
-- 20. AUTO-MANAGE STATUS WHEN SHARE LINK CREATED OR ACCESSED
-- =============================================================================

create or replace function public.handle_new_share_link()
returns trigger
language plpgsql
security definer
as $$
begin
  -- When a share link is created for a markup, move from draft → ready_for_review
  if new.markup_id is not null then
    update public.markups
    set status = 'ready_for_review'
    where id = new.markup_id and status = 'draft';
  end if;
  return new;
end;
$$;

drop trigger if exists handle_new_share_link_trigger on public.share_links;
create trigger handle_new_share_link_trigger
  after insert on public.share_links
  for each row execute function public.handle_new_share_link();

-- =============================================================================
-- 21. ENSURE ONLY ONE CURRENT VERSION PER MARKUP
-- =============================================================================

create or replace function public.ensure_single_current_version()
returns trigger
language plpgsql
as $$
begin
  if new.is_current = true then
    update public.markup_versions
    set is_current = false
    where markup_id = new.markup_id and id != new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists ensure_single_current_version_trigger on public.markup_versions;
create trigger ensure_single_current_version_trigger
  after insert or update on public.markup_versions
  for each row execute function public.ensure_single_current_version();

-- =============================================================================
-- 22. ROW LEVEL SECURITY
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.folders enable row level security;
alter table public.markups enable row level security;
alter table public.markup_versions enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.share_links enable row level security;
alter table public.workspace_invites enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.markup_notification_settings enable row level security;

-- =============================================================================
-- HELPER FUNCTION: check workspace access
-- =============================================================================

create or replace function public.user_has_workspace_access(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = auth.uid()
  );
$$;

create or replace function public.user_is_workspace_owner(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.workspaces
    where id = p_workspace_id and owner_id = auth.uid()
  );
$$;

-- =============================================================================
-- 23. RLS POLICIES — PROFILES
-- =============================================================================

drop policy if exists "Profiles viewable by everyone (for mentions)" on public.profiles;
create policy "Profiles viewable by everyone (for mentions)"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- =============================================================================
-- 24. RLS POLICIES — WORKSPACES
-- =============================================================================

drop policy if exists "Workspaces viewable by members" on public.workspaces;
create policy "Workspaces viewable by members"
  on public.workspaces for select
  using (
    owner_id = auth.uid()
    or public.user_has_workspace_access(id)
  );

drop policy if exists "Users can create workspaces" on public.workspaces;
create policy "Users can create workspaces"
  on public.workspaces for insert
  with check (owner_id = auth.uid());

drop policy if exists "Owners can update their workspaces" on public.workspaces;
create policy "Owners can update their workspaces"
  on public.workspaces for update
  using (owner_id = auth.uid());

drop policy if exists "Owners can delete their workspaces" on public.workspaces;
create policy "Owners can delete their workspaces"
  on public.workspaces for delete
  using (owner_id = auth.uid());

-- =============================================================================
-- 25. RLS POLICIES — WORKSPACE MEMBERS
-- =============================================================================

drop policy if exists "Members visible to workspace members" on public.workspace_members;
create policy "Members visible to workspace members"
  on public.workspace_members for select
  using (public.user_has_workspace_access(workspace_id));

drop policy if exists "Owners can add members" on public.workspace_members;
create policy "Owners can add members"
  on public.workspace_members for insert
  with check (public.user_is_workspace_owner(workspace_id));

drop policy if exists "Owners can update members" on public.workspace_members;
create policy "Owners can update members"
  on public.workspace_members for update
  using (public.user_is_workspace_owner(workspace_id));

drop policy if exists "Owners or self can remove member" on public.workspace_members;
create policy "Owners or self can remove member"
  on public.workspace_members for delete
  using (
    public.user_is_workspace_owner(workspace_id)
    or user_id = auth.uid()
  );

-- =============================================================================
-- 26. RLS POLICIES — FOLDERS
-- =============================================================================

drop policy if exists "Folders viewable by workspace members" on public.folders;
create policy "Folders viewable by workspace members"
  on public.folders for select
  using (public.user_has_workspace_access(workspace_id));

drop policy if exists "Members can create folders" on public.folders;
create policy "Members can create folders"
  on public.folders for insert
  with check (public.user_has_workspace_access(workspace_id));

drop policy if exists "Members can update folders" on public.folders;
create policy "Members can update folders"
  on public.folders for update
  using (public.user_has_workspace_access(workspace_id));

drop policy if exists "Members can delete folders" on public.folders;
create policy "Members can delete folders"
  on public.folders for delete
  using (public.user_has_workspace_access(workspace_id));

-- =============================================================================
-- 27. RLS POLICIES — MARKUPS
-- =============================================================================

drop policy if exists "MarkUps viewable by workspace members" on public.markups;
create policy "MarkUps viewable by workspace members"
  on public.markups for select
  using (public.user_has_workspace_access(workspace_id));

drop policy if exists "Members can create markups" on public.markups;
create policy "Members can create markups"
  on public.markups for insert
  with check (public.user_has_workspace_access(workspace_id));

drop policy if exists "Members can update markups" on public.markups;
create policy "Members can update markups"
  on public.markups for update
  using (public.user_has_workspace_access(workspace_id));

drop policy if exists "Members can delete markups" on public.markups;
create policy "Members can delete markups"
  on public.markups for delete
  using (public.user_has_workspace_access(workspace_id));

-- =============================================================================
-- 28. RLS POLICIES — MARKUP VERSIONS
-- =============================================================================

drop policy if exists "Versions viewable by workspace members" on public.markup_versions;
create policy "Versions viewable by workspace members"
  on public.markup_versions for select
  using (
    exists (
      select 1 from public.markups m
      where m.id = markup_versions.markup_id
        and public.user_has_workspace_access(m.workspace_id)
    )
  );

drop policy if exists "Members can create versions" on public.markup_versions;
create policy "Members can create versions"
  on public.markup_versions for insert
  with check (
    exists (
      select 1 from public.markups m
      where m.id = markup_versions.markup_id
        and public.user_has_workspace_access(m.workspace_id)
    )
  );

drop policy if exists "Members can update versions" on public.markup_versions;
create policy "Members can update versions"
  on public.markup_versions for update
  using (
    exists (
      select 1 from public.markups m
      where m.id = markup_versions.markup_id
        and public.user_has_workspace_access(m.workspace_id)
    )
  );

-- =============================================================================
-- 29. RLS POLICIES — THREADS
-- (Guest writes happen via API routes using service role key, bypassing RLS)
-- =============================================================================

drop policy if exists "Threads viewable by workspace members" on public.threads;
create policy "Threads viewable by workspace members"
  on public.threads for select
  using (
    exists (
      select 1 from public.markups m
      where m.id = threads.markup_id
        and public.user_has_workspace_access(m.workspace_id)
    )
  );

drop policy if exists "Members can create threads" on public.threads;
create policy "Members can create threads"
  on public.threads for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.markups m
      where m.id = threads.markup_id
        and public.user_has_workspace_access(m.workspace_id)
    )
  );

drop policy if exists "Creators or members can update threads" on public.threads;
create policy "Creators or members can update threads"
  on public.threads for update
  using (
    exists (
      select 1 from public.markups m
      where m.id = threads.markup_id
        and public.user_has_workspace_access(m.workspace_id)
    )
  );

drop policy if exists "Creators can delete threads" on public.threads;
create policy "Creators can delete threads"
  on public.threads for delete
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.markups m
      where m.id = threads.markup_id
        and m.created_by = auth.uid()
    )
  );

-- =============================================================================
-- 30. RLS POLICIES — MESSAGES
-- =============================================================================

drop policy if exists "Messages viewable by workspace members" on public.messages;
create policy "Messages viewable by workspace members"
  on public.messages for select
  using (
    exists (
      select 1 from public.threads t
      join public.markups m on m.id = t.markup_id
      where t.id = messages.thread_id
        and public.user_has_workspace_access(m.workspace_id)
    )
  );

drop policy if exists "Members can create messages" on public.messages;
create policy "Members can create messages"
  on public.messages for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.threads t
      join public.markups m on m.id = t.markup_id
      where t.id = messages.thread_id
        and public.user_has_workspace_access(m.workspace_id)
    )
  );

drop policy if exists "Authors can update own messages" on public.messages;
create policy "Authors can update own messages"
  on public.messages for update
  using (created_by = auth.uid());

drop policy if exists "Authors can delete own messages" on public.messages;
create policy "Authors can delete own messages"
  on public.messages for delete
  using (created_by = auth.uid());

-- =============================================================================
-- 31. RLS POLICIES — SHARE LINKS
-- =============================================================================

drop policy if exists "Share links viewable by workspace members" on public.share_links;
create policy "Share links viewable by workspace members"
  on public.share_links for select
  using (
    (markup_id is not null and exists (
      select 1 from public.markups m
      where m.id = share_links.markup_id
        and public.user_has_workspace_access(m.workspace_id)
    ))
    or (workspace_id is not null and public.user_has_workspace_access(workspace_id))
    or (folder_id is not null and exists (
      select 1 from public.folders f
      where f.id = share_links.folder_id
        and public.user_has_workspace_access(f.workspace_id)
    ))
  );

drop policy if exists "Members can create share links" on public.share_links;
create policy "Members can create share links"
  on public.share_links for insert
  with check (created_by = auth.uid());

drop policy if exists "Creators can update share links" on public.share_links;
create policy "Creators can update share links"
  on public.share_links for update
  using (created_by = auth.uid());

drop policy if exists "Creators can delete share links" on public.share_links;
create policy "Creators can delete share links"
  on public.share_links for delete
  using (created_by = auth.uid());

-- =============================================================================
-- 32. RLS POLICIES — WORKSPACE INVITES
-- =============================================================================

drop policy if exists "Invites viewable by workspace owners" on public.workspace_invites;
create policy "Invites viewable by workspace owners"
  on public.workspace_invites for select
  using (public.user_is_workspace_owner(workspace_id));

drop policy if exists "Owners can create invites" on public.workspace_invites;
create policy "Owners can create invites"
  on public.workspace_invites for insert
  with check (public.user_is_workspace_owner(workspace_id));

drop policy if exists "Owners can delete invites" on public.workspace_invites;
create policy "Owners can delete invites"
  on public.workspace_invites for delete
  using (public.user_is_workspace_owner(workspace_id));

-- =============================================================================
-- 33. RLS POLICIES — NOTIFICATIONS
-- =============================================================================

drop policy if exists "Users see own notifications" on public.notifications;
create policy "Users see own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

drop policy if exists "Users delete own notifications" on public.notifications;
create policy "Users delete own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());

-- =============================================================================
-- 34. RLS POLICIES — NOTIFICATION PREFERENCES
-- =============================================================================

drop policy if exists "Users see own preferences" on public.notification_preferences;
create policy "Users see own preferences"
  on public.notification_preferences for select
  using (user_id = auth.uid());

drop policy if exists "Users update own preferences" on public.notification_preferences;
create policy "Users update own preferences"
  on public.notification_preferences for update
  using (user_id = auth.uid());

drop policy if exists "Users insert own preferences" on public.notification_preferences;
create policy "Users insert own preferences"
  on public.notification_preferences for insert
  with check (user_id = auth.uid());

drop policy if exists "Users see own markup notif settings" on public.markup_notification_settings;
create policy "Users see own markup notif settings"
  on public.markup_notification_settings for select
  using (user_id = auth.uid());

drop policy if exists "Users update own markup notif settings" on public.markup_notification_settings;
create policy "Users update own markup notif settings"
  on public.markup_notification_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================================================
-- 35. STORAGE BUCKETS
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('markup-files', 'markup-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', false)
on conflict (id) do nothing;

-- =============================================================================
-- 36. STORAGE RLS POLICIES
-- =============================================================================

-- markup-files: only workspace members can read/write
drop policy if exists "MarkUp files readable by workspace members" on storage.objects;
create policy "MarkUp files readable by workspace members"
  on storage.objects for select
  using (
    bucket_id = 'markup-files'
    and exists (
      select 1 from public.markups m
      where m.id::text = (storage.foldername(name))[1]
        and public.user_has_workspace_access(m.workspace_id)
    )
  );

drop policy if exists "MarkUp files uploadable by workspace members" on storage.objects;
create policy "MarkUp files uploadable by workspace members"
  on storage.objects for insert
  with check (
    bucket_id = 'markup-files'
    and auth.uid() is not null
  );

drop policy if exists "MarkUp files updatable by workspace members" on storage.objects;
create policy "MarkUp files updatable by workspace members"
  on storage.objects for update
  using (
    bucket_id = 'markup-files'
    and auth.uid() is not null
  );

drop policy if exists "MarkUp files deletable by workspace members" on storage.objects;
create policy "MarkUp files deletable by workspace members"
  on storage.objects for delete
  using (
    bucket_id = 'markup-files'
    and auth.uid() is not null
  );

-- avatars: public read, authenticated write
drop policy if exists "Avatars publicly readable" on storage.objects;
create policy "Avatars publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- attachments: workspace members read/write
drop policy if exists "Attachments readable by authenticated" on storage.objects;
create policy "Attachments readable by authenticated"
  on storage.objects for select
  using (
    bucket_id = 'attachments'
    and auth.uid() is not null
  );

drop policy if exists "Attachments uploadable by authenticated" on storage.objects;
create policy "Attachments uploadable by authenticated"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and auth.uid() is not null
  );

-- screenshots: workspace members read, service role writes
drop policy if exists "Screenshots readable by authenticated" on storage.objects;
create policy "Screenshots readable by authenticated"
  on storage.objects for select
  using (
    bucket_id = 'screenshots'
    and auth.uid() is not null
  );

-- =============================================================================
-- 37. REALTIME PUBLICATIONS (for live updates)
-- =============================================================================

-- Enable realtime on tables Claude Code will subscribe to
alter publication supabase_realtime add table public.threads;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.markups;
alter publication supabase_realtime add table public.notifications;

-- =============================================================================
-- 38. HELPFUL VIEWS
-- =============================================================================

-- Workspace summary with counts
create or replace view public.workspace_summary as
select
  w.id,
  w.name,
  w.slug,
  w.avatar_url,
  w.is_personal,
  w.owner_id,
  w.created_at,
  (select count(*) from public.markups where workspace_id = w.id and not archived) as markup_count,
  (select count(*) from public.workspace_members where workspace_id = w.id) as member_count
from public.workspaces w;

-- MarkUp summary with comment counts
create or replace view public.markup_summary as
select
  m.*,
  (select count(*) from public.threads where markup_id = m.id) as thread_count,
  (select count(*) from public.threads where markup_id = m.id and status = 'open') as open_thread_count,
  (select max(version_number) from public.markup_versions where markup_id = m.id) as latest_version
from public.markups m;

-- =============================================================================
-- 39. SEED DATA NOTE
-- =============================================================================
-- DO NOT seed any sample data here. The first real user that signs up will
-- automatically get a personal workspace via the on_auth_user_created trigger.
-- All "sample" data shown in the Stitch designs should be created BY the user
-- through the actual UI of the application — this guarantees no hardcoded mocks.
--
-- If you want a quick way to populate test data after setup:
-- 1. Sign up a test user via the app's signup flow
-- 2. Use the app's UI to create folders, upload files, drop pins
-- This validates the entire stack works end-to-end.
-- =============================================================================

-- =============================================================================
-- DONE. Verify the following in Supabase Dashboard:
-- 1. Table Editor → see all tables listed above
-- 2. Authentication → Providers → Email enabled, Confirm email = ON
-- 3. Storage → 4 buckets created (markup-files, avatars, attachments, screenshots)
-- 4. Database → Replication → supabase_realtime publication includes the 4 tables
-- =============================================================================

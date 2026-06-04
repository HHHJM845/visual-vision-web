-- P0 production schema for admin review, delivery confirmation and dispute handling.
-- Run this after auth-schema.sql in the Supabase SQL editor.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('aigcer', 'client', 'admin'));

alter table public.profiles
  drop constraint if exists profiles_verification_status_check;

alter table public.profiles
  add constraint profiles_verification_status_check
  check (verification_status in ('none', 'pending', 'verified', 'rejected', 'needs_changes'));

alter table public.profiles
  add column if not exists admin_role text check (admin_role in ('super_admin', 'operator'));

alter table public.commissions
  drop constraint if exists commissions_status_check;

alter table public.commissions
  add constraint commissions_status_check check (status in ('pending_review', 'open', 'closed'));

create table if not exists public.project_progress (
  commission_id bigint primary key references public.commissions(id) on delete cascade,
  current_stage text not null default 'script',
  stage_status text not null default 'waiting_aigcer'
    check (stage_status in ('waiting_aigcer', 'waiting_owner', 'completed')),
  active_delivery_id text,
  revision_count integer not null default 0,
  submitted_at timestamptz,
  confirmed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.project_deliverables (
  id text primary key default gen_random_uuid()::text,
  commission_id bigint not null references public.commissions(id) on delete cascade,
  stage_id text not null,
  stage_label text not null,
  version integer not null default 1,
  title text not null,
  description text not null,
  file_name text,
  file_url text,
  submitted_by_id text not null,
  submitted_by_name text not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'changes_requested', 'confirmed')),
  feedback text,
  confirmed_by_id text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_disputes (
  id text primary key default gen_random_uuid()::text,
  commission_id bigint not null references public.commissions(id) on delete cascade,
  commission_title text not null,
  stage_id text,
  stage_label text,
  applicant_id text,
  applicant_name text,
  reporter_id text not null,
  reporter_name text not null,
  reason text not null,
  expectation text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.escrow_plans (
  id text primary key default gen_random_uuid()::text,
  commission_id bigint not null references public.commissions(id) on delete cascade,
  total_amount numeric not null check (total_amount > 0),
  currency text not null default 'CNY',
  status text not null default 'draft' check (status in ('draft', 'funded', 'completed')),
  released_amount numeric not null default 0,
  created_by_id text not null,
  funded_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.escrow_milestones (
  id text primary key default gen_random_uuid()::text,
  plan_id text not null references public.escrow_plans(id) on delete cascade,
  commission_id bigint not null references public.commissions(id) on delete cascade,
  stage_id text not null,
  stage_label text not null,
  percent numeric not null check (percent >= 0),
  amount numeric not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'released')),
  released_at timestamptz
);

create table if not exists public.escrow_releases (
  id text primary key default gen_random_uuid()::text,
  plan_id text not null references public.escrow_plans(id) on delete cascade,
  commission_id bigint not null references public.commissions(id) on delete cascade,
  milestone_id text not null references public.escrow_milestones(id) on delete cascade,
  stage_id text not null,
  stage_label text not null,
  amount numeric not null check (amount >= 0),
  released_by_id text not null,
  released_to_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_contracts (
  id text primary key default gen_random_uuid()::text,
  commission_id bigint not null references public.commissions(id) on delete cascade,
  commission_title text not null,
  client_id text not null,
  client_name text not null,
  aigcer_id text not null,
  aigcer_name text not null,
  budget_text text not null,
  delivery_format text not null,
  milestone_summary text not null,
  escrow_summary text not null,
  terms text not null,
  status text not null default 'draft'
    check (status in ('draft', 'client_signed', 'aigcer_signed', 'active')),
  client_signed_at timestamptz,
  aigcer_signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (commission_id)
);

create table if not exists public.admin_audit_logs (
  id text primary key default gen_random_uuid()::text,
  review_id text not null,
  review_title text not null,
  type text not null,
  action text not null,
  operator_id text not null,
  operator_name text not null,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists project_deliverables_commission_idx on public.project_deliverables(commission_id);
create index if not exists project_deliverables_stage_idx on public.project_deliverables(commission_id, stage_id);
create index if not exists project_disputes_commission_idx on public.project_disputes(commission_id);
create index if not exists project_disputes_status_idx on public.project_disputes(status);
create index if not exists escrow_plans_commission_idx on public.escrow_plans(commission_id);
create index if not exists escrow_milestones_plan_idx on public.escrow_milestones(plan_id);
create index if not exists escrow_milestones_commission_stage_idx on public.escrow_milestones(commission_id, stage_id);
create index if not exists escrow_releases_plan_idx on public.escrow_releases(plan_id);
create index if not exists escrow_releases_commission_idx on public.escrow_releases(commission_id);
create index if not exists project_contracts_commission_idx on public.project_contracts(commission_id);
create index if not exists project_contracts_status_idx on public.project_contracts(status);
create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs(created_at desc);

drop trigger if exists project_progress_set_updated_at on public.project_progress;
create trigger project_progress_set_updated_at
before update on public.project_progress
for each row execute function public.set_updated_at();

drop trigger if exists project_deliverables_set_updated_at on public.project_deliverables;
create trigger project_deliverables_set_updated_at
before update on public.project_deliverables
for each row execute function public.set_updated_at();

drop trigger if exists project_disputes_set_updated_at on public.project_disputes;
create trigger project_disputes_set_updated_at
before update on public.project_disputes
for each row execute function public.set_updated_at();

drop trigger if exists escrow_plans_set_updated_at on public.escrow_plans;
create trigger escrow_plans_set_updated_at
before update on public.escrow_plans
for each row execute function public.set_updated_at();

drop trigger if exists project_contracts_set_updated_at on public.project_contracts;
create trigger project_contracts_set_updated_at
before update on public.project_contracts
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('project-deliverables', 'project-deliverables', true)
on conflict (id) do update set public = excluded.public;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and admin_role in ('super_admin', 'operator')
  );
$$;

alter table public.project_progress enable row level security;
alter table public.project_deliverables enable row level security;
alter table public.project_disputes enable row level security;
alter table public.escrow_plans enable row level security;
alter table public.escrow_milestones enable row level security;
alter table public.escrow_releases enable row level security;
alter table public.project_contracts enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "Project progress visible to project parties" on public.project_progress;
create policy "Project progress visible to project parties"
on public.project_progress for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    left join public.applications a on a.commission_id = c.id and a.status = 'accepted'
    where c.id = project_progress.commission_id
      and (c.author_id = auth.uid()::text or a.aigcer_id = auth.uid()::text)
  )
);

drop policy if exists "Project parties manage progress" on public.project_progress;
create policy "Project parties manage progress"
on public.project_progress for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    left join public.applications a on a.commission_id = c.id and a.status = 'accepted'
    where c.id = project_progress.commission_id
      and (c.author_id = auth.uid()::text or a.aigcer_id = auth.uid()::text)
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    left join public.applications a on a.commission_id = c.id and a.status = 'accepted'
    where c.id = project_progress.commission_id
      and (c.author_id = auth.uid()::text or a.aigcer_id = auth.uid()::text)
  )
);

drop policy if exists "Project parties read deliverables" on public.project_deliverables;
create policy "Project parties read deliverables"
on public.project_deliverables for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    left join public.applications a on a.commission_id = c.id and a.status = 'accepted'
    where c.id = project_deliverables.commission_id
      and (c.author_id = auth.uid()::text or a.aigcer_id = auth.uid()::text)
  )
);

drop policy if exists "Accepted creator submits deliverables" on public.project_deliverables;
create policy "Accepted creator submits deliverables"
on public.project_deliverables for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1 from public.applications a
    where a.commission_id = project_deliverables.commission_id
      and a.aigcer_id = auth.uid()::text
      and a.status = 'accepted'
  )
);

drop policy if exists "Project owner updates deliverables" on public.project_deliverables;
create policy "Project owner updates deliverables"
on public.project_deliverables for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    where c.id = project_deliverables.commission_id
      and c.author_id = auth.uid()::text
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    where c.id = project_deliverables.commission_id
      and c.author_id = auth.uid()::text
  )
);

drop policy if exists "Project parties create disputes" on public.project_disputes;
create policy "Project parties create disputes"
on public.project_disputes for insert
to authenticated
with check (
  reporter_id = auth.uid()::text
  and exists (
    select 1 from public.commissions c
    left join public.applications a on a.commission_id = c.id and a.status = 'accepted'
    where c.id = project_disputes.commission_id
      and (c.author_id = auth.uid()::text or a.aigcer_id = auth.uid()::text)
  )
);

drop policy if exists "Project parties and admins read disputes" on public.project_disputes;
create policy "Project parties and admins read disputes"
on public.project_disputes for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    left join public.applications a on a.commission_id = c.id and a.status = 'accepted'
    where c.id = project_disputes.commission_id
      and (c.author_id = auth.uid()::text or a.aigcer_id = auth.uid()::text)
  )
);

drop policy if exists "Admins manage disputes" on public.project_disputes;
create policy "Admins manage disputes"
on public.project_disputes for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Project parties read escrow plans" on public.escrow_plans;
create policy "Project parties read escrow plans"
on public.escrow_plans for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    left join public.applications a on a.commission_id = c.id and a.status = 'accepted'
    where c.id = escrow_plans.commission_id
      and (c.author_id = auth.uid()::text or a.aigcer_id = auth.uid()::text)
  )
);

drop policy if exists "Project owners manage escrow plans" on public.escrow_plans;
create policy "Project owners manage escrow plans"
on public.escrow_plans for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    where c.id = escrow_plans.commission_id
      and c.author_id = auth.uid()::text
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    where c.id = escrow_plans.commission_id
      and c.author_id = auth.uid()::text
  )
);

drop policy if exists "Project parties read escrow milestones" on public.escrow_milestones;
create policy "Project parties read escrow milestones"
on public.escrow_milestones for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    left join public.applications a on a.commission_id = c.id and a.status = 'accepted'
    where c.id = escrow_milestones.commission_id
      and (c.author_id = auth.uid()::text or a.aigcer_id = auth.uid()::text)
  )
);

drop policy if exists "Project owners manage escrow milestones" on public.escrow_milestones;
create policy "Project owners manage escrow milestones"
on public.escrow_milestones for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    where c.id = escrow_milestones.commission_id
      and c.author_id = auth.uid()::text
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    where c.id = escrow_milestones.commission_id
      and c.author_id = auth.uid()::text
  )
);

drop policy if exists "Project parties read escrow releases" on public.escrow_releases;
create policy "Project parties read escrow releases"
on public.escrow_releases for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    left join public.applications a on a.commission_id = c.id and a.status = 'accepted'
    where c.id = escrow_releases.commission_id
      and (c.author_id = auth.uid()::text or a.aigcer_id = auth.uid()::text)
  )
);

drop policy if exists "Project owners create escrow releases" on public.escrow_releases;
create policy "Project owners create escrow releases"
on public.escrow_releases for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    where c.id = escrow_releases.commission_id
      and c.author_id = auth.uid()::text
  )
);

drop policy if exists "Project parties read contracts" on public.project_contracts;
create policy "Project parties read contracts"
on public.project_contracts for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    left join public.applications a on a.commission_id = c.id and a.status = 'accepted'
    where c.id = project_contracts.commission_id
      and (c.author_id = auth.uid()::text or a.aigcer_id = auth.uid()::text)
  )
);

drop policy if exists "Project parties manage contracts" on public.project_contracts;
create policy "Project parties manage contracts"
on public.project_contracts for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    left join public.applications a on a.commission_id = c.id and a.status = 'accepted'
    where c.id = project_contracts.commission_id
      and (c.author_id = auth.uid()::text or a.aigcer_id = auth.uid()::text)
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.commissions c
    left join public.applications a on a.commission_id = c.id and a.status = 'accepted'
    where c.id = project_contracts.commission_id
      and (c.author_id = auth.uid()::text or a.aigcer_id = auth.uid()::text)
  )
);

drop policy if exists "Admins read audit logs" on public.admin_audit_logs;
create policy "Admins read audit logs"
on public.admin_audit_logs for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins create audit logs" on public.admin_audit_logs;
create policy "Admins create audit logs"
on public.admin_audit_logs for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Deliverable files are public" on storage.objects;
create policy "Deliverable files are public"
on storage.objects for select
to public
using (bucket_id = 'project-deliverables');

drop policy if exists "Project parties upload deliverable files" on storage.objects;
create policy "Project parties upload deliverable files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'project-deliverables');

-- Production admin bootstrap:
-- 1. Create the admin user in Supabase Auth.
-- 2. Update their profile row:
--    update public.profiles set role = 'admin', admin_role = 'super_admin', verification_status = 'verified' where email = 'your-admin@example.com';

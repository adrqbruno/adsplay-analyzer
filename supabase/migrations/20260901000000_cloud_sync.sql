-- Adsplay Analyzer — sync opcional para a nuvem (time compartilhado).
--
-- Espelha as tabelas locais do Dexie (clients/uploads/analyses). O app
-- continua local-first por padrão; isso só é usado quando o usuário aciona
-- "Sincronizar" explicitamente na aba Backup. IDs são os mesmos UUIDs
-- gerados localmente (crypto.randomUUID()), então sync é sempre um upsert
-- por id — sem tabela de mapeamento.
--
-- Modelo de acesso: qualquer usuário autenticado do projeto (time da AdRoq)
-- lê/escreve tudo — não há isolamento por usuário nesta primeira versão.

create table public.clients (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  settings jsonb,
  synced_at timestamptz not null default now(),
  synced_by uuid references auth.users (id)
);

create table public.uploads (
  id uuid primary key,
  client_id uuid not null references public.clients (id) on delete cascade,
  file_name text not null,
  uploaded_at timestamptz not null,
  headers jsonb not null,
  column_map jsonb not null,
  row_count integer not null,
  raw_rows jsonb not null,
  synced_at timestamptz not null default now(),
  synced_by uuid references auth.users (id)
);

create table public.analyses (
  id uuid primary key,
  client_id uuid not null references public.clients (id) on delete cascade,
  upload_id uuid not null references public.uploads (id) on delete cascade,
  file_name text not null,
  created_at timestamptz not null,
  params jsonb not null,
  account_metrics jsonb not null,
  campaign_count integer not null,
  findings jsonb not null,
  waste_info jsonb not null,
  synced_at timestamptz not null default now(),
  synced_by uuid references auth.users (id)
);

create index uploads_client_id_idx on public.uploads (client_id);
create index analyses_client_id_idx on public.analyses (client_id);
create index analyses_upload_id_idx on public.analyses (upload_id);

alter table public.clients enable row level security;
alter table public.uploads enable row level security;
alter table public.analyses enable row level security;

create policy "authenticated full access" on public.clients
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on public.uploads
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on public.analyses
  for all to authenticated using (true) with check (true);

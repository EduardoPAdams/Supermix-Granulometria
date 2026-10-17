-- Tabela do módulo Visita Surpresa (rodar uma vez no SQL Editor do Supabase)
create table public.visitas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  filial text not null,
  nf text not null,
  motorista text,
  cliente text,
  laboratorista text,
  slump_nf text,
  slump_obtido text,
  agua_retida numeric,
  agua_central numeric,
  agua_obra numeric,
  anomalias text[] not null default '{}',
  outros text,
  acoes text[] not null default '{}',
  obs text,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index visitas_data_idx on public.visitas (data desc);

alter table public.visitas enable row level security;

create policy "ler" on public.visitas for select to authenticated using (true);
create policy "inserir" on public.visitas for insert to authenticated with check (true);
create policy "editar" on public.visitas for update to authenticated using (true) with check (true);
create policy "apagar" on public.visitas for delete to authenticated using (true);

-- SE A TABELA JÁ FOI CRIADA ANTES, rode só esta linha:
-- alter table public.visitas add column if not exists agua_retida numeric, add column if not exists laboratorista text;

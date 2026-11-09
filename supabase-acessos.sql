-- ═══════════════════════════════════════════════════════════════════
-- CONTROLE DE ACESSOS (rodar uma vez no SQL Editor do Supabase)
-- Pode rodar de novo sem problema: o script é "re-executável".
--
-- Como funciona:
--  • O admin é o login lab.adm@supermix.com: acesso total + painel de acessos.
--  • Cada login tem uma linha em `perfis`:
--      modulos = módulos que ele pode VER    (ex.: {granulometria, visita})
--      edicao  = módulos que ele pode EDITAR (ex.: {granulometria})
--    Quem está em `modulos` mas não em `edicao` fica "só leitura".
--  • Visita Surpresa: cada login vê só as visitas que ele lançou; o admin vê todas.
--    Granulometria continua compartilhada (um registro por dia pro laboratório).
--  • Quem bloqueia de verdade é o RLS: sem o módulo liberado, o banco
--    não deixa ler nem gravar, mesmo que alguém mexa no site.
-- ═══════════════════════════════════════════════════════════════════

-- 1) Tabela de perfis (uma linha por login)
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nome text,
  modulos text[] not null default '{}',
  edicao text[] not null default '{}',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- (se a tabela já existia de uma versão anterior, garante a coluna nova)
alter table public.perfis add column if not exists edicao text[] not null default '{}';

-- 2) Funções de checagem (security definer = rodam com permissão do dono,
--    pra poder olhar auth.users e perfis sem esbarrar no próprio RLS)
create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid() and lower(email) = 'lab.adm@supermix.com'
  )
$$;

create or replace function public.tem_modulo(m text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.eh_admin() or exists (
    select 1 from public.perfis where id = auth.uid() and m = any(modulos)
  )
$$;

create or replace function public.pode_editar(m text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.eh_admin() or exists (
    select 1 from public.perfis where id = auth.uid() and m = any(modulos) and m = any(edicao)
  )
$$;

-- 3) Todo login novo criado no Supabase ganha um perfil SEM acesso nenhum.
--    O admin libera os módulos pelo painel.
create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, email) values (new.id, lower(new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil();

-- 4) Logins que JÁ existem: entram com os dois módulos liberados (ver e editar),
--    pra ninguém perder acesso de repente. Depois o admin ajusta no painel.
insert into public.perfis (id, email, modulos, edicao)
select id, lower(email), array['granulometria', 'visita'], array['granulometria', 'visita'] from auth.users
on conflict (id) do nothing;

-- 5) RLS da tabela perfis: cada um lê o próprio; admin lê e edita todos
alter table public.perfis enable row level security;
drop policy if exists "perfis_ler" on public.perfis;
drop policy if exists "perfis_editar" on public.perfis;
create policy "perfis_ler" on public.perfis for select to authenticated
  using (id = auth.uid() or public.eh_admin());
create policy "perfis_editar" on public.perfis for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- 6) Troca as regras antigas ("qualquer logado pode tudo") pelas novas:
--    ler = módulo liberado; inserir/editar/apagar = módulo liberado pra edição
do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('registros', 'visitas')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

alter table public.registros enable row level security;
alter table public.visitas enable row level security;

create policy "granulometria_ler"     on public.registros for select to authenticated using (public.tem_modulo('granulometria'));
create policy "granulometria_inserir" on public.registros for insert to authenticated with check (public.pode_editar('granulometria'));
create policy "granulometria_editar"  on public.registros for update to authenticated using (public.pode_editar('granulometria')) with check (public.pode_editar('granulometria'));
create policy "granulometria_apagar"  on public.registros for delete to authenticated using (public.pode_editar('granulometria'));

-- Visitas: cada login só vê, edita e apaga as visitas que ELE lançou (criado_por).
-- O admin vê e mexe em todas.
create policy "visita_ler" on public.visitas for select to authenticated
  using (public.tem_modulo('visita') and (criado_por = auth.uid() or public.eh_admin()));
create policy "visita_inserir" on public.visitas for insert to authenticated
  with check (public.pode_editar('visita') and (criado_por = auth.uid() or public.eh_admin()));
create policy "visita_editar" on public.visitas for update to authenticated
  using (public.pode_editar('visita') and (criado_por = auth.uid() or public.eh_admin()))
  with check (public.pode_editar('visita') and (criado_por = auth.uid() or public.eh_admin()));
create policy "visita_apagar" on public.visitas for delete to authenticated
  using (public.pode_editar('visita') and (criado_por = auth.uid() or public.eh_admin()));

/**
 * Acesso à tabela `perfis` no Supabase (controle de acessos).
 * Cada login tem uma linha: { id, email, nome, modulos, edicao }.
 *   modulos = o que pode ver; edicao = o que pode editar (sempre dentro de modulos).
 * O RLS deixa cada um ler o próprio perfil; só o admin lê e edita todos.
 */
import { supabase } from '../lib/supabase.js'

const TABLE = 'perfis'

// Permissões do usuário logado: { admin, modulos, edicao, nome }
export async function carregarAcesso(userId) {
  const [adm, perf] = await Promise.all([
    supabase.rpc('eh_admin'),
    supabase.from(TABLE).select('nome, modulos, edicao').eq('id', userId).maybeSingle(),
  ])
  if (adm.error) throw adm.error
  if (perf.error) throw perf.error
  return {
    admin: !!adm.data,
    modulos: perf.data?.modulos || [],
    edicao: perf.data?.edicao || [],
    nome: perf.data?.nome || '',
  }
}

// Lista todos os logins (só funciona para o admin)
export async function perfisListar() {
  const { data, error } = await supabase.from(TABLE).select('id, email, nome, modulos, edicao, criado_em').order('email')
  if (error) throw error
  return data
}

// Atualiza nome e permissões de um login (só o admin consegue)
export async function perfilSalvar(id, { nome, modulos, edicao }) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      nome: nome.trim() || null,
      modulos,
      edicao: edicao.filter((m) => modulos.includes(m)),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, email, nome, modulos, edicao, criado_em')
  if (error) throw error
  if (!data?.length) throw new Error('Sem permissão para alterar este login.')
  return data[0]
}

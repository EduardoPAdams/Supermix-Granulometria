/**
 * Acesso à tabela `visitas` no Supabase (módulo Visita Surpresa).
 * Uma linha por visita. O RLS só deixa usuários logados lerem/gravarem.
 */
import { supabase } from '../lib/supabase.js'

const TABLE = 'visitas'

// Lista as visitas (mais recentes primeiro). `mes` opcional no formato AAAA-MM.
export async function visitasListar(mes) {
  let q = supabase.from(TABLE).select('*').order('data', { ascending: false }).order('criado_em', { ascending: false })
  if (mes) {
    const [a, m] = mes.split('-').map(Number)
    const fim = new Date(a, m, 1) // primeiro dia do mês seguinte
    const fimStr = `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, '0')}-01`
    q = q.gte('data', `${mes}-01`).lt('data', fimStr)
  }
  const { data, error } = await q
  if (error) throw error
  return data
}

// Cria uma visita nova ou atualiza uma existente (quando `id` vem preenchido)
export async function visitaSalvar(visita) {
  const row = { ...visita, atualizado_em: new Date().toISOString() }
  if (row.id) {
    const { id, criado_em, criado_por, ...campos } = row
    const { error } = await supabase.from(TABLE).update(campos).eq('id', id)
    if (error) throw error
  } else {
    delete row.id
    const { error } = await supabase.from(TABLE).insert(row)
    if (error) throw error
  }
}

export async function visitaApagar(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

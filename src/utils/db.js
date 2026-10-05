/**
 * Acesso aos registros diários no Supabase (tabela `registros`).
 * Cada linha = um dia: { data: 'AAAA-MM-DD', dados: {...JSON do dia...} }.
 * Todas as funções são assíncronas e lançam erro se a requisição falhar.
 */
import { supabase } from '../lib/supabase.js'

const TABLE = 'registros'

// Lista todas as datas que têm registro, da mais recente para a mais antiga
export async function dbListDates() {
  const { data, error } = await supabase.from(TABLE).select('data').order('data', { ascending: false })
  if (error) throw error
  return data.map((r) => r.data)
}

// Busca o registro de um dia; retorna null se não existir
export async function dbGet(date) {
  const { data, error } = await supabase.from(TABLE).select('dados').eq('data', date).maybeSingle()
  if (error) throw error
  return data ? data.dados : null
}

// Busca vários dias de uma vez (desde uma data, opcional), em ordem crescente
export async function dbGetRecords(sinceDate) {
  let query = supabase.from(TABLE).select('data, dados').order('data', { ascending: true })
  if (sinceDate) query = query.gte('data', sinceDate)
  const { data, error } = await query
  if (error) throw error
  return data.map((r) => ({ date: r.data, data: r.dados }))
}

// Salva (cria ou substitui) o registro de um dia
export async function dbSet(date, dados) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ data: date, dados, atualizado_em: new Date().toISOString() }, { onConflict: 'data' })
  if (error) throw error
}

// Apaga o registro de um dia
export async function dbDel(date) {
  const { error } = await supabase.from(TABLE).delete().eq('data', date)
  if (error) throw error
}

// Envia vários registros de uma vez SEM sobrescrever dias que já existem na nuvem
export async function dbInsertMissing(records) {
  const rows = records.map((r) => ({ data: r.date, dados: r.data }))
  const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: 'data', ignoreDuplicates: true })
  if (error) throw error
}

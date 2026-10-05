/**
 * Cliente do Supabase (banco de dados em nuvem + login).
 * A chave "publishable" é pública por natureza: ela vai parar no JS do site de
 * qualquer jeito. Quem protege os dados é o RLS (Row Level Security) no banco,
 * que só deixa usuários logados lerem/gravarem.
 * NUNCA coloque aqui a chave "secret" / "service_role".
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pixwtfceuorutfquqmsy.supabase.co'
const SUPABASE_KEY = 'sb_publishable_1DMOe7Rlez_2gfhMXxE3fw_C9JZqceq'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

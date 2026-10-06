/**
 * Formatação de datas e números usados em todo o app.
 * Datas de registro são sempre strings 'AAAA-MM-DD' (mesmo formato do <input type="date">),
 * o que permite usá-las como chave de localStorage e ordená-las como texto.
 */

// Data de hoje no formato 'AAAA-MM-DD'
export function toDay() {
  return new Date().toISOString().split('T')[0]
}

// Converte 'AAAA-MM-DD' para exibição 'DD/MM/AAAA'
export function fmtD(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

// "Parse Float" tolerante: aceita vírgula decimal, texto vazio ou inválido vira 0
export function pf(value) {
  const n = parseFloat(String(value ?? '').replace(',', '.'))
  return isNaN(n) || n < 0 ? 0 : n
}

// Hora atual no formato 'HH:MM', usada para preencher o campo de hora da leitura de umidade
export function nowHHMM() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

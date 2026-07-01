export function toDay() {
  return new Date().toISOString().split('T')[0]
}

export function fmtD(s) {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export function pf(v) {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return isNaN(n) || n < 0 ? 0 : n
}

export function nowHHMM() {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

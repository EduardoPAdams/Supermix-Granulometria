import { MATS, MF_SIEVES } from '../data/materials.js'
import { pf } from './format.js'

export function emptyMat(m) {
  const masses = { fundo: '' }
  ;(m.sieves || []).forEach((s) => {
    masses[s] = ''
  })
  return { nf: '', placa: '', masses, pulvMf: '' }
}

export function emptyDay() {
  const o = { resp: '', filial: '', umidade: [] }
  MATS.forEach((m) => {
    o[m.id] = emptyMat(m)
  })
  return o
}

// Migra formato antigo {areia_fina:'402',areia_media:'405'} para array
export function migrateUmidade(u) {
  if (!u) return []
  if (Array.isArray(u)) return u.map((e) => (e.numero !== undefined ? e : { ...e, numero: 1 }))
  const r = []
  if (u.areia_media) r.push({ id: Date.now(), matId: 'areia_media', leitura: u.areia_media, hora: '', numero: 1 })
  if (u.areia_fina) r.push({ id: Date.now() + 1, matId: 'areia_fina', leitura: u.areia_fina, hora: '', numero: 1 })
  return r
}

export function calcMat(data, sieves) {
  const keys = [...sieves, 'fundo']
  const vals = keys.map((k) => pf(data?.masses?.[k]))
  const tot = vals.reduce((a, b) => a + b, 0)
  let cum = 0
  const rows = keys.map((k, i) => {
    const massa = vals[i]
    const pct = tot > 0 ? (massa / tot) * 100 : 0
    cum += pct
    return { key: k, label: k === 'fundo' ? 'Fundo' : `${k} mm`, massa, pct, cum, pass: Math.max(0, 100 - cum) }
  })
  const acumMap = {}
  rows.slice(0, sieves.length).forEach((r) => {
    acumMap[parseFloat(r.key)] = r.cum
  })
  const testedAsc = sieves.map(parseFloat).sort((a, b) => a - b)
  const smallest = testedAsc[0]
  const largest = testedAsc[testedAsc.length - 1]
  let mfSum = 0
  for (const std of MF_SIEVES) {
    if (std > largest) mfSum += 0
    else if (std <= smallest) mfSum += acumMap[smallest] || 0
    else {
      const next = testedAsc.find((s) => s >= std)
      mfSum += next !== undefined ? acumMap[next] || 0 : 0
    }
  }
  return { rows, tot, mf: parseFloat((mfSum / 100).toFixed(3)) }
}

export function pulvRes(mi, mfv) {
  const a = pf(mi)
  const b = pf(mfv)
  if (!a || !b) return null
  return ((a - b) / a) * 100
}

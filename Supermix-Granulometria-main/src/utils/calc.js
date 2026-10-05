/**
 * Cálculos do ensaio de granulometria (peneiramento) e do ensaio de material
 * pulverulento, seguindo a norma NBR NM 248 (composição granulométrica de
 * agregados e cálculo do Módulo de Finura).
 */

import { MATS, MF_SIEVES } from '../data/materials.js'
import { pf } from './format.js'

// Registro "vazio" de um material: sem nota fiscal/placa e uma massa em
// branco para cada peneira daquele material + o fundo.
export function emptyMat(material) {
  const masses = { fundo: '' }
  ;(material.sieves || []).forEach((sieve) => {
    masses[sieve] = ''
  })
  return { nf: '', placa: '', masses, pulvMf: '' }
}

// Registro "vazio" de um dia inteiro: um emptyMat() para cada material cadastrado
export function emptyDay() {
  const day = { resp: '', filial: '', umidade: [] }
  MATS.forEach((material) => {
    day[material.id] = emptyMat(material)
  })
  return day
}

// Migra o formato antigo de umidade — um objeto único {areia_fina:'402',areia_media:'405'} —
// para o formato atual: uma lista de leituras com hora e número de leitura.
export function migrateUmidade(umidade) {
  if (!umidade) return []
  if (Array.isArray(umidade)) return umidade.map((entry) => (entry.numero !== undefined ? entry : { ...entry, numero: 1 }))
  const entries = []
  if (umidade.areia_media) entries.push({ id: Date.now(), matId: 'areia_media', leitura: umidade.areia_media, hora: '', numero: 1 })
  if (umidade.areia_fina) entries.push({ id: Date.now() + 1, matId: 'areia_fina', leitura: umidade.areia_fina, hora: '', numero: 1 })
  return entries
}

/**
 * Calcula, para um material, a tabela de peneiramento (massa/% retida/% acumulada/
 * % passante por peneira) e o Módulo de Finura (MF).
 *
 * O MF é a soma das % retidas acumuladas nas peneiras da série normal
 * (MF_SIEVES), dividida por 100. Como cada material só é testado em um
 * subconjunto dessas peneiras, para cada peneira "padrão" ausente usamos o
 * valor acumulado da peneira testada mais próxima (a mesma regra da norma:
 * abaixo da menor peneira testada = 0% retido acumulado nela; acima da maior
 * = considera-se 100%; entre peneiras testadas, usa-se a peneira testada
 * imediatamente maior).
 */
export function calcMat(data, sieves) {
  const rowKeys = [...sieves, 'fundo']
  const masses = rowKeys.map((key) => pf(data?.masses?.[key]))
  const totalMass = masses.reduce((sum, m) => sum + m, 0)

  let cumulativePct = 0
  const rows = rowKeys.map((key, i) => {
    const massa = masses[i]
    const pct = totalMass > 0 ? (massa / totalMass) * 100 : 0
    cumulativePct += pct
    return { key, label: key === 'fundo' ? 'Fundo' : `${key} mm`, massa, pct, cum: cumulativePct, pass: Math.max(0, 100 - cumulativePct) }
  })

  // % acumulada retida em cada peneira testada, indexada pela abertura (em mm)
  const cumByOpening = {}
  rows.slice(0, sieves.length).forEach((row) => {
    cumByOpening[parseFloat(row.key)] = row.cum
  })

  const testedOpeningsAsc = sieves.map(parseFloat).sort((a, b) => a - b)
  const smallestTested = testedOpeningsAsc[0]
  const largestTested = testedOpeningsAsc[testedOpeningsAsc.length - 1]

  let sumOfCumPercents = 0
  for (const standardOpening of MF_SIEVES) {
    if (standardOpening > largestTested) sumOfCumPercents += 0
    else if (standardOpening <= smallestTested) sumOfCumPercents += cumByOpening[smallestTested] || 0
    else {
      const nextTestedUp = testedOpeningsAsc.find((opening) => opening >= standardOpening)
      sumOfCumPercents += nextTestedUp !== undefined ? cumByOpening[nextTestedUp] || 0 : 0
    }
  }

  return { rows, tot: totalMass, mf: parseFloat((sumOfCumPercents / 100).toFixed(3)) }
}

// % de material pulverulento (fino) perdido no ensaio: (massa inicial - massa final) / massa inicial.
// Retorna null enquanto MI ou MF ainda não foram preenchidos.
export function pulvRes(massaInicial, massaFinal) {
  const mi = pf(massaInicial)
  const mf = pf(massaFinal)
  if (!mi || !mf) return null
  return ((mi - mf) / mi) * 100
}

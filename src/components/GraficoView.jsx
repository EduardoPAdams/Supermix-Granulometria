/**
 * Aba "Gráfico": evolução do Módulo de Finura de um material nos últimos 30
 * dias, com a faixa aceitável destacada, além de médias e contagem de dias
 * fora da faixa. É um SVG desenhado manualmente (sem lib de gráficos).
 */
import { useEffect, useMemo, useState } from 'react'
import { MATS } from '../data/materials.js'
import { calcMat, pulvRes } from '../utils/calc.js'
import { dbGetRecords } from '../utils/db.js'
import { fmtD } from '../utils/format.js'

const DAYS = 30

/* Converte 'AAAA-MM-DD' em Date local (meio-dia, evita fuso) */
function toDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

function ddmm(s) {
  const [, m, d] = s.split('-')
  return `${d}/${m}`
}

export default function GraficoView() {
  const [selMat, setSelMat] = useState('areia_fina')

  /* Carrega da nuvem, uma única vez, os registros dos últimos 30 dias */
  const [records, setRecords] = useState([])
  useEffect(() => {
    const start = new Date()
    start.setDate(start.getDate() - (DAYS - 1))
    const pad = (n) => String(n).padStart(2, '0')
    const since = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
    dbGetRecords(since)
      .then((recs) => setRecords(recs.filter((r) => r.data)))
      .catch((err) => console.error(err))
  }, [])

  const mat = MATS.find((m) => m.id === selMat)

  const { points, pulvVals, avgMf, avgPulv, outCount } = useMemo(() => {
    const points = []
    const pulvVals = []
    for (const rec of records) {
      const md = rec.data[mat.id]
      if (!md) continue
      const c = calcMat(md, mat.sieves)
      if (c.tot > 0) {
        points.push({ date: rec.date, mf: c.mf, out: c.mf < mat.mfMin || c.mf > mat.mfMax })
      }
      const pv = pulvRes(mat.pulvMi, md.pulvMf)
      if (pv !== null) pulvVals.push(pv)
    }
    const avgMf = points.length ? points.reduce((a, p) => a + p.mf, 0) / points.length : null
    const avgPulv = pulvVals.length ? pulvVals.reduce((a, b) => a + b, 0) / pulvVals.length : null
    const outCount = points.filter((p) => p.out).length
    return { points, pulvVals, avgMf, avgPulv, outCount }
  }, [records, mat])

  /* ── Geometria do gráfico ── */
  const W = 700
  const H = 300
  const M = { top: 18, right: 16, bottom: 34, left: 46 }
  const iw = W - M.left - M.right
  const ih = H - M.top - M.bottom

  const start = new Date()
  start.setDate(start.getDate() - (DAYS - 1))
  start.setHours(0, 0, 0, 0)

  const xOf = (dateStr) => {
    const diff = Math.round((toDate(dateStr) - start) / 86400000)
    return M.left + (diff / (DAYS - 1)) * iw
  }

  const mfVals = points.map((p) => p.mf)
  let yMin = Math.min(mat.mfMin, ...(mfVals.length ? mfVals : [mat.mfMin]))
  let yMax = Math.max(mat.mfMax, ...(mfVals.length ? mfVals : [mat.mfMax]))
  const yPad = Math.max((yMax - yMin) * 0.25, 0.05)
  yMin -= yPad
  yMax += yPad
  const yOf = (v) => M.top + ih - ((v - yMin) / (yMax - yMin)) * ih

  /* Ticks do eixo Y (5 divisões) e X (a cada 5 dias) */
  const yTicks = Array.from({ length: 6 }, (_, i) => yMin + ((yMax - yMin) * i) / 5)
  const xTicks = []
  for (let i = 0; i < DAYS; i += 5) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    xTicks.push(s)
  }

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.date).toFixed(1)},${yOf(p.mf).toFixed(1)}`).join(' ')

  return (
    <div className="pad">
      {/* Seleção de material */}
      <div className="mat-tabs" style={{ padding: '0 0 12px' }}>
        {MATS.map((m) => (
          <button key={m.id} className={`mat-tab${selMat === m.id ? ' on' : ''}`} onClick={() => setSelMat(m.id)}>
            {m.short}
          </button>
        ))}
      </div>

      {/* Cards de resumo */}
      <div className="gr-cards">
        <div className="gr-card">
          <div className="gr-card-lbl">MF médio (30 dias)</div>
          <div className={`gr-card-val${avgMf !== null && (avgMf < mat.mfMin || avgMf > mat.mfMax) ? ' warn' : ''}`}>
            {avgMf !== null ? avgMf.toFixed(3) : '—'}
          </div>
          <div className="gr-card-sub">
            faixa {mat.mfMin.toFixed(3)} – {mat.mfMax.toFixed(3)}
          </div>
        </div>
        <div className="gr-card">
          <div className="gr-card-lbl">Pulverulento médio</div>
          <div className="gr-card-val">{avgPulv !== null ? `${avgPulv.toFixed(2)}%` : '—'}</div>
          <div className="gr-card-sub">{pulvVals.length} ensaio{pulvVals.length === 1 ? '' : 's'}</div>
        </div>
        <div className="gr-card">
          <div className="gr-card-lbl">Ensaios de MF</div>
          <div className="gr-card-val">{points.length}</div>
          <div className="gr-card-sub">últimos {DAYS} dias</div>
        </div>
        <div className="gr-card">
          <div className="gr-card-lbl">Fora da faixa</div>
          <div className={`gr-card-val${outCount > 0 ? ' warn' : ''}`}>{outCount}</div>
          <div className="gr-card-sub">dia{outCount === 1 ? '' : 's'}</div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="card">
        <div className="sec-ttl">Módulo de finura — {mat.label}</div>
        {points.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '36px 0', fontSize: 13, lineHeight: 2 }}>
            Nenhum ensaio de {mat.label} nos últimos {DAYS} dias.
            <br />
            Preencha a granulometria na aba Entrada e salve.
          </div>
        ) : (
          <>
            <div className="gr-svg-wrap">
              <svg viewBox={`0 0 ${W} ${H}`} className="gr-svg" role="img" aria-label={`Gráfico de módulo de finura de ${mat.label}`}>
                {/* grade horizontal */}
                {yTicks.map((t, i) => (
                  <g key={i}>
                    <line x1={M.left} x2={W - M.right} y1={yOf(t)} y2={yOf(t)} stroke="#eee" />
                    <text x={M.left - 6} y={yOf(t) + 3} textAnchor="end" fontSize="9" fill="#888">
                      {t.toFixed(2)}
                    </text>
                  </g>
                ))}

                {/* faixa ideal mfMin–mfMax */}
                <rect x={M.left} y={yOf(mat.mfMax)} width={iw} height={yOf(mat.mfMin) - yOf(mat.mfMax)} fill="#e1f5ee" opacity="0.75" />
                <line x1={M.left} x2={W - M.right} y1={yOf(mat.mfMax)} y2={yOf(mat.mfMax)} stroke="#5dcaa5" strokeDasharray="4 3" />
                <line x1={M.left} x2={W - M.right} y1={yOf(mat.mfMin)} y2={yOf(mat.mfMin)} stroke="#5dcaa5" strokeDasharray="4 3" />

                {/* linha da média */}
                {avgMf !== null && points.length > 1 && (
                  <>
                    <line x1={M.left} x2={W - M.right} y1={yOf(avgMf)} y2={yOf(avgMf)} stroke="#c1272d" strokeDasharray="2 4" opacity="0.6" />
                    <text x={W - M.right} y={yOf(avgMf) - 4} textAnchor="end" fontSize="9" fill="#c1272d">
                      média {avgMf.toFixed(3)}
                    </text>
                  </>
                )}

                {/* eixo X */}
                {xTicks.map((d) => (
                  <text key={d} x={xOf(d)} y={H - M.bottom + 16} textAnchor="middle" fontSize="9" fill="#888">
                    {ddmm(d)}
                  </text>
                ))}
                <line x1={M.left} x2={W - M.right} y1={M.top + ih} y2={M.top + ih} stroke="#ccc" />

                {/* linha do MF */}
                {points.length > 1 && <path d={line} fill="none" stroke="#c1272d" strokeWidth="2" strokeLinejoin="round" />}

                {/* pontos */}
                {points.map((p) => (
                  <g key={p.date}>
                    <circle cx={xOf(p.date)} cy={yOf(p.mf)} r="4.5" fill={p.out ? '#ffb74d' : '#c1272d'} stroke="#fff" strokeWidth="1.5">
                      <title>{`${fmtD(p.date)} — MF ${p.mf.toFixed(3)}${p.out ? ' (fora da faixa)' : ''}`}</title>
                    </circle>
                    {points.length <= 12 && (
                      <text x={xOf(p.date)} y={yOf(p.mf) - 9} textAnchor="middle" fontSize="9" fontWeight="600" fill={p.out ? '#e65100' : '#333'}>
                        {p.mf.toFixed(2)}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>
            <div className="gr-legend">
              <span>
                <i className="gr-dot" style={{ background: '#c1272d' }} /> MF do dia
              </span>
              <span>
                <i className="gr-dot" style={{ background: '#ffb74d' }} /> fora da faixa
              </span>
              <span>
                <i className="gr-band" /> faixa ideal
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

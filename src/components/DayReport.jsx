import { MATS } from '../data/materials.js'
import { getHumidity } from '../data/materials.js'
import { calcMat, emptyMat, migrateUmidade } from '../utils/calc.js'
import { fmtD, pf } from '../utils/format.js'
import truckImg from '../assets/truck.png'
import MatPrintCard from './MatPrintCard.jsx'
import PulvPrintCard from './PulvPrintCard.jsx'

export default function DayReport({ data, date }) {
  // Umidade: suporta formato antigo (objeto) e novo (array)
  const umEntries = migrateUmidade(data.umidade)
  const sortedUm = [...umEntries].sort((a, b) => a.hora.localeCompare(b.hora))
  const hasUmidade = sortedUm.length > 0

  // Apenas materiais com dados (verdes)
  const activeMats = MATS.filter((m) => calcMat(data[m.id] || emptyMat(m), m.sieves).tot > 0)
  const hasPulv = MATS.some((m) => pf((data[m.id] || {}).pulvMf) > 0)

  // Grid: até 4 colunas de materiais + coluna de pulverulento se houver
  const numCols = Math.min(4, Math.max(1, activeMats.length))
  const gridCols = hasPulv ? `1fr 148px` : `1fr`

  return (
    <div className="rp-wrap">
      <div className="rp-page">
        {/* Cabeçalho */}
        <div className="rp-hdr">
          <div>
            <div className="rp-logo-row">
              <div className="rp-logo-txt">SUPERMIX</div>
              <div className="rp-logo-diamond" />
            </div>
            <div className="rp-logo-tag" style={{ fontSize: 7, color: '#c1272d', marginTop: 1 }}>
              facilitando a construção civil
            </div>
          </div>
          <div className="rp-title">GRANULOMETRIA</div>
          <div className="rp-truck">
            <img src={truckImg} style={{ height: 80, width: 'auto', display: 'block' }} alt="caminhao" />
          </div>
        </div>

        {/* Meta */}
        <div className="rp-meta">
          <span>
            <strong>RESPONSÁVEL</strong>
            <span className="rp-meta-val">{data.resp || '_____________________'}</span>
          </span>
          <span>
            <strong>DATA</strong>
            <span className="rp-meta-val">{fmtD(date) || '__/__/____'}</span>
          </span>
          <span>
            <strong>FILIAL</strong>
            <span className="rp-meta-val">{data.filial || '____________'}</span>
          </span>
        </div>

        {/* Grade de materiais — somente os que têm dados */}
        {activeMats.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 4, alignItems: 'start' }}>
            {/* Materiais ativos em grid interno */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${numCols},1fr)`, gap: 4 }}>
              {activeMats.map((m) => (
                <MatPrintCard key={m.id} mc={m} md={data[m.id]} />
              ))}
            </div>
            {/* Pulverulento — só aparece se tiver dados */}
            {hasPulv && <PulvPrintCard data={data} />}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#888', padding: '12px 0', fontSize: 9 }}>Sem dados de granulometria lançados.</div>
        )}

        {/* Seção de Umidade — boxes por leitura */}
        {hasUmidade &&
          (() => {
            // Agrupa por numero de leitura
            const grupos = {}
            sortedUm.forEach((e) => {
              const n = e.numero ?? 1
              if (!grupos[n]) grupos[n] = []
              grupos[n].push(e)
            })
            const nums = Object.keys(grupos).map(Number).sort((a, b) => a - b)
            return (
              <div style={{ marginTop: 6, borderTop: '1px solid #bbb', paddingTop: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 8, marginBottom: 4, letterSpacing: 1, color: '#444' }}>UMIDADE DA AREIA</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {nums.map((n) => (
                    <div key={n} style={{ flex: '1 1 0', minWidth: 110, border: '1px solid #aaa', borderRadius: 2, overflow: 'hidden' }}>
                      <div
                        style={{
                          background: '#c8c8c8',
                          fontWeight: 700,
                          fontSize: 9,
                          padding: '2px 6px',
                          textAlign: 'center',
                          letterSpacing: 0.5,
                          borderBottom: '1px solid #aaa',
                        }}
                      >
                        LEITURA {n}
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
                        <thead>
                          <tr>
                            <th style={{ background: '#e8e8e8', padding: '1px 4px', border: '1px solid #ccc', textAlign: 'left', fontWeight: 700 }}>HORA</th>
                            <th style={{ background: '#e8e8e8', padding: '1px 4px', border: '1px solid #ccc', textAlign: 'left', fontWeight: 700 }}>MATERIAL</th>
                            <th style={{ background: '#e8e8e8', padding: '1px 4px', border: '1px solid #ccc', textAlign: 'right', fontWeight: 700 }}>SENSOR</th>
                            <th style={{ background: '#e8e8e8', padding: '1px 4px', border: '1px solid #ccc', textAlign: 'right', fontWeight: 700 }}>UM.%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupos[n].map((e, i) => {
                            const u = getHumidity(e.matId, e.leitura)
                            const matLabel = e.matId === 'areia_media' ? 'A.N. MÉD.' : 'A.C. FINA'
                            return (
                              <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                <td style={{ padding: '1px 4px', border: '1px solid #ddd', fontWeight: 600 }}>{e.hora || '—'}</td>
                                <td style={{ padding: '1px 4px', border: '1px solid #ddd' }}>{matLabel}</td>
                                <td style={{ padding: '1px 4px', border: '1px solid #ddd', textAlign: 'right' }}>{e.leitura}</td>
                                <td
                                  style={{
                                    padding: '1px 4px',
                                    border: '1px solid #ddd',
                                    textAlign: 'right',
                                    fontWeight: 700,
                                    color: u !== null ? '#006600' : '#cc0000',
                                  }}
                                >
                                  {u !== null ? u.toFixed(1) + '%' : '—'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
      </div>
    </div>
  )
}

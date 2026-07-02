import { useMemo, useState } from 'react'
import { UM_MATS, getHumidity } from '../data/materials.js'
import { fmtD, nowHHMM } from '../utils/format.js'

export default function UmidadeView({ entries, onAdd, onRemove, saved, onSave, date }) {
  const [matId, setMatId] = useState('areia_media')
  const [leitura, setLeitura] = useState('')
  const [hora, setHora] = useState(nowHHMM)
  const [numero, setNumero] = useState(1)
  const umidade = getHumidity(matId, leitura)
  const fora = leitura !== '' && umidade === null

  // Agrupa entradas por número de leitura, ordenadas por hora dentro de cada grupo
  const grupos = useMemo(() => {
    const g = {}
    entries.forEach((e) => {
      const n = e.numero ?? 1
      if (!g[n]) g[n] = []
      g[n].push(e)
    })
    Object.keys(g).forEach((n) => {
      g[n].sort((a, b) => a.hora.localeCompare(b.hora))
    })
    return g
  }, [entries])
  const numeros = Object.keys(grupos).map(Number).sort((a, b) => a - b)

  const handleAdd = () => {
    if (!leitura || fora) return
    onAdd({ id: Date.now(), matId, leitura, hora, numero })
    setLeitura('')
    setHora(nowHHMM())
  }
  const handleKey = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="pad">
      {/* Formulário nova leitura */}
      <div className="card">
        <div className="sec-ttl">Nova leitura</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
          <div>
            <div className="flbl">Nº Leitura</div>
            <select className="inp" value={numero} onChange={(e) => setNumero(parseInt(e.target.value))} style={{ cursor: 'pointer', minWidth: 90 }}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  Leitura {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flbl">Material</div>
            <select className="inp" value={matId} onChange={(e) => setMatId(e.target.value)} style={{ cursor: 'pointer' }}>
              {UM_MATS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flbl">Hora</div>
            <input type="time" className="inp" value={hora} onChange={(e) => setHora(e.target.value)} style={{ minWidth: 100 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <div className="flbl">Sensor</div>
            <input
              type="text"
              inputMode="numeric"
              className="inp inp-r"
              value={leitura}
              onChange={(e) => setLeitura(e.target.value.replace(/[^0-9]/g, ''))}
              onFocus={(e) => e.target.select()}
              onKeyDown={handleKey}
              placeholder="000"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div className="flbl">Umidade calculada</div>
            <div
              className="inp"
              style={{ background: '#f5f5f5', color: umidade !== null ? '#0a5c44' : fora ? '#e65100' : '#aaa', fontWeight: umidade !== null ? 600 : 400 }}
            >
              {leitura === '' ? '—' : fora ? '⚠ Fora do range' : umidade.toFixed(1) + '%'}
            </div>
          </div>
          <button
            className="btn-save"
            onClick={handleAdd}
            style={{ padding: '7px 18px', fontSize: 13, whiteSpace: 'nowrap', opacity: !leitura || fora ? 0.5 : 1 }}
          >
            + Adicionar
          </button>
        </div>
      </div>

      {/* Leituras do dia — agrupadas por número */}
      {numeros.length > 0 && (
        <div className="card">
          <div className="sec-ttl">Leituras do dia ({entries.length})</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {numeros.map((n) => (
              <div key={n} style={{ flex: '1 1 200px', minWidth: 180, border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: '#6d6e71', color: '#fff', padding: '5px 10px', fontWeight: 600, fontSize: 12, letterSpacing: 0.5 }}>
                  Leitura {n}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '4px 6px', fontSize: 10, background: '#f5f5f5', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Hora</th>
                      <th style={{ padding: '4px 6px', fontSize: 10, background: '#f5f5f5', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Material</th>
                      <th style={{ padding: '4px 6px', fontSize: 10, background: '#f5f5f5', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Sensor</th>
                      <th style={{ padding: '4px 6px', fontSize: 10, background: '#f5f5f5', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Um.%</th>
                      <th style={{ width: 26, background: '#f5f5f5', borderBottom: '1px solid #ddd' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupos[n].map((e, i) => {
                      const mat = UM_MATS.find((m) => m.id === e.matId)
                      const u = getHumidity(e.matId, e.leitura)
                      return (
                        <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '4px 6px', fontSize: 11, fontWeight: 500, borderBottom: '1px solid #f0f0f0' }}>{e.hora || '—'}</td>
                          <td style={{ padding: '4px 6px', fontSize: 11, borderBottom: '1px solid #f0f0f0' }}>{mat?.short || e.matId}</td>
                          <td style={{ padding: '4px 6px', fontSize: 11, textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{e.leitura}</td>
                          <td
                            style={{
                              padding: '4px 6px',
                              fontSize: 11,
                              textAlign: 'right',
                              fontWeight: 600,
                              borderBottom: '1px solid #f0f0f0',
                              color: u !== null ? '#0a5c44' : '#c1272d',
                            }}
                          >
                            {u !== null ? u.toFixed(1) + '%' : '⚠'}
                          </td>
                          <td style={{ textAlign: 'center', padding: '2px 2px', borderBottom: '1px solid #f0f0f0' }}>
                            <button
                              onClick={() => onRemove(e.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c1272d', fontSize: 16, lineHeight: 1, padding: '0 3px', fontFamily: 'inherit' }}
                            >
                              ×
                            </button>
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
      )}

      <div className="save-bar">
        {saved && <span className="saved">✓ Salvo — {fmtD(date)}</span>}
        <button className="btn-save" onClick={onSave}>
          Salvar dados do dia
        </button>
      </div>
    </div>
  )
}

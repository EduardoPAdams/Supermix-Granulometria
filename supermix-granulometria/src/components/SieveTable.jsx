import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { calcMat } from '../utils/calc.js'

const SieveTable = memo(function SieveTable({ mc, initMasses, onUpdate }) {
  const keys = useMemo(() => [...mc.sieves, 'fundo'], [mc.id])
  const [vals, setVals] = useState(() => {
    const v = {}
    keys.forEach((k) => {
      v[k] = String(initMasses?.[k] ?? '')
    })
    return v
  })
  const refs = useRef({})
  const calc = useMemo(() => calcMat({ masses: vals }, mc.sieves), [vals, mc.id])

  useEffect(() => {
    onUpdate(vals)
  }, [vals])

  const handleChange = (k, raw) => {
    const c = raw.replace(/[^0-9.,]/g, '').replace(',', '.')
    setVals((p) => ({ ...p, [k]: c }))
  }

  const handleKey = (e, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const nk = keys[idx + 1]
      if (nk) {
        refs.current[nk]?.focus()
        refs.current[nk]?.select()
      }
    }
  }

  const ok = calc.tot > 0 && calc.mf >= mc.mfMin && calc.mf <= mc.mfMax

  return (
    <div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th className="l">Peneira</th>
              <th className="r">Massa retida (g)</th>
              <th className="r">% Retida</th>
              <th className="r">% Ret. Acum.</th>
              <th className="r">% Passante</th>
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((row, i) => (
              <tr key={row.key} className={i % 2 === 0 ? 'e' : 'o'}>
                <td className="l">{row.label}</td>
                <td className="r" style={{ padding: '3px 4px', minWidth: 100 }}>
                  <input
                    ref={(el) => {
                      refs.current[row.key] = el
                    }}
                    type="text"
                    inputMode="decimal"
                    className="inp inp-r inp-sm"
                    value={vals[row.key]}
                    onChange={(e) => handleChange(row.key, e.target.value)}
                    onKeyDown={(e) => handleKey(e, i)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    style={{ width: '100%' }}
                  />
                </td>
                <td className="r">{calc.tot > 0 ? row.pct.toFixed(2) : '—'}</td>
                <td className="r">{calc.tot > 0 ? row.cum.toFixed(2) : '—'}</td>
                <td className="r">{calc.tot > 0 ? row.pass.toFixed(2) : '—'}</td>
              </tr>
            ))}
            <tr className="tot">
              <td className="l">Total</td>
              <td className="r">{calc.tot > 0 ? calc.tot.toFixed(1) : '—'}</td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>
      {calc.tot > 0 && (
        <div className={ok ? 'mf-ok' : 'mf-warn'}>
          <strong>MF: {calc.mf.toFixed(3)}</strong>
          <span style={{ opacity: 0.75 }}>
            faixa: {mc.mfMin} – {mc.mfMax}
          </span>
          <span>{ok ? '✓ OK' : '⚠ Fora da faixa'}</span>
        </div>
      )}
    </div>
  )
})

export default SieveTable

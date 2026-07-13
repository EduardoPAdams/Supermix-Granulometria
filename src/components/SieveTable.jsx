/**
 * Tabela de peneiramento de um material: um campo de massa retida por peneira,
 * com cálculo ao vivo de % retida / % acumulada / % passante e do Módulo de
 * Finura (ver utils/calc.js). `mc` = configuração do material (peneiras,
 * faixa de MF aceitável); `md` (em App.jsx) = os dados digitados daquele dia.
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { calcMat } from '../utils/calc.js'

const SieveTable = memo(function SieveTable({ mc, initMasses, onUpdate }) {
  const rowKeys = useMemo(() => [...mc.sieves, 'fundo'], [mc.id])
  const [massValues, setMassValues] = useState(() => {
    const initial = {}
    rowKeys.forEach((key) => {
      initial[key] = String(initMasses?.[key] ?? '')
    })
    return initial
  })
  const inputRefs = useRef({})
  const calc = useMemo(() => calcMat({ masses: massValues }, mc.sieves), [massValues, mc.id])

  // Notifica o componente pai a cada alteração, para ele salvar no estado do dia
  useEffect(() => {
    onUpdate(massValues)
  }, [massValues])

  const handleChange = (key, raw) => {
    const cleaned = raw.replace(/[^0-9.,]/g, '').replace(',', '.')
    setMassValues((prev) => ({ ...prev, [key]: cleaned }))
  }

  // Enter avança o foco para o campo da próxima peneira (agiliza a digitação)
  const handleKey = (e, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const nextKey = rowKeys[idx + 1]
      if (nextKey) {
        inputRefs.current[nextKey]?.focus()
        inputRefs.current[nextKey]?.select()
      }
    }
  }

  const withinRange = calc.tot > 0 && calc.mf >= mc.mfMin && calc.mf <= mc.mfMax

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
                      inputRefs.current[row.key] = el
                    }}
                    type="text"
                    inputMode="decimal"
                    className="inp inp-r inp-sm"
                    value={massValues[row.key]}
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
        <div className={withinRange ? 'mf-ok' : 'mf-warn'}>
          <strong>MF: {calc.mf.toFixed(3)}</strong>
          <span style={{ opacity: 0.75 }}>
            faixa: {mc.mfMin} – {mc.mfMax}
          </span>
          <span>{withinRange ? '✓ OK' : '⚠ Fora da faixa'}</span>
        </div>
      )}
    </div>
  )
})

export default SieveTable

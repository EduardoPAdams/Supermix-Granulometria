import { MATS } from '../data/materials.js'
import { emptyMat, pulvRes } from '../utils/calc.js'

export default function PulvTab({ dayData, setField }) {
  return (
    <div className="card alt">
      <div className="sec-ttl">Pulverulento</div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th className="l">Material</th>
              <th className="r">MI (g)</th>
              <th className="r">MF (g)</th>
              <th className="r">Resultado (%)</th>
            </tr>
          </thead>
          <tbody>
            {MATS.map((m, i) => {
              const md2 = dayData[m.id] || emptyMat(m)
              const res = pulvRes(m.pulvMi, md2.pulvMf)
              return (
                <tr key={m.id} className={i % 2 === 0 ? 'e' : 'o'}>
                  <td className="l" style={{ fontSize: 12 }}>
                    {m.label}
                  </td>
                  <td className="r">{m.pulvMi}</td>
                  <td className="r" style={{ padding: '3px 4px', minWidth: 90 }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="inp inp-r inp-sm"
                      value={md2.pulvMf || ''}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                        setField(`${m.id}.pulvMf`, v)
                      }}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td className="r">{res !== null ? res.toFixed(2) + '%' : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

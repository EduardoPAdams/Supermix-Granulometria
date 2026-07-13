/**
 * Aba "Pulverulento": para cada material, mostra a massa inicial padrão (MI)
 * e um campo para a massa final pesada (MF) após o ensaio, calculando o
 * % de material fino perdido (pulvRes, em utils/calc.js).
 */
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
            {MATS.map((material, i) => {
              const materialData = dayData[material.id] || emptyMat(material)
              const result = pulvRes(material.pulvMi, materialData.pulvMf)
              return (
                <tr key={material.id} className={i % 2 === 0 ? 'e' : 'o'}>
                  <td className="l" style={{ fontSize: 12 }}>
                    {material.label}
                  </td>
                  <td className="r">{material.pulvMi}</td>
                  <td className="r" style={{ padding: '3px 4px', minWidth: 90 }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="inp inp-r inp-sm"
                      value={materialData.pulvMf || ''}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                        setField(`${material.id}.pulvMf`, cleaned)
                      }}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td className="r">{result !== null ? result.toFixed(2) + '%' : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

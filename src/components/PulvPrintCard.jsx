/**
 * Card de material pulverulento dentro do relatório impresso/PDF: só
 * aparece se algum material tiver resultado lançado naquele dia.
 */
import { Fragment } from 'react'
import { MATS } from '../data/materials.js'
import { emptyMat, pulvRes } from '../utils/calc.js'
import { pf } from '../utils/format.js'

export default function PulvPrintCard({ data }) {
  const activeMaterials = MATS.filter((m) => pf((data[m.id] || {}).pulvMf) > 0)
  if (activeMaterials.length === 0) return null
  return (
    <div className="pulv-card">
      <div className="pulv-card-hdr">PULVERULENTO</div>
      <table className="pulv-table">
        <thead>
          <tr>
            <th className="l">MATERIAL</th>
            <th className="l">TIPO</th>
            <th className="r">VALOR</th>
          </tr>
        </thead>
        <tbody>
          {activeMaterials.map((material, i) => {
            const materialData = data[material.id] || emptyMat(material)
            const result = pulvRes(material.pulvMi, materialData.pulvMf)
            const sep = i > 0 ? 'mat-sep' : ''
            return (
              <Fragment key={material.id}>
                <tr className={sep}>
                  <td className="mat-name" rowSpan={3} style={{ width: 52 }}>
                    {material.label.split(' ').map((word, j) => (
                      <span key={j}>
                        {word}
                        <br />
                      </span>
                    ))}
                  </td>
                  <td className="tipo">MI (g):</td>
                  <td className="val">{material.pulvMi}</td>
                </tr>
                <tr>
                  <td className="tipo">MF (g):</td>
                  <td className="val">{pf(materialData.pulvMf).toFixed(0)}</td>
                </tr>
                <tr>
                  <td className="tipo">RESULT. (%):</td>
                  <td className="val">{result !== null ? result.toFixed(1) : ''}</td>
                </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

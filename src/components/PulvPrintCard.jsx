import { Fragment } from 'react'
import { MATS } from '../data/materials.js'
import { emptyMat, pulvRes } from '../utils/calc.js'
import { pf } from '../utils/format.js'

export default function PulvPrintCard({ data }) {
  const activePulv = MATS.filter((m) => pf((data[m.id] || {}).pulvMf) > 0)
  if (activePulv.length === 0) return null
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
          {activePulv.map((m, i) => {
            const md = data[m.id] || emptyMat(m)
            const res = pulvRes(m.pulvMi, md.pulvMf)
            const sep = i > 0 ? 'mat-sep' : ''
            return (
              <Fragment key={m.id}>
                <tr className={sep}>
                  <td className="mat-name" rowSpan={3} style={{ width: 52 }}>
                    {m.label.split(' ').map((w, j) => (
                      <span key={j}>
                        {w}
                        <br />
                      </span>
                    ))}
                  </td>
                  <td className="tipo">MI (g):</td>
                  <td className="val">{m.pulvMi}</td>
                </tr>
                <tr>
                  <td className="tipo">MF (g):</td>
                  <td className="val">{pf(md.pulvMf).toFixed(0)}</td>
                </tr>
                <tr>
                  <td className="tipo">RESULT. (%):</td>
                  <td className="val">{res !== null ? res.toFixed(1) : ''}</td>
                </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

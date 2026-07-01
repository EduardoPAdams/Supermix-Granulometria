import { calcMat, emptyMat } from '../utils/calc.js'

export default function MatPrintCard({ mc, md }) {
  const c = calcMat(md || emptyMat(mc), mc.sieves)
  const ok = c.tot > 0 && c.mf >= mc.mfMin && c.mf <= mc.mfMax
  return (
    <div className="mat-card">
      <div className="mat-card-hdr">{mc.label}</div>
      <div className="mat-meta-row">
        <span className="mat-meta-lbl">NF:</span>
        <span className="mat-meta-val">{md?.nf || ''}</span>
      </div>
      <div className="mat-meta-row">
        <span className="mat-meta-lbl">PLACA:</span>
        <span className="mat-meta-val">{md?.placa || ''}</span>
      </div>
      <table className="mat-table">
        <thead>
          <tr>
            <th>PENEIRA</th>
            <th className="r">RETIDO (g)</th>
          </tr>
        </thead>
        <tbody>
          {c.rows.map((r) => (
            <tr key={r.key}>
              <td>{r.key === 'fundo' ? 'FUNDO' : r.key}</td>
              <td className="r">{r.massa > 0 ? (r.massa % 1 === 0 ? r.massa.toFixed(0) : r.massa.toFixed(1)) : ''}</td>
            </tr>
          ))}
          <tr className="mf-row">
            <td>MF:</td>
            <td className="r" style={{ color: ok ? '#006600' : '#cc0000' }}>
              {c.tot > 0 ? c.mf.toFixed(3) : ''}
            </td>
          </tr>
          <tr className="range-row">
            <td colSpan={2}>
              {mc.mfMin} a {mc.mfMax}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

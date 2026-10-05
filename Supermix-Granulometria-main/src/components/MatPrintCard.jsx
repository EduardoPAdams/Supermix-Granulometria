/**
 * Card de um material dentro do relatório impresso/PDF (DayReport):
 * peneira por peneira, a massa retida, e o MF final com destaque se estiver
 * fora da faixa aceitável. `mc` = configuração do material, `md` = dados do dia.
 */
import { calcMat, emptyMat } from '../utils/calc.js'

export default function MatPrintCard({ mc, md }) {
  const calc = calcMat(md || emptyMat(mc), mc.sieves)
  const withinRange = calc.tot > 0 && calc.mf >= mc.mfMin && calc.mf <= mc.mfMax
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
          {calc.rows.map((row) => (
            <tr key={row.key}>
              <td>{row.key === 'fundo' ? 'FUNDO' : row.key}</td>
              <td className="r">{row.massa > 0 ? (row.massa % 1 === 0 ? row.massa.toFixed(0) : row.massa.toFixed(1)) : ''}</td>
            </tr>
          ))}
          <tr className="mf-row">
            <td>MF:</td>
            <td className="r" style={{ color: withinRange ? '#006600' : '#cc0000' }}>
              {calc.tot > 0 ? calc.mf.toFixed(3) : ''}
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

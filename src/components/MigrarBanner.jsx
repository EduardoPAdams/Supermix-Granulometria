/**
 * Aviso + botão para enviar os registros antigos do navegador (localStorage)
 * para a nuvem. Só aparece se existir algum dia salvo localmente que ainda
 * não está na nuvem. Os dados locais NÃO são apagados (ficam como backup).
 */
import { useState } from 'react'
import { lsGet, lsKeys } from '../utils/storage.js'
import { migrateUmidade } from '../utils/calc.js'
import { dbInsertMissing } from '../utils/db.js'

export default function MigrarBanner({ cloudDates, onDone }) {
  const [enviando, setEnviando] = useState(false)

  const pendentes = lsKeys('smx:').filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !cloudDates.includes(d))
  if (pendentes.length === 0) return null

  const migrar = async () => {
    const records = pendentes
      .map((d) => {
        const data = lsGet(`smx:${d}`)
        if (data && data.umidade && !Array.isArray(data.umidade)) data.umidade = migrateUmidade(data.umidade)
        return { date: d, data }
      })
      .filter((r) => r.data)
    setEnviando(true)
    try {
      // Envia em lotes de 100 para não estourar o tamanho da requisição
      for (let i = 0; i < records.length; i += 100) await dbInsertMissing(records.slice(i, i + 100))
      alert(`✓ ${records.length} dia(s) enviado(s) para a nuvem.`)
      onDone()
    } catch (err) {
      console.error(err)
      alert('Erro ao enviar os dados. Nada foi apagado do navegador, pode tentar de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="migrar-banner no-print">
      <span>
        Há <b>{pendentes.length}</b> dia(s) salvos só neste navegador.
      </span>
      <button className="btn-print" onClick={migrar} disabled={enviando}>
        {enviando ? 'Enviando...' : 'Enviar para a nuvem'}
      </button>
    </div>
  )
}

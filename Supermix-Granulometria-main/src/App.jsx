/**
 * Componente principal: controla a data selecionada, as 4 abas do app
 * (Entrada, Umidade, Gráfico, Histórico), o carregamento/gravação dos
 * registros na nuvem (Supabase) e a geração de impressão/PDF de um dia.
 * O componente App() só decide entre a tela de login e o app (MainApp).
 */
import { useCallback, useEffect, useState } from 'react'
import { MATS, MAT_TABS } from './data/materials.js'
import { emptyDay, emptyMat, calcMat, migrateUmidade } from './utils/calc.js'
import { fmtD, toDay, pf } from './utils/format.js'
import { dbDel, dbGet, dbGetRecords, dbListDates, dbSet } from './utils/db.js'
import { supabase } from './lib/supabase.js'
import Login from './components/Login.jsx'
import MigrarBanner from './components/MigrarBanner.jsx'
import Logo from './components/Logo.jsx'
import SieveTable from './components/SieveTable.jsx'
import PulvTab from './components/PulvTab.jsx'
import UmidadeView from './components/UmidadeView.jsx'
import GraficoView from './components/GraficoView.jsx'
import DayReport from './components/DayReport.jsx'

export default function App() {
  // undefined = ainda verificando; null = deslogado; objeto = logado
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <div className="loading-msg">Carregando...</div>
  if (!session) return <Login />
  return <MainApp />
}

function MainApp() {
  const [view, setView] = useState('entrada')
  const [date, setDate] = useState(toDay())
  const [activeMat, setActiveMat] = useState('areia_fina')
  const [dayData, setDayData] = useState(() => emptyDay())
  const [hist, setHist] = useState([])
  const [histLoaded, setHistLoaded] = useState(false)
  const [histLoading, setHistLoading] = useState(false)
  const [dayStatus, setDayStatus] = useState('loading') // 'loading' | 'ok' | 'error'
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [histRecords, setHistRecords] = useState([])
  const [printTarget, setPrintTarget] = useState(null)
  const [pdfTarget, setPdfTarget] = useState(null)
  const sieveKey = `${date}-${activeMat}`

  // Carrega da nuvem a lista de datas com registros salvos (usada no Histórico e na migração)
  const loadHist = useCallback(async () => {
    try {
      setHist(await dbListDates())
      setHistLoaded(true)
    } catch (err) {
      console.error(err)
      alert('Erro ao carregar a lista de registros. Verifique a internet.')
    }
  }, [])

  useEffect(() => {
    loadHist()
  }, [loadHist])

  // Sempre que a data selecionada muda, carrega o registro daquele dia (ou começa um em branco).
  // Enquanto carrega (ou se der erro) o salvamento fica bloqueado, pra não sobrescrever o dia com dados vazios.
  useEffect(() => {
    let cancel = false
    setDayStatus('loading')
    dbGet(date)
      .then((savedRecord) => {
        if (cancel) return
        if (savedRecord) {
          // Migra formato antigo de umidade se necessário
          if (savedRecord.umidade && !Array.isArray(savedRecord.umidade)) savedRecord.umidade = migrateUmidade(savedRecord.umidade)
          setDayData(savedRecord)
          setSaved(true)
        } else {
          setDayData(emptyDay())
          setSaved(false)
        }
        setDayStatus('ok')
      })
      .catch((err) => {
        if (cancel) return
        console.error(err)
        setDayStatus('error')
      })
    return () => {
      cancel = true
    }
  }, [date])

  // Ao entrar na aba Histórico, carrega da nuvem os dados completos de todos os dias
  useEffect(() => {
    if (view !== 'historico') return
    let cancel = false
    setHistLoading(true)
    dbGetRecords()
      .then((recs) => !cancel && setHistRecords(recs.reverse()))
      .catch((err) => {
        console.error(err)
        if (!cancel) alert('Erro ao carregar o histórico.')
      })
      .finally(() => !cancel && setHistLoading(false))
    return () => {
      cancel = true
    }
  }, [view, hist])

  // Quando printTarget é definido (botão "Imprimir" no Histórico), aciona window.print()
  // e depois limpa o estado quando a caixa de diálogo de impressão fecha
  useEffect(() => {
    if (printTarget) {
      document.body.classList.add('printing-single')
      const cleanup = () => {
        document.body.classList.remove('printing-single')
        setPrintTarget(null)
      }
      window.addEventListener('afterprint', cleanup, { once: true })
      window.print()
    }
  }, [printTarget])

  // Quando pdfTarget é definido (botão "PDF" no Histórico), renderiza o relatório
  // escondido em #pdf-single como imagem (html2canvas) e monta um PDF a partir dela (jsPDF),
  // paginando se a imagem for mais alta que uma página A4.
  useEffect(() => {
    if (!pdfTarget) return
    setTimeout(async () => {
      const el = document.getElementById('pdf-single')
      if (!el) {
        setPdfTarget(null)
        return
      }
      try {
        const { default: html2canvas } = await import('html2canvas')
        const { jsPDF } = await import('jspdf')
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false })
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' })
        const pageW = pdf.internal.pageSize.getWidth()
        const pageH = pdf.internal.pageSize.getHeight()
        const ratio = pageW / canvas.width
        const totalH = canvas.height * ratio
        if (totalH <= pageH) {
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, pageW, totalH)
        } else {
          const pxPerPage = Math.floor(pageH / ratio)
          let y = 0
          while (y < canvas.height) {
            const sliceH = Math.min(pxPerPage, canvas.height - y)
            const sc = document.createElement('canvas')
            sc.width = canvas.width
            sc.height = sliceH
            const ctx = sc.getContext('2d')
            ctx.fillStyle = '#fff'
            ctx.fillRect(0, 0, sc.width, sliceH)
            ctx.drawImage(canvas, 0, -y)
            if (y > 0) pdf.addPage()
            pdf.addImage(sc.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, pageW, sliceH * ratio)
            y += sliceH
          }
        }
        pdf.save(`granulometria-${pdfTarget.date}.pdf`)
      } catch (err) {
        console.error(err)
        alert('Erro ao gerar PDF.')
      } finally {
        setPdfTarget(null)
      }
    }, 150)
  }, [pdfTarget])

  const handleSievesChange = useCallback(
    (masses) => {
      setDayData((p) => ({ ...p, [activeMat]: { ...p[activeMat], masses } }))
      setSaved(false)
    },
    [activeMat]
  )

  const setField = (path, val) => {
    setSaved(false)
    if (path.includes('.')) {
      const [mid, ...rest] = path.split('.')
      setDayData((p) => ({ ...p, [mid]: { ...(p[mid] || {}), [rest.join('.')]: val } }))
    } else setDayData((p) => ({ ...p, [path]: val }))
  }

  const save = async () => {
    if (dayStatus !== 'ok' || saving) return
    setSaving(true)
    try {
      await dbSet(date, dayData)
      setSaved(true)
      setHist((p) => [...new Set([date, ...p])].sort().reverse())
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar. Verifique a internet e tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  const addUmidade = (entry) => {
    setSaved(false)
    setDayData((p) => ({ ...p, umidade: [...(Array.isArray(p.umidade) ? p.umidade : []), entry] }))
  }

  const removeUmidade = (id) => {
    setSaved(false)
    setDayData((p) => ({ ...p, umidade: (Array.isArray(p.umidade) ? p.umidade : []).filter((e) => e.id !== id) }))
  }

  const delH = async (d) => {
    if (!confirm(`Apagar dados de ${fmtD(d)}?`)) return
    try {
      await dbDel(d)
    } catch (err) {
      console.error(err)
      alert('Erro ao apagar.')
      return
    }
    setHist((p) => p.filter((x) => x !== d))
    setHistRecords((p) => p.filter((r) => r.date !== d))
  }

  // Material selecionado na aba Entrada (null quando a aba "Pulverulento" está ativa)
  const activeMaterial = activeMat !== 'pulverulento' ? MATS.find((m) => m.id === activeMat) : null
  const activeMaterialData = activeMaterial ? dayData[activeMat] || emptyMat(activeMaterial) : null

  return (
    <>
      <div className="wrap">
        {/* Cabeçalho */}
        <div className="hdr no-print">
          <div className="hdr-top">
            <Logo />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.35)', color: '#fff', borderRadius: 6, padding: '5px 8px', fontSize: 12, fontFamily: 'inherit' }}
            />
            <button className="btn-sair" onClick={() => supabase.auth.signOut()}>
              Sair
            </button>
            </div>
          </div>
          <div className="hdr-fields">
            <div>
              <div className="hdr-lbl">Responsável</div>
              <input className="hdr-inp" value={dayData.resp || ''} onChange={(e) => setField('resp', e.target.value)} placeholder="Nome" />
            </div>
            <div>
              <div className="hdr-lbl">Filial</div>
              <input className="hdr-inp" value={dayData.filial || ''} onChange={(e) => setField('filial', e.target.value)} placeholder="Filial" />
            </div>
          </div>
        </div>

        {/* Nav principal */}
        <div className="nav no-print">
          {[
            ['entrada', 'Entrada'],
            ['umidade', 'Umidade'],
            ['grafico', 'Gráfico'],
            ['historico', 'Histórico'],
          ].map(([id, lbl]) => (
            <button key={id} className={`nav-btn${view === id ? ' on' : ''}`} onClick={() => setView(id)}>
              {lbl}
            </button>
          ))}
        </div>

        {histLoaded && (
          <div className="pad" style={{ paddingBottom: 0 }}>
            <MigrarBanner cloudDates={hist} onDone={loadHist} />
          </div>
        )}

        {/* ── ABA ENTRADA ── */}
        {view === 'entrada' && (
          <div>
            <div className="mat-tabs no-print">
              {MAT_TABS.map((m) => {
                const done =
                  m.id === 'pulverulento'
                    ? MATS.some((mat) => pf((dayData[mat.id] || {}).pulvMf) > 0)
                    : calcMat(dayData[m.id] || emptyMat(m), m.sieves).tot > 0
                return (
                  <button key={m.id} className={`mat-tab${activeMat === m.id ? ' on' : done ? ' done' : ''}`} onClick={() => setActiveMat(m.id)}>
                    {m.short}
                    {done && activeMat !== m.id ? ' ✓' : ''}
                  </button>
                )
              })}
            </div>
            <div className="pad">
              {activeMat === 'pulverulento' ? (
                <PulvTab dayData={dayData} setField={setField} />
              ) : (
                <div className="card">
                  <div style={{ fontWeight: 500, fontSize: 14, color: '#c1272d', marginBottom: 10 }}>{activeMaterial.label}</div>
                  <div className="fgrid">
                    <div>
                      <div className="flbl">NF</div>
                      <input className="inp" value={activeMaterialData.nf || ''} onChange={(e) => setField(`${activeMat}.nf`, e.target.value)} placeholder="Nota fiscal" />
                    </div>
                    <div>
                      <div className="flbl">Placa</div>
                      <input className="inp" value={activeMaterialData.placa || ''} onChange={(e) => setField(`${activeMat}.placa`, e.target.value)} placeholder="ABC-1234" />
                    </div>
                  </div>
                  <SieveTable key={sieveKey} mc={activeMaterial} initMasses={activeMaterialData.masses} onUpdate={handleSievesChange} />
                </div>
              )}
              <div className="save-bar">
                {dayStatus === 'error' && <span style={{ fontSize: 12, color: '#e65100' }}>Erro ao carregar o dia — recarregue a página</span>}
                {saved && <span className="saved">✓ Salvo — {fmtD(date)}</span>}
                <button className="btn-save" onClick={save} disabled={dayStatus !== 'ok' || saving}>
                  {dayStatus === 'loading' ? 'Carregando...' : saving ? 'Salvando...' : 'Salvar dados do dia'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ABA UMIDADE ── */}
        {view === 'umidade' && (
          <UmidadeView
            entries={Array.isArray(dayData.umidade) ? dayData.umidade : migrateUmidade(dayData.umidade)}
            onAdd={addUmidade}
            onRemove={removeUmidade}
            saved={saved}
            onSave={save}
            date={date}
          />
        )}

        {/* ── ABA GRÁFICO ── */}
        {view === 'grafico' && <GraficoView key={saved ? 's' : 'u'} />}

        {/* ── ABA HISTÓRICO ── */}
        {view === 'historico' && (
          <div className="pad">
            {histLoading && histRecords.length === 0 ? (
              <div className="loading-msg">Carregando...</div>
            ) : histRecords.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 0', fontSize: 13, lineHeight: 2 }}>
                Nenhum registro salvo ainda.
                <br />
                Preencha os dados e salve na aba Entrada.
              </div>
            ) : (
              histRecords.map((rec) => (
                <div key={rec.date} className="hist-day">
                  <div className="hist-hdr">
                    <div>
                      <div className="hist-hdr-date">
                        {fmtD(rec.date)}
                        {rec.date === toDay() && <span style={{ fontSize: 10, marginLeft: 8, opacity: 0.7 }}>(hoje)</span>}
                      </div>
                      {(rec.data.resp || rec.data.filial) && (
                        <div className="hist-hdr-meta">
                          {rec.data.resp && `Resp: ${rec.data.resp}`}
                          {rec.data.resp && rec.data.filial && ' · '}
                          {rec.data.filial && `Filial: ${rec.data.filial}`}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button className="btn-print-hist" onClick={() => setPrintTarget(rec)}>
                        ⎙ Imprimir
                      </button>
                      <button
                        className="btn-print-hist"
                        onClick={() => setPdfTarget(rec)}
                        disabled={pdfTarget?.date === rec.date}
                        style={{ opacity: pdfTarget?.date === rec.date ? 0.5 : 1, cursor: pdfTarget?.date === rec.date ? 'default' : 'pointer' }}
                      >
                        {pdfTarget?.date === rec.date ? '⏳ PDF...' : '⬇ PDF'}
                      </button>
                      <button className="btn-del" onClick={() => delH(rec.date)}>
                        Apagar
                      </button>
                    </div>
                  </div>
                  <DayReport data={rec.data} date={rec.date} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {printTarget && (
        <div id="print-single">
          <DayReport data={printTarget.data} date={printTarget.date} />
        </div>
      )}
      {pdfTarget && (
        <div id="pdf-single" style={{ position: 'fixed', left: '-9999px', top: 0, width: 960, background: '#fff', padding: '14px' }}>
          <DayReport data={pdfTarget.data} date={pdfTarget.date} />
        </div>
      )}
    </>
  )
}

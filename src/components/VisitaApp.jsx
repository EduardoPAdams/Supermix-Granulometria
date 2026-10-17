/**
 * Módulo Visita Surpresa — digitaliza o "Painel de acompanhamentos" das
 * filiais POA Norte / Sul. Três abas:
 *  - Nova visita: NF, motorista/BT, cliente, slump, água retida, anomalias (1–9 + Outros) e ações (A–C)
 *  - Registros: lista filtrável com editar/apagar e exportação CSV
 *  - Resumo: totais do mês e contagem por anomalia e por ação
 * Os dados ficam na tabela `visitas` do Supabase (ver src/utils/dbVisitas.js).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { visitaApagar, visitaSalvar, visitasListar } from '../utils/dbVisitas.js'
import { toDay, fmtD } from '../utils/format.js'
import Logo from './Logo.jsx'

export const ANOMALIAS = [
  ['1', 'Slump acima da faixa'],
  ['2', 'Moldagem na bica'],
  ['3', 'Moldagem com concreto do slump'],
  ['4', 'Moldagem no início da carga'],
  ['5', 'Adensamento incorreto'],
  ['6', 'Adição de água sem assinatura de responsabilidade'],
  ['7', 'Concreto vencido sem assinatura de responsabilidade'],
  ['8', 'Motorista não preenche as informações corretamente na NF'],
  ['9', 'Motorista não tinha material para realizar a moldagem'],
]
export const ACOES = [
  ['A', 'Advertência verbal'],
  ['B', 'Advertência jurídica'],
  ['C', 'Treinamento / reciclagem'],
]
const FILIAIS = ['POA Norte', 'POA Sul']

// ── Slump: lê a faixa da NF ("10 ± 2", "10+/-2" ou "8 a 12") ──
const num = (s) => {
  const v = parseFloat(String(s ?? '').replace(',', '.'))
  return Number.isFinite(v) ? v : null
}
export function faixaSlump(s) {
  s = String(s || '').replace(/,/g, '.')
  let m = s.match(/(\d+(?:\.\d+)?)\s*(?:±|\+\/-|\+-|\+\s*-)\s*(\d+(?:\.\d+)?)/)
  if (m) return { min: +m[1] - +m[2], max: +m[1] + +m[2] }
  m = s.match(/(\d+(?:\.\d+)?)\s*(?:a|-|–|até)\s*(\d+(?:\.\d+)?)/i)
  if (m) return { min: Math.min(+m[1], +m[2]), max: Math.max(+m[1], +m[2]) }
  return null
}
export function statusSlump(nf, obtido) {
  const f = faixaSlump(nf)
  const o = num(obtido)
  if (!f || o === null) return null
  return o > f.max ? 'acima' : o < f.min ? 'abaixo' : 'ok'
}

const filialSalva = () => {
  try {
    return localStorage.getItem('smx:visita-filial') || 'POA Norte'
  } catch {
    return 'POA Norte'
  }
}

const vazio = () => ({
  id: null,
  filial: filialSalva(),
  data: toDay(),
  nf: '',
  motorista: '',
  laboratorista: '',
  cliente: '',
  slump_nf: '',
  slump_obtido: '',
  agua_retida: '',
  agua_central: '',
  agua_obra: '',
  anomalias: [],
  outros: '',
  acoes: [],
  obs: '',
})

const temAnomalia = (v) => (v.anomalias || []).length > 0 || !!v.outros

export default function VisitaApp({ onVoltar }) {
  const [view, setView] = useState('nova')
  const [form, setForm] = useState(vazio)
  const [autoSlump, setAutoSlump] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [lista, setLista] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState(false)
  const [fFilial, setFFilial] = useState('')
  const [fMes, setFMes] = useState(toDay().slice(0, 7))
  const [fBusca, setFBusca] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErroLista(false)
    try {
      setLista(await visitasListar())
    } catch (err) {
      console.error(err)
      setErroLista(true)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const set = (campo, valor) => setForm((p) => ({ ...p, [campo]: valor }))

  // Confere o slump sempre que a faixa ou o valor obtido mudam; marca/desmarca a anomalia 1 automaticamente
  const slump = statusSlump(form.slump_nf, form.slump_obtido)
  const faixa = faixaSlump(form.slump_nf)
  useEffect(() => {
    const tem1 = form.anomalias.includes('1')
    if (slump === 'acima' && !tem1) {
      setAutoSlump(true)
      setForm((p) => ({ ...p, anomalias: [...p.anomalias, '1'].sort() }))
    } else if (slump !== 'acima' && tem1 && autoSlump) {
      setAutoSlump(false)
      setForm((p) => ({ ...p, anomalias: p.anomalias.filter((c) => c !== '1') }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slump])

  const alternar = (campo, codigo) => {
    if (campo === 'anomalias' && codigo === '1') setAutoSlump(false)
    setForm((p) => ({
      ...p,
      [campo]: p[campo].includes(codigo) ? p[campo].filter((c) => c !== codigo) : [...p[campo], codigo].sort(),
    }))
  }

  const aviso = (texto) => {
    setMsg(texto)
    setTimeout(() => setMsg(''), 4000)
  }

  const salvar = async () => {
    if (!form.nf.trim()) return alert('Preencha a nota fiscal.')
    if (!form.data) return alert('Preencha a data.')
    setSalvando(true)
    try {
      await visitaSalvar({
        ...form,
        nf: form.nf.trim(),
        motorista: form.motorista.trim(),
        cliente: form.cliente.trim(),
        laboratorista: (form.laboratorista || '').trim(),
        agua_retida: num(form.agua_retida),
        agua_central: num(form.agua_central),
        agua_obra: num(form.agua_obra),
      })
      try {
        localStorage.setItem('smx:visita-filial', form.filial)
      } catch {}
      aviso(form.id ? '✓ Visita atualizada' : '✓ Visita salva')
      setForm({ ...vazio(), filial: form.filial })
      setAutoSlump(false)
      carregar()
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar. Verifique a internet e tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  const editar = (v) => {
    setForm({
      ...vazio(),
      ...v,
      laboratorista: v.laboratorista ?? '',
      agua_retida: v.agua_retida ?? '',
      agua_central: v.agua_central ?? '',
      agua_obra: v.agua_obra ?? '',
      anomalias: v.anomalias || [],
      acoes: v.acoes || [],
    })
    setAutoSlump(false)
    setView('nova')
    window.scrollTo(0, 0)
  }

  const apagar = async (v) => {
    if (!confirm(`Apagar a visita da NF ${v.nf} (${fmtD(v.data)})?`)) return
    try {
      await visitaApagar(v.id)
      setLista((p) => p.filter((x) => x.id !== v.id))
    } catch (err) {
      console.error(err)
      alert('Erro ao apagar.')
    }
  }

  const filtradas = useMemo(() => {
    const b = fBusca.trim().toLowerCase()
    return lista.filter(
      (v) =>
        (!fFilial || v.filial === fFilial) &&
        (!fMes || (v.data || '').startsWith(fMes)) &&
        (!b || [v.nf, v.motorista, v.cliente].join(' ').toLowerCase().includes(b))
    )
  }, [lista, fFilial, fMes, fBusca])

  const exportarCSV = () => {
    if (!filtradas.length) return alert('Nada para exportar com esses filtros.')
    const q = (x) => `"${String(x ?? '').replace(/"/g, '""')}"`
    const cab = [
      'Filial', 'Data', 'Nota fiscal', 'Motorista/BT', 'Cliente', 'Slump NF', 'Slump obtido',
      'Água retida (L)', 'Água central (L)', 'Água obra (L)',
      ...ANOMALIAS.map(([c, t]) => `${c} ${t}`), 'Outros',
      ...ACOES.map(([c, t]) => `${c} ${t}`), 'Observações', 'Laboratorista',
    ]
    const linhas = filtradas.map((v) => [
      v.filial, fmtD(v.data), v.nf, v.motorista, v.cliente, v.slump_nf, v.slump_obtido,
      String(v.agua_retida ?? '').replace('.', ','), String(v.agua_central ?? '').replace('.', ','), String(v.agua_obra ?? '').replace('.', ','),
      ...ANOMALIAS.map(([c]) => ((v.anomalias || []).includes(c) ? 'X' : '')), v.outros,
      ...ACOES.map(([c]) => ((v.acoes || []).includes(c) ? 'X' : '')), v.obs, v.laboratorista,
    ])
    const csv = '﻿' + [cab, ...linhas].map((l) => l.map(q).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `visita-surpresa-${fMes || toDay()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="wrap">
      {/* Cabeçalho */}
      <div className="hdr">
        <div className="hdr-top">
          <Logo />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-sair" onClick={onVoltar}>
              ← Início
            </button>
            <button className="btn-sair" onClick={() => supabase.auth.signOut()}>
              Sair
            </button>
          </div>
        </div>
        <div className="vs-titulo">Visita Surpresa</div>
      </div>

      <div className="nav">
        {[
          ['nova', form.id ? 'Editando' : 'Nova visita'],
          ['registros', `Registros${lista.length ? ` (${lista.length})` : ''}`],
          ['resumo', 'Resumo'],
        ].map(([id, lbl]) => (
          <button key={id} className={`nav-btn${view === id ? ' on' : ''}`} onClick={() => setView(id)}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── NOVA VISITA ── */}
      {view === 'nova' && (
        <div className="pad">
          <div className="card">
            <div className="sec-ttl">Carga</div>
            <div className="fgrid">
              <div>
                <div className="flbl">Filial</div>
                <select className="inp" value={form.filial} onChange={(e) => set('filial', e.target.value)}>
                  {FILIAIS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flbl">Data</div>
                <input className="inp" type="date" value={form.data} onChange={(e) => set('data', e.target.value)} />
              </div>
              <div>
                <div className="flbl">Nota fiscal</div>
                <input className="inp" inputMode="numeric" value={form.nf} onChange={(e) => set('nf', e.target.value)} placeholder="Nº da NF" />
              </div>
              <div>
                <div className="flbl">Motorista / BT</div>
                <input className="inp" value={form.motorista} onChange={(e) => set('motorista', e.target.value)} placeholder="Nome ou nº do BT" />
              </div>
            </div>
            <div className="fgrid" style={{ marginBottom: 0 }}>
              <div>
                <div className="flbl">Cliente / obra</div>
                <input className="inp" value={form.cliente} onChange={(e) => set('cliente', e.target.value)} placeholder="Cliente" />
              </div>
              <div>
                <div className="flbl">Laboratorista</div>
                <input className="inp" value={form.laboratorista} onChange={(e) => set('laboratorista', e.target.value)} placeholder="Quem fez a visita" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="sec-ttl">Slump</div>
            <div className="fgrid">
              <div>
                <div className="flbl">Slump da NF (cm)</div>
                <input className="inp" value={form.slump_nf} onChange={(e) => set('slump_nf', e.target.value)} placeholder="10 ± 2" />
              </div>
              <div>
                <div className="flbl">Slump obtido (cm)</div>
                <input className="inp" inputMode="decimal" value={form.slump_obtido} onChange={(e) => set('slump_obtido', e.target.value)} placeholder="ex.: 13" />
              </div>
            </div>
            {slump === 'acima' ? (
              <div className="mf-warn">▲ Acima da faixa ({faixa.min} a {faixa.max} cm) — anomalia 1 marcada</div>
            ) : slump === 'abaixo' ? (
              <div className="mf-warn">▼ Abaixo da faixa ({faixa.min} a {faixa.max} cm)</div>
            ) : slump === 'ok' ? (
              <div className="mf-ok">✓ Dentro da faixa ({faixa.min} a {faixa.max} cm)</div>
            ) : (
              <div className="vs-dica">Escreva a faixa como “10 ± 2” ou “8 a 12” para conferir o slump.</div>
            )}
          </div>

          <div className="card">
            <div className="sec-ttl">Água (L)</div>
            <div className="vs-agua">
              <div>
                <div className="flbl">Retida</div>
                <input className="inp" inputMode="decimal" value={form.agua_retida} onChange={(e) => set('agua_retida', e.target.value)} placeholder="0" />
              </div>
              <div>
                <div className="flbl">Central</div>
                <input className="inp" inputMode="decimal" value={form.agua_central} onChange={(e) => set('agua_central', e.target.value)} placeholder="0" />
              </div>
              <div>
                <div className="flbl">Obra</div>
                <input className="inp" inputMode="decimal" value={form.agua_obra} onChange={(e) => set('agua_obra', e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="sec-ttl">Anomalias identificadas</div>
            <div className="vs-lista">
              {ANOMALIAS.map(([c, t]) => (
                <label key={c} className={`vs-chk${form.anomalias.includes(c) ? ' on' : ''}`}>
                  <input type="checkbox" checked={form.anomalias.includes(c)} onChange={() => alternar('anomalias', c)} />
                  <span className="vs-cod">{c}</span>
                  <span>
                    {t}
                    {c === '1' && autoSlump && <span className="vs-auto">auto</span>}
                  </span>
                </label>
              ))}
            </div>
            <div className="flbl" style={{ marginTop: 10 }}>Outros</div>
            <textarea className="inp vs-txt" value={form.outros} onChange={(e) => set('outros', e.target.value)} placeholder="Outra anomalia, se houver" />
          </div>

          <div className="card">
            <div className="sec-ttl">Ação tomada</div>
            <div className="vs-lista">
              {ACOES.map(([c, t]) => (
                <label key={c} className={`vs-chk${form.acoes.includes(c) ? ' on' : ''}`}>
                  <input type="checkbox" checked={form.acoes.includes(c)} onChange={() => alternar('acoes', c)} />
                  <span className="vs-cod">{c}</span>
                  <span>{t}</span>
                </label>
              ))}
            </div>
            <div className="flbl" style={{ marginTop: 10 }}>Observações</div>
            <textarea className="inp vs-txt" value={form.obs} onChange={(e) => set('obs', e.target.value)} placeholder="Detalhes da visita" />
          </div>

          <div className="save-bar">
            {msg && <span className="saved">{msg}</span>}
            {form.id && (
              <button className="btn-print" onClick={() => setForm({ ...vazio(), filial: form.filial })}>
                Cancelar edição
              </button>
            )}
            <button className="btn-save" onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : form.id ? 'Atualizar visita' : 'Salvar visita'}
            </button>
          </div>
        </div>
      )}

      {/* ── REGISTROS ── */}
      {view === 'registros' && (
        <div className="pad">
          <div className="card vs-filtros">
            <div>
              <div className="flbl">Filial</div>
              <select className="inp" value={fFilial} onChange={(e) => setFFilial(e.target.value)}>
                <option value="">Todas</option>
                {FILIAIS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flbl">Mês</div>
              <input className="inp" type="month" value={fMes} onChange={(e) => setFMes(e.target.value)} />
            </div>
            <div>
              <div className="flbl">Buscar</div>
              <input className="inp" value={fBusca} onChange={(e) => setFBusca(e.target.value)} placeholder="NF, motorista, cliente" />
            </div>
            <div style={{ alignSelf: 'end' }}>
              <button className="btn-print" style={{ width: '100%' }} onClick={exportarCSV}>
                ⬇ Exportar CSV
              </button>
            </div>
          </div>

          {carregando ? (
            <div className="loading-msg">Carregando...</div>
          ) : erroLista ? (
            <div className="vs-vazio">
              Não foi possível carregar as visitas.
              <br />
              <button className="btn-print" style={{ marginTop: 10 }} onClick={carregar}>
                Tentar de novo
              </button>
            </div>
          ) : filtradas.length === 0 ? (
            <div className="vs-vazio">
              {lista.length ? 'Nenhuma visita com esses filtros.' : 'Nenhuma visita registrada ainda.'}
              <br />
              {lista.length ? 'Troque a filial, o mês ou a busca.' : 'Preencha e salve na aba Nova visita.'}
            </div>
          ) : (
            filtradas.map((v) => {
              const st = statusSlump(v.slump_nf, v.slump_obtido)
              return (
                <div key={v.id} className={`vs-rec${temAnomalia(v) ? ' ruim' : ''}`}>
                  <div className="vs-rec-hdr">
                    <span className="vs-rec-nf">NF {v.nf}</span>
                    <span className="vs-rec-meta">
                      {fmtD(v.data)} · {v.filial}
                    </span>
                  </div>
                  <div className="vs-kv">
                    <div>
                      <b>Motorista / BT</b>
                      {v.motorista || '—'}
                    </div>
                    <div>
                      <b>Cliente</b>
                      {v.cliente || '—'}
                    </div>
                    {v.laboratorista && (
                      <div>
                        <b>Laboratorista</b>
                        {v.laboratorista}
                      </div>
                    )}
                    <div>
                      <b>Slump NF → obtido</b>
                      {v.slump_nf || '—'} → {v.slump_obtido || '—'}
                      {st === 'acima' ? ' ▲' : st === 'abaixo' ? ' ▼' : ''}
                    </div>
                    <div>
                      <b>Água retida / central / obra</b>
                      {v.agua_retida ?? 0} / {v.agua_central ?? 0} / {v.agua_obra ?? 0} L
                    </div>
                  </div>
                  <div className="vs-chips">
                    {(v.anomalias || []).map((c) => (
                      <span key={c} className="vs-chip">
                        {c} · {ANOMALIAS.find((a) => a[0] === c)?.[1]}
                      </span>
                    ))}
                    {v.outros && <span className="vs-chip">Outros · {v.outros}</span>}
                    {!temAnomalia(v) && <span className="vs-chip ok">Sem anomalia</span>}
                    {(v.acoes || []).map((c) => (
                      <span key={c} className="vs-chip acao">
                        {c} · {ACOES.find((a) => a[0] === c)?.[1]}
                      </span>
                    ))}
                  </div>
                  {v.obs && <div className="vs-obs">{v.obs}</div>}
                  <div className="vs-rec-acoes">
                    <button className="btn-print" onClick={() => editar(v)}>
                      Editar
                    </button>
                    <button className="btn-print" onClick={() => apagar(v)}>
                      Apagar
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── RESUMO ── */}
      {view === 'resumo' && <Resumo lista={lista} carregando={carregando} />}
    </div>
  )
}

function Resumo({ lista, carregando }) {
  const [filial, setFilial] = useState('')
  const [mes, setMes] = useState(toDay().slice(0, 7))
  const sel = lista.filter((v) => (!filial || v.filial === filial) && (!mes || (v.data || '').startsWith(mes)))
  const tot = sel.length
  const com = sel.filter(temAnomalia).length
  const acima = sel.filter((v) => statusSlump(v.slump_nf, v.slump_obtido) === 'acima').length
  const soma = (campo) => sel.reduce((s, v) => s + (Number(v[campo]) || 0), 0)

  const barras = (itens, campo, comOutros) => {
    const linhas = itens.map(([c, t]) => [c, t, sel.filter((v) => (v[campo] || []).includes(c)).length])
    if (comOutros) linhas.push(['+', 'Outros', sel.filter((v) => v.outros).length])
    const max = Math.max(1, ...linhas.map((l) => l[2]))
    return linhas.map(([c, t, n]) => (
      <div key={c} className="vs-barra">
        <span className="vs-cod">{c}</span>
        <div>
          <div className="vs-barra-lbl">{t}</div>
          <div className="vs-trilho">
            <div className="vs-fill" style={{ width: `${(n / max) * 100}%` }} />
          </div>
        </div>
        <span className="vs-barra-n">{n}</span>
      </div>
    ))
  }

  return (
    <div className="pad">
      <div className="card fgrid" style={{ marginBottom: 10 }}>
        <div>
          <div className="flbl">Filial</div>
          <select className="inp" value={filial} onChange={(e) => setFilial(e.target.value)}>
            <option value="">Todas</option>
            {FILIAIS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="flbl">Mês</div>
          <input className="inp" type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
        </div>
      </div>

      {carregando ? (
        <div className="loading-msg">Carregando...</div>
      ) : (
        <>
          <div className="gr-cards">
            <div className="gr-card">
              <div className="gr-card-lbl">Visitas</div>
              <div className="gr-card-val">{tot}</div>
            </div>
            <div className="gr-card">
              <div className="gr-card-lbl">Com anomalia</div>
              <div className={`gr-card-val${com ? ' warn' : ''}`}>{com}</div>
              <div className="gr-card-sub">{tot ? Math.round((com / tot) * 100) : 0}% das visitas</div>
            </div>
            <div className="gr-card">
              <div className="gr-card-lbl">Slump acima da faixa</div>
              <div className={`gr-card-val${acima ? ' warn' : ''}`}>{acima}</div>
            </div>
            <div className="gr-card">
              <div className="gr-card-lbl">Água (L)</div>
              <div className="gr-card-val">{soma('agua_retida').toLocaleString('pt-BR')}</div>
              <div className="gr-card-sub">
                retida · central {soma('agua_central').toLocaleString('pt-BR')} · obra {soma('agua_obra').toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
          {tot === 0 ? (
            <div className="vs-vazio">Nenhuma visita nesse período.</div>
          ) : (
            <>
              <div className="card">
                <div className="sec-ttl">Anomalias</div>
                {barras(ANOMALIAS, 'anomalias', true)}
              </div>
              <div className="card">
                <div className="sec-ttl">Ações tomadas</div>
                {barras(ACOES, 'acoes')}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

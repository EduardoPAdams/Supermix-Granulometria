/**
 * Painel de acessos (só para o admin, lab.adm@supermix.com).
 * Lista todos os logins da tabela `perfis` e deixa o admin escolher
 * o nome de exibição e, pra cada módulo, o nível: sem acesso, só ver, ou ver e editar.
 *
 * Login novo: criar no Supabase (Authentication → Users → Add user).
 * Ele aparece aqui automaticamente, sem acesso a nada, até o admin liberar.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { perfisListar, perfilSalvar } from '../utils/dbPerfis.js'
import { ADMIN_EMAIL, MODULOS } from '../data/modulos.js'
import Logo from './Logo.jsx'

const ehAdmin = (p) => (p.email || '').toLowerCase() === ADMIN_EMAIL
const NIVEIS = [
  ['nenhum', 'Sem acesso'],
  ['ver', 'Só ver'],
  ['editar', 'Ver e editar'],
]

// perfil (modulos/edicao) → { granulometria: 'ver', visita: 'editar', ... }
const niveisDoPerfil = (p) =>
  Object.fromEntries(
    MODULOS.map((m) => [m.id, !p.modulos?.includes(m.id) ? 'nenhum' : p.edicao?.includes(m.id) ? 'editar' : 'ver'])
  )

export default function AdminPainel({ onVoltar }) {
  const [lista, setLista] = useState(null) // null = carregando
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  const carregar = useCallback(async () => {
    setErro('')
    setLista(null)
    try {
      setLista(await perfisListar())
    } catch (err) {
      console.error(err)
      setErro('Erro ao carregar os logins. Verifique a internet (e se o SQL de acessos já foi rodado no Supabase).')
      setLista([])
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const atualizar = (novo) => setLista((l) => l.map((p) => (p.id === novo.id ? novo : p)))

  const termo = busca.trim().toLowerCase()
  const visiveis = (lista || [])
    .filter((p) => !termo || `${p.email} ${p.nome || ''}`.toLowerCase().includes(termo))
    .sort((a, b) => ehAdmin(b) - ehAdmin(a) || a.email.localeCompare(b.email))
  const semAcesso = (lista || []).filter((p) => !ehAdmin(p) && !p.modulos?.length).length

  return (
    <div className="wrap">
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
        <div className="vs-titulo">Gerenciar acessos</div>
      </div>

      <div className="pad">
        <div className="card alt adm-info">
          <b>Como adicionar um login novo:</b> no Supabase, vá em <i>Authentication → Users → Add user</i> e crie com e-mail e
          senha (marque "Auto Confirm User"). Ele aparece aqui sem acesso a nada; é só marcar os módulos e salvar.
        </div>

        <div className="adm-topo">
          <input className="inp" placeholder="Buscar por e-mail ou nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <button className="btn-print" onClick={carregar} disabled={lista === null}>
            ↻ Atualizar
          </button>
        </div>

        {lista && !erro && (
          <div className="adm-resumo">
            {lista.length} {lista.length === 1 ? 'login' : 'logins'}
            {semAcesso > 0 && <span className="adm-alerta"> · {semAcesso} sem acesso a nada</span>}
          </div>
        )}

        {erro && <div className="login-erro">{erro}</div>}

        {lista === null ? (
          <div className="loading-msg">Carregando...</div>
        ) : visiveis.length === 0 && !erro ? (
          <div className="vs-vazio">Nenhum login encontrado.</div>
        ) : (
          visiveis.map((p) => <PerfilLinha key={p.id} perfil={p} onSalvo={atualizar} />)
        )}
      </div>
    </div>
  )
}

function PerfilLinha({ perfil, onSalvo }) {
  const admin = ehAdmin(perfil)
  const [nome, setNome] = useState(perfil.nome || '')
  const [niveis, setNiveis] = useState(() => niveisDoPerfil(perfil))
  const [status, setStatus] = useState('') // '' | 'salvando' | 'ok' | 'erro'

  const originais = niveisDoPerfil(perfil)
  const mudou = nome.trim() !== (perfil.nome || '') || MODULOS.some((m) => niveis[m.id] !== originais[m.id])

  const escolher = (id, nivel) => {
    setStatus('')
    setNiveis((n) => ({ ...n, [id]: nivel }))
  }

  const salvar = async () => {
    setStatus('salvando')
    const modulos = MODULOS.filter((m) => niveis[m.id] !== 'nenhum').map((m) => m.id)
    const edicao = MODULOS.filter((m) => niveis[m.id] === 'editar').map((m) => m.id)
    try {
      const novo = await perfilSalvar(perfil.id, { nome, modulos, edicao })
      onSalvo(novo)
      setStatus('ok')
    } catch (err) {
      console.error(err)
      setStatus('erro')
    }
  }

  const desfazer = () => {
    setNome(perfil.nome || '')
    setNiveis(niveisDoPerfil(perfil))
    setStatus('')
  }

  return (
    <div className={`adm-user${admin ? ' admin' : !perfil.modulos?.length ? ' bloq' : ''}`}>
      <div className="adm-user-hdr">
        <div className="adm-email">{perfil.email}</div>
        {admin ? (
          <span className="adm-badge">Administrador · acesso total</span>
        ) : !perfil.modulos?.length ? (
          <span className="adm-badge cinza">Sem acesso</span>
        ) : null}
      </div>

      {admin ? (
        <div className="vs-dica">O administrador sempre vê todos os módulos e este painel. Não dá pra mudar por aqui.</div>
      ) : (
        <>
          <div className="adm-campos adm-campos-niveis">
            <div>
              <div className="flbl">Nome</div>
              <input
                className="inp"
                value={nome}
                placeholder="Nome de quem usa o login"
                onChange={(e) => {
                  setNome(e.target.value)
                  setStatus('')
                }}
              />
            </div>
            <div>
              <div className="flbl">Acesso por módulo</div>
              <div className="adm-mods">
                {MODULOS.map((m) => (
                  <div key={m.id} className="adm-mod">
                    <div className="adm-mod-nome">{m.titulo}</div>
                    <div className="adm-seg" role="radiogroup" aria-label={`Acesso ao módulo ${m.titulo}`}>
                      {NIVEIS.map(([nv, lbl]) => (
                        <button
                          key={nv}
                          type="button"
                          role="radio"
                          aria-checked={niveis[m.id] === nv}
                          className={`adm-seg-btn ${nv}${niveis[m.id] === nv ? ' on' : ''}`}
                          onClick={() => escolher(m.id, nv)}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="adm-acoes">
            {status === 'ok' && !mudou && <span className="saved">✓ Salvo</span>}
            {status === 'erro' && <span className="adm-alerta">Erro ao salvar. Tente de novo.</span>}
            {mudou && status !== 'salvando' && (
              <button className="btn-print" onClick={desfazer}>
                Desfazer
              </button>
            )}
            <button className="btn-save" onClick={salvar} disabled={!mudou || status === 'salvando'}>
              {status === 'salvando' ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

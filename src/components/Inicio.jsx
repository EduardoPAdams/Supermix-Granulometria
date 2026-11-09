/**
 * Tela inicial depois do login: o usuário escolhe qual módulo vai usar.
 * Só aparecem os módulos liberados pra esse login (tabela `perfis`).
 * O admin vê todos, mais o cartão "Gerenciar acessos".
 */
import { supabase } from '../lib/supabase.js'
import { MODULOS } from '../data/modulos.js'
import Logo from './Logo.jsx'

const ICONES = {
  granulometria: (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <rect x="6" y="8" width="28" height="5" rx="1" fill="currentColor" />
      <rect x="9" y="17" width="22" height="5" rx="1" fill="currentColor" opacity=".7" />
      <rect x="12" y="26" width="16" height="5" rx="1" fill="currentColor" opacity=".45" />
    </svg>
  ),
  visita: (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <rect x="9" y="6" width="22" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M14 16l3 3 6-6M14 26h12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <circle cx="16" cy="14" r="6" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M5 33c1.5-6 5.5-9 11-9s9.5 3 11 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 17l2.5 2.5L37 15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

export default function Inicio({ email, acesso, onEscolher }) {
  const liberados = MODULOS.filter((m) => acesso.admin || acesso.modulos.includes(m.id))
  const cards = acesso.admin
    ? [...liberados, { id: 'admin', titulo: 'Gerenciar acessos', desc: 'Defina quais módulos cada login pode usar.' }]
    : liberados

  return (
    <div className="wrap">
      <div className="hdr">
        <div className="hdr-top">
          <Logo />
          <button className="btn-sair" onClick={() => supabase.auth.signOut()}>
            Sair
          </button>
        </div>
      </div>
      <div className="pad">
        <div className="inicio-ola">
          <div className="inicio-ttl">{acesso.nome ? `Olá, ${acesso.nome.split(' ')[0]}! ` : ''}O que você vai fazer agora?</div>
          {email && (
            <div className="inicio-sub">
              Conectado como {email}
              {acesso.admin && <span className="adm-badge">Administrador</span>}
            </div>
          )}
        </div>

        {acesso.erro ? (
          <div className="vs-vazio">
            Não deu pra carregar suas permissões.
            <br />
            Verifique a internet e recarregue a página.
          </div>
        ) : cards.length === 0 ? (
          <div className="vs-vazio">
            Seu login ainda não tem acesso a nenhum módulo.
            <br />
            Fale com o administrador do laboratório.
          </div>
        ) : (
          <div className="inicio-grid">
            {cards.map((m) => (
              <button key={m.id} className={`inicio-card${m.id === 'admin' ? ' adm' : ''}`} onClick={() => onEscolher(m.id)}>
                <span className="inicio-ico">{ICONES[m.id]}</span>
                <span className="inicio-nome">
                  {m.titulo}
                  {m.id !== 'admin' && !acesso.admin && !acesso.edicao.includes(m.id) && <span className="leitura-tag cinza">Só leitura</span>}
                </span>
                <span className="inicio-desc">{m.desc}</span>
                <span className="inicio-ir">Abrir →</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

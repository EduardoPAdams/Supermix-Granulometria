/**
 * Tela inicial depois do login: o usuário escolhe qual módulo vai usar.
 * Aparece sempre que alguém entra no site (ou volta pelo botão "Início").
 */
import { supabase } from '../lib/supabase.js'
import Logo from './Logo.jsx'

const MODULOS = [
  {
    id: 'granulometria',
    titulo: 'Granulometria',
    desc: 'Ensaios de granulometria, pulverulento e umidade dos agregados.',
    icone: (
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        <rect x="6" y="8" width="28" height="5" rx="1" fill="currentColor" />
        <rect x="9" y="17" width="22" height="5" rx="1" fill="currentColor" opacity=".7" />
        <rect x="12" y="26" width="16" height="5" rx="1" fill="currentColor" opacity=".45" />
      </svg>
    ),
  },
  {
    id: 'visita',
    titulo: 'Visita Surpresa',
    desc: 'Acompanhamento das cargas: slump, água retida, anomalias e ações tomadas.',
    icone: (
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        <rect x="9" y="6" width="22" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M14 16l3 3 6-6M14 26h12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function Inicio({ email, onEscolher }) {
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
          <div className="inicio-ttl">O que você vai fazer agora?</div>
          {email && <div className="inicio-sub">Conectado como {email}</div>}
        </div>
        <div className="inicio-grid">
          {MODULOS.map((m) => (
            <button key={m.id} className="inicio-card" onClick={() => onEscolher(m.id)}>
              <span className="inicio-ico">{m.icone}</span>
              <span className="inicio-nome">{m.titulo}</span>
              <span className="inicio-desc">{m.desc}</span>
              <span className="inicio-ir">Abrir →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

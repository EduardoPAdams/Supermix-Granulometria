/**
 * Tela de login (email + senha). Os usuários são criados manualmente no
 * painel do Supabase (Authentication → Users); cadastro público fica desligado.
 */
import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import Logo from './Logo.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const entrar = async () => {
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setCarregando(false)
    if (error) setErro('Email ou senha inválidos.')
  }

  return (
    <div className="wrap">
      <div className="hdr">
        <div className="hdr-top">
          <Logo />
        </div>
      </div>
      <div className="pad">
        <div className="card login-card">
          <div style={{ fontWeight: 500, fontSize: 15, color: '#c1272d', marginBottom: 12 }}>Entrar</div>
          <div style={{ marginBottom: 10 }}>
            <div className="flbl">Email</div>
            <input className="inp" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div className="flbl">Senha</div>
            <input
              className="inp"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && entrar()}
            />
          </div>
          {erro && <div className="login-erro">{erro}</div>}
          <button className="btn-save" style={{ width: '100%' }} onClick={entrar} disabled={carregando || !email || !senha}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

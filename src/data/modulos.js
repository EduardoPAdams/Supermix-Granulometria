/**
 * Módulos do sistema e e-mail do administrador.
 * Os ids aqui são os mesmos gravados em `perfis.modulos` e checados no RLS
 * (ver supabase-acessos.sql). Módulo novo = adicionar aqui + policies no banco.
 *
 * ADMIN_EMAIL só serve pra destacar o admin no painel. Quem garante o acesso
 * de verdade é a função eh_admin() no Supabase.
 */
export const ADMIN_EMAIL = 'lab.adm@supermix.com'

export const MODULOS = [
  {
    id: 'granulometria',
    titulo: 'Granulometria',
    desc: 'Ensaios de granulometria, pulverulento e umidade dos agregados.',
  },
  {
    id: 'visita',
    titulo: 'Visita Surpresa',
    desc: 'Acompanhamento das cargas: slump, água retida, anomalias e ações tomadas.',
  },
]

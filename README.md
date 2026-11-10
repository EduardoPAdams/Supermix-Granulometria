# Laboratório — Supermix

Aplicação web do laboratório da **Supermix Concreto** que substitui as
planilhas e fichas de papel do controle de qualidade. Fica atrás de um
login e tem dois módulos, além de um painel de acessos para o administrador.

🔗 **No ar:** https://eduardopadams.github.io/Supermix-Granulometria/

## Módulos

### Granulometria

Ensaios diários dos agregados (areia, brita/pedrisco) que entram na produção.

- **Entrada**: para cada material (areia fina, areia média, diabásio,
  granito, basalto) o técnico digita a massa retida em cada peneira. O app
  calcula % retida, % retida acumulada, % passante e o **Módulo de Finura
  (MF)**, indicando se está dentro da faixa do material. A sub-aba
  **Pulv.** calcula o material pulverulento (% de finos).
- **Umidade**: várias leituras por dia; a leitura do sensor vira % de
  umidade pelas tabelas de calibração da sonda.
- **Gráfico**: MF dos últimos 30 dias por material, com a faixa ideal,
  média e contagem de dias fora da faixa.
- **Histórico**: todos os dias salvos, com **imprimir** e **exportar PDF**.

Quem tem acesso **Só ver** enxerga as quatro abas: Gráfico e Histórico com
os dados reais, e Entrada e Umidade com um **dia de exemplo** (valores
fictícios de `src/data/exemplo.js`), com todos os campos travados e sem
botão de salvar. Serve pra pessoa ter noção de como é o lançamento.

### Visita Surpresa

Versão digital da ficha de Visita Surpresa: cada visita audita uma carga
entregue.

- **Nova visita**: filial, data, NF, motorista/BT, cliente, laboratorista,
  slump da NF e obtido, água (retida, central e obra), anomalias (1 a 9 +
  Outros), ações (A, B, C) e observações. Se o slump obtido passa da faixa
  da NF, a anomalia 1 é marcada sozinha.
- **Filial** é texto livre com sugestões das filiais já lançadas. Ao
  salvar, o nome é padronizado (maiúsculas, acentos e espaços), pra
  "poa norte" e "POA Norte" não virarem duas filiais.
- **Registros**: filtro por filial, mês e busca (NF, motorista, cliente),
  editar, apagar e exportar CSV (abre direto no Excel/LibreOffice).
- **Resumo**: totais do mês, taxa de anomalia, slumps acima da faixa,
  litros de água na obra e contagem por anomalia e por ação.
- **Cada login vê só as visitas que ele lançou** (coluna `criado_por`).
  O admin vê as de todos, com a informação **Lançado por** em cada
  visita, um filtro por login em Registros e Resumo e a coluna no CSV.

## Controle de acessos

- O **administrador** (`lab.adm@supermix.com`) vê tudo e tem o cartão
  **Gerenciar acessos** na tela inicial.
- No painel, cada login tem, por módulo, um de três níveis:
  **Sem acesso**, **Só ver** ou **Ver e editar**.
- Quem tem "Só ver" não lança nem altera nada e não vê os botões de
  editar/apagar. Na Granulometria, Entrada e Umidade aparecem só como
  exemplo fictício, travado; os dados reais ficam em Gráfico e Histórico.
  Na Visita Surpresa aparecem só Registros e Resumo.
- Na **Visita Surpresa**, cada login só vê, edita e apaga as próprias
  visitas; o admin vê todas. A **Granulometria** é compartilhada: um
  registro por dia pro laboratório inteiro.
- A regra vale **no banco** (RLS do Supabase), não só na tela: sem
  permissão, o banco recusa leitura ou gravação.

**Login novo:** criar no Supabase em *Authentication → Users → Add user*
(marcar "Auto Confirm User"). Ele aparece no painel sem acesso a nada até o
admin liberar.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Front-end | React 18 + Vite, sem biblioteca de UI |
| Gráficos | SVG puro |
| Banco e login | Supabase (Postgres + Auth + RLS), região São Paulo |
| PDF | `html2canvas` + `jspdf`, carregados só quando gera o PDF |
| Deploy | GitHub Actions → GitHub Pages a cada push na `main` |

A chave do Supabase em `src/lib/supabase.js` é a *publishable* (pública
por natureza). Quem protege os dados é o RLS. **Nunca** coloque a chave
`secret`/`service_role` no front.

## Banco de dados

| Tabela | Uso |
| --- | --- |
| `registros` | Granulometria: um registro por dia (`data`, `dados` em JSON) |
| `visitas` | Visita Surpresa: uma linha por visita (`criado_por` = login que lançou) |
| `perfis` | Acessos: um por login (`modulos` = pode ver, `edicao` = pode editar) |

Scripts SQL (rodar no *SQL Editor* do Supabase):

- `supabase-visitas.sql`: cria a tabela `visitas`.
- `supabase-acessos.sql`: cria `perfis`, as funções `eh_admin()`,
  `tem_modulo()` e `pode_editar()`, o gatilho que cria o perfil de cada
  login novo e as regras de RLS de `registros` e `visitas`. Pode rodar de
  novo sem problema.

## Estrutura

```
src/
  App.jsx                  # login, permissões, tela Início e módulo Granulometria
  main.jsx                 # ponto de entrada
  index.css                # todos os estilos (cinza + vermelho Supermix)
  lib/supabase.js          # cliente do Supabase
  data/
    materials.js           # materiais, peneiras, faixas de MF, tabelas de umidade
    exemplo.js             # dia de exemplo (fictício) do modo "Só ver"
    modulos.js             # lista de módulos e e-mail do admin
  utils/
    calc.js                # granulometria, MF e pulverulento
    db.js                  # tabela registros
    dbVisitas.js           # tabela visitas
    dbPerfis.js            # tabela perfis (acessos)
    format.js              # datas e números
    storage.js             # leitura do localStorage antigo (migração)
  components/
    Login.jsx              # tela de login
    Inicio.jsx             # escolha do módulo (só os liberados)
    AdminPainel.jsx        # painel de acessos do admin
    VisitaApp.jsx          # módulo Visita Surpresa inteiro
    MigrarBanner.jsx       # sobe dados antigos do navegador pra nuvem
    SieveTable.jsx, PulvTab.jsx, UmidadeView.jsx, GraficoView.jsx
    DayReport.jsx, MatPrintCard.jsx, PulvPrintCard.jsx, Logo.jsx
  assets/                  # favicon e caminhão
```

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Não abra o `index.html` direto pelo
`file://`, a página fica em branco.

## Deploy

Todo push na `main` dispara o workflow `.github/workflows/deploy.yml`
(`npm ci` + `npm run build`) e publica no GitHub Pages
(*Settings → Pages → Source: GitHub Actions*).

- O `base` do `vite.config.js` no build é `/Supermix-Granulometria/`, com
  as maiúsculas iguais ao nome do repositório.
- Mexeu no `package.json`? Suba o `package-lock.json` junto (o workflow
  usa `npm ci`).
- Depois do deploy, teste numa aba anônima (cache do navegador).

## Notas

- Para adicionar ou ajustar um material (peneiras, faixa de MF, massa
  inicial do pulverulento), edite `src/data/materials.js`. Se mudar
  peneiras ou faixa de MF, ajuste também o exemplo em
  `src/data/exemplo.js`.
- Para criar um módulo novo: adicionar em `src/data/modulos.js` e criar as
  policies da tabela dele usando `tem_modulo('<id>')` e
  `pode_editar('<id>')`.
- Até outubro de 2026 os dados ficavam só no `localStorage`; o
  `MigrarBanner` sobe esses dias pra nuvem sem sobrescrever nada.

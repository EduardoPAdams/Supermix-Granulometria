# Supermix Granulometria

Aplicação web usada pela usina de concreto **Supermix** para o controle de
qualidade dos agregados (areia, brita/pedrisco) que entram na produção do
concreto. Substitui as planilhas/fichas de papel do laboratório por um
sistema onde o técnico lança os dados dos ensaios do dia e o app calcula
tudo automaticamente.

## O que o app faz

- **Ensaio de granulometria (peneiramento)** — para cada material (areia
  fina, areia média, diabásio, granito, basalto), o técnico digita a massa
  retida em cada peneira. O app calcula % retida, % retida acumulada, %
  passante e o **Módulo de Finura (MF)**, indicando se o resultado está
  dentro da faixa aceitável daquele material (aba **Entrada**).
- **Ensaio de material pulverulento** — a partir da massa inicial (padrão)
  e da massa final pesada após o ensaio, calcula o % de finos perdidos
  (aba **Entrada → Pulverulento**).
- **Umidade da areia** — converte a leitura do sensor de umidade em % de
  umidade, usando as tabelas de referência da areia fina e média, com
  suporte a várias leituras por dia (aba **Umidade**).
- **Gráfico** — evolução do MF de um material nos últimos 30 dias, com a
  faixa ideal destacada, média do período e contagem de dias fora da faixa.
- **Histórico** — todos os dias já salvos, com opção de **imprimir** ou
  **exportar em PDF** o relatório completo de qualquer dia.

Os dados ficam salvos no navegador (`localStorage`) — não há backend nem
banco de dados. Cada dia é salvo com uma tecla "Salvar dados do dia".

## Origem do projeto

O app começou como um único arquivo HTML (React carregado via CDN + Babel
standalone) e foi migrado para um projeto **Vite + React** com estrutura
modular, mantendo exatamente o mesmo comportamento.

## Estrutura

```
src/
  App.jsx                    # componente principal: abas, estado do dia, salvar/imprimir/PDF
  main.jsx                   # ponto de entrada (monta o App no index.html)
  index.css                  # estilos
  data/materials.js          # materiais cadastrados, peneiras, faixas de MF, tabelas de umidade
  utils/
    calc.js                  # cálculo de granulometria, Módulo de Finura e pulverulento
    format.js                # formatação de datas e números
    storage.js                # helpers de localStorage
  components/
    Logo.jsx                 # logo da Supermix no cabeçalho
    SieveTable.jsx            # tabela de peneiras (aba Entrada)
    PulvTab.jsx                # aba de material pulverulento
    UmidadeView.jsx            # aba de umidade
    GraficoView.jsx            # aba de gráfico (MF ao longo do tempo)
    DayReport.jsx               # relatório completo de um dia (impressão/PDF)
    MatPrintCard.jsx            # card de um material dentro do relatório
    PulvPrintCard.jsx           # card de pulverulento dentro do relatório
  assets/truck.png             # imagem do caminhão usada no relatório
```

Cada arquivo tem um comentário no topo explicando seu papel — comece por
`App.jsx` para entender o fluxo geral, depois `utils/calc.js` para a lógica
dos cálculos.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Build de produção

```bash
npm run build
npm run preview   # para testar o build localmente
```

## Deploy no GitHub Pages

1. Suba este projeto para um repositório no GitHub.
2. Em **Settings → Pages**, em "Build and deployment", selecione
   **Source: GitHub Actions**.
3. Ajuste o `base` em `vite.config.js` para bater com o nome exato do
   seu repositório (case-sensitive):

   ```js
   base: '/nome-do-seu-repositorio/'
   ```

4. Faça `git push` para a branch `main` — o workflow em
   `.github/workflows/deploy.yml` builda e publica automaticamente.

O app fica em `https://<seu-usuario>.github.io/<nome-do-repositorio>/`.

## Notas

- Os dados ficam salvos apenas no `localStorage` do navegador que os
  digitou — não há sincronização entre computadores nem backend.
- `html2canvas` e `jspdf` são carregados sob demanda (`import()` dinâmico)
  só quando o usuário gera um PDF, para manter o bundle inicial leve.
- Para adicionar ou ajustar um material (peneiras, faixa de MF, massa
  inicial do pulverulento), edite `src/data/materials.js`.

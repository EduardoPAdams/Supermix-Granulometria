# Supermix Granulometria

Aplicação web para controle de qualidade em usina de concreto: ensaios de
granulometria, materiais pulverulentos e umidade de areia — com geração
de relatórios prontos para impressão e exportação em PDF.

Migrada de um único arquivo HTML (React via CDN + Babel standalone) para
um projeto **Vite + React** com estrutura modular.

## Estrutura

```
src/
  App.jsx                 # componente principal (abas, estado, salvar/imprimir)
  main.jsx                # ponto de entrada
  index.css                # estilos (extraídos do <style> original)
  data/materials.js        # materiais, faixas de MF, tabelas de umidade
  utils/format.js          # formatação de datas e números
  utils/storage.js         # helpers de localStorage
  utils/calc.js            # cálculo de granulometria/MF e pulverulento
  components/
    Logo.jsx
    SieveTable.jsx          # tabela de peneiras (aba Entrada)
    PulvTab.jsx             # aba de material pulverulento
    UmidadeView.jsx         # aba de umidade
    DayReport.jsx           # relatório completo (impressão/PDF)
    MatPrintCard.jsx        # card de material no relatório
    PulvPrintCard.jsx       # card de pulverulento no relatório
  assets/truck.png          # imagem do caminhão (antes em base64 inline)
```

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

- Os dados continuam salvos no `localStorage` do navegador (mesmo
  comportamento do arquivo original) — não há backend.
- `html2canvas` e `jspdf` são carregados sob demanda (`import()` dinâmico)
  só quando o usuário gera um PDF, para manter o bundle inicial leve.

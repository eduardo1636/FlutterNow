# F00 — Estabilização técnica

## Escopo implementado
- Extração do registry e dados do projeto para `src/editor/project.js`.
- Extração do componente de prévia para `src/editor/PreviewNode.jsx`.
- Extração do gerador React para `src/editor/codegen.js`.
- Extração do download de arquivos para `src/editor/download.js`.
- Importação JSON legada com validação de estrutura, tipos e IDs, preservando `flutternow-project-v1`.
- Tratamento de erro na gravação local, indicando exportação de backup.
- ESLint, Prettier, configuração TypeScript gradual, testes Vitest e workflow de CI.

## Como verificar no VSCodium

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

Teste manual: adicione e arraste componentes; altere propriedades; use desfazer/refazer; troque dispositivos; exporte App.jsx e JSON; reimporte JSON; dê reload e confirme persistência.

## Limitações e decisões pendentes
- A migração integral para TypeScript estrito dos componentes e do modelo está prevista em F01. A configuração F00 usa `allowJs` e `checkJs: false`, portanto o comando typecheck ainda não valida estritamente os arquivos JavaScript legados.
- Ainda falta um `package-lock.json` gerado por instalação com rede. Até sua inclusão, a CI usa `npm install` e pode resolver versões permitidas diferentes. Após a primeira instalação local, versionar o lockfile e migrar CI para `npm ci`.
- Como o ambiente de criação não consegue acessar o registro npm, os testes de instalação, lint, build e Vitest devem ser confirmados pela CI e/ou máquina local antes do merge.
- O formato JSON sem `schemaVersion` é aceito apenas como compatibilidade legada. A próxima fase introduzirá o documento versionado e migrações.
- O código exportado ainda é um componente `App.jsx`, não um projeto completo.

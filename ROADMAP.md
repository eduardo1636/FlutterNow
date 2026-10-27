# FLUTTERNOW — PLANO MESTRE DE PRODUTO E ENGENHARIA
**Versão do plano:** 1.0 — 27/10/2026  
**Status:** planejamento aprovado para consulta; implementação em etapas mediante execução acompanhada.  
**Repositório:** https://github.com/eduardo1636/FlutterNow

## 0. Visão, posicionamento e limites
FlutterNow será um construtor visual **web-first** que gera projetos React/Vite/TypeScript exportáveis. O usuário arrasta componentes, organiza páginas, configura responsividade, eventos, estados e integrações, testa uma aplicação real e exporta seu código completo.
- Diferenciais: interface prioritariamente em português; baixo atrito; projeto de usuário portátil em JSON versionado; exportação sem dependência de runtime proprietário; design system; caminho para APIs e mobile.
- Inicialmente **não gera Flutter/Dart nativo**. O caminho mobile prioritário será o app web empacotado via Capacitor (WebView com APIs nativas); geração React Native/Expo ou Flutter/Dart é uma decisão técnica e um novo gerador, condicionada a viabilidade demonstrada.
- Métrica norte: usuário novo consegue criar, testar, reabrir e exportar uma aplicação funcional sem tocar no código.
- Sem serviços pagos, assinaturas ou deploy com cobrança sem autorização explícita.

## 1. Benchmark pesquisado (outubro/2026)
| Plataforma | Capacidades observadas | Lição para FlutterNow |
|---|---|---|
| FlutterFlow | árvore de widgets, propriedades, actions, state, APIs, testes, exportação, colaboração e deploy | lógica visual e experiência unificada |
| Bubble | workflows, banco de dados, regras de acesso, criação web/mobile | produto completo, não só protótipo |
| Webflow | design tokens, componentes reutilizáveis, estilos e biblioteca | sistema de design como fundamento |
| Framer | editor de alta fluidez, CMS, IA diretamente no canvas | UX fluida e edição assistida |
| Draftbit | editor integrado, exportação React Native/Expo, GitHub, histórico | código portável e controle de versão |
| WeWeb | builder + workflows + APIs + exportação / self-host | portabilidade de backend e publicação |
| Adalo | canvas multi-tela, banco de dados e publicação mobile | descoberta e criação de telas intuitivas |
| Puck | editor open-source React, composição aninhada, armazenamento em JSON, licença MIT | possível acelerador de editor; fazer prova de conceito antes de adotar |

Fontes oficiais:
- https://docs.flutterflow.io/flutterflow-ui/builder/
- https://www.flutterflow.io/
- https://bubble.io/mobile/
- https://help.webflow.com/hc/en-us/articles/41959932025235-Using-a-design-system-in-Webflow
- https://www.framer.com/
- https://draftbit.com/platform/
- https://www.weweb.io/
- https://pt.adalo.com/
- https://puckeditor.com/docs

## 2. Auditoria da base atual — confirmado no repositório
- Arquivos atuais: package.json, vite.config.js, index.html, src/main.jsx, src/App.jsx, src/style.css, README.md, .gitignore.
- React 18 + Vite 5 declarados; TypeScript está como dependência, mas editor em JSX; sem scripts formais de lint, typecheck, teste ou CI.
- Editor: 8 tipos básicos (heading, text, button, input, card, image, divider, spacer), canvas de coluna única, propriedades, dispositivos, ordenação, JSON import/export e exportação de um componente App.jsx.
- Persistência: localStorage (um projeto por chave; não é nuvem, não oferece backup automático remoto).
- Problema arquitetural: App.jsx ~18,7 KB centraliza modelo, operações, renderer, exportador e UI; CSS está condensado; não há schema versionado, árvore aninhada, múltiplas páginas, testes ou preview isolado.
- Não foi feita compilação nem execução local nesta auditoria. O estado anterior deve ser marcado como baseline; testar o build na etapa 0.
- Preservar e migrar os projetos salvos em JSON e no localStorage; nunca descartar sem exportação/backup.

## 3. Decisões estruturais (ADRs)
**ADR-01 — Modelo canônico:** documento JSON versionado descrevendo projetos, páginas, componentes, estilos, eventos, state, fontes de dados, tokens e assets. Preview, editor e exportadores consomem esse mesmo documento. Proibir um renderer com lógica diferente do codegen.
**ADR-02 — Árvore:** cada página tem uma árvore de nós identificados por UUID. Contêineres possuem children. Mover, excluir, copiar e inserir usam comandos testáveis com validação estrutural (proibir ciclos e pais incompatíveis).
**ADR-03 — Comandos:** usar store com history/undo/redo e transações; cada ação possui nome, payload e validador. Não escrever mutações dispersas em JSX.
**ADR-04 — Registry:** cada tipo de componente declara schema, valores padrão, limites, regras de children, editor de propriedades, preview renderer e adaptadores de codegen.
**ADR-05 — Segurança:** nunca executar código de projeto fornecido pelo usuário no processo principal do editor; usar sandbox isolado, CSP e allowlist. Não executar expressões arbitrárias via eval ou Function. Chaves privadas somente em backend.
**ADR-06 — Portabilidade:** exportação React/Vite TS funcional, testes de build automatizados, manifesto de dependências e assets incluídos. Codegen determinístico para mesmo documento.
**ADR-07 — Mobile:** Capacitor primeiro; output é app híbrido, não Flutter nativo. Futuro gerador Flutter/Expo somente após spike e matriz de compatibilidade de componentes.
**ADR-08 — Integração com backend:** conexão segura, RLS e permissões, separar configuração de credenciais. Modo local sempre útil.
**ADR-09 — Biblioteca:** comparar Puck (MIT) vs editor próprio com @dnd-kit/react; decidir por prova de conceito curta, verificando compatibilidade com eventos, state e múltiplos codegens.
**ADR-10 — Evolução:** pacotes organizados em workspace apenas quando melhorarem isolamento; evitar microserviços prematuros.

## 4. Arquitetura-alvo
\`\`\`
src/
  app/               # rotas, layout, providers, inicialização
  editor/
    canvas/          # renderizador e overlays de edição
    interactions/    # seleção, zoom, drag/drop e atalhos
    inspector/       # propriedades
    panels/          # paleta, árvore, assets, páginas, histórico
  core/
    document/        # types, schemas, migrações
    commands/        # insert, move, update, delete, duplicate, undo
    registry/        # catálogo e contratos de componentes
    bindings/        # expressões seguras e resolvedores
    workflows/       # modelo/validação/executor
    styles/          # tokens e responsividade
  preview/           # runner isolado
  codegen/
    react-vite/      # gerador completo e testes de build
    capacitor/       # embalagem mobile posterior
  storage/           # IndexedDB + import/export + cloud adapter
  services/          # autenticação, projetos, APIs, assets
  ui/                # design system do próprio FlutterNow
tests/               # unit, integration, e2e, fixtures
docs/                # ADRs, tutoriais, arquitetura, contratos
.github/workflows/   # CI
\`\`\`
Alvos iniciais: React + Vite + TypeScript (editor), Zod (schemas e entrada), Zustand ou equivalente (store), @dnd-kit/react (gestos/teclado), Vitest + React Testing Library (unidade), Playwright (E2E), IndexedDB (persistência local robusta), Prettier + ESLint, GitHub Actions. Avaliar Puck antes de consolidar o DnD. React Flow somente para editor de workflows; Sandpack/iframe isolado para preview executável conforme avaliação de segurança e custo.

## 5. Contrato mínimo do documento (ilustrativo)
\`\`\`json
{
  "schemaVersion": 1,
  "id": "app-id",
  "name": "Meu aplicativo",
  "settings": { "locale": "pt-BR", "themeId": "default" },
  "pages": [{ "id": "home", "route": "/", "rootNodeId": "root" }],
  "nodes": {
    "root": {
      "id": "root",
      "type": "Column",
      "children": ["title"],
      "props": {},
      "styles": { "base": {}, "tablet": {}, "desktop": {} },
      "events": {}
    },
    "title": {
      "id": "title",
      "type": "Text",
      "children": [],
      "props": { "text": "Olá, mundo" },
      "styles": { "base": {} },
      "events": {}
    }
  },
  "tokens": { "color": {}, "spacing": {}, "typography": {} },
  "variables": [],
  "dataSources": [],
  "workflows": [],
  "assets": []
}
\`\`\`
Nota: é proposta de formato, não estrutura já implementada. Deve receber versão, esquema Zod, migração do modelo v0.1 e testes de round-trip.

## 6. Fases executáveis e critérios de conclusão

### F00 — Estabilizar o MVP (P0)
Entregas:
- Corrigir eventuais falhas de instalação/build da base; fixar versões compatíveis e gerar lockfile.
- CI GitHub Actions com install, lint, typecheck, testes e build; configuração ESLint/Prettier.
- Refatorar CSS legível, remover imports mortos, separar App em componentes e corrigir UX básica.
- Capturar fixtures do JSON v0.1 e fluxo de backup; documentar execução Windows/VSCodium.
- README com screenshots e limitações honestas.
Aceite: instalação limpa e build CI passam; adicionar/editar/reordenar/exportar não regrediu; fixture v0.1 abre.

### F01 — Domínio do documento e motor de comandos (P0)
Entregas:
- TypeScript estrito; schemas, migrations, IDs estáveis, normalização de árvore.
- Comandos insert, move, clone, delete, setProp, setStyle, batch e históricos.
- Seleção independente, histórico transacional, erro recuperável e tests unitários.
- Export/import de JSON versionado com feedback e tolerância controlada a projetos antigos.
Aceite: árvore com 3 níveis, sem ciclos, round-trip JSON estável, undo/redo reconstituindo projeto corretamente, migração de todas as fixtures.

### F02 — Canvas profissional e aninhamento (P0)
Entregas:
- Comparar Puck vs DnD próprio em spike registrado com tradeoffs.
- Coluna, linha, stack, container, section, grid; drop em filhos compatíveis e mover entre pais.
- Árvore visual sincronizada; zoom/pan, breadcrumbs, seleção e multi-seleção.
- Arrastar do catálogo, placeholder de drop, teclas, copiar/colar, alinhamento, duplicação.
- Dispositivo mobile/tablet/desktop com breakpoints reais; canvas e preview distintos.
Aceite: criar dashboard com grids e componentes aninhados por arrastar; salvar/reabrir sem perder hierarquia; navegação por teclado em operações essenciais.

### F03 — Design System e editor de propriedades (P0)
Entregas:
- Tokens globais de cor, spacing, radii, fonts, sombras e temas light/dark.
- Propriedades tipadas por widget, controles contextualizados, unidades CSS seguras.
- Flexbox/grid, alinhamento, tamanhos min/max, overflow, padding/margin, estados hover/focus/disabled.
- Breakpoints com herança e overrides; presets e redefinição de propriedades.
- Validação de acessibilidade (contraste, labels, foco) com avisos.
Aceite: alterar token muda todas as instâncias; mesmos componentes se adaptam a 3 breakpoints; propriedades inválidas são rejeitadas sem corromper projeto.

### F04 — Catálogo robusto e componentes reutilizáveis (P0)
Entregas:
- Registry declarativo e pelo menos 25 widgets inicialmente: texts, icons, image, buttons, inputs, checkbox, switch, select, tabs, cards, containers, list, grid, alert, modal, nav, forms etc.
- Widgets de formulário acessíveis e estilizáveis; snippets e templates de seção.
- Componentes customizados com propriedades expostas, instâncias e versões.
- Galeria de assets com upload e política de links/formatos.
Aceite: construir uma tela de login e um painel gerencial completos sem editar o código; instâncias recebem mudanças no componente-base.

### F05 — Projetos, páginas e navegação (P0)
Entregas:
- Tela inicial com criação, duplicação, busca, arquivamento e import/export de projetos.
- Gerenciador de páginas, rotas, parâmetros, página inicial, links e histórico de navegação.
- Editor de navegação com ações e breadcrumbs/preview independente.
- Temas e templates de aplicativos (CRM, agenda, finanças, tarefas, landing).
Aceite: aplicativo de 3 páginas com navegação clicável no preview e projeto reaberto.

### F06 — Armazenamento local confiável e versionamento (P0)
Entregas:
- Migrar localStorage para IndexedDB, autosave debounce e indicadores reais de erro/salvamento.
- Snapshot/restore, histórico local de versões, backup JSON/ZIP, migrações.
- Tratamento de quota, sessão interrompida, recuperação de rascunho e conflito de abas.
Aceite: 100 alterações e reload sem perda; testes de queda durante save; backup reabre; nenhum dado é apagado silenciosamente.

### F07 — Codegen React completo e preview seguro (P0)
Entregas:
- Gerador por registry a partir do mesmo schema canônico; outputs legíveis e determinísticos.
- ZIP contendo Vite/React/TS, package.json, lockfile, assets, rotas, tokens e componentes.
- Preview de app real em ambiente isolado, erros de compilação contextualizados e console do usuário.
- Separação editor/preview para prevenir ação de editor ao clicar no aplicativo.
- Build smoke-test automático de projetos exportados (fixtures).
Aceite: exportar template, npm install + npm run build passam; layout, rotas e estilos batem com preview; nenhum segredo exportado.

**GATE ALPHA — editor útil de verdade:** F00–F07 concluídas; usuário monta e exporta app React web multipágina com layouts aninhados.

### F08 — Variáveis, estado e ações visuais (P1)
Entregas:
- Estado global/local, variáveis tipadas e derivadas; expressions DSL seguras (sem eval).
- Action Flow visual com nós trigger, condition, setState, navigate, alert, modal, validate, fetch.
- Workflow com mensagens de erro, loading, regras de escopo, loop protections e debug step-by-step.
- React Flow apenas se o editor em grafo trouxer benefício; exportar funções TS equivalentes.
Aceite: formulário interativo valida input, altera estado, muda página e exibe sucesso/erro no app exportado.

### F09 — Dados e integrações (P1)
Entregas:
- Datasources REST, import OpenAPI selecionado, variáveis de ambiente e headers.
- CRUD com query builder básico; estado de loading/error/empty, paginação/filtros.
- Supabase adapter opcional com Auth, Postgres, Storage, RLS e perfis de acesso.
- Segredos e proxies seguros em funções backend; nunca guardar tokens sensíveis no documento público.
- Testes com API mockada, falhas de rede, retries e políticas de acesso.
Aceite: app de tarefas com login, criação, edição, exclusão e persistência por usuário, sem exposição entre contas.

### F10 — Qualidade, depuração e experiência (P1)
Entregas:
- Console de runtime, painel de erros, inspector de estado, testes de projeto, diagnósticos e logs.
- Atalhos, histórico, onboarding, tutoriais, documentação, pesquisa de componentes.
- Internacionalização pt-BR e en-US, responsividade do próprio editor e acessibilidade WCAG 2.2 AA nas rotas essenciais.
- Monitoramento de performance em builds locais e CI; verificar projetos com 100–300 nós.
Aceite: fluxo de 15 minutos de usuário novo documentado e reproduzível; sem erros críticos no E2E; relatório de a11y e performance.

### F11 — Contas e nuvem (P1)
Entregas:
- Login do construtor, workspace pessoal, organização por projeto; sincronização local↔nuvem.
- Supabase ou backend equivalente com row-level security, backups, versões e quotas.
- Estratégia de conflito offline-online, auditoria de alterações e exclusão/recuperação.
- Publicação de política de privacidade caso terceiros usem serviço hospedado.
Aceite: login de dois usuários isolados; restaurar projeto em segundo navegador; negar acessos cruzados por testes automáticos.

### F12 — Publicação web e integração GitHub (P1)
Entregas:
- Preview compartilhável somente por escolha explícita.
- Publicar apps com build de produção, domínio/HTTPS, ambientes staging/prod, variáveis de ambiente.
- GitHub export: repositório e branch selecionados, PRs e commits sem sobrescrever alterações externas.
- Reversão a versão anterior e diagnóstico de build.
Aceite: app publicado, acessível por URL, atualizável e reversível; exportação GitHub com diff verificado.

**GATE BETA — app de negócio funcional:** F08–F12 concluídas; login, dados, ações e deploy web operacionais.

### F13 — Mobile realista (P2)
Entregas:
- Primeiro Progressive Web App; depois geração de projeto Capacitor Android/iOS.
- Capacitor com tela inicial, ícone, splash, deep links e políticas de permissões.
- Integrações nativas selecionadas por plugins (câmera, push, armazenamento etc.), quando compatíveis.
- Pipeline de builds em ambiente apropriado; Android SDK/Android Studio e iOS macOS/Xcode ou CI Mac.
- Matriz de compatibilidade com aviso por componente/ação: web, Android, iOS.
Aceite: app demonstrativo instalado num dispositivo Android físico e testado; documentação descreve com precisão o caráter híbrido.

### F14 — Colaboração e governança (P2)
Entregas:
- Comentários por componente, compartilhamento de projeto e papéis (owner/editor/viewer).
- Presença e colaboração simultânea com Yjs (CRDT) ou abordagem equivalente; resolução de conflitos.
- Versionamento visual, branches de projeto/merge conforme maturidade, trilha de auditoria.
Aceite: dois usuários alteram elementos diferentes simultaneamente sem perder dados; permissões são aplicadas no servidor.

### F15 — IA como recurso opcional (P2)
Entregas:
- Gerar telas e layouts por prompt, com schema-constrained output e preview de diff antes de aplicar.
- Assistente contextual para explicar erros, sugerir componentes e criar workflows.
- Interface de provedores, controles de orçamento/créditos, autorização e rate limits.
- Prompts e dados não enviados a terceiros sem consentimento informado; sem API key no cliente.
Aceite: prompt gera documento válido; usuário aprova/rejeita alterações; toda operação reversível; limites de gasto ativos.

### F16 — Ecossistema, escala e alvos alternativos (P3)
Entregas:
- Marketplace curado de templates/plugins, SDK para widgets customizados, documentação pública.
- Biblioteca de componentes compartilhada, templates por setor, APIs para automação.
- Spike React Native/Expo e Flutter/Dart como **geradores separados**; começar com subconjunto suportado e golden tests.
- Métricas de produto, monitoramento, escalabilidade e modelo de negócios apenas se houver interesse.
Aceite: extensão adiciona componente sem modificar editor; qualquer novo gerador mostra matriz precisa de funcionalidades suportadas e produz build executável do subset.

## 7. Gates de lançamento (não confundir entregas com garantia de funcionamento)
- **Alpha (F00–F07):** usuário monta app web com 3 páginas, layouts aninhados, salva/reabre, exporta ZIP e passa npm run build.
- **Beta (F08–F12):** CRUD autenticado, workflows, URL publicada, conta/projetos, testes críticos passam.
- **Mobile Preview (F13):** APK de teste Android a partir de app gerado, não código Flutter/Dart nativo.
- **Produto avançado (F14–F16):** multiplayer, IA, extensões após métricas e testes das fases anteriores.

## 8. Padrões de engenharia obrigatórios por entrega
Cada fase será um PR próprio, com descrição, screenshots/video curto se visual, checklist de migração, testes e impacto em performance; merge apenas se passar gates.
- CI: lint, typecheck, unit, build, E2E dos fluxos críticos e smoke-build de pelo menos 2 projetos gerados (após F07).
- Cobertura alvo de 80% dos módulos core/document/commands/workflows, sem perseguir percentual global artificial.
- Testes de acessibilidade nas rotas críticas, auditoria de dependências, validação de import/export e testes de regressão do JSON.
- Integridade: backups antes de migração de schema e fallback seguro se dados forem inválidos.
- Segurança: dados e credenciais fora do repositório, URLs verificadas, downloads próprios isolados, políticas de compartilhamento explícitas, limitação de recursos no preview.
- UX: edição com latência percebida baixa, interações fluidas com 100 nós em equipamento de referência; definir orçamento em laboratório após benchmark F02, não prometer 60fps em qualquer hardware.
- GitHub: branches por fase, README atualizado, ADRs e CHANGELOG, tags de versões semânticas.
- Decisões irreversíveis/custos devem ser explicitamente aprovados pelo mantenedor antes da adoção.

## 9. Roadmap de entregas em ordem
**Primeira sequência de execução recomendada:** F00 → F01 → F02 → F03 → F04 → F05 → F06 → F07.  
Depois: F08 → F09 → F10 → F11 → F12.  
Por último: F13 → F14 → F15 → F16.

Não somar integração IA + mobile nativo + colaboração antes do modelo de documento, engine e codegen estarem comprovados.

## 10. Riscos e mitigação
| Risco | Impacto | Mitigação |
|---|---|---|
| Copiar concorrente superficialmente | escopo infinito | diferenciais e gates definidos |
| JSON sem versão | perda de projetos | Zod, migrações, fixtures e backups |
| Editor e exportação divergentes | projeto quebrado | AST canônica e golden tests |
| Execução de código não confiável | incidente de segurança | sandbox isolado e CSP |
| DnD complexo com bugs | UX insatisfatória | spike Puck vs DnD, testes e keyboard support |
| Precificação de SaaS/APIs | despesas inesperadas | local-first, limites, aprovação prévia |
| Prometer app Flutter quando geramos WebView | expectativa incorreta | matriz de alvos, comunicação explícita |
| Sincronização sobrescrever trabalho | perda de código | branch + PR + diff e modo export-first |
| Crescimento do bundle e tempo de editor | lentidão | lazy loading, profiling e budgets |

## 11. Primeiro sprint a executar quando solicitado
**F00 — Estabilização técnica**, nesta ordem:
1. Criar branch de trabalho e registrar estado baseline (nenhuma alteração destrutiva na main).
2. Instalar dependências e executar o projeto em ambiente verificável.
3. Configurar lockfile, TS em modo estrito, ESLint, Prettier, Vitest e CI.
4. Separar registry, render e gerador do componente monolítico mantendo comportamento.
5. Criar fixtures do JSON atual e testes dos 8 widgets, CRUD visual, undo/redo e export.
6. Verificar build/testes, registrar resultado no PR e aguardar validação visual antes do merge.
**Definição de pronto:** CI verde, nenhuma regressão de funcionamento básico, plano de migração preparado para F01.

## 12. Links de referência técnica
- Puck: https://puckeditor.com/docs
- dnd-kit: https://dndkit.com/react/quickstart/
- Sandpack: https://sandpack.codesandbox.io/docs
- Capacitor: https://capacitorjs.com/docs
- Yjs: https://docs.yjs.dev/
- FlutterFlow docs: https://docs.flutterflow.io/flutterflow-ui/builder/

---
**Regra de execução:** atacar uma fase por vez, verificar o resultado no repositório, e nunca declarar uma etapa concluída somente porque os arquivos foram gravados no GitHub. Compilação, testes e evidência são requisitos de conclusão.

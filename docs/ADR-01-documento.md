# ADR-01 — Documento canônico versionado e comandos transacionais

**Decisão:** usar JSON de projeto (\`schemaVersion=1\`) como única fonte de dados. Pages referenciam raízes de uma árvore de widgets normalizada por IDs. Um motor puro aplica comandos imutáveis; um reducer mantém undo/redo.

**Motivos:** tornar possível suporte a elementos aninhados, rastreabilidade das alterações, geração de código consistente e migração segura de arquivos anteriores. Uma lista plana global não consegue representar hierarquia sem convenções frágeis.

**Alternativas avaliadas:** DOM/JSX como estado (difícil serializar de modo seguro), arrays aninhados mutáveis (movimentação, lookup e referências mais complexos), objeto normalizado por ID (escolhido).

**Consequências:** validação e reconstrução total do documento após cada comando traz custo proporcional ao tamanho do projeto; é aceitável nesta fase. Introduzir índices incrementais e perfis de desempenho somente quando houver testes mostrando gargalos. O canvas ainda usa projeção legada durante a F01.

**Riscos mitigados:** esquema versionado rejeita versões futuras desconhecidas; comando inválido não modifica estado; migração mantém backup; importação não executa scripts. A geração futura não deve usar \`eval\` com expressões do usuário.

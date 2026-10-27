# FlutterNow — Etapa F01: Documento e comandos

## Objetivo e status

A F01 introduz o **modelo canônico do projeto**, uma árvore de nós com IDs estáveis e um histórico transacional de comandos. A F01 **não** implementa ainda o drag-and-drop dentro de containers (F02), páginas visuais (F05) nem a exportação de layouts complexos (F07).

### Componentes implementados

| Arquivo | Responsabilidade |
|---|---|
| \`src/core/document.ts\` | contrato TypeScript, validadores, importação, serialização e migração do JSON antigo |
| \`src/core/commands.ts\` | comandos atômicos e imutáveis de edição |
| \`src/core/session.ts\` | undo/redo com até 60 snapshots |
| \`src/core/persistence.ts\` | persistência v1 (nova chave local), migração e backup do formato legado |
| \`tests/f01-document.test.js\` | testes de migração, invariantes, comandos, histórico e armazenamento |

## Modelo v1

- \`schemaVersion: 1\` — versões desconhecidas são **rejeitadas** sem sobrescrever os dados locais.
- \`pages\` — coleção de páginas (\`id\`, \`name\`, \`route\`, \`rootId\`, \`style\`).
- \`activePageId\` — página atualmente ativa.
- \`nodes\` — tabela de nós por ID, com \`id\`, \`type\`, \`props\`, \`styles.base/tablet/desktop\` e \`children\`.
- Cada raiz precisa ser uma \`column\` e não pode ser filha de outro nó.
- Cada nó pertence a no máximo um pai e a uma página; ciclos, órfãos, IDs inválidos e folhas com filhos são rejeitados.
- Limites iniciais: 1.500 nós, até 32 níveis e até 100 páginas por documento.

Para simplificar F01, o modelo usa um registro de tipos de componentes estático e mantém a validação de propriedades baseada em valores seguros (string/number/boolean). O registro extensível com schemas específicos será implementado nas próximas fases.

## Comandos

\`applyCommand(document, command)\` devolve um **novo documento** após validação. Se alguma operação é inválida, ela lança erro e não altera o documento anterior.

Comandos: \`insert\`, \`move\`, \`duplicate\`, \`remove\`, \`setProp\`, \`setStyle\`, \`setPageStyle\`, \`setName\`, \`replace\` e \`batch\` (transação).

A sessão \`createSession()\` + \`reduceSession()\` implementa \`commit\`, \`undo\` e \`redo\`. Uma ação após desfazer invalida a pilha de refazer.

## Estratégia de migração sem perda

1. A chave antiga \`flutternow-project-v1\` permanece intacta.
2. Se existe um projeto na chave atual \`flutternow-project-v2\`, ele é validado antes de abrir.
3. Se não há chave atual e existe legado válido, ele é convertido em v1, com coluna raiz e todos os elementos legados como filhos na mesma ordem; é mantida cópia em \`flutternow-backup-v01\`.
4. Se há projeto atual corrompido/incompatível, o aplicativo impede salvamento automático daquela sessão, preserva a chave original e exibe aviso.
5. É possível importar JSON legado ou versionado e exportar o documento completo.
6. Todo save usa \`serializeDocument()\` e valida novamente o projeto.

**Atenção:** o backup continua armazenado no mesmo navegador. Por segurança, faça backup externo utilizando o botão **Projeto**, que baixa JSON completo.

## Experiência visual F01

O editor existente continua apresentando os elementos diretos do container raiz. Se o documento tiver outras páginas ou containers aninhados, o aplicativo mostra um aviso. A exportação/copiar código React ficam indisponíveis para esses documentos, pois a versão antiga do gerador não contempla seus componentes internos. Exportar JSON continua possível.

## Testes de aceitação

\`\`\`bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
\`\`\`

Validar manualmente:

- Abrir a versão antiga com tarefas e componentes salvos.
- Reordenar, editar, duplicar e excluir componentes e verificar undo/redo.
- Recarregar a página e confirmar persistência sem trocar ordem ou perder estilos.
- Exportar JSON e reimportá-lo; verificar que o projeto volta inteiro.
- Testar importação inválida e confirmar que o projeto original não é apagado.
- Conferir novo aviso ao importar documento com container aninhado.

## Fora de escopo

- Editor visual de containers aninhados e navegação pela árvore (F02).
- Estilos responsivos visuais completos (F03).
- Criação/edição de múltiplas páginas pela UI (F05).
- Projetos sincronizados na nuvem (F11).
- Gerador React com código de árvore e rotas (F07).

A F01 é a fundação para essas capacidades, não o lançamento visual delas.

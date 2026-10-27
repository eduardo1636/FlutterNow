# F01 — Modelo de documentos e comandos

## Entregas implementadas

O FlutterNow passou a usar o documento **canônico com schemaVersion 1** internamente, no lugar da lista simples de elementos do formato v0.1. A interface ainda exibe uma projeção plana da página ativa até que o canvas aninhado seja desenvolvido na F02.

Estrutura principal:
- \`src/core/document.ts\`: tipos TypeScript estritos, validação estrutural, migração, serialização e projeção de compatibilidade.
- \`src/core/commands.ts\`: comandos atômicos com validações para inserção, movimentação, remoção de subárvore, duplicação, edição de estilos/propriedades e transações em lote.
- \`src/core/session.ts\`: sessão imutável com histórico undo/redo de até 60 entradas.
- \`src/core/persistence.ts\`: migração e carregamento local protegidos, além do armazenamento da nova versão.
- \`src/App.jsx\`: usa o novo motor; as funções antigas de mutação de arrays e o histórico manual foram removidos.
- \`tests/f01-document.test.js\`: testes de profundidade, ciclos, migração, atomicidade, histórico e salvamento.

## Contrato do documento v1

\`\`\`json
{
  "schemaVersion": 1,
  "id": "project-123",
  "name": "Meu aplicativo",
  "activePageId": "page-home",
  "pages": [
    {
      "id": "page-home",
      "name": "Página inicial",
      "route": "/",
      "rootId": "root-home",
      "style": { "background": "#ffffff", "padding": 22, "gap": 16 }
    }
  ],
  "nodes": {
    "root-home": {
      "id": "root-home",
      "type": "column",
      "props": {},
      "styles": { "base": {} },
      "children": ["text-home"]
    },
    "text-home": {
      "id": "text-home",
      "type": "text",
      "props": { "text": "Olá!" },
      "styles": { "base": {} },
      "children": []
    }
  }
}
\`\`\`

As páginas referenciam raízes. Containers (\`column\`, \`row\`, \`container\`) podem possuir filhos; widgets de conteúdo não podem. Cada nó tem somente um pai. Nós inacessíveis, ciclos, IDs reservados e profundidade acima de 32 são inválidos.

## Regras de persistência e migração

1. A versão nova usa \`localStorage["flutternow-project-v2"]\`; o sufixo \`v2\` diferencia a chave antiga, não corresponde ao \`schemaVersion\`.
2. Se houver um projeto canônico válido, ele é carregado.
3. Se houver somente dados da versão antiga, eles são convertidos e é gravado um backup independente em \`flutternow-backup-v01\`. O conteúdo original em \`flutternow-project-v1\` **nunca é apagado**.
4. Se o projeto existente estiver inválido ou o backup não puder ser feito, o salvamento automático entra em modo protegido para impedir substituições acidentais.
5. O botão **Projeto** exporta o JSON canônico. Importar aceita tanto arquivos v0.1 como schemaVersion 1.
6. A serialização canônica inclui todos os nós, inclusive aqueles que a interface F01 ainda não consegue editar visualmente.

O salvamento segue no navegador, não é banco de dados ou sincronização em nuvem.

## Limitações desta fase

- Não existe canvas com drag-and-drop aninhado. O editor visual ainda representa os filhos diretos da coluna raiz da página ativa.
- A exportação de código \`App.jsx\` continua adequada a páginas simples. Para documentos com múltiplas páginas ou containers adicionais, o botão fica desabilitado até a evolução do gerador.
- Estilos responsivos fazem parte do modelo, mas sua edição visual e rendering por breakpoint são entregas da F03.
- A interface ainda não permite adicionar páginas visualmente (F05), embora o documento esteja preparado.
- Testes CI e build não substituem a validação manual no navegador.

## Critérios de aceite manual

1. Abra o projeto já salvo na versão anterior: textos, cores e ordem devem permanecer.
2. Acrescente, mova, duplique, exclua e edite os oito tipos de componentes atuais.
3. Desfaça/refaça várias ações e confirme os resultados.
4. Atualize a página, verifique que tudo permaneceu salvo e que o indicador não mostra falha.
5. Exporte JSON novo, reimporte, atualize a página e confirme conteúdo.
6. Se tiver o JSON antigo, importe-o e confirme migração.
7. Confira no DevTools / Application > Local Storage as chaves de backup e nova versão.

## Gate de conclusão

Só mesclar na \`main\` após CI com lint, typecheck, testes e build verdes **e** confirmação da experiência no VSCodium. Após F01 validada, F02 poderá implementar canvas e árvore aninhados utilizando o mesmo motor.

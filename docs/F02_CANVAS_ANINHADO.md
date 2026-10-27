# F02 — Canvas aninhado e árvore de componentes

## Entrega
O editor FlutterNow agora renderiza a **árvore canônica** do documento v1, preservando os dados existentes.

- Paleta: **Container**, **Linha** e **Coluna** junto dos elementos anteriores.
- Adicionar por clique à raiz ou ao container selecionado, ou arrastar de qualquer seção até um slot de inserção.
- Aninhamento de componentes até o limite de profundidade do motor (32 níveis); IDs únicos e sem ciclos.
- Arrastar elementos para slots antes/depois dos demais e para containers em profundidade.
- Painel **Árvore** à esquerda com seleção, recolhimento e destino de drop nos containers.
- Painel de propriedades permite editar cor de fundo, padding, gap, raio e altura mínima de layouts; permite trocar container pai e reordenar por botões.
- Zoom controlado entre 50% e 150%, prévia de layout e largura para celular/tablet/desktop.
- Undo/redo, importação, exportação JSON e persistência v1 mantidos.
- Exportação de código React **bloqueada** quando há containers ou múltiplas páginas, para evitar geração incompleta. A geração completa fica na F07.

## Arquitetura
- \`src/editor/layout.js\`: contratos de widget de layout, CSS e auxiliares de parentesco.
- \`src/editor/canvas/CanvasTree.jsx\`: renderização recursiva e slots com HTML5 drag-and-drop.
- \`src/editor/canvas/LayerTree.jsx\`: navegador hierárquico de camadas.
- \`src/App.jsx\`: integração do editor com os comandos já implementados em F01.
- \`tests/f02-canvas.test.js\`: testes de hierarquia, estilos, movimentação, duplicação e undo/redo.

## Como validar no VSCodium

\`\`\`powershell
git fetch origin
git switch --track origin/feat/f02-canvas-aninhado
npm ci
npm run dev
\`\`\`

Se a branch já existir localmente, use \`git switch feat/f02-canvas-aninhado\` e \`git pull --ff-only\` antes de instalar.

Cenário manual de aceitação:

1. Clique em **Linha** na paleta e confirme que surgiu no canvas.
2. Selecione essa linha e clique em **Coluna** duas vezes. A linha deverá apresentar duas colunas.
3. Arraste **Título** para a primeira coluna e **Botão** para a segunda; confirme a presença na árvore.
4. Selecione uma coluna e altere fundo, padding, espaçamento e arredondamento no inspector.
5. Arraste o título para a segunda coluna, duplique o botão e reordene usando **Subir/Descer**.
6. Use **Desfazer/Refazer** e confirme que a árvore e a prévia se mantêm sincronizadas.
7. Salve um JSON, recarregue a página, reabra o projeto e confirme a mesma hierarquia.
8. Experimente zoom e os formatos celular/tablet/desktop; clique em **Prévia**.
9. Confirme que, com layouts aninhados, o botão de exportação React está desabilitado, mas exportação de projeto JSON continua disponível.
10. Confirme que os projetos antigos continuam sendo carregados normalmente.

## Limites conhecidos
- Drag-and-drop por HTML5: funciona melhor com mouse/trackpad em desktops. Arrastar por toque ainda exige avaliação de uma biblioteca de gestos para a versão mobile do próprio editor.
- A árvore não possui edição de múltiplos nós ao mesmo tempo; ainda não há pan de canvas.
- A visualização é de layout, não um runner de ações de aplicativo.
- O código React completo e publicável para estruturas aninhadas será gerado na F07.
- Responsividade avançada, estilos por breakpoint e componentes compartilhados serão tratados em F03/F04.
- Múltiplas páginas já existem no documento, mas a interface para criá-las/editá-las entra na F05.
- O GitHub Actions verifica lint, configuração TS, testes de lógica e build. A experiência visual precisa de aceitação manual; testes E2E de arrastar e soltar serão recomendados para próxima iteração.

## Decisão sobre a tecnologia de Drag & Drop
A F02 usa o HTML5 Drag & Drop nativo, aproveitando a estrutura e minimizando dependências. Antes de tentar colaboração, toque ou posicionamento muito sofisticado, fazer um spike comparando a abordagem nativa com @dnd-kit/react, com foco em:
- acessibilidade e teclado;
- arrastar por toque;
- precisão em listas/árvores recursivas;
- desempenho com muitas dezenas de elementos;
- custo de integração sem perda dos comandos do core.

O motor documental permanece desacoplado, portanto uma substituição do mecanismo de gestos não deve modificar os projetos salvos.

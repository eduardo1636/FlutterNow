# F03 — Design System e estilos responsivos

## Entrega
O FlutterNow F03 oferece tokens, temas e estilos específicos por dispositivo, preservando a leitura de projetos anteriores no schemaVersion 1.

### Recursos
- Painel **Design**: cores, espaçamentos, raio e tipografia de referência.
- Temas predefinidos Violeta, Oceano e Noturno; aplicados num único comando reversível.
- Inspector responsivo: fundo, texto, borda, padding, margin, gap, largura, tipografia, alinhamentos e flex-wrap.
- Herança de propriedades: celular/base → tablet → desktop; remover override faz o dispositivo herdar novamente.
- Referências a tokens (exemplo: token:colorPrimary) sincronizam todas as propriedades vinculadas quando o token muda.
- As mudanças são persistidas e exportadas no JSON; documentos antigos sem tokens continuam válidos.

## Como testar no VSCodium
1. Abra o FlutterNow F03. Confirme que o projeto anterior mantém linhas, colunas, textos e imagens.
2. Na aba **Design** à esquerda escolha tema Oceano, altere a cor primária e use Desfazer/Refazer.
3. Selecione um Botão e vincule **Cor de fundo** ao token Primária no inspector.
4. Mude a cor primária e confirme que o botão vinculado acompanha a mudança.
5. Selecione uma Coluna. Em Celular, defina padding 8; em Tablet, padding 20; em Computador, padding 32.
6. Remova o override do Computador e confira que ele volta a herdar o valor do Tablet.
7. Dentro de uma Linha, ajuste a largura (%) de um elemento e compare entre dispositivos.
8. Exporte JSON, recarregue a página e confirme que cores, tokens e estilos permanecem.
9. Importe um JSON de F01/F02 e confira compatibilidade e integridade do conteúdo.
10. Com recursos de estilo avançado, confirme que **Exportar código** fica indisponível (F07 vai completar o gerador), mas o backup JSON continua possível.

### Atualizar uma pasta Git local

~~~powershell
git fetch origin
git switch --track origin/feat/f03-design-system-responsivo
npm ci
npm run dev
~~~

Se a branch já existir localmente, use git switch feat/f03-design-system-responsivo e git pull --ff-only.

## Segurança, compatibilidade e limites
- A engine só aceita um conjunto de propriedades e valores seguros; rejeita referências a tokens desconhecidos e CSS arbitrário.
- Tokens alteram automaticamente apenas elementos **vinculados**. Os componentes existentes com cores fixas mantêm sua aparência.
- A visualização responsiva é calculada por dispositivo no editor; media queries de código exportado serão trabalhadas na F07.
- O editor mantém o fluxo HTML5 Drag & Drop da F02. Interações por toque, multisseleção e pan continuam fora de escopo.
- Os controles visuais ainda são JSX; o núcleo documental e de comandos é verificado por TypeScript.

## Validação automática

~~~bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
~~~

Testes específicos: tests/f03-design.test.js (cascata, tokens, segurança, compatibilidade e undo/redo).

**Próxima etapa:** F04 — biblioteca expandida de componentes e elementos reutilizáveis.

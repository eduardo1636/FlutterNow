# FlutterNow ✨

Editor visual de interfaces web, inspirado no fluxo de trabalho de construtores como FlutterFlow. **MVP em React + Vite**, sem necessidade de contas, banco de dados ou serviços pagos.

## Como executar

Requisitos: Node.js 20+ e npm.

```bash
git clone https://github.com/eduardo1636/FlutterNow.git
cd FlutterNow
npm install
npm run dev
```

Abra o endereço local exibido pelo Vite.

## Funcionalidades disponíveis

- Paleta com título, parágrafo, botão, campo de texto, cartão, imagem, divisor e espaçamento.
- Adição por clique ou arrastar e soltar; reordenação de elementos pelo canvas ou pelos botões de subir/descer.
- Edição de textos, cores, arredondamento, alinhamento, tamanho de fonte e dimensões.
- Prévia em dimensões de celular, tablet e desktop.
- Geração e download de um componente React `App.jsx`.
- Salvamento automático no `localStorage` do navegador e importação/exportação de projeto JSON.
- Desfazer/refazer nas alterações de layout e propriedades.
- Sem backend e sem chave de API.

## Limitações da primeira versão

O canvas é uma **pilha vertical de componentes** (sem layouts aninhados, navegação entre telas, eventos configuráveis ou lógica de backend). A prévia é uma representação interativa do layout, não a execução de aplicativos Android/iOS ou de código Flutter/Dart. O arquivo React exportado é um componente de apresentação, a ser integrado a um projeto React. O salvamento automático é local ao navegador; exporte seu JSON para backups.

## Próximas fases

1. Estrutura de árvore com containers, linhas, colunas e páginas múltiplas.
2. Sistema de estilos reutilizáveis, alinhamento e regras responsivas avançadas.
3. Editor de eventos, navegação e formulários.
4. Projetos sincronizados em banco de dados com login.
5. Publicação web e exportação mobile via Capacitor.
6. Opcional: geração de Dart/Flutter por conversão de modelo de componentes, que exigirá um gerador próprio.

## Segurança

Importe apenas projetos JSON de origem confiável. URLs de imagens são carregadas diretamente pelo navegador. Não armazene credenciais ou dados sensíveis no JSON dos projetos.

## Licença

Sem licença declarada.

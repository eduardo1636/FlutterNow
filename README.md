# FlutterNow ✨

Editor visual de interfaces web, inspirado no fluxo de trabalho de construtores como FlutterFlow. **MVP em React + Vite**, sem necessidade de contas, banco de dados ou serviços pagos.

## Como executar

Requisitos: Node.js 22 e npm (recomendado).

```bash
git clone https://github.com/eduardo1636/FlutterNow.git
cd FlutterNow
npm ci
npm run dev
```

Abra o endereço local exibido pelo Vite.

## Validação e qualidade (F00)

```bash
npm run lint       # ESLint
npm run typecheck  # Configuração TypeScript gradual
npm test           # Testes Vitest
npm run build      # Build de produção
```

A automação GitHub Actions executa essas verificações em pushes e pull requests.
Confira [F00 — Estabilização](docs/F00_ESTABILIZACAO.md), [F01 — Documento e comandos](docs/F01_DOCUMENTOS_COMANDOS.md) e o [Plano Mestre](ROADMAP.md).

> Observação: o motor documental e os comandos da F01 utilizam TypeScript estrito. A interface legada em JSX ainda será migrada gradualmente. As dependências são travadas com `package-lock.json` e o CI utiliza `npm ci`.

## Funcionalidades disponíveis

- Paleta com título, parágrafo, botão, campo de texto, cartão, imagem, divisor e espaçamento.
- Adição por clique ou arrastar e soltar; reordenação de elementos pelo canvas ou pelos botões de subir/descer.
- Edição de textos, cores, arredondamento, alinhamento, tamanho de fonte e dimensões.
- Prévia em dimensões de celular, tablet e desktop.
- Geração e download de um componente React `App.jsx`.
- Salvamento automático no `localStorage`, migração do JSON antigo para formato versionado, backup legado e importação/exportação.
- Desfazer/refazer nas alterações de layout e propriedades.
- Sem backend e sem chave de API.

## Modelo de projeto F01

O motor interno já suporta árvores de componentes e documentos com múltiplas páginas. A interface ainda exibe apenas os componentes diretos da raiz da página ativa. Para documentos com containers aninhados ou múltiplas páginas, o editor mostra um aviso e bloqueia a exportação React incompleta. O JSON completo permanece exportável e importável. A interface de aninhamento visual é a próxima etapa (F02).

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

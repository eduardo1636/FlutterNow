import { describe, expect, it } from "vitest";
import { components, initial } from "../src/editor/project.js";
import { generateCode } from "../src/editor/codegen.js";

describe("exportação React da versão inicial", () => {
  it("gera um componente App exportável", () => {
    const source = generateCode(initial);
    expect(source).toContain("export default function App()");
    expect(source).toContain("Crie algo incrível.");
    expect(source).toContain("<button");
    expect(source).toContain("</main>");
  });

  it("mantém os oito tipos suportados pela paleta", () => {
    const project = {
      ...initial,
      nodes: components.map((component, index) => ({
        id: "n-" + index,
        type: component.type,
        props: { ...component.defaults },
      })),
    };
    const code = generateCode(project);
    expect(code).toContain("<h2");
    expect(code).toContain("<p ");
    expect(code).toContain("<button");
    expect(code).toContain("<input");
    expect(code).toContain("<div");
    expect(code).toContain("<img");
    expect(code).toContain("<hr");
  });

  it("escapa textos de usuário com aspas", () => {
    const project = {
      ...initial,
      nodes: [{ id: "title", type: "heading", props: { ...components[0].defaults, text: 'Olá "FlutterNow"' } }],
    };
    const code = generateCode(project);
    expect(code).toContain(JSON.stringify('Olá "FlutterNow"'));
  });

  it("é determinístico para o mesmo documento", () => {
    expect(generateCode(initial)).toEqual(generateCode(initial));
  });
  it("escapa valores injetados no estilo do divisor exportado", () => {
    const malicious = "red' }} /> hacked <div";
    const doc = {
      ...initial,
      nodes: [{ id: "divider", type: "divider", props: { background: malicious } }],
    };
    const output = generateCode(doc);
    expect(output).toContain(JSON.stringify("1px solid " + malicious));
    expect(output).not.toContain("borderTop: '1px solid " + malicious + "'");
  });

});

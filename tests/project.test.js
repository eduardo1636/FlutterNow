import { describe, expect, it } from "vitest";
import { components, initial, parseProjectJSON } from "../src/editor/project.js";
import legacyFixture from "./fixtures/legacy-v01.json";

describe("leitura e compatibilidade do projeto v0.1", () => {
  it("preserva o projeto inicial após exportação/importação", () => {
    const restored = parseProjectJSON(JSON.stringify(initial));
    expect(restored).toEqual(initial);
  });

  it("importa a fixture independente v0.1 sem perda de dados", () => {
    expect(parseProjectJSON(JSON.stringify(legacyFixture))).toEqual(legacyFixture);
  });

  it("reconhece os oito widgets legados", () => {
    const document = {
      name: "Teste de widgets",
      page: initial.page,
      nodes: components.map((component, index) => ({
        id: "node-" + index,
        type: component.type,
        props: { ...component.defaults },
      })),
    };
    const imported = parseProjectJSON(JSON.stringify(document));
    expect(imported.nodes.map((node) => node.type)).toEqual(components.map((c) => c.type));
  });

  it("rejeita JSON inválido e projetos sem propriedades obrigatórias", () => {
    expect(() => parseProjectJSON("{")).toThrow();
    expect(() => parseProjectJSON('{"name":"Teste","nodes":[]}')).toThrow();
  });

  it("rejeita componentes desconhecidos ou IDs duplicados", () => {
    const element = { id: "dup", type: "text", props: { ...components[1].defaults } };
    const project = { ...initial, nodes: [element, { ...element }] };
    expect(() => parseProjectJSON(JSON.stringify(project))).toThrow();
    project.nodes = [{ ...element, id: "x", type: "script" }];
    expect(() => parseProjectJSON(JSON.stringify(project))).toThrow();
  });

  it("rejeita tipos inválidos de propriedades", () => {
    const project = {
      ...initial,
      nodes: [{ id: "1", type: "button", props: { ...components[2].defaults, radius: "gigante" } }],
    };
    expect(() => parseProjectJSON(JSON.stringify(project))).toThrow("Propriedade inválida");
  });
});

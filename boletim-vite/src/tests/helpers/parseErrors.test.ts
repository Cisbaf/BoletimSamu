import { describe, it, expect } from "vitest";
import { parseDjangoError } from "../../helpers/parseErrors";
import { ApiError } from "../../helpers/apiError";

describe("parseDjangoError", () => {
  it("usa o detail do DRF", () => {
    const error = new ApiError(400, { detail: "Pedido não encontrado." }, "", "falhou");
    expect(parseDjangoError(error)).toBe("Pedido não encontrado.");
  });

  it("junta mensagens de erro de campo", () => {
    const error = new ApiError(
      400,
      { non_field_errors: ["Faltam documentos obrigatórios: Certidão de Óbito"] },
      "",
      "falhou"
    );
    expect(parseDjangoError(error)).toContain("Faltam documentos");
  });

  it("não usa HTML de erro do servidor como mensagem", () => {
    const html = "<!doctype html><html><title>Server Error (500)</title></html>";
    const error = new ApiError(500, null, html, "falhou");
    expect(parseDjangoError(error)).toContain("Erro interno no servidor");
  });

  it("explica o 413 do nginx (corpo em HTML, sem JSON)", () => {
    const error = new ApiError(413, null, "<html>413 Request Entity Too Large</html>", "falhou");
    expect(parseDjangoError(error)).toContain("grande demais");
  });

  it("explica o throttle mesmo sem corpo", () => {
    expect(parseDjangoError(new ApiError(429, null, "", "falhou"))).toContain("Muitas tentativas");
  });

  it("mantém a mensagem de falha de rede em vez do texto genérico", () => {
    const error = new ApiError(0, null, "", "Não foi possível concluir o envio: a conexão caiu.");
    expect(parseDjangoError(error)).toBe("Não foi possível concluir o envio: a conexão caiu.");
  });

  it("não engole a mensagem de um Error comum", () => {
    expect(parseDjangoError(new TypeError("Failed to fetch"))).toBe("Failed to fetch");
  });

  it("cai no texto genérico só quando não há nada aproveitável", () => {
    expect(parseDjangoError(null)).toBe("Ocorreu um erro inesperado.");
  });
});

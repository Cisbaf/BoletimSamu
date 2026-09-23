import { describe, it, expect } from "vitest";
import { prepareUploadFile } from "../../domain/fileUpload";

const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]; // %PDF-1.4
const JPG_HEADER = [0xff, 0xd8, 0xff, 0xe0];

function makeFile(name: string, bytes: number[]) {
  return new File([new Uint8Array(bytes)], name, { type: "application/pdf" });
}

describe("prepareUploadFile", () => {
  it("aceita um PDF válido", async () => {
    const { error, file } = await prepareUploadFile(makeFile("doc.pdf", PDF_HEADER));
    expect(error).toBeNull();
    expect(file?.name).toBe("doc.pdf");
  });

  it("devolve o arquivo já carregado na memória, sem depender do original", async () => {
    const original = makeFile("doc.pdf", PDF_HEADER);
    const { file } = await prepareUploadFile(original);

    expect(file).not.toBe(original);
    expect(file!.size).toBe(PDF_HEADER.length);
    expect(new Uint8Array(await file!.arrayBuffer())).toEqual(new Uint8Array(PDF_HEADER));
  });

  it("aceita PDF com bytes antes do cabeçalho, como os leitores fazem", async () => {
    const bytes = [0xef, 0xbb, 0xbf, 0x0a, ...PDF_HEADER];
    expect((await prepareUploadFile(makeFile("doc.pdf", bytes))).error).toBeNull();
  });

  it("aceita imagem JPG válida", async () => {
    expect((await prepareUploadFile(makeFile("foto.JPG", JPG_HEADER))).error).toBeNull();
  });

  it("rejeita extensão fora da lista", async () => {
    const { error } = await prepareUploadFile(makeFile("doc.docx", PDF_HEADER));
    expect(error).toContain("não permitido");
  });

  it("rejeita arquivo sem extensão", async () => {
    const { error } = await prepareUploadFile(makeFile("documento", PDF_HEADER));
    expect(error).toContain("sem extensão");
  });

  it("aponta o arquivo vazio, típico de anexo vindo da nuvem", async () => {
    const { error } = await prepareUploadFile(makeFile("doc.pdf", []));
    expect(error).toContain("vazio");
  });

  it("rejeita conteúdo que não bate com a extensão", async () => {
    const { error } = await prepareUploadFile(makeFile("doc.pdf", [0x4d, 0x5a, 0x00, 0x00]));
    expect(error).toContain("não corresponde");
  });

  it("avisa quando o navegador não consegue ler o arquivo", async () => {
    // Caso real: anexo escolhido de um app de nuvem sem estar baixado no
    // aparelho. Antes, isso só estourava durante o fetch — a requisição não
    // chegava ao servidor e a tela mostrava apenas "erro inesperado".
    const unreadable = {
      name: "doc.pdf",
      size: 256 * 1024,
      type: "application/pdf",
      arrayBuffer: () => Promise.reject(new DOMException("NotReadableError")),
    } as unknown as File;

    const { error, file } = await prepareUploadFile(unreadable);
    expect(error).toContain("Não foi possível ler");
    expect(error).toContain("Google Drive");
    expect(file).toBeNull();
  });

  it("rejeita acima de 10 MB sem tentar carregar o arquivo", async () => {
    let readAttempted = false;
    const huge = {
      name: "doc.pdf",
      size: 11 * 1024 * 1024,
      type: "application/pdf",
      arrayBuffer: () => { readAttempted = true; return Promise.resolve(new ArrayBuffer(0)); },
    } as unknown as File;

    const { error } = await prepareUploadFile(huge);
    expect(error).toContain("limite é 10 MB");
    expect(readAttempted).toBe(false);
  });
});

/**
 * Preparação de anexos no navegador, espelhando a validação do backend
 * (django/src/applicant_document/serializers.py::_validate_upload).
 *
 * Além de validar, esta etapa **carrega o arquivo inteiro para a memória**.
 * O File que o seletor devolve é só uma referência: quando o anexo vem de um
 * app de nuvem (Google Drive, iCloud, WhatsApp) e não está baixado no
 * aparelho, a leitura pode falhar no meio do upload — o fetch é abortado, a
 * requisição nunca chega ao servidor e não há resposta nenhuma para mostrar.
 * Lendo os bytes aqui, o problema aparece na hora, no campo do anexo, e o
 * envio passa a usar um blob local que não depende mais do app de origem.
 */

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const UPLOAD_HINT = "PDF, JPG, PNG · Máx. 10MB";

const MAGIC_BYTES: Record<string, number[]> = {
  ".pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
  ".jpg": [0xff, 0xd8, 0xff],
  ".jpeg": [0xff, 0xd8, 0xff],
  ".png": [0x89, 0x50, 0x4e, 0x47],
};

const KIND_BY_EXTENSION: Record<string, string> = {
  ".pdf": "PDF",
  ".jpg": "imagem JPG",
  ".jpeg": "imagem JPG",
  ".png": "imagem PNG",
};

// Mesma tolerância dos leitores de PDF: o "%PDF" pode não estar no byte 0.
const HEADER_SIZE = 1024;

export type PreparedUpload =
  | { error: string; file: null }
  | { error: null; file: File };

export function getExtension(fileName: string): string {
  const match = /\.[^.\\/]+$/.exec(fileName ?? "");
  return match ? match[0].toLowerCase() : "";
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function hasValidSignature(ext: string, header: Uint8Array): boolean {
  const magic = MAGIC_BYTES[ext];

  if (ext === ".pdf") {
    for (let start = 0; start <= header.length - magic.length; start++) {
      if (magic.every((byte, i) => header[start + i] === byte)) return true;
    }
    return false;
  }

  return magic.every((byte, i) => header[i] === byte);
}

const CLOUD_HINT =
  "Se ele veio do Google Drive, iCloud ou WhatsApp, baixe-o para o aparelho antes de anexar, ou envie uma foto do documento.";

/**
 * Valida o arquivo e devolve uma cópia dele já carregada na memória.
 * Em caso de problema, devolve a mensagem para exibir no campo.
 */
export async function prepareUploadFile(file: File): Promise<PreparedUpload> {
  const name = file.name || "arquivo";
  const ext = getExtension(name);

  if (!ext) {
    return {
      error: `O arquivo "${name}" está sem extensão. Renomeie para .pdf, .jpg ou .png, ou envie uma foto do documento.`,
      file: null,
    };
  }

  if (!(ext in MAGIC_BYTES)) {
    return { error: `Tipo de arquivo não permitido (${ext}). Envie PDF, JPG ou PNG.`, file: null };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      error: `O arquivo tem ${formatSize(file.size)} e o limite é 10 MB. Reduza o tamanho ou envie uma foto do documento.`,
      file: null,
    };
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return {
      error: `Não foi possível ler o arquivo "${name}" neste aparelho. ${CLOUD_HINT}`,
      file: null,
    };
  }

  if (bytes.byteLength === 0) {
    return { error: `O arquivo "${name}" está vazio (0 bytes). ${CLOUD_HINT}`, file: null };
  }

  if (!hasValidSignature(ext, new Uint8Array(bytes.slice(0, HEADER_SIZE)))) {
    return {
      error: `O conteúdo de "${name}" não corresponde a um ${KIND_BY_EXTENSION[ext]} válido. O arquivo pode estar corrompido, protegido por senha ou apenas renomeado. Abra-o, salve novamente e tente outra vez — ou envie uma foto do documento.`,
      file: null,
    };
  }

  // Cópia local: a partir daqui o envio não depende mais do app de origem.
  return {
    error: null,
    file: new File([bytes], name, { type: file.type, lastModified: file.lastModified }),
  };
}

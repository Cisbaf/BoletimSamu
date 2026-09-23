/**
 * Erro de chamada à API com o contexto necessário para montar uma mensagem
 * útil: status HTTP, corpo já interpretado (quando é JSON) e o texto cru
 * (quando o servidor devolveu HTML de erro, por exemplo).
 *
 * `status === 0` significa que a requisição nem chegou ao servidor
 * (sem conexão, upload interrompido, arquivo ilegível).
 */
export class ApiError extends Error {
  status: number;
  data: unknown;
  rawBody: string;

  constructor(status: number, data: unknown, rawBody: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.rawBody = rawBody;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

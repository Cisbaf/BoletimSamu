export function parseDjangoError(error: any): string {
  if (!error) return "Ocorreu um erro inesperado.";

  const data = error?.response?.data || error;

  if (typeof data === "string") return data;

  // Caso clássico: { detail: "..." }
  if (data?.detail) return data.detail;

  const messages: string[] = [];

  const extract = (value: any) => {
    if (!value) return;

    if (typeof value === "string") {
      messages.push(value);
    } else if (Array.isArray(value)) {
      value.forEach(extract);
    } else if (typeof value === "object") {
      Object.values(value).forEach(extract);
    }
  };

  extract(data);

  if (messages.length > 0) {
    // Remove duplicadas e junta bonito
    return [...new Set(messages)].join(" ");
  }

  return "Ocorreu um erro inesperado.";
}
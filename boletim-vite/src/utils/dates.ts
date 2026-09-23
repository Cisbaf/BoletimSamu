export function formatToBRDate(dateString: string): string {
  const date = new Date(dateString);

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysWaiting(dateString: string): number {
  const now = new Date();
  const targetDate = new Date(dateString);

  const diffMs = now.getTime() - targetDate.getTime();

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** Converte uma data no formato "YYYY-MM-DD" (sem hora) para "DD/MM/AAAA".
 *  O parse é manual de propósito: `new Date("2026-09-12")` é interpretado
 *  como UTC e acabaria exibindo o dia anterior no fuso do Brasil. */
export function formatToBRDateOnly(dateString?: string | null): string {
  if (!dateString) return "";

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
  if (!match) return dateString;

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
}

/** Data de hoje no formato "YYYY-MM-DD", respeitando o fuso local. */
export function todayISODate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

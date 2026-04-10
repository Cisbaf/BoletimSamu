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
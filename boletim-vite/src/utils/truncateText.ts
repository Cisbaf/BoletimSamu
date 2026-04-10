export function truncateText(text: string, max = 50) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}
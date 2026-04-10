export function getFileType(url: string): "image" | "pdf" | "unknown" {
  const lower = url.toLowerCase();

  if (lower.endsWith(".pdf")) return "pdf";

  if (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp")
  ) {
    return "image";
  }

  return "unknown";
}
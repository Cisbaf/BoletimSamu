export async function downloadFile(url: string, filename: string) {
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(`Erro ao baixar arquivo: ${response.status}`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(blobUrl);
}

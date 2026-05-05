export const downloadBlobFile = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const downloadTextFile = (
  content: string,
  fileName: string,
  mimeType = "application/json",
): void => {
  const blob = new Blob([content], { type: mimeType });
  downloadBlobFile(blob, fileName);
};

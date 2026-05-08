export const UPLOAD_MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;

export const IMAGE_UPLOAD_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
] as const;

export const DOCUMENT_UPLOAD_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ...IMAGE_UPLOAD_ALLOWED_MIME_TYPES,
] as const;

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getUploadSizeExceededMessage(limitBytes: number): string {
  return `O arquivo excede o limite máximo permitido de ${formatFileSize(limitBytes)}.`;
}

export function getUploadTypeErrorMessage(allowedTypesLabel: string): string {
  return `Tipo de arquivo inválido. Formatos aceitos: ${allowedTypesLabel}.`;
}

export function validateUploadFile(params: {
  file: File;
  maxBytes?: number;
  allowedMimeTypes: readonly string[];
  allowedTypesLabel: string;
}): string | null {
  const { file, allowedMimeTypes, allowedTypesLabel } = params;
  const maxBytes = params.maxBytes ?? UPLOAD_MAX_FILE_SIZE_BYTES;

  if (file.size > maxBytes) {
    return getUploadSizeExceededMessage(maxBytes);
  }

  if (!allowedMimeTypes.includes(file.type)) {
    return getUploadTypeErrorMessage(allowedTypesLabel);
  }

  return null;
}

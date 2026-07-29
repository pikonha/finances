export const DEFAULT_TRANSFER_NOTE = "Transferência";

export function transferNote(note?: string | null) {
  const normalized = note?.trim();
  return normalized || DEFAULT_TRANSFER_NOTE;
}

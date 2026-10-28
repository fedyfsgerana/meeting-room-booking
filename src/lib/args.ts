export const INVALID_REQUEST = {
  ok: false as const,
  message: "Permintaan tidak valid. Muat ulang halaman, lalu coba lagi.",
};

export function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isText(value: unknown, max = 1000): value is string {
  return typeof value === "string" && value.length <= max;
}

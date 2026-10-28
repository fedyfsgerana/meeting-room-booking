const TONES = [
  "tone-info",
  "tone-ok",
  "tone-warn",
  "tone-bad",
  "tone-violet",
  "tone-orange",
  "tone-teal",
  "tone-pink",
  "tone-indigo",
  "tone-cyan",
  "tone-lime",
  "tone-slate",
] as const;

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export function avatarTone(name: string) {
  let hash = 7;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

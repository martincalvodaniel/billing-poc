export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "")
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const ACCENT_MAP: Record<string, string> = {
  a: "[aáàäâãåā]",
  e: "[eéèëêē]",
  i: "[iíìïîī]",
  o: "[oóòöôõø]",
  u: "[uúùüûū]",
  n: "[nñ]",
  c: "[cç]",
  y: "[yý]",
}

export function buildAccentInsensitivePattern(input: string): string {
  const lowered = stripDiacritics(input.toLowerCase())
  let out = ""
  for (const ch of lowered) {
    const escaped = escapeRegex(ch)
    out += ACCENT_MAP[ch] ?? escaped
  }
  return out
}

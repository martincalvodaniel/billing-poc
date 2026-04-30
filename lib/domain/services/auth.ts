export function isEmailAllowed(email: string): boolean {
  const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowedEmails.includes(email.toLowerCase())
}

export function zodError(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
  ) {
    return (
      (error as { issues: { message: string }[] }).issues[0]?.message ??
      "Validation failed"
    )
  }
  return "Validation failed"
}

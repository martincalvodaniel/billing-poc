import type { z } from "zod"

export class WordPressApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = "WordPressApiError"
    this.status = status
  }
}

function getRequiredWordPressEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    throw new WordPressApiError(
      `${name} environment variable is required for WordPress integration`,
      500
    )
  }
  return value.trim()
}

export function getWordPressCredentials() {
  return {
    endpoint: getRequiredWordPressEnv("WORDPRESS_ENDPOINT"),
    user: getRequiredWordPressEnv("WORDPRESS_USER"),
    password: getRequiredWordPressEnv("WORDPRESS_PASSWORD"),
  }
}

function buildWordPressBasicAuthHeader(user: string, password: string): string {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`
}

export async function fetchWordPressJson<T>(
  url: string,
  init: RequestInit,
  failureMessage: string,
  schema: z.ZodType<T>,
  validationMessage: string
): Promise<{ data: T; response: Response }> {
  const { user, password } = getWordPressCredentials()
  const hasBody = init.body !== undefined
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: buildWordPressBasicAuthHeader(user, password),
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "")
    const suffix = bodyText.length > 0 ? `: ${bodyText}` : ""
    throw new WordPressApiError(
      `${failureMessage} with status ${response.status}${suffix}`,
      response.status
    )
  }

  const parsed = schema.safeParse(await response.json())
  if (!parsed.success) {
    throw new WordPressApiError(validationMessage, 502)
  }

  return {
    data: parsed.data,
    response,
  }
}

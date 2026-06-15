export class FetchError extends Error {
  status: number
  info: unknown

  constructor(message: string, status: number, info: unknown) {
    super(message)
    this.name = "FetchError"
    this.status = status
    this.info = info
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin" })

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? ""
    let info: unknown
    if (contentType.includes("application/json")) {
      try {
        info = await response.json()
      } catch {
        info = null
      }
    } else {
      try {
        info = await response.text()
      } catch {
        info = null
      }
    }
    throw new FetchError(
      `Request to ${url} failed with status ${response.status}`,
      response.status,
      info
    )
  }

  return (await response.json()) as T
}

export function shouldRetryOnError(error: unknown): boolean {
  if (error instanceof FetchError && [401, 403, 404].includes(error.status)) {
    return false
  }
  return true
}

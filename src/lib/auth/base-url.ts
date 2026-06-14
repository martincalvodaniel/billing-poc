function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

function withHttps(host: string): string {
  return `https://${host}`
}

/**
 * Resolves the auth base URL for better-auth.
 *
 * Vercel exposes deployment hostnames (e.g. `VERCEL_BRANCH_URL`) without a
 * scheme, so we prefix `https://` for those. `BETTER_AUTH_URL` is expected to
 * be a full URL and is used as-is.
 */
export function getAuthBaseURL(): string {
  const explicit = process.env.BETTER_AUTH_URL
  if (explicit) {
    return stripTrailingSlash(explicit)
  }

  const branch = process.env.VERCEL_BRANCH_URL
  if (branch) {
    return stripTrailingSlash(withHttps(branch))
  }

  const vercel = process.env.VERCEL_URL
  if (vercel) {
    return stripTrailingSlash(withHttps(vercel))
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (production) {
    return stripTrailingSlash(withHttps(production))
  }

  return "http://localhost:3000"
}

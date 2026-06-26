const DEFAULT_WORDPRESS_TOTAL_PAGES = 1

export function getWordPressPagination(
  response: Response,
  page: number,
  fallbackTotal: number
) {
  const headerTotalPages = Number(
    response.headers.get("x-wp-totalpages") ?? "0"
  )
  const headerTotal = Number(response.headers.get("x-wp-total") ?? "0")
  const totalPages =
    Number.isFinite(headerTotalPages) && headerTotalPages > 0
      ? headerTotalPages
      : DEFAULT_WORDPRESS_TOTAL_PAGES
  const total =
    Number.isFinite(headerTotal) && headerTotal >= 0
      ? headerTotal
      : fallbackTotal

  return {
    page,
    total,
    totalPages,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  }
}

export type SortDirection = "asc" | "desc"

export interface SortState<TKey extends string> {
  sortBy: TKey
  sortDir: SortDirection
}

export function nextSortState<TKey extends string>(
  current: SortState<TKey>,
  clicked: TKey,
  nextColumnDefaultDir: SortDirection
): SortState<TKey> {
  if (current.sortBy === clicked) {
    return {
      sortBy: clicked,
      sortDir: current.sortDir === "asc" ? "desc" : "asc",
    }
  }

  return {
    sortBy: clicked,
    sortDir: nextColumnDefaultDir,
  }
}

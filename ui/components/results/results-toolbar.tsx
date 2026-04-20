import { Button } from "@/components/ui/button"

type ResultsToolbarProps<TFilter extends string, TSort extends string> = {
  filterOptions: readonly TFilter[]
  activeFilter: TFilter
  onFilterChange: (filter: TFilter) => void
  getFilterLabel: (filter: TFilter) => string
  sortOptions: readonly TSort[]
  activeSort: TSort
  onSortChange: (sort: TSort) => void
  getSortLabel: (sort: TSort) => string
  clearLabel: string
  onClear: () => void
}

export function ResultsToolbar<TFilter extends string, TSort extends string>({
  filterOptions,
  activeFilter,
  onFilterChange,
  getFilterLabel,
  sortOptions,
  activeSort,
  onSortChange,
  getSortLabel,
  clearLabel,
  onClear,
}: ResultsToolbarProps<TFilter, TSort>) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2" aria-label="results-toolbar">
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={activeFilter === option ? "default" : "outline"}
            className="rounded-full"
            onClick={() => onFilterChange(option)}
          >
            {getFilterLabel(option)}
          </Button>
        ))}
      </div>

      <select
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        value={activeSort}
        onChange={(event) => onSortChange(event.target.value as TSort)}
      >
        {sortOptions.map((option) => (
          <option key={option} value={option}>
            {getSortLabel(option)}
          </option>
        ))}
      </select>

      <Button size="sm" variant="ghost" className="rounded-xl" onClick={onClear}>
        {clearLabel}
      </Button>
    </div>
  )
}

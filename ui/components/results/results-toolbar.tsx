import { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
  refineQuery?: string
  onRefineQueryChange?: (value: string) => void
  refineInputLabel?: string
  refineInputPlaceholder?: string
  refineSubmitLabel?: string
  onRefineSubmit?: () => void
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
  refineQuery,
  onRefineQueryChange,
  refineInputLabel,
  refineInputPlaceholder,
  refineSubmitLabel,
  onRefineSubmit,
}: ResultsToolbarProps<TFilter, TSort>) {
  const handleRefineSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onRefineSubmit?.()
  }

  return (
    <div className="space-y-3" aria-label="results-toolbar">
      {typeof refineQuery === "string" && onRefineQueryChange && onRefineSubmit && refineInputLabel && refineSubmitLabel && (
        <form className="flex w-full flex-col gap-2 sm:flex-row sm:items-center" onSubmit={handleRefineSubmit}>
          <Input
            value={refineQuery}
            onChange={(event) => onRefineQueryChange(event.target.value)}
            aria-label={refineInputLabel}
            placeholder={refineInputPlaceholder}
            className="h-10 rounded-xl"
          />
          <Button size="sm" type="submit" className="h-10 rounded-xl px-4">
            {refineSubmitLabel}
          </Button>
        </form>
      )}

      <div className="app-toolbar">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option}
              size="sm"
              variant="outline"
              data-active={activeFilter === option}
              className="app-chip rounded-full"
              onClick={() => onFilterChange(option)}
            >
              {getFilterLabel(option)}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
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
      </div>
    </div>
  )
}

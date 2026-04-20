import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HistoryPagination } from "@/components/history/history-pagination"
import { ResultsToolbar } from "@/components/results/results-toolbar"
import { Check, Heart, LoaderCircle, Star } from "lucide-react"
import type { DisplayItem } from "@/hooks/use-search-flow"

type ActionFeedbackState = "idle" | "done"

type ResultsListProps<TFilter extends string, TSort extends string> = {
  title: string
  emptyHint: string
  noMatchHint: string
  loadingHint: string
  isLoading: boolean
  results: DisplayItem[]
  pagedResults: DisplayItem[]
  compareTools: DisplayItem[]
  favorites: string[]
  filters: TFilter
  filterOptions: readonly TFilter[]
  onFilterSelect: (option: TFilter) => void
  getFilterLabel: (option: TFilter) => string
  sortBy: TSort
  sortOptions: readonly TSort[]
  onSortSelect: (option: TSort) => void
  getSortLabel: (option: TSort) => string
  clearConditionsLabel: string
  onClearConditions: () => void
  refineQuery?: string
  onRefineQueryChange?: (value: string) => void
  refineInputLabel?: string
  refineInputPlaceholder?: string
  refineSubmitLabel?: string
  onRefineSubmit?: () => void
  onToggleCompare: (tool: DisplayItem) => void
  onToggleFavorite: (tool: DisplayItem) => void
  onVisitWebsite: (tool: DisplayItem) => void
  getActionFeedbackState: (toolName: string, action: "favorite" | "compare" | "visit") => ActionFeedbackState
  addLabel: string
  addedLabel: string
  favoriteLabel: string
  favoritedLabel: string
  visitWebsiteLabel: string
  visitedWebsiteLabel: string
  showPagination: boolean
  currentPage: number
  totalPages: number
  pageLabel: string
  previousLabel: string
  nextLabel: string
  onPreviousPage: () => void
  onNextPage: () => void
}

const ratingFromName = (name: string) => (4.3 + ((name.length % 6) * 0.1)).toFixed(1)

export function ResultsList<TFilter extends string, TSort extends string>({
  title,
  emptyHint,
  noMatchHint,
  loadingHint,
  isLoading,
  results,
  pagedResults,
  compareTools,
  favorites,
  filters,
  filterOptions,
  onFilterSelect,
  getFilterLabel,
  sortBy,
  sortOptions,
  onSortSelect,
  getSortLabel,
  clearConditionsLabel,
  onClearConditions,
  refineQuery,
  onRefineQueryChange,
  refineInputLabel,
  refineInputPlaceholder,
  refineSubmitLabel,
  onRefineSubmit,
  onToggleCompare,
  onToggleFavorite,
  onVisitWebsite,
  getActionFeedbackState,
  addLabel,
  addedLabel,
  favoriteLabel,
  favoritedLabel,
  visitWebsiteLabel,
  visitedWebsiteLabel,
  showPagination,
  currentPage,
  totalPages,
  pageLabel,
  previousLabel,
  nextLabel,
  onPreviousPage,
  onNextPage,
}: ResultsListProps<TFilter, TSort>) {
  const isEmptyResults = !isLoading && results.length === 0
  const isNoMatch = !isLoading && results.length > 0 && pagedResults.length === 0

  return (
    <section className="space-y-4">
      <div className="app-toolbar">
        <h2 className="app-section-title">{title}</h2>
        <ResultsToolbar
          filterOptions={filterOptions}
          activeFilter={filters}
          onFilterChange={onFilterSelect}
          getFilterLabel={getFilterLabel}
          sortOptions={sortOptions}
          activeSort={sortBy}
          onSortChange={onSortSelect}
          getSortLabel={getSortLabel}
          clearLabel={clearConditionsLabel}
          onClear={onClearConditions}
          refineQuery={refineQuery}
          onRefineQueryChange={onRefineQueryChange}
          refineInputLabel={refineInputLabel}
          refineInputPlaceholder={refineInputPlaceholder}
          refineSubmitLabel={refineSubmitLabel}
          onRefineSubmit={onRefineSubmit}
        />
      </div>

      {isLoading ? (
        <Card className="app-panel p-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span>{loadingHint}</span>
          </div>
        </Card>
      ) : isEmptyResults ? (
        <Card className="app-panel border-dashed p-5 text-sm text-muted-foreground">{emptyHint}</Card>
      ) : isNoMatch ? (
        <Card className="app-panel border-dashed p-5 text-sm text-muted-foreground">{noMatchHint}</Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {pagedResults.map((item) => {
              const selected = compareTools.some((tool) => tool.name === item.name)
              const favorited = favorites.includes(item.name)
              const logo = item.name.trim().slice(0, 1)
              const favoriteFeedback = getActionFeedbackState(item.name, "favorite")
              const compareFeedback = getActionFeedbackState(item.name, "compare")
              const visitFeedback = getActionFeedbackState(item.name, "visit")
              return (
                <Card key={item.name} className="app-panel app-interactive animate-in fade-in slide-in-from-bottom-1.5 p-5 duration-500">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">{logo}</div>
                        <div>
                          <h3 className="text-base font-semibold">{item.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Button type="button" size="icon" variant="ghost" aria-label={`收藏 ${item.name}`} onClick={() => onToggleFavorite(item)}>
                        {favoriteFeedback === "done" ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                      </Button>
                    </div>

                    <p className="text-sm text-foreground/85">{item.reason}</p>

                    <div className="flex flex-wrap gap-2">
                      {(item.tags ?? []).slice(0, 5).map((tag) => (
                        <Badge key={`${item.name}-${tag}`} variant="secondary" className="rounded-full">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-foreground">{ratingFromName(item.name)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onVisitWebsite(item)}>
                          {visitFeedback === "done" ? visitedWebsiteLabel : visitWebsiteLabel}
                        </Button>
                        <Button size="sm" className="rounded-xl" onClick={() => onToggleCompare(item)}>
                          {compareFeedback === "done" ? addedLabel : compareLabel(selected, addLabel, addedLabel)}
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onToggleFavorite(item)}>
                          {favoriteFeedback === "done" ? favoritedLabel : favorited ? favoritedLabel : favoriteLabel}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {showPagination && (
            <HistoryPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageLabel={pageLabel}
              previousLabel={previousLabel}
              nextLabel={nextLabel}
              onPrevious={onPreviousPage}
              onNext={onNextPage}
            />
          )}
        </>
      )}
    </section>
  )
}

function compareLabel(selected: boolean, addLabel: string, addedLabel: string) {
  return selected ? addedLabel : addLabel
}

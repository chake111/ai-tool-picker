import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HistoryPagination } from "@/components/history/history-pagination"
import { ResultsToolbar } from "@/components/results/results-toolbar"
import { ArrowUpRight, Check, Heart, LoaderCircle, Scale, Sparkles, Star } from "lucide-react"
import type { DisplayItem } from "@/hooks/use-search-flow"

type ActionFeedbackState = "idle" | "done"

type ResultsListProps<TFilter extends string, TSort extends string> = {
  title: string
  summary: string
  currentQuery: string
  resultCountLabel: string
  workspaceEyebrow: string
  matchScoreLabel: string
  reputationLabel: string
  reasonsLabel: string
  bestForLabel: string
  caveatsLabel: string
  compareReadyLabel: string
  comparedLabel: string
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
const scoreFromConfidence = (score: number) => Math.round(score * 100)

export function ResultsList<TFilter extends string, TSort extends string>({
  title,
  summary,
  currentQuery,
  resultCountLabel,
  workspaceEyebrow,
  matchScoreLabel,
  reputationLabel,
  reasonsLabel,
  bestForLabel,
  caveatsLabel,
  compareReadyLabel,
  comparedLabel,
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
    <section className="space-y-5">
      <Card className="app-panel space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{workspaceEyebrow}</p>
            <h1 className="app-section-title">{title}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{summary}</p>
          </div>
          <div className="app-panel-muted min-w-[220px] rounded-2xl px-4 py-3 text-sm">
            <p className="text-xs text-muted-foreground">{resultCountLabel}</p>
            <p className="mt-1 line-clamp-2 font-medium text-foreground">“{currentQuery || "-"}”</p>
          </div>
        </div>

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
      </Card>

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

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="app-panel-muted rounded-xl px-3 py-2 text-xs text-muted-foreground">
                        <p className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-primary" />{matchScoreLabel}</p>
                        <p className="mt-1 text-base font-semibold text-foreground">{scoreFromConfidence(item.confidenceScore)} / 100</p>
                      </div>
                      <div className="app-panel-muted rounded-xl px-3 py-2 text-xs text-muted-foreground">
                        <p className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{reputationLabel}</p>
                        <p className="mt-1 text-base font-semibold text-foreground">{ratingFromName(item.name)} / 5</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">{reasonsLabel}</p>
                      <ul className="space-y-1.5">
                        {(item.fitReasons?.length ? item.fitReasons : [item.reason]).slice(0, 2).map((reason) => (
                          <li key={`${item.name}-${reason}`} className="inline-flex items-start gap-2 text-sm text-foreground/90">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {(item.bestFor.length > 0 || item.limitations.length > 0) && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-muted-foreground">{bestForLabel}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(item.bestFor ?? []).slice(0, 3).map((entry) => (
                              <Badge key={`${item.name}-best-${entry}`} variant="secondary" className="rounded-full">
                                {entry}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-muted-foreground">{caveatsLabel}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(item.limitations ?? []).slice(0, 2).map((entry) => (
                              <Badge key={`${item.name}-limit-${entry}`} variant="outline" className="rounded-full text-muted-foreground">
                                {entry}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {(item.tags ?? []).slice(0, 5).map((tag) => (
                        <Badge key={`${item.name}-${tag}`} variant="secondary" className="rounded-full">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
                      <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Scale className="h-3.5 w-3.5" />
                        <span>{selected ? comparedLabel : compareReadyLabel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onVisitWebsite(item)}>
                          <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
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

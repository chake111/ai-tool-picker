import { Card } from "@/components/ui/card"
import { HistoryPagination } from "@/components/history/history-pagination"
import { ResultsToolbar } from "@/components/results/results-toolbar"
import { LoadingStatePanel, StatePanel } from "@/components/ui/state-panel"
import { ToolDecisionCard } from "@/components/results/tool-decision-card"
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
  capabilityLabel: string
  nextActionLabel: string
  detailsLabel: string
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
  capabilityLabel,
  nextActionLabel,
  detailsLabel,
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
        <LoadingStatePanel hint={loadingHint} />
      ) : isEmptyResults ? (
        <StatePanel hint={emptyHint} tone="dashed" />
      ) : isNoMatch ? (
        <StatePanel hint={noMatchHint} tone="dashed" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {pagedResults.map((item) => {
              const selected = compareTools.some((tool) => tool.name === item.name)
              const favorited = favorites.includes(item.name)

              return (
                <ToolDecisionCard
                  key={item.name}
                  item={item}
                  selected={selected}
                  favorited={favorited}
                  favoriteFeedback={getActionFeedbackState(item.name, "favorite")}
                  compareFeedback={getActionFeedbackState(item.name, "compare")}
                  visitFeedback={getActionFeedbackState(item.name, "visit")}
                  matchScoreLabel={matchScoreLabel}
                  reputationLabel={reputationLabel}
                  reasonsLabel={reasonsLabel}
                  bestForLabel={bestForLabel}
                  caveatsLabel={caveatsLabel}
                  capabilityLabel={capabilityLabel}
                  nextActionLabel={nextActionLabel}
                  detailsLabel={detailsLabel}
                  compareReadyLabel={compareReadyLabel}
                  comparedLabel={comparedLabel}
                  addLabel={addLabel}
                  addedLabel={addedLabel}
                  favoriteLabel={favoriteLabel}
                  favoritedLabel={favoritedLabel}
                  visitWebsiteLabel={visitWebsiteLabel}
                  visitedWebsiteLabel={visitedWebsiteLabel}
                  onToggleCompare={onToggleCompare}
                  onToggleFavorite={onToggleFavorite}
                  onVisitWebsite={onVisitWebsite}
                />
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

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HistoryPagination } from "@/components/history/history-pagination"
import { HomeResultsFilters } from "@/components/home/home-results-filters"
import { Heart, Star } from "lucide-react"

type DisplayItem = {
  name: string
  desc: string
  reason: string
  link: string
  tags: string[]
  priceRange: string
  platform: string
  languageSupport: string
}

type ResultsListProps<TOption extends string> = {
  title: string
  emptyHint: string
  isLoading: boolean
  results: DisplayItem[]
  pagedResults: DisplayItem[]
  compareTools: DisplayItem[]
  filters: TOption
  filterOptions: readonly TOption[]
  onFilterSelect: (option: TOption) => void
  getFilterLabel: (option: TOption) => string
  onToggleCompare: (tool: DisplayItem) => void
  addLabel: string
  addedLabel: string
  visitWebsiteLabel: string
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

export function ResultsList<TOption extends string>({
  title,
  emptyHint,
  isLoading,
  results,
  pagedResults,
  compareTools,
  filters,
  filterOptions,
  onFilterSelect,
  getFilterLabel,
  onToggleCompare,
  addLabel,
  addedLabel,
  visitWebsiteLabel,
  showPagination,
  currentPage,
  totalPages,
  pageLabel,
  previousLabel,
  nextLabel,
  onPreviousPage,
  onNextPage,
}: ResultsListProps<TOption>) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <HomeResultsFilters options={filterOptions} activeOption={filters} getLabel={getFilterLabel} onSelect={onFilterSelect} />
      </div>

      {results.length === 0 && !isLoading ? (
        <Card className="rounded-2xl border-dashed p-5 text-sm text-muted-foreground">{emptyHint}</Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {pagedResults.map((item) => {
              const selected = compareTools.some((tool) => tool.name === item.name)
              const logo = item.name.trim().slice(0, 1)
              return (
                <Card
                  key={item.name}
                  className="animate-in fade-in slide-in-from-bottom-1.5 rounded-2xl border border-border/80 p-5 duration-500"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">{logo}</div>
                        <div>
                          <h3 className="text-base font-semibold">{item.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`收藏 ${item.name}`}
                        className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/70"
                      >
                        <Heart className="h-4 w-4" />
                      </button>
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
                        <Button asChild size="sm" variant="outline" className="rounded-xl">
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            {visitWebsiteLabel}
                          </a>
                        </Button>
                        <Button size="sm" variant={selected ? "default" : "outline"} className="rounded-xl" onClick={() => onToggleCompare(item)}>
                          {selected ? addedLabel : addLabel}
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

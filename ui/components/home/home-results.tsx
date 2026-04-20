import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HistoryList } from "@/components/history/history-list"
import { HistoryPagination } from "@/components/history/history-pagination"
import { HomeResultsFilters } from "@/components/home/home-results-filters"

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

type HomeResultsProps<TOption extends string> = {
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

export function HomeResults<TOption extends string>({
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
}: HomeResultsProps<TOption>) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <HomeResultsFilters options={filterOptions} activeOption={filters} getLabel={getFilterLabel} onSelect={onFilterSelect} />
      </div>

      {results.length === 0 && !isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">{emptyHint}</Card>
      ) : (
        <>
          <HistoryList>
            {pagedResults.map((item) => {
              const selected = compareTools.some((tool) => tool.name === item.name)
              return (
                <Card key={item.name} className="space-y-3 p-4">
                  <div>
                    <h3 className="text-base font-semibold">{item.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <p className="text-sm">{item.reason}</p>
                  <div className="flex flex-wrap gap-2">
                    {(item.tags ?? []).slice(0, 4).map((tag) => (
                      <Badge key={`${item.name}-${tag}`} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        {visitWebsiteLabel}
                      </a>
                    </Button>
                    <Button size="sm" variant={selected ? "default" : "outline"} onClick={() => onToggleCompare(item)}>
                      {selected ? addedLabel : addLabel}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </HistoryList>

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

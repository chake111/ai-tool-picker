import { Button } from "@/components/ui/button"

type HistoryPaginationProps = {
  currentPage: number
  totalPages: number
  pageLabel: string
  previousLabel: string
  nextLabel: string
  onPrevious: () => void
  onNext: () => void
}

export function HistoryPagination({ currentPage, totalPages, pageLabel, previousLabel, nextLabel, onPrevious, onNext }: HistoryPaginationProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button type="button" size="sm" variant="outline" onClick={onPrevious} disabled={currentPage === 1}>
        {previousLabel}
      </Button>
      <p className="text-sm text-muted-foreground">{pageLabel}</p>
      <Button type="button" size="sm" variant="outline" onClick={onNext} disabled={currentPage >= totalPages}>
        {nextLabel}
      </Button>
    </div>
  )
}

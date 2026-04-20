import type { ReactNode } from "react"

type HistoryListProps = {
  children: ReactNode
}

export function HistoryList({ children }: HistoryListProps) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>
}

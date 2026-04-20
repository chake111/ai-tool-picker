import type { ReactNode } from "react"

type HistoryActionsProps = {
  children: ReactNode
}

export function HistoryActions({ children }: HistoryActionsProps) {
  return <div className="flex items-center justify-end gap-2">{children}</div>
}

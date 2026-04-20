import type { ReactNode } from "react"

export function CompareTable({ children }: { children: ReactNode }) {
  return <div className="app-panel overflow-x-auto">{children}</div>
}

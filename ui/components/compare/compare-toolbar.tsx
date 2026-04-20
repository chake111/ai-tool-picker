import type { ReactNode } from "react"

export function CompareToolbar({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-3">{children}</div>
}

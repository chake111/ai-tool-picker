import type { ReactNode } from "react"

export function CompareToolbar({ children }: { children: ReactNode }) {
  return <div className="app-toolbar">{children}</div>
}

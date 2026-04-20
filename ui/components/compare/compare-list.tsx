import type { ReactNode } from "react"

export function CompareList({ children }: { children: ReactNode }) {
  return <div className="grid gap-3">{children}</div>
}

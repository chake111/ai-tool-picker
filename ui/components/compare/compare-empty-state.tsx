import { Card } from "@/components/ui/card"

export function CompareEmptyState({ message }: { message: string }) {
  return <Card className="app-panel p-6 text-sm text-muted-foreground">{message}</Card>
}

import { ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { FavoriteItem } from "@/lib/favorites-store"

type FavoriteCardProps = {
  item: FavoriteItem
  visitLabel: string
  noWebsiteLabel: string
  removeLabel: string
  onRemove: (name: string) => void
}

export function FavoriteCard({ item, visitLabel, noWebsiteLabel, removeLabel, onRemove }: FavoriteCardProps) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{item.name}</h2>
          <p className="text-sm text-muted-foreground">{item.desc}</p>
        </div>
        <Button size="icon-sm" variant="ghost" onClick={() => onRemove(item.name)} aria-label={removeLabel}>
          <Trash2 className="size-4" />
        </Button>
      </div>
      <p className="text-sm">{item.reason}</p>
      <div className="flex flex-wrap gap-2">
        {(item.tags ?? []).map((tag) => (
          <span key={`${item.name}-${tag}`} className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>
      {item.link ? (
        <Button asChild size="sm" variant="outline">
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            {visitLabel} <ExternalLink className="ml-1 size-3.5" />
          </a>
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">{noWebsiteLabel}</p>
      )}
    </Card>
  )
}

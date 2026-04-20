import { Card } from "@/components/ui/card"
import { FavoriteCard } from "@/components/favorites/favorite-card"
import type { FavoriteItem } from "@/lib/favorites-store"

type FavoritesListProps = {
  items: FavoriteItem[]
  emptyLabel: string
  visitLabel: string
  noWebsiteLabel: string
  getRemoveLabel: (name: string) => string
  onRemove: (name: string) => void
}

export function FavoritesList({ items, emptyLabel, visitLabel, noWebsiteLabel, getRemoveLabel, onRemove }: FavoritesListProps) {
  if (items.length === 0) {
    return <Card className="p-6 text-sm text-muted-foreground">{emptyLabel}</Card>
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <FavoriteCard
          key={item.name}
          item={item}
          visitLabel={visitLabel}
          noWebsiteLabel={noWebsiteLabel}
          removeLabel={getRemoveLabel(item.name)}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

type SortMode = "name" | "ai" | "scenario"

type FavoritesToolbarProps = {
  title: string
  subtitle: string
  sortMode: SortMode
  onSortChange: (mode: SortMode) => void
  sortAriaLabel: string
  nameLabel: string
  aiLabel: string
  scenarioLabel: string
  statsLabel: string
}

export function FavoritesToolbar({
  title,
  subtitle,
  sortMode,
  onSortChange,
  sortAriaLabel,
  nameLabel,
  aiLabel,
  scenarioLabel,
  statsLabel,
}: FavoritesToolbarProps) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <p className="text-xs text-muted-foreground">{statsLabel}</p>
      </div>
      <select
        value={sortMode}
        onChange={(event) => onSortChange(event.target.value as SortMode)}
        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        aria-label={sortAriaLabel}
      >
        <option value="name">{nameLabel}</option>
        <option value="ai">{aiLabel}</option>
        <option value="scenario">{scenarioLabel}</option>
      </select>
    </section>
  )
}

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowUpRight, Check, Heart, Scale, Sparkles, Star } from "lucide-react"
import type { DisplayItem } from "@/hooks/use-search-flow"

type ActionFeedbackState = "idle" | "done"

type ToolDecisionCardProps = {
  item: DisplayItem
  selected: boolean
  favorited: boolean
  favoriteFeedback: ActionFeedbackState
  compareFeedback: ActionFeedbackState
  visitFeedback: ActionFeedbackState
  matchScoreLabel: string
  reputationLabel: string
  reasonsLabel: string
  bestForLabel: string
  caveatsLabel: string
  capabilityLabel: string
  nextActionLabel: string
  compareReadyLabel: string
  comparedLabel: string
  addLabel: string
  addedLabel: string
  favoriteLabel: string
  favoritedLabel: string
  visitWebsiteLabel: string
  visitedWebsiteLabel: string
  detailsLabel: string
  onToggleCompare: (tool: DisplayItem) => void
  onToggleFavorite: (tool: DisplayItem) => void
  onVisitWebsite: (tool: DisplayItem) => void
}

const ratingFromName = (name: string) => (4.3 + ((name.length % 6) * 0.1)).toFixed(1)
const scoreFromConfidence = (score: number) => Math.round(score * 100)

export function ToolDecisionCard({
  item,
  selected,
  favorited,
  favoriteFeedback,
  compareFeedback,
  visitFeedback,
  matchScoreLabel,
  reputationLabel,
  reasonsLabel,
  bestForLabel,
  caveatsLabel,
  capabilityLabel,
  nextActionLabel,
  compareReadyLabel,
  comparedLabel,
  addLabel,
  addedLabel,
  favoriteLabel,
  favoritedLabel,
  visitWebsiteLabel,
  visitedWebsiteLabel,
  detailsLabel,
  onToggleCompare,
  onToggleFavorite,
  onVisitWebsite,
}: ToolDecisionCardProps) {
  const logo = item.name.trim().slice(0, 1)

  return (
    <Card key={item.name} className="app-panel app-interactive animate-in fade-in slide-in-from-bottom-1.5 p-5 duration-500">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">{logo}</div>
            <div>
              <h3 className="text-base font-semibold">{item.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </div>
          <Button type="button" size="icon" variant="ghost" aria-label={`收藏 ${item.name}`} onClick={() => onToggleFavorite(item)}>
            {favoriteFeedback === "done" ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="app-panel-muted rounded-xl px-3 py-2 text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {matchScoreLabel}
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">{scoreFromConfidence(item.confidenceScore)} / 100</p>
          </div>
          <div className="app-panel-muted rounded-xl px-3 py-2 text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {reputationLabel}
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">{ratingFromName(item.name)} / 5</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{reasonsLabel}</p>
          <ul className="space-y-1.5">
            {(item.fitReasons?.length ? item.fitReasons : [item.reason]).slice(0, 2).map((reason) => (
              <li key={`${item.name}-${reason}`} className="inline-flex items-start gap-2 text-sm text-foreground/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{bestForLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {(item.bestFor ?? []).slice(0, 3).map((entry) => (
                <Badge key={`${item.name}-best-${entry}`} variant="secondary" className="rounded-full">
                  {entry}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{caveatsLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {(item.limitations ?? []).slice(0, 2).map((entry) => (
                <Badge key={`${item.name}-limit-${entry}`} variant="outline" className="rounded-full text-muted-foreground">
                  {entry}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">{capabilityLabel}</p>
          <div className="flex flex-wrap gap-2">
            {(item.tags ?? []).slice(0, 5).map((tag) => (
              <Badge key={`${item.name}-${tag}`} variant="secondary" className="rounded-full">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Scale className="h-3.5 w-3.5" />
            <span>{selected ? comparedLabel : compareReadyLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onVisitWebsite(item)}>
              <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
              {visitFeedback === "done" ? visitedWebsiteLabel : visitWebsiteLabel}
            </Button>
            <Button size="sm" className="rounded-xl" onClick={() => onToggleCompare(item)}>
              {compareFeedback === "done" ? addedLabel : selected ? addedLabel : addLabel}
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onToggleFavorite(item)}>
              {favoriteFeedback === "done" ? favoritedLabel : favorited ? favoritedLabel : favoriteLabel}
            </Button>
            <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground">
              {detailsLabel}
            </Button>
          </div>
        </div>

        <p className="rounded-xl bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{nextActionLabel}</p>
      </div>
    </Card>
  )
}

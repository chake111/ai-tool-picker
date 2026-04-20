import type { ReactNode } from "react"
import { ShieldCheck, Sparkles, Timer } from "lucide-react"

type HeroStat = {
  label: string
  value: string
}

type HomeHeroProps = {
  title: string
  subtitle: string
  trustNote: string
  inputArea: ReactNode
  quickScenes: ReactNode
  scenarioTitle: string
  stats: HeroStat[]
}

const iconMap = [Sparkles, Timer, ShieldCheck]

export function HomeHero({ title, subtitle, trustNote, inputArea, quickScenes, scenarioTitle, stats }: HomeHeroProps) {
  return (
    <section className="app-panel relative overflow-hidden px-6 py-7 sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_14%,transparent)_0%,transparent_46%)]" />
      <div className="relative space-y-8">
        <div className="space-y-4">
          <p className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground">
            AI Tool Decision Assistant
          </p>
          <div className="space-y-3">
            <h1 className="max-w-4xl text-[length:var(--font-title-xl)] font-semibold leading-[var(--line-height-title)] tracking-tight text-foreground">{title}</h1>
            <p className="max-w-3xl text-[length:var(--font-body-md)] text-muted-foreground">{subtitle}</p>
          </div>
          <div className="app-panel-subtle flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground">
            <span>{trustNote}</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em]">Linear / Vercel inspired workflow</span>
          </div>
        </div>

        {inputArea}

        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = iconMap[index] ?? Sparkles
            return (
              <div key={stat.label} className="app-panel-muted flex items-start gap-3 rounded-2xl p-4">
                <span className="mt-0.5 rounded-lg bg-background p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{stat.value}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-3 border-t border-border/70 pt-5">
          <h2 className="text-sm font-medium text-foreground sm:text-base">{scenarioTitle}</h2>
          {quickScenes}
        </div>
      </div>
    </section>
  )
}

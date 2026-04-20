import type { ReactNode } from "react"

type HomeHeroProps = {
  title: string
  subtitle: string
  trustNote: string
  inputArea: ReactNode
  quickScenes: ReactNode
  scenarioTitle: string
}

export function HomeHero({ title, subtitle, trustNote, inputArea, quickScenes, scenarioTitle }: HomeHeroProps) {
  return (
    <section className="app-panel px-6 py-7 sm:px-8 sm:py-9">
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="max-w-4xl text-[length:var(--font-title-xl)] font-semibold leading-[var(--line-height-title)] tracking-tight text-foreground">{title}</h1>
          <p className="max-w-3xl text-[length:var(--font-body-md)] text-muted-foreground">{subtitle}</p>
        </div>

        {inputArea}

        <div className="space-y-3 border-t border-border/70 pt-4">
          <p className="text-xs text-muted-foreground sm:text-sm">{trustNote}</p>
          <h2 className="text-sm font-medium text-foreground sm:text-base">{scenarioTitle}</h2>
          {quickScenes}
        </div>
      </div>
    </section>
  )
}

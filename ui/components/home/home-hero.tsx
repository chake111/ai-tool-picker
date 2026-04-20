import type { ReactNode } from "react"

type HomeHeroProps = {
  title: string
  subtitle: string
  inputArea: ReactNode
  quickScenes: ReactNode
}

export function HomeHero({ title, subtitle, inputArea, quickScenes }: HomeHeroProps) {
  return (
    <section className="app-panel-subtle space-y-6 p-6 sm:p-8">
      <div className="space-y-3">
        <h1 className="text-[length:var(--font-title-xl)] font-bold leading-[var(--line-height-title)] tracking-tight text-foreground">{title}</h1>
        <p className="max-w-3xl text-[length:var(--font-body-md)] text-muted-foreground">{subtitle}</p>
      </div>
      {inputArea}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground sm:text-base">或者直接从场景开始</h2>
        {quickScenes}
      </div>
    </section>
  )
}

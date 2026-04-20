import type { ReactNode } from "react"

type HomeHeroProps = {
  title: string
  subtitle: string
  inputArea: ReactNode
  quickScenes: ReactNode
}

export function HomeHero({ title, subtitle, inputArea, quickScenes }: HomeHeroProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-border/60 bg-gradient-to-b from-primary/5 to-background p-6 sm:p-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[52px] lg:leading-[1.12]">{title}</h1>
        <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">{subtitle}</p>
      </div>
      {inputArea}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground sm:text-base">或者直接从场景开始</h2>
        {quickScenes}
      </div>
    </section>
  )
}

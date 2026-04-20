import type { ReactNode } from "react"

type HomeHeroProps = {
  title: string
  subtitle: string
  actions?: ReactNode
}

export function HomeHero({ title, subtitle, actions }: HomeHeroProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
      {actions}
    </section>
  )
}

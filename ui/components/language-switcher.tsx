"use client"

import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { routing, type AppLocale } from '@/i18n/routing'

const localeLabels: Record<AppLocale, string> = {
  zh: '中文',
  en: 'EN',
}

function replaceLocaleInPath(pathname: string, nextLocale: AppLocale) {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) {
    return `/${nextLocale}`
  }

  if (routing.locales.includes(segments[0] as AppLocale)) {
    segments[0] = nextLocale
    return `/${segments.join('/')}`
  }

  return `/${nextLocale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="inline-flex items-center rounded-full border border-border/70 bg-muted/20 p-1">
      {routing.locales.map((targetLocale) => {
        const active = targetLocale === locale
        return (
          <Button
            key={targetLocale}
            type="button"
            variant="ghost"
            size="sm"
            className={cn('rounded-full px-3', active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
            onClick={() => {
              if (targetLocale === locale) return
              router.replace(replaceLocaleInPath(pathname, targetLocale))
            }}
            aria-pressed={active}
          >
            {localeLabels[targetLocale]}
          </Button>
        )
      })}
    </div>
  )
}

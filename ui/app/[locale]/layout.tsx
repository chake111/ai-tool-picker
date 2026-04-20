import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Heart, Home, Settings2, Sparkles } from 'lucide-react'
import { AuthSessionProvider } from '@/components/auth-session-provider'
import { IntlProvider } from '@/components/intl-provider'
import { Toaster } from '@/components/ui/toaster'
import { routing } from '@/i18n/routing'

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>

export async function generateMetadata({ params }: Omit<LocaleLayoutProps, 'children'>): Promise<Metadata> {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    return {
      title: 'AI Tool Picker',
      description: 'Tell us what you need and we will recommend suitable AI tools.',
    }
  }

  const t = await getTranslations({ locale, namespace: 'metadata' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = await getMessages()
  const navItems = [
    { href: `/${locale}`, label: locale === 'zh' ? '首页' : 'Home', icon: Home },
    { href: `/${locale}/favorites`, label: locale === 'zh' ? '收藏' : 'Favorites', icon: Heart },
    { href: `/${locale}/preferences`, label: locale === 'zh' ? '偏好' : 'Preferences', icon: Settings2 },
  ]

  return (
    <IntlProvider locale={locale} messages={messages}>
      <AuthSessionProvider>
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
            <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <Link href={`/${locale}`} className="inline-flex items-center gap-3 rounded-lg px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/70">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground sm:text-base">AI Tool Picker</p>
                  <p className="text-xs text-muted-foreground">{locale === 'zh' ? '更快找到适合你的 AI 工具' : 'Pick the right AI tool faster'}</p>
                </div>
              </Link>

              <div className="flex items-center gap-1 sm:gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/70"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>
          </header>
          {children}
          <Toaster />
        </div>
      </AuthSessionProvider>
    </IntlProvider>
  )
}

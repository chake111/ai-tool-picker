import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { AuthSessionProvider } from '@/components/auth-session-provider'
import { IntlProvider } from '@/components/intl-provider'
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
    { href: `/${locale}`, label: locale === 'zh' ? '首页' : 'Home' },
    { href: `/${locale}/favorites`, label: locale === 'zh' ? '收藏' : 'Favorites' },
    { href: `/${locale}/preferences`, label: locale === 'zh' ? '偏好' : 'Preferences' },
  ]

  return (
    <IntlProvider locale={locale} messages={messages}>
      <AuthSessionProvider>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border/80 bg-background/95">
            <nav className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          {children}
        </div>
      </AuthSessionProvider>
    </IntlProvider>
  )
}

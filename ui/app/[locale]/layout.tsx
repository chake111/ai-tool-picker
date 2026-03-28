import type { Metadata } from 'next'
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

  return (
    <IntlProvider locale={locale} messages={messages}>
      <AuthSessionProvider>{children}</AuthSessionProvider>
    </IntlProvider>
  )
}

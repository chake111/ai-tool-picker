"use client"

import { NextIntlClientProvider } from "next-intl"

type IntlProviderProps = {
  children: React.ReactNode
  locale: string
  messages: Record<string, unknown>
}

export function IntlProvider({ children, locale, messages }: IntlProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={() => {}}
      getMessageFallback={({ namespace, key }) =>
        namespace ? `${namespace}.${key}` : key
      }
    >
      {children}
    </NextIntlClientProvider>
  )
}

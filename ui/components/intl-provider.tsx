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
      onError={(error) => {
        if (process.env.NODE_ENV !== "production") {
          console.error(error)
        }
      }}
      getMessageFallback={({ namespace, key }) =>
        namespace ? `${namespace}.${key}` : key
      }
    >
      {children}
    </NextIntlClientProvider>
  )
}

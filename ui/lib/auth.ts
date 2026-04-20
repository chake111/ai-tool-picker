import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const isDevOrDebug = process.env.NODE_ENV !== "production" || process.env.AUTH_DEBUG === "true"

type AuthEnvDiagnostics = {
  env: string
  isDevOrDebug: boolean
  googleClientIdConfigured: boolean
  googleClientSecretConfigured: boolean
  nextAuthUrlConfigured: boolean
  nextAuthUrlValid: boolean
  nextAuthUrlProtocol: string | null
  checkedAt: string
}

function isNonEmpty(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0
}

function parseUrl(urlRaw: string | undefined): URL | null {
  if (!isNonEmpty(urlRaw)) return null
  try {
    return new URL(urlRaw as string)
  } catch {
    return null
  }
}

function buildAuthEnvDiagnostics(): AuthEnvDiagnostics {
  const parsedNextAuthUrl = parseUrl(process.env.NEXTAUTH_URL)

  return {
    env: process.env.NODE_ENV ?? "unknown",
    isDevOrDebug,
    googleClientIdConfigured: isNonEmpty(process.env.GOOGLE_CLIENT_ID),
    googleClientSecretConfigured: isNonEmpty(process.env.GOOGLE_CLIENT_SECRET),
    nextAuthUrlConfigured: isNonEmpty(process.env.NEXTAUTH_URL),
    nextAuthUrlValid: Boolean(parsedNextAuthUrl),
    nextAuthUrlProtocol: parsedNextAuthUrl?.protocol ?? null,
    checkedAt: new Date().toISOString(),
  }
}

let hasLoggedAuthEnvWarnings = false

function logAuthEnvWarningsIfNeeded(): void {
  if (!isDevOrDebug || hasLoggedAuthEnvWarnings) return

  const diagnostics = buildAuthEnvDiagnostics()

  if (!diagnostics.googleClientIdConfigured) {
    console.warn("[auth] missing GOOGLE_CLIENT_ID")
  }

  if (!diagnostics.googleClientSecretConfigured) {
    console.warn("[auth] missing GOOGLE_CLIENT_SECRET")
  }

  if (!diagnostics.nextAuthUrlConfigured) {
    console.warn("[auth] missing NEXTAUTH_URL")
  } else if (!diagnostics.nextAuthUrlValid) {
    console.warn("[auth] invalid NEXTAUTH_URL")
  }

  hasLoggedAuthEnvWarnings = true
}

logAuthEnvWarningsIfNeeded()

export function getAuthConfigDebugSnapshot() {
  const diagnostics = buildAuthEnvDiagnostics()
  return {
    ...diagnostics,
    secrets: {
      googleClientId: diagnostics.googleClientIdConfigured ? "configured" : "missing",
      googleClientSecret: diagnostics.googleClientSecretConfigured ? "configured" : "missing",
    },
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Keep provider-issued sub as stable identity key; avoid overriding with mutable email.
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // Backward compatibility: fall back to email only when stable id is unavailable.
        const stableId = typeof token.sub === "string" ? token.sub.trim() : ""
        session.user.id = stableId || session.user.email || ""
      }
      return session
    },
  },
}

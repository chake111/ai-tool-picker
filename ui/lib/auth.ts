import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

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

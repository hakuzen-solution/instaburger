import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials) {
        const identifier = String(credentials?.username || credentials?.email || '')
        const pwd = String(credentials?.password || '')
        if (!identifier || !pwd) return null

        const user = await prisma.user.findUnique({
          where: { email: identifier }
        })

        if (!user?.password) return null

        const isValid = await bcrypt.compare(pwd, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.role = user?.role ?? "admin"
        token.id = user?.id
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user) {
        session.user.role = token?.role as string
        session.user.id = token?.id as string
      }
      return session
    },
  },
})

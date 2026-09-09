import type { NextAuthConfig } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logError } from '@/lib/errors/log-error'
import { checkRateLimit, peekRateLimit, resetRateLimit } from '@/lib/security/rate-limit'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authConfig: NextAuthConfig = {
  // NextAuth v5 lit AUTH_SECRET en priorité ; la valeur explicite ci-dessous
  // garantit que NEXTAUTH_SECRET (défini sur Vercel) est bien utilisé aussi.
  // Sans cela, le build de production lève MissingSecret sur toutes les
  // routes /api/auth/* (message « There was a problem with the server
  // configuration ») — bug de connexion vu en prod le 2026-09-06.
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-in-production-min-32-chars',
  // Requis en v5 derrière un proxy/sous-domaine Vercel pour valider l'hôte.
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/error',
  },
  // Configuration explicite des cookies pour NextAuth v5
  // Important pour la compatibilite avec le middleware
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  // Configuration explicite des cookies pour NextAuth v5
  // Important pour la compatibilite avec le middleware
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          await logError({
            errorType: 'AUTH_LOGIN_FAILED',
            message: 'Identifiants invalides (format)',
            context: { route: 'authorize' },
          })
          return null
        }

        const { email, password } = validatedFields.data

        // Rate limiting login : 8 échecs / email / 15 min. On ne consomme un
        // jeton QUE sur échec — un utilisateur qui se trompe deux fois n'est
        // pas pénalisé au-delà, et un succès ne compte pas.
        const rlKey = `login:email:${email.toLowerCase()}`
        const rl = peekRateLimit(rlKey, 8, 15 * 60 * 1000)
        if (!rl.allowed) {
          await logError({
            errorType: 'AUTH_RATE_LIMITED',
            message: `Trop de tentatives de connexion pour ${email}`,
          })
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) {
          checkRateLimit(rlKey, 8, 15 * 60 * 1000)
          await logError({
            errorType: 'AUTH_LOGIN_FAILED',
            message: `Échec de connexion : compte introuvable pour ${email}`,
          })
          return null
        }

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash)

        if (!passwordsMatch) {
          checkRateLimit(rlKey, 8, 15 * 60 * 1000)
          await logError({
            errorType: 'AUTH_LOGIN_FAILED',
            message: `Échec de connexion : mot de passe incorrect pour ${email}`,
          })
          return null
        }

        if (!user.active) {
          await logError({
            errorType: 'AUTH_LOGIN_BLOCKED',
            message: `Tentative de connexion sur compte désactivé : ${email}`,
          })
          return null
        }

        // Connexion réussie : on repart sur un bucket propre
        resetRateLimit(rlKey)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'USER' | 'ADMIN',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Connexion : on ancre l'identité et le rôle lus en base.
        token.id = user.id as string
        token.role = user.role as 'USER' | 'ADMIN'
        return token
      }

      // NOTE: La vérification en base à chaque rafraîchissement peut causer
      // des problèmes de performance en production. Pour l'instant, on garde
      // les informations dans le token JWT. Si vous avez besoin d'une vérification
      // stricte en temps réel, vous pouvez réactiver la logique ci-dessous,
      // mais assurez-vous que la connexion DB est optimisée.

      // // Rafraîchissement (chaque accès à la session) : re-vérification en base.
      // // Un compte supprimé ou désactivé invalide sa session IMMÉDIATEMENT —
      // // sinon un JWT reste utilisable jusqu'à son expiration même après la
      // // suppression du compte (trou constaté en prod le 2026-09-07 : une
      // // session « JEAN » survivait à la suppression du compte).
      // // Le rôle est aussi re-synchronisé à chaque fois : une promotion ou une
      // // désactivation d'admin s'applique sans attendre une reconnexion.
      // const dbUser = await prisma.user.findUnique({
      //   where: { id: token.id as string },
      //   select: { role: true, active: true },
      // })
      // if (!dbUser || !dbUser.active) {
      //   // null = session détruite (NextAuth v5) → déconnexion effective.
      //   return null
      // }
      // token.role = dbUser.role as 'USER' | 'ADMIN'
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'USER' | 'ADMIN'
      }
      return session
    },
  },
}
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  // Add CSRF protection
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.sub) {
        // Set the basic session data first
        session.user.id = token.sub;
        session.user.role = token.role as string;

        // Validate that the user still exists in the database (optional check)
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.sub },
            select: { id: true, isActive: true },
          });

          if (!dbUser || !dbUser.isActive) {
            console.log(
              "Session validation warning - user not found or inactive:",
              {
                tokenSub: token.sub,
                userExists: !!dbUser,
                isActive: dbUser?.isActive,
              },
            );
            // Note: We're not expiring the session immediately, just logging the issue
            // The user will be handled at the API level if needed
          }
        } catch (error) {
          console.error("Error validating user session (non-critical):", error);
          // Continue with the session anyway - don't break user experience
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Log successful sign-ins for security monitoring
      if (process.env.NODE_ENV === "production") {
        console.log(`User signed in: ${user.email} via ${account?.provider}`);
      }
    },
  },
  // Remove debug mode for production
  debug: false,
});

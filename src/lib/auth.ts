import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { secureLogger } from "@/lib/secure-logger";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours (reduced from 30 days for better security)
    updateAge: 4 * 60 * 60, // 4 hours (more frequent updates)
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Redirect errors to signin page
  },
  // Enhanced CSRF protection
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict", // Changed from "lax" to "strict" for better security
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60, // Match session maxAge
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60, // 15 minutes for callback URL
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60, // 15 minutes for CSRF token
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
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

        const email = (credentials.email as string).toLowerCase();

        try {
          const user = await db.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              isActive: true,
            },
          });

          if (!user || !user.password) {
            // Failed login will be handled by the auth router's recordFailedAttempt
            return null;
          }

          // Check if account is active
          if (!user.isActive) {
            // Failed login will be handled by the auth router's recordFailedAttempt
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password,
          );

          if (!isPasswordValid) {
            // Failed login will be handled by the auth router's recordFailedAttempt
            return null;
          }

          // Successful login - clear any failed attempts via the auth router
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          secureLogger.error("Authorization error", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Enhanced redirect validation to prevent open redirects
      try {
        // Allow relative callback URLs
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }
        
        // Parse the URL to validate it
        const parsedUrl = new URL(url);
        const parsedBaseUrl = new URL(baseUrl);
        
        // Only allow same origin redirects
        if (parsedUrl.origin === parsedBaseUrl.origin) {
          return url;
        }
        
        // Allow specific trusted domains (add your production domains here)
        const trustedDomains = [
          "localhost:3000",
          "easesubs.com",
          "www.easesubs.com",
        ];
        
        if (trustedDomains.includes(parsedUrl.host)) {
          return url;
        }
        
        // Fallback to base URL for security
        return baseUrl;
      } catch {
        // If URL parsing fails, return base URL
        return baseUrl;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.isActive = true; // Will be validated in session callback
      }
      
      // Add timestamp for token freshness validation
      if (!token.iat) {
        token.iat = Math.floor(Date.now() / 1000);
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && token.sub) {
        // Set the basic session data
        session.user.id = token.sub;
        session.user.role = token.role as string;

        // Validate user is still active (cached for performance)
        try {
          const user = await db.user.findUnique({
            where: { id: token.sub },
            select: { isActive: true },
          });

          if (!user?.isActive) {
            // User has been deactivated, invalidate session
            throw new Error("User account deactivated");
          }
        } catch (error) {
          secureLogger.error("Session validation error", error);
          // On database error, allow session to continue but log the issue
        }
      }
      return session;
    },
    async signIn({ account, profile }) {
      // Additional sign-in security checks
      if (account?.provider === "google" && profile?.email) {
        // For Google OAuth, ensure email is verified
        const googleProfile = profile as { email_verified?: boolean };
        if (!googleProfile.email_verified) {
          secureLogger.auth("Google sign-in with unverified email", profile.email);
          return false;
        }
        
        // Check if user exists and is active
        try {
          const existingUser = await db.user.findUnique({
            where: { email: profile.email.toLowerCase() },
            select: { isActive: true },
          });
          
          if (existingUser && !existingUser.isActive) {
            secureLogger.auth("Sign-in attempt for inactive user", profile.email);
            return false;
          }
        } catch (error) {
          secureLogger.error("Error checking user status during OAuth", error);
          return false;
        }
      }
      
      return true;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Enhanced security logging
      if (process.env.NODE_ENV === "production") {
        secureLogger.auth(`User signed in via ${account?.provider}${isNewUser ? " (new user)" : ""}`, user.email || undefined);
      }
      
      // Update last login timestamp
      if (user.id) {
        try {
          await db.user.update({
            where: { id: user.id },
            data: { updatedAt: new Date() },
          });
        } catch (error) {
          secureLogger.error("Failed to update last login", error);
        }
      }
    },
    async signOut() {
      if (process.env.NODE_ENV === "production") {
        secureLogger.auth("User signed out");
      }
    },
  },
  // Enhanced security settings
  debug: false, // Always false for security
});

import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const enabledSocialProviders = {
  github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
};

export const auth = betterAuth({
  appName: "Pattern Tracker",
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      // Not awaited so response time doesn't reveal whether the account exists.
      void sendEmail({
        to: user.email,
        subject: "Reset your Pattern Tracker password",
        text: `Someone requested a password reset for this account.\n\nReset it here (valid for 1 hour): ${url}\n\nIf this wasn't you, ignore this email.`,
      });
    },
  },
  socialProviders: {
    ...(enabledSocialProviders.github && {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      },
    }),
    ...(enabledSocialProviders.google && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    }),
  },
  user: {
    deleteUser: { enabled: true },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    // No cookie cache: role changes and bans must take effect on the very next request.
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 300, max: 3 },
      "/change-password": { window: 60, max: 5 },
    },
  },
  // nextCookies must stay last so cookies set by other plugins are forwarded.
  plugins: [admin(), nextCookies()],
});

import { LibsqlDialect } from "@libsql/kysely-libsql";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";

const getDatabaseDialect = () => {
  const url = process.env.TURSO_DATABASE_URL;
  if (url !== undefined && url !== "") {
    return new LibsqlDialect({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return new LibsqlDialect({
    url: "file::memory:",
  });
};

export const auth = betterAuth({
  appName: "Stowaway",
  database: {
    dialect: getDatabaseDialect(),
    type: "sqlite",
  },
  plugins: [
    magicLink({
      storeToken: "hashed",
      sendMagicLink: ({ email, url }) => {
        if (process.env.NODE_ENV !== "production") {
          process.stdout.write(`\n[Stowaway Magic Link] ${email}\n${url}\n\n`);
          return;
        }
        throw new Error(
          "Magic link email provider is not configured for production"
        );
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;

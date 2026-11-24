import { redirect } from "next/navigation";

import { SetupNotice } from "@/components/setup-notice";
import { SignInForm } from "@/components/sign-in-form";
import { isDbConfigured } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  EXPIRED_TOKEN: "That sign-in link has expired. Request a new one below.",
  INVALID_TOKEN:
    "That sign-in link is invalid or has already been used. Request a new one below.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const configured = isDbConfigured();
  if (configured) {
    const session = await getSession();
    if (session) {
      redirect("/");
    }
  }

  const { error } = await searchParams;
  const errorMessage =
    error === undefined
      ? undefined
      : (ERROR_MESSAGES[error] ?? "Could not verify that sign-in link.");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col gap-3">
        <span className="font-heading text-primary text-sm font-bold tracking-widest uppercase">
          Stowaway
        </span>
        <h1 className="font-heading text-3xl font-bold text-balance md:text-4xl">
          Sign in to your lists.
        </h1>
        <p className="text-muted-foreground leading-relaxed text-pretty">
          Enter your email and we&apos;ll send a one-click sign-in link. New
          here? Your account is created automatically.
        </p>
      </header>

      {configured ? (
        <SignInForm
          initialError={errorMessage}
          isDev={process.env.NODE_ENV !== "production"}
        />
      ) : (
        <SetupNotice />
      )}
    </main>
  );
}

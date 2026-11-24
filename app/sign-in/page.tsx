import { redirect } from "next/navigation";

import { SetupNotice } from "@/components/setup-notice";
import { SignInForm } from "@/components/sign-in-form";
import { isDbConfigured } from "@/lib/db";
import { isPassphraseAuthConfigured } from "@/lib/passphrase-auth";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const isConfigured = isDbConfigured() && isPassphraseAuthConfigured();
  if (isConfigured && (await getSession())) {
    redirect("/");
  }

  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col gap-3">
        <span className="font-heading text-primary text-sm font-bold tracking-widest uppercase">
          Stowaway
        </span>
        <h1 className="font-heading text-3xl font-bold text-balance md:text-4xl">
          Unlock your lists.
        </h1>
        <p className="text-muted-foreground leading-relaxed text-pretty">
          Enter your private passphrase to open your packing lists.
        </p>
      </header>

      {isConfigured ? (
        <SignInForm
          error={
            error === "invalid" ? "That passphrase didn't match." : undefined
          }
        />
      ) : (
        <SetupNotice />
      )}
    </main>
  );
}

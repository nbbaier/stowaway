"use client";

import { Mail } from "lucide-react";
import { useState, useTransition } from "react";
import type { SubmitEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

interface SignInFormProps {
  initialError?: string;
  isDev: boolean;
}

export const SignInForm = ({ initialError, isDev }: SignInFormProps) => {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, startTransition] = useTransition();

  const sendLink = (targetEmail: string) => {
    startTransition(async () => {
      setError(null);
      const { error: signInError } = await signIn.magicLink({
        email: targetEmail,
        callbackURL: "/",
        errorCallbackURL: "/sign-in",
      });
      if (signInError) {
        setError(
          signInError.message ?? "Could not send a sign-in link. Try again."
        );
        return;
      }
      setSentEmail(targetEmail);
    });
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address.");
      return;
    }
    sendLink(trimmed);
  };

  if (sentEmail !== null) {
    return (
      <div className="bg-card text-card-foreground flex flex-col gap-5 rounded-xl border p-6">
        <div className="flex flex-col gap-2">
          <div className="text-primary flex items-center gap-2 text-sm font-medium">
            <Mail className="size-4" aria-hidden="true" />
            <span>Check your inbox</span>
          </div>
          <p className="text-sm leading-relaxed">
            We sent a sign-in link to{" "}
            <span className="font-medium">{sentEmail}</span>. Click it to open
            your packing lists.
          </p>
          {isDev && (
            <p className="text-muted-foreground text-xs leading-relaxed">
              Dev mode: email sending is mocked, so the magic link was printed
              to your server terminal.
            </p>
          )}
        </div>

        {error !== null && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              sendLink(sentEmail);
            }}
          >
            {pending ? "Sending..." : "Resend link"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              setSentEmail(null);
              setError(null);
            }}
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card text-card-foreground flex flex-col gap-5 rounded-xl border p-6"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="sign-in-email">Email address</Label>
        <Input
          id="sign-in-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
          required
        />
      </div>

      {error !== null && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending link..." : "Send sign-in link"}
      </Button>
    </form>
  );
};

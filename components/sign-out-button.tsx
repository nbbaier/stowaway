"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export const SignOutButton = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await signOut();
          router.push("/sign-in");
          router.refresh();
        });
      }}
    >
      <LogOut aria-hidden="true" />
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
};

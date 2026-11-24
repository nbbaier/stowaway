import { LogOut } from "lucide-react";

import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";

export const SignOutButton = () => (
  <form action={signOut}>
    <Button type="submit" variant="ghost" size="sm">
      <LogOut aria-hidden="true" />
      Sign out
    </Button>
  </form>
);

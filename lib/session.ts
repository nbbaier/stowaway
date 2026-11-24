import { redirect } from "next/navigation";

import {
  getPassphraseSession,
  isPassphraseAuthConfigured,
} from "@/lib/passphrase-auth";

export const getSession = getPassphraseSession;

export const requireSession = async () => {
  if (!isPassphraseAuthConfigured()) {
    redirect("/sign-in");
  }
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
};

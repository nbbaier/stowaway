import { signInWithPassphrase } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignInFormProps {
  error?: string;
}

export const SignInForm = ({ error }: SignInFormProps) => (
  <form
    action={signInWithPassphrase}
    className="bg-card text-card-foreground flex flex-col gap-5 rounded-xl border p-6"
  >
    <div className="flex flex-col gap-2">
      <Label htmlFor="sign-in-passphrase">Passphrase</Label>
      <Input
        id="sign-in-passphrase"
        name="passphrase"
        type="password"
        autoComplete="current-password"
        required
      />
    </div>

    {error !== undefined && (
      <p role="alert" className="text-destructive text-sm">
        {error}
      </p>
    )}

    <Button type="submit" size="lg">
      Unlock your lists
    </Button>
  </form>
);

export const SetupNotice = () => (
  <output className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border p-6">
    <h2 className="font-heading text-lg font-bold">Finish app setup</h2>
    <p className="text-muted-foreground text-sm leading-relaxed">
      Configure{" "}
      <code className="text-foreground font-mono">TURSO_DATABASE_URL</code>,{" "}
      <code className="text-foreground font-mono">TURSO_AUTH_TOKEN</code>,{" "}
      <code className="text-foreground font-mono">STOWAWAY_PASSPHRASE</code>,
      and{" "}
      <code className="text-foreground font-mono">STOWAWAY_SESSION_SECRET</code>{" "}
      in the project environment. Tables are created automatically on first use.
    </p>
  </output>
);

export const SetupNotice = () => (
  <output className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border p-6">
    <h2 className="font-heading text-lg font-bold">
      Connect your Turso database
    </h2>
    <p className="text-muted-foreground text-sm leading-relaxed">
      Add <code className="text-foreground font-mono">TURSO_DATABASE_URL</code>{" "}
      and <code className="text-foreground font-mono">TURSO_AUTH_TOKEN</code> in
      the Vars section of project settings. Tables are created automatically on
      first use.
    </p>
  </output>
);

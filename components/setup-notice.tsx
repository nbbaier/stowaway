export function SetupNotice() {
  return (
    <div role="status" className="flex flex-col gap-2 rounded-xl border bg-card p-6 text-card-foreground">
      <h2 className="font-heading text-lg font-bold">Connect your Turso database</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Add <code className="font-mono text-foreground">TURSO_DATABASE_URL</code> and{' '}
        <code className="font-mono text-foreground">TURSO_AUTH_TOKEN</code> in the Vars section of project settings.
        Tables are created automatically on first use.
      </p>
    </div>
  )
}

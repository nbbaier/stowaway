# Private passphrase access

Stowaway currently uses one private namespace with a shared passphrase. Set `STOWAWAY_PASSPHRASE` and a random `STOWAWAY_SESSION_SECRET` in the local or production environment. Generate the session secret with `openssl rand -base64 32`. The passphrase should be long and unique.

After changing the environment variables, restart or redeploy the app. Sign-in creates a signed, HTTP-only cookie that expires after 30 days. Changing the session secret invalidates existing sessions. No email provider is needed.

## Namespace expansion

The session already carries a `namespaceId`; it is currently the fixed value `private`. Trip records are filtered by their owner ID (`user_id`) everywhere they are read or changed. A one-time database migration moves existing trips to the private namespace. To support multiple passphrase namespaces later:

1. Add a namespace table with a stable ID and a password hash for each namespace.
2. Add a namespace selector or invite flow to sign-in, and put the selected namespace ID in the signed session.
3. Keep trip reads and writes scoped to that session namespace ID.

That keeps the trip ownership boundary while changing how namespace credentials are selected and stored. A shared namespace passphrase should be treated as a bearer secret: anyone who knows it can access that namespace.

# Mandatory secure engineering instructions

These rules apply to human contributors and coding agents in this repository. They do not replace code review, independent testing or threat modelling.

## Hard security boundaries
- Never commit or print real secrets, privileged passwords, database connection strings, tokens, personal information or production data. Keep secrets in the approved runtime secret manager; rotate exposed values through their issuing provider.
- Every nonpublic route, mutation, background job, webhook and AI tool invocation must enforce authentication and object-level, tenant-aware authorization on the server; do not trust client-supplied user IDs, roles or tenant IDs.
- Validate and limit incoming payload sizes and file types; use parameterized SQL; avoid interpolating untrusted input into shell commands, HTML, URLs or database queries.
- Apply sensible per-identity and per-route request throttles to login, registration, password reset, uploads, AI inference, exports and expensive operations. For horizontally scaled apps, use a shared durable limiter; validate trusted-proxy settings before using forwarded IP headers. Return HTTP 429 and retry guidance as appropriate.
- Prevent CSRF for cookie-authenticated state changes. Use secure HttpOnly SameSite cookies, appropriate origin/CSRF checks and short-lived sessions with revocation.
- Use strict allowlists and ownership checks for uploads and signed download links; treat external files and retrieved content as untrusted, including AI prompt injection attempts.
- AI outputs are untrusted. Validate structured outputs, isolate tenant context, bound resource use and obtain human approval before consequential or destructive actions.
- Apply least-privilege database roles; verify Postgres RLS and role bypass behavior when relevant; maintain backups and test restores in isolated environments.
- Protect users' personal information and children's data; minimize retained fields and redact logs, prompts and error messages.
- Keep dependency lockfiles updated and use automated secret, dependency and static scanning where available; never mark a skipped scan as passed.

## Required change workflow
1. Identify affected attack surfaces and document risks, including cross-user/cross-tenant and unauthorized access.
2. Implement root-cause fixes on a branch. Avoid broad rewrites and never weaken existing controls for convenience.
3. Add negative regression tests for missing authorization, abuse limits and malformed inputs where applicable.
4. Run relevant install/build/typecheck/unit/integration/security checks, recording the exact results and unavailable checks.
5. Create a focused PR with the finding, fix, testing evidence, rollout/rollback and any required migrations.
6. Merge only with required checks and approvals. Production deployment or secret rotation must be authorized and verified.
7. Never run destructive tests, load attacks or unapproved database migrations against production.

## Incident handling
If a credential or personal data exposure is suspected: do not copy the secret into an issue or PR. Restrict exposure, preserve relevant logs, plan rotation, update dependent systems, verify replacement operation, then revoke the previous credential. Escalate uncertainty; never claim an asset secure without evidence.

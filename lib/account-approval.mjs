// Management approval may never silently substitute for proof of email ownership.
// Keep this query shared between the HTTP handler and database transaction regression tests.
export const APPROVE_VERIFIED_ACCOUNT_SQL =
 "UPDATE hub_accounts SET verified_at=now() WHERE id=$1 AND disabled_at IS NULL AND verified_at IS NULL AND email_verified_at IS NOT NULL RETURNING id,email,role,verified_at,email_verified_at";

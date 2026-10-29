# Artist Hub: Cloudflare public synthetic demo

## Deployed staging Worker
- URL: https://cabo-artist-static-preview.cabo-solutions-za.workers.dev/
- Cloudflare worker name: `cabo-artist-static-preview`
- Source: `cloudflare/artist-static-demo.worker.js`
- Deployed: 2026-10-28, separate from Render.

The Worker embeds the existing `public/index.html`, `public/styles.css` and `public/app.js` assets as a **static read-only synthetic demonstration**. The roster is fictional and the existing JavaScript's built-in fallback activates after API calls return 503. No runtime fetch to Render is needed for the public assets.

## Non-negotiable safeguards
- A visible banner explicitly says that sign-in, booking, payments and live AI are unavailable.
- `/api/*` GETs return explicit 503 and mutation methods return 405. **No live operations can be submitted** through this Worker.
- Staging URL is noindex; no sensitive data, auth tokens, payment records or real customer profiles are migrated.
- The current backend, PostgreSQL, mail, webhook validation and payment integrations remain on Render and are deliberately not proxied.
- Cloudflare asset script has CSP, noindex, X-Frame-Options, nosniff and referrer headers.

## Verification/release gates
- Cloudflare API reports upload and workers.dev route enabled.
- Independent public GitHub CI test from CABOSOLUTIONS will verify HTTPS HTML, JS/CSS assets, noindex and rejected live API routes. Result must be inspected; do not assume PASS based on the upload.
- Run mobile and desktop browser tests for synthetic roster search, filters and disabled booking button.
- To migrate the **actual functioning app**, design secure Workers-compatible authentication/session and database access, payments (Yoco webhook verification), rate limiting, receipts, notifications and tenant/role policies; test with synthetic accounts.
- Only then change production domains and shut down Render after backups and rollback tests.

**NewChanges is explicitly excluded and stays on Render.**

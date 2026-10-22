# CABO Artist Hub

A distinct CABO Solutions booking and artist-career intelligence prototype. The original CABO corporate website and CABO Learning Hub are unaffected.

## What works in this iteration

- Premium responsive discovery site in original CABO clay/gold/teal palette
- Eight **fictional** seeded artists, sample gigs and synthetic social mentions
- Public booking enquiries stored privately in Neon PostgreSQL
- Read-only artist intelligence studio with explainable, synthetic PR and Career Health indices, fee analytics and pipeline view
- Management-only enquiry list and status progression using a server-side access token
- Groq AI artist-career advice, when configured and admin-authenticated; explicit fallback otherwise
- Server-side field validation, parameterised SQL, booking confirmation conflict checks, security headers and IP request throttles

## Not built yet

Full multi-user authentication and per-artist RBAC, real account integration/social APIs, invoices/document uploads, tax computations, payments/contracts, email dispatch, production finance import and measured ML forecasts. Never enter real sensitive financial or identity documents into this early prototype.

## Run locally

Requires Node.js 20+ and a PostgreSQL 18 database.

1. `npm install`
2. Set `DATABASE_URL` and `ADMIN_TOKEN` in a local ignored `.env` environment (the app does **not** automatically load `.env`). Set `GROQ_API_KEY` if available.
3. Apply `sql/schema.sql` to your chosen empty Neon database with a PostgreSQL client.
4. `npm start`; navigate to http://localhost:10000
5. `npm test` for deterministic metrics tests.

## Render deployment

Create a Node web service from this repo/branch (`npm install --omit=dev`, `npm start`), set `DATABASE_URL`, a long random management `ADMIN_TOKEN` you know, and optionally `GROQ_API_KEY` in Render **secret environment variables**. Service listens on `PORT` (defaults to 10000). `/api/health` checks database connectivity. Default deployment region should be Frankfurt to match Neon.

For production, replace the prototype admin-token access with multi-tenant session/RBAC auth, invite workflows and a full security review before accepting real contracts or finances. Social listening in this version is **synthetic only**.

# Groq provider verification

CABO Artist Hub deliberately keeps the AI adviser behind superadmin authorization and returns clearly labelled **CABO offline rules** when Groq is not configured or cannot respond.

## Configure

1. Rotate any Groq key previously exposed in a chat or log.
2. Store the replacement as `GROQ_API_KEY` in Render's private service environment, **not** in GitHub, browser code or a source file. Keep `GROQ_MODEL` to an available Groq chat model (current app default: `llama-3.3-70b-versatile`).
3. Redeploy to load the new environment value.
4. Sign in as superadmin, open **Studio → Operations → Production readiness evidence**, click **Verify Groq AI connection**.

The check is limited to three attempts per hour per client identity. It sends a minimal eight-token completion request to Groq with a 12-second timeout. Only pass/warn status and duration are written to `hub_operational_checks`; the prompt response, API key, and upstream error body are never logged or returned. Readiness only treats the **most recent** successful check within 24 hours as verified. A success verifies basic provider connectivity, **not** model safety, response quality, uptime or real-world artist claims.

If the key is absent, invalid, rate-limited or Groq is offline, the public demo remains available and the AI adviser continues in explicitly labelled offline mode. Never claim that offline guidance was AI-generated.

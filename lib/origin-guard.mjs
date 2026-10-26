// Browser-cookie authenticated writes must provide trustworthy same-origin evidence.
// Do not treat the absence of Origin as proof of same-origin for cookie requests.
// Anonymous API clients without cookies remain supported.
export function validMutationOrigin(req, { production = process.env.NODE_ENV === "production" } = {}) {
  const host = String(req.headers.host || "").trim().toLowerCase();
  if (!/^[a-z0-9.-]+(?::[0-9]{1,5})?$/.test(host)) return false;
  const expected = (production ? "https://" : "http://") + host;
  const origin = req.headers.origin;
  if (origin !== undefined) {
    if (typeof origin !== "string" || !origin.trim()) return false;
    try { return new URL(origin).origin === expected; } catch { return false; }
  }
  const referer = req.headers.referer;
  if (referer !== undefined) {
    if (typeof referer !== "string" || !referer.trim()) return false;
    try { return new URL(referer).origin === expected; } catch { return false; }
  }
  // Non-browser clients with no cookie may send JSON without either header.
  // Cookie-bearing writes without Origin or Referer fail closed.
  return !String(req.headers.cookie || "").trim();
}

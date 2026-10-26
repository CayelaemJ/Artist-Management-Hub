// Trust X-Forwarded-For ONLY with an explicitly configured, known ingress.
// With one trusted append-style reverse proxy, the rightmost XFF entry is
// the client address observed by that proxy. Leftmost entries may be spoofed.
export function clientIp(req, trustProxyHops = process.env.TRUST_PROXY_HOPS) {
  const remote = String(req.socket?.remoteAddress || "unknown").trim();
  if (trustProxyHops !== "1") return remote.slice(0, 100);
  const xff = req.headers["x-forwarded-for"];
  const values = typeof xff === "string" ? xff.split(",") : [];
  const observed = values.length ? values[values.length - 1].trim() : "";
  return (observed || remote).slice(0, 100);
}

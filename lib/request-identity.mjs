import {isIP} from "node:net";

/**
 * Trust the nearest proxy-supplied X-Forwarded-For address only when exactly
 * one reverse proxy hop is configured. Never use the attacker-controlled
 * leftmost address: a proxy can append to a forged inbound header.
 */
export function requestClientIp(req, trustProxyHops=process.env.TRUST_PROXY_HOPS) {
  const remote=String(req.socket?.remoteAddress||"unknown");
  if(trustProxyHops!=="1") return remote;
  const forwarded=req.headers?.["x-forwarded-for"];
  if(typeof forwarded!=="string") return remote;
  const parts=forwarded.split(",").map(s=>s.trim()).filter(Boolean);
  const candidate=parts.at(-1);
  return candidate && isIP(candidate) ? candidate : remote;
}

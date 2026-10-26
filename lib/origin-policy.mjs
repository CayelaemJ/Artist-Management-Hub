/** Restrict browser-initiated state changes to the exact application origin. */
export function validRequestOrigin(req,env=process.env) {
 const site=req.headers?.["sec-fetch-site"];
 if(site==="cross-site"||site==="same-site")return false;
 const origin=req.headers?.origin;
 if(origin===undefined)return true; // Scripts without browser Origin still need authentication.
 if(typeof origin!=="string")return false;
 try {
  const u=new URL(origin);
  const host=String(req.headers?.host||"").toLowerCase();
  const local=/^(localhost|127\.0\.0\.1)(?::\d{1,5})?$/.test(host);
  if(u.username||u.password||u.pathname!=="/"||u.search||u.hash)return false;
  if(u.host.toLowerCase()!==host)return false;
  // Local loopback origins are safe even when a test server inherits NODE_ENV=production.
  // Public internet hosts always require HTTPS.
  return u.protocol==="https:"||(local&&u.protocol==="http:");
 }catch{return false}
}

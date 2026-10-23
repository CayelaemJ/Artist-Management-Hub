import crypto from "node:crypto";
const active=new Map();
const maxAge=3600_000;
export function credentialConfigured(){return Boolean(process.env.SUPERADMIN_USERNAME&&process.env.SUPERADMIN_PASSWORD_HASH);}
export function authenticate(username,password){
 if(!credentialConfigured()||typeof username!=="string"||typeof password!=="string"||password.length>256)return false;
 const [salt,expected]=process.env.SUPERADMIN_PASSWORD_HASH.split(":");
 if(!/^[0-9a-f]{32}$/.test(salt||"")||!/^[0-9a-f]{64}$/.test(expected||""))return false;
 const input=crypto.scryptSync(password,Buffer.from(salt,"hex"),32);
 const wanted=Buffer.from(expected,"hex");
 const nameGood=crypto.timingSafeEqual(crypto.createHash("sha256").update(username).digest(),crypto.createHash("sha256").update(process.env.SUPERADMIN_USERNAME).digest());
 return nameGood&&crypto.timingSafeEqual(input,wanted);
}
function key(token){return crypto.createHash("sha256").update(token).digest("hex");}
function parse(req){const c=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("cabo_superadmin="));return c?.slice("cabo_superadmin=".length)||"";}
export function superadminUser(req){
 const token=parse(req);
 if(!/^[a-f0-9]{64}$/.test(token))return null;
 const k=key(token),s=active.get(k);
 if(!s)return null;
 if(s.expires<Date.now()){active.delete(k);return null;}
 return {username:s.username,role:"superadmin"};
}
export function superadminStart(username){
 const now=Date.now();
 for(const [k,v] of active)if(v.expires<now)active.delete(k);
 if(active.size>=1000)throw Error("Admin session capacity reached");
 const token=crypto.randomBytes(32).toString("hex");
 active.set(key(token),{username,expires:now+maxAge});
 return token;
}
export function superadminEnd(req){const token=parse(req);if(/^[a-f0-9]{64}$/.test(token))active.delete(key(token));}
export function adminCookie(token){return "cabo_superadmin="+token+"; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600"+(process.env.NODE_ENV==="production"?"; Secure":"");}
export function clearAdminCookie(){return "cabo_superadmin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"+(process.env.NODE_ENV==="production"?"; Secure":"");}

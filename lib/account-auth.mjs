import crypto from "node:crypto";
export function hashPassword(password){
 if(typeof password!=="string"||password.length<12||password.length>128)throw Error("Password must be 12–128 characters");
 const salt=crypto.randomBytes(16);
 return "scrypt:"+salt.toString("hex")+":"+crypto.scryptSync(password,salt,32).toString("hex");
}
export function verifyPassword(password,stored){
 if(typeof password!=="string"||typeof stored!=="string"||password.length>256)return false;
 const m=/^scrypt:([a-f0-9]{32}):([a-f0-9]{64})$/.exec(stored);
 if(!m)return false;
 return crypto.timingSafeEqual(crypto.scryptSync(password,Buffer.from(m[1],"hex"),32),Buffer.from(m[2],"hex"));
}
export function tokenHash(t){return crypto.createHash("sha256").update(t).digest("hex");}
export function issueToken(){return crypto.randomBytes(32).toString("hex");}
export function accountCookie(t){return "cabo_account="+t+"; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200"+(process.env.NODE_ENV==="production"?"; Secure":"");}
export function clearAccountCookie(){return "cabo_account=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"+(process.env.NODE_ENV==="production"?"; Secure":"");}
export function extractAccountCookie(req){const c=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("cabo_account="));const v=c?.slice(13)||"";return /^[a-f0-9]{64}$/.test(v)?v:null;}

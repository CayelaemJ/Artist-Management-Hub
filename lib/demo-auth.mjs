import crypto from "node:crypto";

// Deliberately restricted fictional-only demonstration identities.
// No account here can view real booking enquiries, contracts, finances or admin routes.
const DEMO_ENABLED=process.env.DEMO_SIGNIN_ENABLED!=="false";
const PASSWORD_SALT="ec9307ad01d7fad1d8c9459f1267f8d4";
const PASSWORD_HASH="f81cd9aaa0e77c3e5fc5c38590d705565eb6a9c644ff404bcdf3c6bb1fe88528";
const demoUsers=Object.freeze({
  "customer.demo@cabo.test":Object.freeze({id:"demo-customer",role:"customer",name:"Demo Customer",email:"customer.demo@cabo.test"}),
  "artist.demo@cabo.test":Object.freeze({id:"demo-artist",role:"artist",name:"Demo Artist",email:"artist.demo@cabo.test"}),
  "manager.demo@cabo.test":Object.freeze({id:"demo-manager",role:"manager",name:"Demo Manager",email:"manager.demo@cabo.test"})
});
const SESSION_TTL_MS=2*60*60*1000;
const sessions=new Map();
const attempts=new Map();
function hashToken(value){return crypto.createHash("sha256").update(value).digest("hex");}
function checkPassword(password){
 if(typeof password!=="string"||password.length>200)return false;
 const derived=crypto.scryptSync(password,Buffer.from(PASSWORD_SALT,"hex"),32,{N:16384,r:8,p:1});
 return crypto.timingSafeEqual(derived,Buffer.from(PASSWORD_HASH,"hex"));
}
function findDemoUser(email,password){
 const normalized=typeof email==="string"?email.trim().toLowerCase():"";
 if(!DEMO_ENABLED || !(normalized in demoUsers) || !checkPassword(password))return null;
 return demoUsers[normalized];
}
function cleanup(){
 const now=Date.now();
 for(const [key,session] of sessions)if(session.expires<=now)sessions.delete(key);
 for(const [key,attempt] of attempts)if(attempt.until<=now)attempts.delete(key);
}
function clientIp(req){
 // Preview-only throttle; Render forwards a real client IP through its proxy.
 return String(req.headers["x-forwarded-for"]||req.socket.remoteAddress||"unknown").split(",")[0].trim().slice(0,100);
}
function loginAttemptAllowed(req,email){
 cleanup();
 const key=crypto.createHash("sha256").update(clientIp(req)+"/"+String(email).trim().toLowerCase()).digest("hex");
 const now=Date.now(),state=attempts.get(key);
 if(state&&state.until>now&&state.count>=8)return false;
 if(!state||state.until<=now)attempts.set(key,{count:1,until:now+15*60*1000});
 else state.count++;
 return true;
}
function newSession(user){
 cleanup();
 if(sessions.size>10000)cleanup();
 if(sessions.size>10000)throw Error("Demo capacity reached");
 const token=crypto.randomBytes(32).toString("base64url");
 sessions.set(hashToken(token),{user,expires:Date.now()+SESSION_TTL_MS});
 return token;
}
function sessionUser(req){
 if(!DEMO_ENABLED)return null;
 const cookie=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("cabo_demo_session="));
 if(!cookie)return null;
 const token=cookie.slice("cabo_demo_session=".length);
 if(!/^[A-Za-z0-9_-]{40,90}$/.test(token))return null;
 const key=hashToken(token),session=sessions.get(key);
 if(!session)return null;
 if(session.expires<=Date.now()){sessions.delete(key);return null;}
 return session.user;
}
function endSession(req){
 const cookie=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("cabo_demo_session="));
 if(!cookie)return;
 const token=cookie.slice("cabo_demo_session=".length);
 if(/^[A-Za-z0-9_-]{40,90}$/.test(token))sessions.delete(hashToken(token));
}
function sessionCookie(token,req){
 const secure=process.env.NODE_ENV==="production"?"; Secure":"";
 return "cabo_demo_session="+token+"; HttpOnly; SameSite=Strict; Path=/; Max-Age=7200"+secure;
}
function clearSessionCookie(){
 const secure=process.env.NODE_ENV==="production"?"; Secure":"";
 return "cabo_demo_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"+secure;
}
function demoWorkspace(user){
 const common={demo:true,role:user.role,name:user.name,email:user.email,notice:"FICTIONAL WORKSPACE — no production records or permissions"};
 if(user.role==="artist")return {...common,title:"Your artist studio",focus:"Echo Dune",highlights:[
  {label:"Artist profile",value:"Echo Dune",detail:"Example artist identity"},
  {label:"Career focus",value:"Grow your audience",detail:"Suggested learning objective"},
  {label:"Next move",value:"Build an EPK",detail:"Demo recommendation only"}],
  activities:["Polish your electronic press kit","Choose your booking availability","Review sample gig performance"]};
 if(user.role==="manager")return {...common,title:"Talent management overview",focus:"Fictional roster",highlights:[
  {label:"Roster",value:"8 artists",detail:"All fictional"},
  {label:"Pending actions",value:"3 exercises",detail:"Sample workflow, not real tasks"},
  {label:"Revenue data",value:"Synthetic only",detail:"Not actual financial records"}],
  activities:["Review fictional artist availability","Prepare demo booking quotes","Compare sample career indicators"]};
 return {...common,title:"Your booking space",focus:"Find your next artist",highlights:[
  {label:"Bookings",value:"No real bookings",detail:"Demo identity only"},
  {label:"Explore",value:"8 artists",detail:"All fictional"},
  {label:"Next step",value:"Discover talent",detail:"Browse the public roster"}],
  activities:["Discover fictional performers","Review indicative fees","Submit a real enquiry only after database activation"]};
}
export {DEMO_ENABLED,demoUsers,findDemoUser,loginAttemptAllowed,newSession,sessionUser,endSession,sessionCookie,clearSessionCookie,demoWorkspace};

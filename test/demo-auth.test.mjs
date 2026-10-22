import {test} from "node:test";
import assert from "node:assert/strict";
process.env.DEMO_SIGNIN_ENABLED="true";
const {demoUsers,DEMO_ENABLED,findDemoUser,loginAttemptAllowed,newSession,sessionUser,endSession,sessionCookie,clearSessionCookie,demoWorkspace}=await import("../lib/demo-auth.mjs");
test("demo role sign-ins accept requested test password only",()=>{
 assert.equal(DEMO_ENABLED,true);
 for(const role of ["customer","artist","manager"]){
  const email=role+".demo@cabo.test";
  const user=findDemoUser(email,"12345");
  assert.ok(user);assert.equal(user.role,role);
  assert.equal(findDemoUser(email,"12346"),null);
  assert.equal(findDemoUser(email,""),null);
 }
 assert.equal(findDemoUser("admin.demo@cabo.test","12345"),null);
});
test("demo token creates expiring httpOnly session and logout invalidates it",()=>{
 const user=demoUsers["artist.demo@cabo.test"];
 const token=newSession(user);
 const req={headers:{cookie:"another=1; cabo_demo_session="+token},socket:{remoteAddress:"127.0.0.1"}};
 assert.equal(sessionUser(req).role,"artist");
 const cookie=sessionCookie(token,req);
 assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);
 assert.match(clearSessionCookie(),/Max-Age=0/);
 endSession(req);
 assert.equal(sessionUser(req),null);
});
test("demonstration roles can only receive fictional content",()=>{
 for(const u of Object.values(demoUsers)){
  const x=demoWorkspace(u);
  assert.equal(x.demo,true);
  assert.equal(x.role,u.role);
  assert.ok(x.notice.includes("FICTIONAL"));
  assert.equal("contact_email" in x,false);
  assert.equal("real_enquiries" in x,false);
 }
});
test("demo login rate limiter stops repeated attempts",()=>{
 const req={headers:{"x-forwarded-for":"203.0.113.61"},socket:{}};
 for(let i=0;i<8;i++)assert.equal(loginAttemptAllowed(req,"test@cabo.test"),true);
 assert.equal(loginAttemptAllowed(req,"test@cabo.test"),false);
});

import {test} from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import {spawn} from "node:child_process";
async function freePort(){
 const server=net.createServer();
 await new Promise((resolve,reject)=>server.once("error",reject).listen(0,"127.0.0.1",resolve));
 const port=server.address().port;
 await new Promise(resolve=>server.close(resolve));
 return port;
}
test("HTTP end-to-end: health, PR dashboard, demo sign-in and cross-role authorization", {timeout:35000},async t=>{
 if(!process.env.DATABASE_URL){t.skip("Neon is not configured");return;}
 const port=await freePort(),base="http://127.0.0.1:"+port;
 const child=spawn(process.execPath,["server.mjs"],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DEMO_SIGNIN_ENABLED:"true"},stdio:["ignore","pipe","pipe"]});
 let output="";
 child.stdout.on("data",part=>{output+=part.toString();});
 child.stderr.on("data",part=>{output+=part.toString();});
 try{
  let running=false;
  for(let i=0;i<50;i++){
   if(child.exitCode!==null)throw Error("Server exited early: "+output.slice(-600));
   try{const r=await fetch(base+"/api/health",{signal:AbortSignal.timeout(2000)});if(r.ok){running=true;break;}}
   catch{}
   await new Promise(resolve=>setTimeout(resolve,150));
  }
  assert.equal(running,true,"HTTP server should become healthy: "+output.slice(-400));
  const roster=await fetch(base+"/api/artists");
  assert.equal(roster.status,200);
  const artists=(await roster.json()).artists;
  assert.ok(artists.length>=8);
  const dashboard=await fetch(base+"/api/demo/artist/"+encodeURIComponent(artists[0].slug));
  assert.equal(dashboard.status,200);
  const metrics=await dashboard.json();
  assert.ok(Number.isFinite(metrics.pr.score));assert.ok(Number.isFinite(metrics.career.score));
  assert.equal((await fetch(base+"/api/admin/enquiries")).status,401);
  assert.equal((await fetch(base+"/api/ops/summary")).status,403);
  assert.equal((await fetch(base+"/api/ops/analytics?days=90")).status,403,"Private reporting must not be public");
  assert.equal((await fetch(base+"/api/ops/analytics?days=365")).status,403,"Date filtering cannot bypass superadmin permission");
  assert.equal((await fetch(base+"/api/demo-bookings")).status,403);
  const login=await fetch(base+"/api/demo-auth/login",{method:"POST",headers:{"Content-Type":"application/json","Origin":base},body:JSON.stringify({email:"manager.demo@cabo.test",password:"12345"})});
  assert.equal(login.status,200);
  const cookie=login.headers.get("set-cookie")?.split(";")[0];
  assert.match(cookie||"",/cabo_demo_session=/);
  const workspace=await fetch(base+"/api/demo-auth/workspace",{headers:{Cookie:cookie}});
  assert.equal(workspace.status,200);assert.equal((await workspace.json()).role,"manager");
  assert.equal((await fetch(base+"/api/demo-bookings",{headers:{Cookie:cookie}})).status,200);
  const invalid=await fetch(base+"/api/accounts/register",{method:"POST",headers:{"Content-Type":"application/json","Origin":base},body:JSON.stringify({email:"qa.invalid@cabo.test",name:"QA Person",role:"customer",password:"12345"})});
  assert.equal(invalid.status,400,"Weak production passwords must fail");
  const unknown=await fetch(base+"/api/accounts/request-password-reset",{method:"POST",headers:{"Content-Type":"application/json","Origin":base},body:JSON.stringify({email:"unknown-recovery-qa@cabo.test"})});
  assert.equal(unknown.status,200);
  assert.match((await unknown.json()).message,/if an eligible account exists/i,"Recovery requests must not expose whether an email is registered");
  const badReset=await fetch(base+"/api/accounts/reset-password",{method:"POST",headers:{"Content-Type":"application/json","Origin":base},body:JSON.stringify({token:"not-a-valid-token",password:"Strong-New-Passphrase-2026"})});
  assert.equal(badReset.status,400);
  const weakReset=await fetch(base+"/api/accounts/reset-password",{method:"POST",headers:{"Content-Type":"application/json","Origin":base},body:JSON.stringify({token:"a".repeat(64),password:"12345"})});
  assert.equal(weakReset.status,400);

 }finally{
  child.kill("SIGTERM");
  if(child.exitCode===null)await new Promise(resolve=>{child.once("exit",resolve);setTimeout(resolve,2000);});
 }
});

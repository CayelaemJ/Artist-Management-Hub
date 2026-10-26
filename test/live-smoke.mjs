import {test} from "node:test";
import assert from "node:assert/strict";

// Opt-in against a known deployed environment, never executed during npm prestart.
// Usage: LIVE_SMOKE_URL=https://cabo-artist-hub.onrender.com RUN_LIVE_SMOKE=1 node --test test/live-smoke.mjs
const run=process.env.RUN_LIVE_SMOKE==="1";
const origin=process.env.LIVE_SMOKE_URL||"";
async function request(path,opts={}){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{return await fetch(new URL(path,origin),{...opts,signal:controller.signal,redirect:"manual"});}
 finally{clearTimeout(timeout);}
}
test("public deployment serves a safe, database-connected health response",{skip:!run},async()=>{
 const r=await request("/api/health");
 assert.equal(r.status,200);
 const data=await r.json();
 assert.equal(data.status,"ok");
 assert.equal(data.database,"connected");
 assert.equal(typeof data.adminEnabled,"boolean");
 assert.equal(typeof data.aiConfigured,"boolean");
 assert.equal(data.connectionString,undefined);
});
test("demo artists and dashboard are readable but not real financial data",{skip:!run},async()=>{
 const roster=await request("/api/artists");
 assert.equal(roster.status,200);
 const list=await roster.json();
 assert.equal(list.demo,true);
 assert.ok(list.artists.length>0);
 const slug=list.artists[0].slug;
 const detail=await request("/api/demo/artist/"+encodeURIComponent(slug));
 assert.equal(detail.status,200);
 const data=await detail.json();
 assert.equal(data.demo,true);
 assert.equal(typeof data.pr.score,"number");
 assert.equal(typeof data.career.score,"number");
});
test("unauthenticated private operations, bookings and finance are denied",{skip:!run},async()=>{
 for(const route of ["/api/ops/summary","/api/ops/finance","/api/ops/analytics","/api/admin/enquiries","/api/accounts/me","/api/demo-bookings"]){
  const r=await request(route);
  assert.ok([401,403].includes(r.status),route+" must not return private data: "+r.status);
 }
});
test("production scripts are served without secrets",{skip:!run},async()=>{
 const page=await request("/");
 assert.equal(page.status,200);
 assert.ok((page.headers.get("content-security-policy")||"").includes("default-src"));
 const body=await page.text();
 assert.ok(body.includes("CABO ARTIST HUB"));
 assert.ok(!body.includes("postgresql://"));
 assert.ok(!body.includes("gsk_"));
});

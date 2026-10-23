import {test} from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import {reportPeriod,buildManagementAnalytics} from "../lib/management-analytics.mjs";

test("report period only accepts bounded reporting windows",()=>{
 assert.equal(reportPeriod(undefined),90);
 assert.equal(reportPeriod("30"),30);
 assert.equal(reportPeriod("365"),365);
 assert.throws(()=>reportPeriod("0"),/30, 90, or 365/);
 assert.throws(()=>reportPeriod("100000"),/30, 90, or 365/);
 assert.throws(()=>reportPeriod("NaN"),/30, 90, or 365/);
});
test("Neon management report separates booking, demo, money and fictional PR scores without personal data",async t=>{
 if(!process.env.DATABASE_URL){t.skip("Neon DATABASE_URL is not configured");return;}
 const uri=new URL(process.env.DATABASE_URL);
 for(const key of ["sslmode","sslcert","sslkey","sslrootcert"])uri.searchParams.delete(key);
 const db=new pg.Pool({connectionString:uri.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:10000,max:1});
 try{
  const d=await buildManagementAnalytics(db,90);
  assert.equal(d.periodDays,90);
  assert.equal(d.sources.noPersonalData,true);
  assert.ok(d.artistScores.length>=8);
  assert.ok(d.artistScores.every(a=>a.synthetic===true&&a.prScore>=0&&a.prScore<=100&&a.careerScore>=0&&a.careerScore<=100));
  assert.ok(d.bookings.every(x=>Number.isInteger(x.count)&&x.count>=0));
  assert.ok(d.demoBookings.every(x=>Number.isInteger(x.count)&&x.count>=0));
  assert.ok(d.weeklyTrend.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.week)));
  assert.match(d.finance.issuedCents,/^\d+$/);
  assert.match(d.finance.paidCents,/^\d+$/);
  const json=JSON.stringify(d);
  for(const privateKey of ["contact_email","contact_name","password_hash","token_secret_ref","bankReference"]){
   assert.equal(json.includes(privateKey),false,"Report must omit "+privateKey);
  }
 }finally{await db.end();}
});

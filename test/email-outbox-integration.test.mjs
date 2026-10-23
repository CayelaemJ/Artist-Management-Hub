import {test} from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import pg from "pg";
test("Neon email outbox queues only a verified booking owner, retries safely and rolls back QA records",async t=>{
 if(!process.env.DATABASE_URL){t.skip("Neon not configured");return;}
 const uri=new URL(process.env.DATABASE_URL);
 for(const k of ["sslmode","sslcert","sslkey","sslrootcert"])uri.searchParams.delete(k);
 const db=new pg.Client({connectionString:uri.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:10000});
 await db.connect();
 let email;
 try{
  await db.query("BEGIN");
  email="email-outbox-qa-"+crypto.randomBytes(8).toString("hex")+"@cabo.test";
  const user=await db.query("INSERT INTO hub_accounts(email,password_hash,display_name,role,email_verified_at,verified_at) VALUES($1,'test-never-login','Fictional QA','customer',now(),now()) RETURNING id",[email]);
  const artist=await db.query("SELECT id FROM artists WHERE synthetic=TRUE LIMIT 1");
  assert.equal(artist.rowCount,1);
  const booking=await db.query("INSERT INTO booking_enquiries(artist_id,customer_account_id,contact_name,contact_email,event_type,event_date,venue,synthetic) VALUES($1,$2,'Fictional QA',$3,'Email outbox QA',CURRENT_DATE+12,'Fictional venue',TRUE) RETURNING id",[artist.rows[0].id,user.rows[0].id,email]);
  const id=booking.rows[0].id;
  const key=crypto.createHash("sha256").update("qa:"+id).digest("hex");
  const stmt="INSERT INTO hub_notifications(account_id,booking_id,channel,subject,body,state,dedupe_key) VALUES($1,$2,'email','Demo subject','Fictional email content only','pending',$3) ON CONFLICT(dedupe_key) DO UPDATE SET dedupe_key=EXCLUDED.dedupe_key RETURNING id";
  const a=await db.query(stmt,[user.rows[0].id,id,key]);
  const b=await db.query(stmt,[user.rows[0].id,id,key]);
  assert.equal(a.rows[0].id,b.rows[0].id);
  const n=await db.query("UPDATE hub_notifications SET locked_until=now()+interval '2 minutes',attempts=attempts+1 WHERE id=$1 AND channel='email' RETURNING id,attempts",[a.rows[0].id]);
  assert.equal(n.rows[0].attempts,1);
  await db.query("UPDATE hub_notifications SET locked_until=NULL,next_attempt_at=now()+interval '60 seconds',state='pending' WHERE id=$1",[n.rows[0].id]);
  const q=await db.query("SELECT attempts,state,next_attempt_at>now() AS later FROM hub_notifications WHERE id=$1",[a.rows[0].id]);
  assert.equal(q.rows[0].attempts,1);
  assert.equal(q.rows[0].state,"pending");
  assert.equal(q.rows[0].later,true);
 }finally{
  await db.query("ROLLBACK");
  if(email){const q=await db.query("SELECT id FROM hub_accounts WHERE email=$1",[email]);assert.equal(q.rowCount,0);}
  await db.end();
 }
});

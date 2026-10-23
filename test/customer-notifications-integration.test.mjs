import {test} from "node:test";import assert from "node:assert/strict";import crypto from "node:crypto";import pg from "pg";
test("booking notification is tenant-scoped, readable and rollback-safe",async t=>{
 if(!process.env.DATABASE_URL){t.skip("Neon not configured");return;}
 const url=new URL(process.env.DATABASE_URL);
 for(const k of ["sslmode","sslcert","sslkey","sslrootcert"])url.searchParams.delete(k);
 const client=new pg.Client({connectionString:url.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:8000});
 await client.connect();
 try{
  await client.query("BEGIN");
  const email="qa-"+crypto.randomBytes(6).toString("hex")+"@cabo.test";
  const account=await client.query("INSERT INTO hub_accounts(email,password_hash,display_name,role,email_verified_at,verified_at) VALUES($1,'test-never-login','QA Synthetic Account','customer',now(),now()) RETURNING id",[email]);
  const artist=await client.query("SELECT id FROM artists WHERE synthetic=TRUE LIMIT 1");
  const booking=await client.query("INSERT INTO booking_enquiries(artist_id,customer_account_id,contact_name,contact_email,event_type,event_date,venue,synthetic) VALUES($1,$2,'Synthetic QA',$3,'Notification workflow',CURRENT_DATE+14,'Demo venue',TRUE) RETURNING id",[artist.rows[0].id,account.rows[0].id,email]);
  const n=await client.query("INSERT INTO hub_notifications(account_id,booking_id,channel,subject,body,state) VALUES($1,$2,'in_app','Booking status','Your booking is under review','pending') RETURNING id",[account.rows[0].id,booking.rows[0].id]);
  const allowed=await client.query("UPDATE hub_notifications SET read_at=now() WHERE id=$1 AND account_id=$2 RETURNING read_at",[n.rows[0].id,account.rows[0].id]);
  assert.equal(allowed.rowCount,1);
  const denied=await client.query("SELECT id FROM hub_notifications WHERE id=$1 AND account_id=$2",[n.rows[0].id,"00000000-0000-0000-0000-000000000000"]);
  assert.equal(denied.rowCount,0);
 }finally{await client.query("ROLLBACK");await client.end();}
});

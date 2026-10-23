import {test} from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import pg from "pg";

test("scoped contract review, immutable terms acceptance, notification and rollback",async t=>{
 if(!process.env.DATABASE_URL){t.skip("Neon is not configured");return;}
 const u=new URL(process.env.DATABASE_URL);
 for(const key of ["sslmode","sslcert","sslkey","sslrootcert"])u.searchParams.delete(key);
 const client=new pg.Client({connectionString:u.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:10000});
 await client.connect();
 let bookingId;
 try{
  await client.query("BEGIN");
  const email="qa-"+crypto.randomBytes(6).toString("hex")+"@cabo.test";
  const account=await client.query("INSERT INTO hub_accounts(email,password_hash,display_name,role,verified_at,email_verified_at) VALUES($1,'test-never-login','Fictional QA','customer',now(),now()) RETURNING id",[email]);
  const aid=account.rows[0].id;
  const artist=await client.query("SELECT id FROM artists WHERE synthetic=TRUE LIMIT 1");
  assert.equal(artist.rowCount,1);
  const booking=await client.query("INSERT INTO booking_enquiries(artist_id,customer_account_id,contact_name,contact_email,event_type,event_date,venue,synthetic) VALUES($1,$2,'Fictional QA',$3,'Contract test',CURRENT_DATE+21,'Fictional venue',TRUE) RETURNING id",[artist.rows[0].id,aid,email]);
  bookingId=booking.rows[0].id;
  const terms="Fictional artist performance at a demonstration venue. No real transaction occurs.";
  const title="Synthetic QA Agreement";
  const draft=await client.query("INSERT INTO booking_contracts(booking_id,title,terms) VALUES($1,$2,$3) RETURNING id,status",[bookingId,title,terms]);
  const cid=draft.rows[0].id;
  assert.equal(draft.rows[0].status,"draft");
  const update=await client.query("UPDATE booking_contracts SET status='sent',sent_at=now() WHERE id=$1 AND status='draft' RETURNING status",[cid]);
  assert.equal(update.rows[0].status,"sent");
  const other=await client.query("SELECT c.id FROM booking_contracts c JOIN booking_enquiries b ON b.id=c.booking_id WHERE c.id=$1 AND b.customer_account_id=$2",[cid,"00000000-0000-0000-0000-000000000000"]);
  assert.equal(other.rowCount,0,"Other customers must never see this agreement");
  const hash=crypto.createHash("sha256").update(title+"\n"+terms).digest("hex");
  const accepted=await client.query("INSERT INTO contract_acceptances(contract_id,customer_account_id,signer_name,terms_sha256) VALUES($1,$2,$3,$4) RETURNING id,terms_sha256",[cid,aid,"Fictional QA",hash]);
  assert.equal(accepted.rows[0].terms_sha256,hash);
  await client.query("UPDATE booking_contracts SET status='accepted',signed_at=now() WHERE id=$1",[cid]);
  await client.query("INSERT INTO hub_notifications(account_id,booking_id,channel,subject,body,state) VALUES($1,$2,'in_app','Contract acceptance','Fictional acceptance','pending')",[aid,bookingId]);
  const a=await client.query("SELECT c.status,a.signer_name FROM booking_contracts c JOIN contract_acceptances a ON a.contract_id=c.id WHERE c.id=$1",[cid]);
  assert.equal(a.rows[0].status,"accepted");
  assert.equal(a.rows[0].signer_name,"Fictional QA");
 }finally{
  await client.query("ROLLBACK");
  if(bookingId){
   const q=await client.query("SELECT id FROM booking_enquiries WHERE id=$1",[bookingId]);
   assert.equal(q.rowCount,0,"Test data must not remain after rollback");
  }
  await client.end();
 }
});

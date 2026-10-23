import {test} from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
test("Neon invoice issue and payment records are transactional, and the smoke fixture rolls back",async t=>{
 if(!process.env.DATABASE_URL){t.skip("DATABASE_URL not configured");return;}
 const u=new URL(process.env.DATABASE_URL);
 for(const k of ["sslmode","sslcert","sslkey","sslrootcert"])u.searchParams.delete(k);
 const client=new pg.Client({connectionString:u.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:8000});
 await client.connect();
 let reference;
 try{
  await client.query("BEGIN");
  const artist=await client.query("SELECT id FROM artists WHERE synthetic=TRUE LIMIT 1");
  assert.equal(artist.rowCount,1);
  const booking=await client.query("INSERT INTO booking_enquiries(artist_id,contact_name,contact_email,event_type,event_date,venue,synthetic) VALUES($1,'Finance QA Fiction','finance.qa@cabo.test','Synthetic invoice smoke',CURRENT_DATE+21,'Demo Stage, Johannesburg',TRUE) RETURNING id",[artist.rows[0].id]);
  reference=booking.rows[0].id;
  const invoice=await client.query("INSERT INTO booking_invoices(booking_id,invoice_number,amount_cents,status) VALUES($1,$2,1500000,'issued') RETURNING id,amount_cents,paid_cents",[reference,"QA-"+reference]);
  assert.equal(Number(invoice.rows[0].amount_cents),1500000);
  await client.query("INSERT INTO invoice_payment_events(invoice_id,provider,provider_event_id,amount_cents) VALUES($1,'verified_manual_bank_transfer',$2,500000)",[invoice.rows[0].id,"QA-"+reference]);
  const update=await client.query("UPDATE booking_invoices SET paid_cents=500000,status='partially_paid' WHERE id=$1 RETURNING paid_cents,status",[invoice.rows[0].id]);
  assert.equal(Number(update.rows[0].paid_cents),500000);
  assert.equal(update.rows[0].status,"partially_paid");
 }finally{
  await client.query("ROLLBACK");
  if(reference){
   const remaining=await client.query("SELECT id FROM booking_enquiries WHERE id=$1",[reference]);
   assert.equal(remaining.rowCount,0,"QA records must not leak into customer data");
  }
  await client.end();
 }
});

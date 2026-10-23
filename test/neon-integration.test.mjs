import {test} from "node:test";
import assert from "node:assert/strict";
import pg from "pg";

test("Neon can read artist dashboards and persist fictional booking lifecycle",async(t)=>{
 if(!process.env.DATABASE_URL){t.skip("Only runs when Neon is configured");return;}
 const url=new URL(process.env.DATABASE_URL);
 for(const k of ["sslmode","sslcert","sslkey","sslrootcert"])url.searchParams.delete(k);
 const client=new pg.Client({connectionString:url.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:8000});
 await client.connect();
 try{
  const x=await client.query("SELECT id,slug,pr_factors,health_factors FROM artists WHERE synthetic=TRUE LIMIT 1");
  assert.ok(x.rows.length,"Synthetic artist exists");
  assert.ok(x.rows[0].pr_factors,"PR scoring input exists");
  assert.ok(x.rows[0].health_factors,"Career Health scoring input exists");
  await client.query("BEGIN");
  try{
   const add=await client.query("INSERT INTO demo_booking_enquiries(artist_id,customer_email,contact_name,event_type,event_date,venue) VALUES($1,'qa.demo@cabo.test','Automated Demo Check','Smoke testing',CURRENT_DATE+10,'Neon sandbox') RETURNING id,status",[x.rows[0].id]);
   assert.equal(add.rows[0].status,"enquiry");
   const updated=await client.query("UPDATE demo_booking_enquiries SET status='availability_check' WHERE id=$1 RETURNING status",[add.rows[0].id]);
   assert.equal(updated.rows[0].status,"availability_check");
  }finally{await client.query("ROLLBACK");}
 }finally{await client.end();}
});
